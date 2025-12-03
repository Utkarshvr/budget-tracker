import { useState } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { Account, AccountFormData } from "@/types/account";
import { theme } from "@/constants/theme";
import { useAccountsData } from "./hooks/useAccountsData";
import { AccountFormSheet } from "./components/AccountFormSheet";
import { AccountActionSheet } from "./components/AccountActionSheet";
import { AccountsHeader } from "./components/AccountsHeader";
import { AccountsSection } from "./components/AccountsSection";
import { AccountsEmptyState } from "./components/AccountsEmptyState";
import { AddAccountCard } from "./components/AddAccountCard";
import { FullScreenLoader } from "./components/FullScreenLoader";

export default function AccountsScreen() {
  const { session } = useSupabaseSession();
  const {
    accounts,
    categories,
    reservations,
    loading,
    refreshing,
    groupedAccounts,
    handleRefresh,
    handleDeleteAccount,
    handleSubmitAccount,
  } = useAccountsData(session);

  const [formSheetVisible, setFormSheetVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedReservations, setExpandedReservations] = useState<Record<string, boolean>>({});
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const handleAddAccount = () => {
    setEditingAccount(null);
    setFormSheetVisible(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setFormSheetVisible(true);
  };

  const handleShowActions = (account: Account) => {
    setSelectedAccount(account);
    setActionSheetVisible(true);
  };

  const handleDelete = async (account: Account) => {
    await handleDeleteAccount(account);
  };

  const handleSubmit = async (formData: AccountFormData) => {
    setSubmitting(true);
    try {
      await handleSubmitAccount(formData, editingAccount);
      setFormSheetVisible(false);
      setEditingAccount(null);
    } catch (error) {
      // Error is already handled in the hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleReservations = (accountId: string) => {
    setExpandedReservations((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  if (loading) {
    return <FullScreenLoader />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary.DEFAULT}
          />
        }
      >
        <AccountsHeader count={accounts.length} />

        <AccountsSection
          title="Bank Accounts"
          accounts={groupedAccounts.bank}
          reservations={reservations}
          categories={categories}
          showTypeMeta={true}
          onEdit={handleEditAccount}
          onDelete={handleDelete}
          onShowActions={handleShowActions}
          expandedReservations={expandedReservations}
          onToggleReservations={handleToggleReservations}
        />

        <AccountsSection
          title="Cash"
          accounts={groupedAccounts.cash}
          reservations={reservations}
          categories={categories}
          showTypeMeta={false}
          onEdit={handleEditAccount}
          onDelete={handleDelete}
          onShowActions={handleShowActions}
          expandedReservations={expandedReservations}
          onToggleReservations={handleToggleReservations}
        />

        {accounts.length === 0 && <AccountsEmptyState />}

        <AddAccountCard onPress={handleAddAccount} />
      </ScrollView>

      <AccountFormSheet
        visible={formSheetVisible}
        account={editingAccount}
        onClose={() => {
          setFormSheetVisible(false);
          setEditingAccount(null);
        }}
        onSubmit={handleSubmit}
        loading={submitting}
      />

      <AccountActionSheet
        visible={actionSheetVisible}
        account={selectedAccount}
        onClose={() => {
          setActionSheetVisible(false);
          setSelectedAccount(null);
        }}
        onEdit={handleEditAccount}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  );
}
