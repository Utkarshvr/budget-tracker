import { useState, useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { Transaction } from "@/types/transaction";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

function formatAmount(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const mainUnit = amount / 100;
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

export default function TransactionsScreen() {
  const { session } = useSupabaseSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (session) {
      fetchTransactions();
    }
  }, [session]);

  const fetchTransactions = async () => {
    if (!session?.user) return;

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(
          `
          *,
          from_account:accounts!from_account_id(id, name, type, currency),
          to_account:accounts!to_account_id(id, name, type, currency)
        `
        )
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

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
          <Text className="text-3xl font-bold text-white">Transactions</Text>
          <Text className="text-neutral-400 text-sm">
            {transactions.length} transaction
            {transactions.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Transactions List */}
        {transactions.length > 0 ? (
          <View className="mb-6">
            {transactions.map((transaction) => {
              const isExpense = transaction.type === "expense";
              const isIncome = transaction.type === "income";
              const isTransfer = transaction.type === "transfer";

              return (
                <View
                  key={transaction.id}
                  className="bg-neutral-800 rounded-2xl p-4 mb-3"
                >
                  <View className="flex-row items-start mb-2">
                    <View
                      className={`w-10 h-10 rounded-lg items-center justify-center mr-3 ${
                        isExpense
                          ? "bg-red-500"
                          : isIncome
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }`}
                    >
                      <MaterialIcons
                        name={
                          isExpense
                            ? "arrow-downward"
                            : isIncome
                            ? "arrow-upward"
                            : "swap-horiz"
                        }
                        size={20}
                        color="white"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-base font-semibold">
                        {transaction.note}
                      </Text>
                      <Text className="text-neutral-400 text-sm mt-1 capitalize">
                        {transaction.type}
                      </Text>
                      <Text className="text-neutral-500 text-xs mt-1">
                        {formatDate(transaction.created_at)}
                      </Text>
                    </View>
                    <Text
                      className={`text-lg font-bold ${
                        isExpense ? "text-red-400" : "text-green-400"
                      }`}
                    >
                      {isExpense ? "-" : isIncome ? "+" : ""}
                      {formatAmount(transaction.amount, transaction.currency)}
                    </Text>
                  </View>

                  {/* Account Information */}
                  <View className="mt-2 pt-2 border-t border-neutral-700">
                    {isExpense && transaction.from_account && (
                      <View className="flex-row items-center">
                        <MaterialIcons
                          name="account-balance"
                          size={16}
                          color="#9ca3af"
                          style={{ marginRight: 6 }}
                        />
                        <Text className="text-neutral-400 text-xs">
                          From: {transaction.from_account.name}
                        </Text>
                      </View>
                    )}
                    {isIncome && transaction.to_account && (
                      <View className="flex-row items-center">
                        <MaterialIcons
                          name="account-balance"
                          size={16}
                          color="#9ca3af"
                          style={{ marginRight: 6 }}
                        />
                        <Text className="text-neutral-400 text-xs">
                          To: {transaction.to_account.name}
                        </Text>
                      </View>
                    )}
                    {isTransfer && (
                      <View>
                        {transaction.from_account && (
                          <View className="flex-row items-center mb-1">
                            <MaterialIcons
                              name="account-balance"
                              size={16}
                              color="#9ca3af"
                              style={{ marginRight: 6 }}
                            />
                            <Text className="text-neutral-400 text-xs">
                              From: {transaction.from_account.name}
                            </Text>
                          </View>
                        )}
                        {transaction.to_account && (
                          <View className="flex-row items-center">
                            <MaterialIcons
                              name="account-balance"
                              size={16}
                              color="#9ca3af"
                              style={{ marginRight: 6 }}
                            />
                            <Text className="text-neutral-400 text-xs">
                              To: {transaction.to_account.name}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          /* Empty State */
          <View className="items-center justify-center py-12">
            <MaterialIcons name="receipt-long" size={64} color="#6b7280" />
            <Text className="text-neutral-400 text-lg mt-4 text-center">
              No transactions yet
            </Text>
            <Text className="text-neutral-500 text-sm mt-2 text-center">
              Add your first transaction to get started
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

