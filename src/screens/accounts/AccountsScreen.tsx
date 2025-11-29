import { useState, useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { Account, AccountFormData, AccountType } from "@/types/account";
import { Category, CategoryReservation } from "@/types/category";
import { AccountFormSheet } from "./components/AccountFormSheet";
import { theme } from "@/constants/theme";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  cash: "attach-money",
  checking: "account-balance",
  savings: "savings",
  credit_card: "credit-card",
};

const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  cash: "bg-green-500",
  checking: "bg-blue-500",
  savings: "bg-purple-500",
  credit_card: "bg-orange-500",
};

function formatBalance(balance: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const mainUnit = balance / 100;
  return `${symbol}${mainUnit.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return "Just now";
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export default function AccountsScreen() {
  const router = useRouter();
  const { session } = useSupabaseSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reservations, setReservations] = useState<CategoryReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formSheetVisible, setFormSheetVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    await Promise.all([fetchAccounts(), fetchCategories(), fetchReservations()]);
  };

  const fetchAccounts = async () => {
    if (!session?.user) return;

    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to fetch accounts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCategories = async () => {
    if (!session?.user) return;
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", session.user.id)
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Error fetching categories", error);
    }
  };

  const fetchReservations = async () => {
    if (!session?.user) return;
    try {
      const { data, error } = await supabase
        .from("category_reservations")
        .select("*")
        .eq("user_id", session.user.id);

      if (error) throw error;
      setReservations(data || []);
    } catch (error: any) {
      console.error("Error fetching reservations", error);
    }
  };

  const getAccountReservations = (accountId: string) => {
    return reservations
      .filter((r) => r.account_id === accountId)
      .map((reservation) => {
        const category = categories.find((c) => c.id === reservation.category_id);
        return {
          ...reservation,
          categoryName: category?.name || "Unknown",
          categoryEmoji: category?.emoji || "📁",
        };
      });
  };

const getTotalReserved = (accountId: string): number => {
  return reservations
    .filter((r) => r.account_id === accountId)
    .reduce((sum, r) => sum + r.reserved_amount, 0);
};

  const renderReservationsSection = (account: Account) => {
    const accountReservations = getAccountReservations(account.id);
    const totalReserved = getTotalReserved(account.id);
    const unallocated = Math.max(account.balance - totalReserved, 0);
  const hasReservations = accountReservations.length > 0;

    return (
      <View className="mt-4">
        <Text className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
          Reserved Funds
        </Text>
        {hasReservations ? (
        <View className="mt-2 rounded-2xl border border-border">
          {accountReservations.map((item, index) => {
            const updatedLabel = item.updated_at
              ? `Updated ${formatDate(item.updated_at)}`
              : null;

            return (
              <View key={item.id}>
                <View className="flex-row items-center justify-between px-3 py-2">
                  <View className="flex-row items-center flex-1 pr-2">
                    <View className="w-9 h-9 rounded-full bg-muted items-center justify-center">
                      <Text style={{ fontSize: 18 }}>{item.categoryEmoji}</Text>
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-foreground text-sm font-semibold">
                        {item.categoryName}
                      </Text>
                      {updatedLabel && (
                        <Text className="text-muted-foreground text-xs mt-0.5">
                          {updatedLabel}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text className="text-primary text-sm font-semibold">
                    {formatBalance(item.reserved_amount, item.currency)}
                  </Text>
                </View>
                {index < accountReservations.length - 1 && (
                  <View className="h-px bg-border" />
                )}
              </View>
            );
          })}
        </View>
        ) : (
          <Text className="text-muted-foreground text-sm mt-2">
            No funds yet. Create one to reserve money for goals.
          </Text>
        )}
        <View className="mt-4">
          <Text className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
            Unreserved
          </Text>
          <Text className="text-foreground text-lg font-bold mt-1">
            {formatBalance(unallocated, account.currency)}
          </Text>
        </View>
        <TouchableOpacity
          className="mt-4 flex-row items-center justify-center rounded-2xl bg-primary-soft border border-primary-border py-2"
          onPress={() => router.push("/(auth)/(tabs)/categories")}
        >
          <MaterialIcons name="savings" size={16} color={theme.colors.primary.DEFAULT} />
          <Text className="text-primary text-sm font-semibold ml-2">
            {hasReservations ? "Manage Funds" : "+ Create Fund"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleAddAccount = () => {
    setEditingAccount(null);
    setFormSheetVisible(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setFormSheetVisible(true);
  };

  const handleDeleteAccount = (account: Account) => {
    Alert.alert(
      "Delete Account",
      `Are you sure you want to delete "${account.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("accounts")
                .delete()
                .eq("id", account.id);

              if (error) throw error;
              fetchData();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete account");
            }
          },
        },
      ]
    );
  };

  const handleSubmitAccount = async (formData: AccountFormData) => {
    if (!session?.user) return;

    setSubmitting(true);
    try {
      // Convert balance to smallest currency unit (paise/cents)
      const balanceInSmallestUnit = Math.round(
        parseFloat(formData.balance) * 100
      );

      const currency = formData.currency;

      if (editingAccount) {
        // Update existing account (don't update currency when editing)
        const { error } = await supabase
          .from("accounts")
          .update({
            name: formData.name.trim(),
            type: formData.type,
            balance: balanceInSmallestUnit,
          })
          .eq("id", editingAccount.id);

        if (error) throw error;
      } else {
        // Create new account with currency from global settings
        const { error } = await supabase.from("accounts").insert({
          user_id: session.user.id,
          name: formData.name.trim(),
          type: formData.type,
          currency: currency,
          balance: balanceInSmallestUnit,
        });

        if (error) throw error;
      }

      setFormSheetVisible(false);
      setEditingAccount(null);
      fetchData();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save account");
    } finally {
      setSubmitting(false);
    }
  };

  const renderAccountCard = (account: Account, showTypeMeta: boolean) => (
    <LinearGradient
      key={account.id}
      colors={[theme.colors.surfaceGradient.from, theme.colors.surfaceGradient.to]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardGradient}
    >
      <TouchableOpacity
        className="rounded-3xl"
        onPress={() => handleEditAccount(account)}
        onLongPress={() => handleDeleteAccount(account)}
        activeOpacity={0.9}
        style={styles.cardInner}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center flex-1 pr-3">
            <View
              className={`${ACCOUNT_TYPE_COLORS[account.type]} w-11 h-11 rounded-2xl items-center justify-center mr-3`}
            >
              <MaterialIcons
                name={ACCOUNT_TYPE_ICONS[account.type] as any}
                size={22}
                color="white"
              />
            </View>
            <View className="flex-1">
              <Text className="text-foreground text-base font-semibold">
                {account.name}
              </Text>
              <Text className="text-muted-foreground text-xs mt-1">
                {showTypeMeta
                  ? `${account.type.replace("_", " ")} • ${account.currency}`
                  : account.currency}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteAccount(account)}
            className="w-8 h-8 rounded-full bg-white/5 items-center justify-center"
          >
            <MaterialIcons name="more-vert" size={18} color={theme.colors.muted.foreground} />
          </TouchableOpacity>
        </View>

        <View className="mt-4">
          <Text className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
            Total Balance
          </Text>
          <Text className="text-foreground text-2xl font-bold mt-1">
            {formatBalance(account.balance, account.currency)}
          </Text>
        </View>

        {renderReservationsSection(account)}
      </TouchableOpacity>
    </LinearGradient>
  );

  const groupedAccounts = accounts.reduce(
    (acc, account) => {
      if (account.type === "cash") {
        acc.cash.push(account);
      } else {
        acc.bank.push(account);
      }
      return acc;
    },
    { cash: [] as Account[], bank: [] as Account[] }
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
      </SafeAreaView>
    );
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
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-3xl font-bold text-foreground">Accounts</Text>
          <Text className="text-muted-foreground text-sm">
            {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Bank Accounts Section */}
        {groupedAccounts.bank.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-bold text-foreground mb-3">Bank Accounts</Text>
            {groupedAccounts.bank.map((account) =>
              renderAccountCard(account, true)
            )}
          </View>
        )}

        {/* Cash Section */}
        {groupedAccounts.cash.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-bold text-foreground mb-3">Cash</Text>
            {groupedAccounts.cash.map((account) =>
              renderAccountCard(account, false)
            )}
          </View>
        )}

        {/* Empty State */}
        {accounts.length === 0 && (
          <View className="items-center justify-center py-12">
            <MaterialIcons
              name="account-balance-wallet"
              size={64}
              color={theme.colors.muted.foreground}
            />
            <Text className="text-muted-foreground text-lg mt-4 text-center">
              No accounts yet
            </Text>
            <Text className="text-muted-foreground text-sm mt-2 text-center">
              Add your first account to get started
            </Text>
          </View>
        )}

        {/* Add Account Section */}
        <TouchableOpacity
          className="border-2 border-dashed border-border rounded-2xl p-4 mb-6"
          onPress={handleAddAccount}
        >
          <View className="flex-row items-center">
            <View className="bg-muted w-10 h-10 rounded-full items-center justify-center mr-3">
              <MaterialIcons name="add" size={24} color="white" />
            </View>
            <Text className="text-foreground text-base font-semibold">
              Add Account
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Account Form Sheet */}
      <AccountFormSheet
        visible={formSheetVisible}
        account={editingAccount}
        onClose={() => {
          setFormSheetVisible(false);
          setEditingAccount(null);
        }}
        onSubmit={handleSubmitAccount}
        loading={submitting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardGradient: {
    borderRadius: 28,
    marginBottom: 16,
  },
  cardInner: {
    borderRadius: 28,
    padding: 16,
    backgroundColor: "rgba(18, 18, 20, 0.92)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
});
