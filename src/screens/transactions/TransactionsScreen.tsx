import { useState, useCallback, useRef } from "react";
import { ScrollView, RefreshControl, View, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { useThemeColors } from "@/constants/theme";
import { useTransactionsData } from "./hooks/useTransactionsData";
import { buildTypeMeta } from "./utils/typeMeta";
import { type DateRangeFilter } from "./utils/dateRange";
import { FilterDropdown } from "./components/FilterDropdown";
import { TransactionsHeader } from "./components/TransactionsHeader";
import { DateRangeFilterBar } from "./components/DateRangeFilterBar";
import { TransactionsList } from "./components/TransactionsList";
import { EmptyState } from "./components/EmptyState";
import { FullScreenLoader } from "./components/FullScreenLoader";
import { TransactionActionSheet } from "./components/TransactionActionSheet";
import { Transaction } from "@/types/transaction";
import { supabase } from "@/lib/supabase";
import TransactionFormScreen from "./TransactionFormScreen";

export default function TransactionsScreen() {
  const colors = useThemeColors();
  const typeMeta = buildTypeMeta(colors);

  const { session } = useSupabaseSession();
  const {
    loading,
    refreshing,
    filterType,
    setFilterType,
    currentDateRange,
    filteredAndGroupedTransactions,
    handleRefresh,
    handlePreviousPeriod,
    handleNextPeriod,
  } = useTransactionsData(session);

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterButtonRef = useRef<View | null>(null);
  const [filterButtonLayout, setFilterButtonLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleFilterTypeChange = useCallback((type: DateRangeFilter) => {
    setFilterType(type);
    setShowFilterDropdown(false);
  }, [setFilterType]);

  const handleCloseDropdown = useCallback(() => {
    setShowFilterDropdown(false);
  }, []);

  const handleToggleDropdown = useCallback(() => {
    if (!showFilterDropdown) {
      // Measure button position before showing dropdown
      filterButtonRef.current?.measureInWindow((x, y, width, height) => {
        setFilterButtonLayout({ x, y, width, height });
        setShowFilterDropdown(true);
      });
    } else {
      setShowFilterDropdown(false);
    }
  }, [showFilterDropdown]);

  const handleTransactionPress = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowActionSheet(true);
  }, []);

  const handleCloseActionSheet = useCallback(() => {
    setShowActionSheet(false);
    setSelectedTransaction(null);
  }, []);

  const handleEditTransaction = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowActionSheet(false);
    setShowTransactionForm(true);
  }, []);

  const handleDeleteTransaction = useCallback((transaction: Transaction) => {
    Alert.alert(
      "Delete Transaction",
      `Are you sure you want to delete "${transaction.note}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("transactions")
                .delete()
                .eq("id", transaction.id)
                .eq("user_id", session?.user.id);

              if (error) throw error;

              Alert.alert("Success", "Transaction deleted successfully");
              handleRefresh();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete transaction");
            }
          },
        },
      ]
    );
  }, [handleRefresh, session?.user.id]);

  const totalCount = filteredAndGroupedTransactions.reduce(
    (sum, group) => sum + group.transactions.length,
    0
  );

  // Flatten filtered transactions for income/expense calculation
  const filteredTransactions = filteredAndGroupedTransactions.flatMap(
    (group) => group.transactions
  );

  if (loading) {
    return <FullScreenLoader colors={colors} />;
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background.DEFAULT }}
    >
      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary.DEFAULT}
          />
        }
      >
        <TransactionsHeader totalCount={totalCount} colors={colors} />

        <DateRangeFilterBar
          filterType={filterType}
          currentDateRange={currentDateRange}
          onPrev={handlePreviousPeriod}
          onNext={handleNextPeriod}
          filteredTransactions={filteredTransactions}
          colors={colors}
        />

        {filteredAndGroupedTransactions.length > 0 ? (
          <TransactionsList
            grouped={filteredAndGroupedTransactions}
            colors={colors}
            typeMeta={typeMeta}
            onTransactionPress={handleTransactionPress}
          />
        ) : (
          <EmptyState colors={colors} />
        )}
      </ScrollView>

      {showFilterDropdown && filterButtonLayout && (
        <FilterDropdown
          visible={showFilterDropdown}
          filterType={filterType}
          onClose={handleCloseDropdown}
          onSelect={handleFilterTypeChange}
          buttonLayout={filterButtonLayout}
        />
      )}

      <TransactionActionSheet
        visible={showActionSheet}
        transaction={selectedTransaction}
        colors={colors}
        typeMeta={typeMeta}
        onClose={handleCloseActionSheet}
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
      />

      {/* Transaction Form Screen (for editing) */}
      <Modal
        visible={showTransactionForm}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setShowTransactionForm(false);
          setEditingTransaction(null);
        }}
      >
        <BottomSheetModalProvider>
          <TransactionFormScreen
            transaction={editingTransaction}
            onClose={() => {
              setShowTransactionForm(false);
              setEditingTransaction(null);
            }}
            onSuccess={() => {
              setShowTransactionForm(false);
              setEditingTransaction(null);
              handleRefresh();
            }}
          />
        </BottomSheetModalProvider>
      </Modal>
    </SafeAreaView>
  );
}
