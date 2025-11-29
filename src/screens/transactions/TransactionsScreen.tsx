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
import { useThemeColors, type ThemeColors } from "@/constants/theme";

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

type TransactionTypeMeta = {
  icon: ComponentProps<typeof MaterialIcons>["name"];
  badgeBg: string;
  badgeIconColor: string;
  amountColor: string; // Tailwind class name
  amountPrefix: string;
};

function buildTypeMeta(colors: ThemeColors): {
  DEFAULT_TYPE_META: TransactionTypeMeta;
  TRANSACTION_TYPE_META: Record<TransactionType, TransactionTypeMeta>;
} {
  const DEFAULT_TYPE_META: TransactionTypeMeta = {
    icon: "receipt-long",
    badgeBg: colors.background.subtle,
    badgeIconColor: colors.foreground,
    amountColor: "text-foreground",
    amountPrefix: "",
  };

  const TRANSACTION_TYPE_META: Record<TransactionType, TransactionTypeMeta> = {
    expense: {
      icon: "arrow-downward",
      badgeBg: colors.transaction.expense.badgeBg,
      badgeIconColor: colors.transaction.expense.badgeIcon,
      amountColor: colors.transaction.expense.amountClass,
      amountPrefix: "-",
    },
    income: {
      icon: "arrow-upward",
      badgeBg: colors.transaction.income.badgeBg,
      badgeIconColor: colors.transaction.income.badgeIcon,
      amountColor: colors.transaction.income.amountClass,
      amountPrefix: "+",
    },
    transfer: {
      icon: "swap-horiz",
      badgeBg: colors.transaction.transfer.badgeBg,
      badgeIconColor: colors.transaction.transfer.badgeIcon,
      amountColor: colors.transaction.transfer.amountClass,
      amountPrefix: "",
    },
    goal: {
      icon: "savings",
      badgeBg: colors.transaction.goal.badgeBg,
      badgeIconColor: colors.transaction.goal.badgeIcon,
      amountColor: colors.transaction.goal.amountClass,
      amountPrefix: "-",
    },
    goal_withdraw: {
      icon: "undo",
      badgeBg: colors.transaction.goalWithdraw.badgeBg,
      badgeIconColor: colors.transaction.goalWithdraw.badgeIcon,
      amountColor: colors.transaction.goalWithdraw.amountClass,
      amountPrefix: "+",
    },
  };

  return { DEFAULT_TYPE_META, TRANSACTION_TYPE_META };
}

export default function TransactionsScreen() {
  const colors = useThemeColors();
  const { DEFAULT_TYPE_META, TRANSACTION_TYPE_META } = buildTypeMeta(colors);

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
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background.DEFAULT }}
      >
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </SafeAreaView>
    );
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
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text
            className="text-3xl font-bold"
            style={{ color: colors.foreground }}
          >
            Transactions
          </Text>
          <Text
            className="text-sm"
            style={{ color: colors.muted.foreground }}
          >
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
                transaction.category?.background_color ||
                colors.background.subtle;
              const rippleProps =
                Platform.OS === "android"
                  ? ({ android_ripple: { color: colors.primary.soft } } as any)
                  : {};
              const accountLabel = getAccountLabel(transaction);

              return (
                <View key={transaction.id}>
                    <TouchableHighlight
                    onPress={() => {}}
                    underlayColor={colors.background.subtle}
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
                            <Text
                              className="text-base font-semibold leading-5"
                              style={{ color: colors.foreground }}
                            >
                              {transaction.note}
                            </Text>
                            <Text
                              className="text-xs mt-1"
                              style={{ color: colors.muted.foreground }}
                            >
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
                          <Text
                            className="text-xs"
                            style={{ color: colors.muted.foreground }}
                          >
                            {formatDate(transaction.created_at)}
                          </Text>
                          {accountLabel && (
                            <Text
                              className="text-xs text-right flex-shrink"
                              style={{ color: colors.muted.foreground }}
                            >
                              {accountLabel}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </TouchableHighlight>
                  {index < transactions.length - 1 && (
                    <View
                      className="h-px mx-4"
                      style={{ backgroundColor: colors.border }}
                    />
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          /* Empty State */
          <View className="items-center justify-center py-12">
            <MaterialIcons
              name="receipt-long"
              size={64}
              color={colors.muted.foreground}
            />
            <Text
              className="text-lg mt-4 text-center"
              style={{ color: colors.muted.foreground }}
            >
              No transactions yet
            </Text>
            <Text
              className="text-sm mt-2 text-center"
              style={{ color: colors.muted.foreground }}
            >
              Add your first transaction to get started
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

