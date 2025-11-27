import { useState, useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { Account, AccountFormData, AccountType } from "@/types/account";
import { Category } from "@/types/category";
import { AccountFormSheet } from "./components/AccountFormSheet";

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
  const [accountFunds, setAccountFunds] = useState<
    Record<
      string,
      {
        total: number;
        currency: string;
        items: {
          id: string;
          name: string;
          emoji: string;
          balance: number;
          target?: number | null;
        }[];
      }
    >
  >({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formSheetVisible, setFormSheetVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    if (session) {
      fetchAccounts();
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      fetchCategories();
    }
  }, [session]);

  useEffect(() => {
    buildAccountFundsFromCategories();
  }, [accounts, categories]);

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
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Error fetching categories for accounts screen", error);
    }
  };

  const buildAccountFundsFromCategories = () => {
    const funded = categories.filter(
      (category) =>
        category.category_type === "fund" && category.fund_account_id
    );

    const allocations: Record<
      string,
      {
        total: number;
        currency: string;
        items: {
          id: string;
          name: string;
          emoji: string;
          balance: number;
          target?: number | null;
        }[];
      }
    > = {};

    funded.forEach((category) => {
      const accountId = category.fund_account_id as string;
      const accountCurrency =
        accounts.find((account) => account.id === accountId)?.currency ||
        category.fund_currency ||
        "INR";

      if (!allocations[accountId]) {
        allocations[accountId] = {
          total: 0,
          currency: accountCurrency,
          items: [],
        };
      }

      allocations[accountId].total += category.fund_balance || 0;
      allocations[accountId].items.push({
        id: category.id,
        name: category.name,
        emoji: category.emoji,
        balance: category.fund_balance || 0,
        target: category.fund_target_amount,
      });
    });

    accounts.forEach((account) => {
      if (!allocations[account.id]) {
        allocations[account.id] = {
          total: 0,
          currency: account.currency,
          items: [],
        };
      }
    });

    setAccountFunds(allocations);
    setExpandedAccounts((prev) => {
      const next = { ...prev };
      accounts.forEach((account) => {
        if (typeof next[account.id] === "undefined") {
          next[account.id] = true;
        }
      });
      return next;
    });
  };

  const renderFundsSection = (account: Account) => {
    const fundInfo = accountFunds[account.id];
    if (!fundInfo) return null;

    const unallocated = Math.max(account.balance - fundInfo.total, 0);
    const isExpanded = expandedAccounts[account.id] ?? true;

    return (
      <View className="mt-3 bg-neutral-900/60 rounded-2xl p-4">
        <TouchableOpacity
          className="flex-row items-center justify-between mb-2"
          onPress={() =>
            setExpandedAccounts((prev) => ({
              ...prev,
              [account.id]: !isExpanded,
            }))
          }
        >
          <Text className="text-white text-sm font-semibold">Funds</Text>
          <MaterialIcons
            name={isExpanded ? "expand-less" : "expand-more"}
            size={22}
            color="#9ca3af"
          />
        </TouchableOpacity>
        {isExpanded && (
          <>
            {fundInfo.items.length === 0 ? (
              <Text className="text-neutral-400 text-xs">
                Nothing reserved yet. All of this balance is ready to plan.
              </Text>
            ) : (
              fundInfo.items.map((item) => {
                const target = item.target || 0;
                const progress = target > 0 ? Math.min(item.balance / target, 1) : 1;
                return (
                  <View key={item.id} className="mb-3">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Text style={{ fontSize: 18, marginRight: 8 }}>{item.emoji}</Text>
                        <Text className="text-white text-sm">{item.name}</Text>
                      </View>
                      <Text className="text-green-400 text-sm font-semibold">
                        {formatBalance(item.balance, fundInfo.currency)}
                      </Text>
                    </View>
                    <View className="h-1.5 rounded-full bg-neutral-800 mt-2 overflow-hidden">
                      <View
                        className="h-1.5 rounded-full bg-green-500"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </View>
                    {target > 0 && (
                      <Text className="text-neutral-500 text-[10px] mt-1">
                        {formatBalance(item.balance, fundInfo.currency)} /{" "}
                        {formatBalance(target, fundInfo.currency)}
                      </Text>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}
        <View className="mt-3 pt-3 border-t border-neutral-800">
          <Text className="text-neutral-400 text-xs uppercase tracking-wide">
            Free to plan
          </Text>
          <Text className="text-white text-lg font-bold mt-1">
            {formatBalance(unallocated, account.currency)}
          </Text>
        </View>
        <TouchableOpacity
          className="mt-3 flex-row items-center justify-center rounded-2xl border border-dashed border-neutral-600 py-2"
          onPress={() => router.push("/(auth)/(tabs)/plan")}
        >
          <MaterialIcons name="savings" size={16} color="#22c55e" />
          <Text className="text-green-400 text-xs font-semibold ml-2">
            Manage funds
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const formatBalanceDisplay = (account: Account) => {
    const fundInfo = accountFunds[account.id];
    const unallocated = Math.max(
      account.balance - (fundInfo?.total || 0),
      0
    );
    return {
      total: formatBalance(account.balance, account.currency),
      unallocated: formatBalance(unallocated, account.currency),
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAccounts();
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
              fetchAccounts();
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

      // TODO: Get currency from global user settings instead of formData
      // For now, using default from form (INR)
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
          currency: currency, // Will come from global settings later
          balance: balanceInSmallestUnit,
        });

        if (error) throw error;
      }

      setFormSheetVisible(false);
      setEditingAccount(null);
      fetchAccounts();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save account");
    } finally {
      setSubmitting(false);
    }
  };

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
      <SafeAreaView className="flex-1 bg-neutral-900 items-center justify-center">
        <ActivityIndicator size="large" color="#22c55e" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#22c55e"
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-3xl font-bold text-white">Accounts</Text>
          <Text className="text-neutral-400 text-sm">
            {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Bank Accounts Section */}
        {groupedAccounts.bank.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-bold text-white mb-3">Bank Accounts</Text>
            {groupedAccounts.bank.map((account) => (
              <TouchableOpacity
                key={account.id}
                className="bg-neutral-800 rounded-2xl p-4 mb-3"
                onPress={() => handleEditAccount(account)}
                onLongPress={() => handleDeleteAccount(account)}
              >
                <View className="flex-row items-start mb-4">
                  <View
                    className={`${ACCOUNT_TYPE_COLORS[account.type]} w-12 h-12 rounded-lg items-center justify-center mr-3`}
                  >
                    <MaterialIcons
                      name={ACCOUNT_TYPE_ICONS[account.type] as any}
                      size={24}
                      color="white"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-base font-semibold">
                      {account.name}
                    </Text>
                    <Text className="text-neutral-400 text-sm mt-1 capitalize">
                      {account.type.replace("_", " ")} • {account.currency}
                    </Text>
                    <Text className="text-neutral-500 text-xs mt-1">
                      Updated {formatDate(account.updated_at)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteAccount(account)}
                    className="p-2"
                  >
                    <MaterialIcons name="more-vert" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
                <View className="mt-2">
                  <Text className="text-neutral-400 text-sm mb-1">Balance</Text>
                  <Text className="text-white text-2xl font-bold">
                    {formatBalance(account.balance, account.currency)}
                  </Text>
                </View>
                {renderFundsSection(account)}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Cash Section */}
        {groupedAccounts.cash.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-bold text-white mb-3">Cash</Text>
            {groupedAccounts.cash.map((account) => (
              <TouchableOpacity
                key={account.id}
                className="bg-neutral-800 rounded-2xl p-4 mb-3"
                onPress={() => handleEditAccount(account)}
                onLongPress={() => handleDeleteAccount(account)}
              >
                <View className="flex-row items-start mb-4">
                  <View
                    className={`${ACCOUNT_TYPE_COLORS[account.type]} w-12 h-12 rounded-lg items-center justify-center mr-3`}
                  >
                    <MaterialIcons
                      name={ACCOUNT_TYPE_ICONS[account.type] as any}
                      size={24}
                      color="white"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-base font-semibold">
                      {account.name}
                    </Text>
                    <Text className="text-neutral-400 text-sm mt-1">
                      {account.currency}
                    </Text>
                    <Text className="text-neutral-500 text-xs mt-1">
                      Updated {formatDate(account.updated_at)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteAccount(account)}
                    className="p-2"
                  >
                    <MaterialIcons name="more-vert" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
                <View className="mt-2">
                  <Text className="text-neutral-400 text-sm mb-1">Balance</Text>
                  <Text className="text-white text-2xl font-bold">
                    {formatBalance(account.balance, account.currency)}
                  </Text>
                </View>
                {renderFundsSection(account)}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {accounts.length === 0 && (
          <View className="items-center justify-center py-12">
            <MaterialIcons name="account-balance-wallet" size={64} color="#6b7280" />
            <Text className="text-neutral-400 text-lg mt-4 text-center">
              No accounts yet
            </Text>
            <Text className="text-neutral-500 text-sm mt-2 text-center">
              Add your first account to get started
            </Text>
          </View>
        )}

        {/* Add Account Section */}
        <TouchableOpacity
          className="border-2 border-dashed border-neutral-600 rounded-2xl p-4 mb-6"
          onPress={handleAddAccount}
        >
          <View className="flex-row items-center">
            <View className="bg-neutral-700 w-10 h-10 rounded-full items-center justify-center mr-3">
              <MaterialIcons name="add" size={24} color="white" />
            </View>
            <Text className="text-white text-base font-semibold">
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
