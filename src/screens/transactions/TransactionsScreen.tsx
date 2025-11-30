import { useState, useCallback, useRef } from "react";
import { ScrollView, RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

  const totalCount = filteredAndGroupedTransactions.reduce(
    (sum, group) => sum + group.transactions.length,
    0
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
          onToggleDropdown={handleToggleDropdown}
          showDropdown={showFilterDropdown}
          filterButtonRef={filterButtonRef}
          colors={colors}
        />

        {filteredAndGroupedTransactions.length > 0 ? (
          <TransactionsList
            grouped={filteredAndGroupedTransactions}
            colors={colors}
            typeMeta={typeMeta}
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
    </SafeAreaView>
  );
}
