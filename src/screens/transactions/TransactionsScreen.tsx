import { useState, useEffect, type ComponentProps } from "react";
import {
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableHighlight,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { Transaction, TransactionType } from "@/types/transaction";

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

function getAccountLabel(transaction: Transaction): string | null {
  const fromName = transaction.from_account?.name;
  const toName = transaction.to_account?.name;

  switch (transaction.type) {
    case "expense":
      return fromName ? `From: ${fromName}` : null;
    case "income":
      return toName ? `To: ${toName}` : null;
    case "transfer":
      if (fromName && toName) {
        return `${fromName} → ${toName}`;
      }
      return fromName ? `From: ${fromName}` : toName ? `To: ${toName}` : null;
    case "goal":
      return fromName ? `${fromName} → Goal` : null;
    case "goal_withdraw":
      return toName ? `Goal → ${toName}` : null;
    default:
      return null;
  }
}

const DEFAULT_TYPE_META = {
  icon: "receipt-long",
  badgeBg: "#27272a",
  badgeIconColor: "#e5e7eb",
  amountColor: "text-white",
  amountPrefix: "",
} as const;

const TRANSACTION_TYPE_META: Record<
  TransactionType,
  {
    icon: ComponentProps<typeof MaterialIcons>["name"];
    badgeBg: string;
    badgeIconColor: string;
    amountColor: string;
    amountPrefix: string;
  }
> = {
  expense: {
    icon: "arrow-downward",
    badgeBg: "#7f1d1d",
    badgeIconColor: "#fca5a5",
    amountColor: "text-red-400",
    amountPrefix: "-",
  },
  income: {
    icon: "arrow-upward",
    badgeBg: "#064e3b",
    badgeIconColor: "#86efac",
    amountColor: "text-green-400",
    amountPrefix: "+",
  },
  transfer: {
    icon: "swap-horiz",
    badgeBg: "#1e3a8a",
    badgeIconColor: "#bfdbfe",
    amountColor: "text-white",
    amountPrefix: "",
  },
  goal: {
    icon: "savings",
    badgeBg: "#4c1d95",
    badgeIconColor: "#ddd6fe",
    amountColor: "text-purple-400",
    amountPrefix: "-",
  },
  goal_withdraw: {
    icon: "undo",
    badgeBg: "#14532d",
    badgeIconColor: "#86efac",
    amountColor: "text-green-400",
    amountPrefix: "+",
  },
};

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
          to_account:accounts!to_account_id(id, name, type, currency),
          category:categories(id, name, emoji, background_color, category_type)
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
          <View className="mb-6 -mx-4">
            {transactions.map((transaction, index) => {
              const typeMeta =
                TRANSACTION_TYPE_META[transaction.type] || DEFAULT_TYPE_META;
              const categoryEmoji = transaction.category?.emoji || "💸";
              const categoryBg =
                transaction.category?.background_color || "#27272a";
              const rippleProps =
                Platform.OS === "android"
                  ? ({ android_ripple: { color: "#22c55e33" } } as any)
                  : {};
              const accountLabel = getAccountLabel(transaction);

              return (
                <View key={transaction.id}>
                  <TouchableHighlight
                    onPress={() => {}}
                    underlayColor="#27272a"
                    {...rippleProps}
                    className="px-4"
                  >
                    <View className="flex-row items-center py-3">
                      <View className="w-11 h-11 mr-3.5 relative">
                        <View
                          className="w-11 h-11 rounded-2xl items-center justify-center"
                          style={{ backgroundColor: categoryBg }}
                        >
                          <Text className="text-2xl">{categoryEmoji}</Text>
                        </View>
                        <View
                          className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full items-center justify-center"
                          style={{ backgroundColor: typeMeta.badgeBg }}
                        >
                          <MaterialIcons
                            name={typeMeta.icon}
                            size={12}
                            color={typeMeta.badgeIconColor}
                          />
                        </View>
                      </View>

                      <View className="flex-1">
                        <View className="flex-row justify-between items-center">
                          <View className="flex-1 pr-3">
                            <Text className="text-white text-base font-semibold leading-5">
                              {transaction.note}
                            </Text>
                            <Text className="text-neutral-400 text-xs mt-1">
                              {transaction.category?.name ||
                                transaction.type.replace("_", " ")}
                            </Text>
                          </View>
                          <Text
                            className={`text-lg font-semibold ${typeMeta.amountColor}`}
                          >
                            {typeMeta.amountPrefix}
                            {formatAmount(
                              transaction.amount,
                              transaction.currency
                            )}
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between mt-1.5">
                          <Text className="text-neutral-500 text-xs">
                            {formatDate(transaction.created_at)}
                          </Text>
                          {accountLabel && (
                            <Text className="text-neutral-400 text-xs text-right flex-shrink">
                              {accountLabel}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </TouchableHighlight>
                  {index < transactions.length - 1 && (
                    <View className="h-px bg-neutral-800 mx-4" />
                  )}
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

