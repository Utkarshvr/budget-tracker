import { useState, useEffect, useMemo, useCallback, useRef, type ComponentProps } from "react";
import {
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableHighlight,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { Transaction, TransactionType } from "@/types/transaction";
import { useThemeColors, type ThemeColors } from "@/constants/theme";
import { FilterDropdown } from "./components/FilterDropdown";

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
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateHeader(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export type DateRangeFilter = "month" | "week" | "year";

function getDateRangeForPeriod(
  period: DateRangeFilter,
  referenceDate: Date
): { start: Date; end: Date } {
  const start = new Date(referenceDate);
  const end = new Date(referenceDate);

  switch (period) {
    case "week": {
      // Get Monday of the week
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      // Get Sunday of the week
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "month": {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0); // Last day of the month
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "year": {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    }
  }

  return { start, end };
}

function formatDateRange(
  start: Date,
  end: Date,
  period: DateRangeFilter
): string {
  if (period === "month") {
    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  } else if (period === "week") {
    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  } else {
    // year
    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
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
  const [filterType, setFilterType] = useState<DateRangeFilter>("month");
  const [currentPeriodDate, setCurrentPeriodDate] = useState(new Date());
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterButtonRef = useRef<View>(null);
  const [filterButtonLayout, setFilterButtonLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

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

  // Calculate current date range
  const currentDateRange = useMemo(() => {
    return getDateRangeForPeriod(filterType, currentPeriodDate);
  }, [filterType, currentPeriodDate]);

  // Filter and group transactions by date
  const filteredAndGroupedTransactions = useMemo(() => {
    const { start, end } = currentDateRange;

    // Filter transactions within date range
    const filtered = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.created_at);
      return transactionDate >= start && transactionDate <= end;
    });

    // Group by date
    const grouped: Record<string, Transaction[]> = {};
    filtered.forEach((transaction) => {
      const dateKey = new Date(transaction.created_at).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });

    // Convert to array and sort by date (newest first)
    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => {
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      })
      .map(([date, transactions]) => ({
        date,
        transactions: transactions.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      }));
  }, [transactions, currentDateRange]);

  const handlePreviousPeriod = () => {
    const newDate = new Date(currentPeriodDate);
    if (filterType === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (filterType === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (filterType === "year") {
      newDate.setFullYear(newDate.getFullYear() - 1);
    }
    setCurrentPeriodDate(newDate);
  };

  const handleNextPeriod = () => {
    const newDate = new Date(currentPeriodDate);
    if (filterType === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else if (filterType === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (filterType === "year") {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setCurrentPeriodDate(newDate);
  };

  const handleFilterTypeChange = useCallback((type: DateRangeFilter) => {
    setFilterType(type);
    setShowFilterDropdown(false);
    // Reset to current period when changing filter type
    setCurrentPeriodDate(new Date());
  }, []);

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
          <Text className="text-sm" style={{ color: colors.muted.foreground }}>
            {filteredAndGroupedTransactions.reduce(
              (sum, group) => sum + group.transactions.length,
              0
            )}{" "}
            transaction
            {filteredAndGroupedTransactions.reduce(
              (sum, group) => sum + group.transactions.length,
              0
            ) !== 1
              ? "s"
              : ""}
          </Text>
        </View>

        {/* Date Range Filter */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={handlePreviousPeriod}
              className="p-1"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons
                name="chevron-left"
                size={24}
                color={colors.primary.DEFAULT}
              />
            </TouchableOpacity>
            <Text
              className="text-base font-semibold text-center"
              style={{ color: colors.foreground, marginHorizontal: 4 }}
            >
              {formatDateRange(
                currentDateRange.start,
                currentDateRange.end,
                filterType
              )}
            </Text>
            <TouchableOpacity
              onPress={handleNextPeriod}
              className="p-1"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={colors.primary.DEFAULT}
              />
            </TouchableOpacity>
          </View>
          <View className="relative">
            <TouchableOpacity
              ref={filterButtonRef}
              onPress={handleToggleDropdown}
              className="flex-row items-center px-2 py-1"
            >
              <Text
                className="text-sm capitalize mr-1"
                style={{ color: colors.primary.DEFAULT }}
              >
                {filterType}
              </Text>
              <MaterialIcons
                name={showFilterDropdown ? "expand-less" : "expand-more"}
                size={20}
                color={colors.primary.DEFAULT}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Transactions List */}
        {filteredAndGroupedTransactions.length > 0 ? (
          <View className="mb-6 -mx-4">
            {filteredAndGroupedTransactions.map((group, groupIndex) => (
              <View key={group.date}>
                {/* Date Header */}
                <View className="px-4 py-2">
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: colors.muted.foreground }}
                  >
                    {formatDateHeader(group.date)}
                  </Text>
                </View>
                {/* Transactions for this date */}
                {group.transactions.map((transaction, index) => {
                  const typeMeta =
                    TRANSACTION_TYPE_META[transaction.type] ||
                    DEFAULT_TYPE_META;
                  const categoryEmoji = transaction.category?.emoji || "💸";
                  const categoryBg =
                    transaction.category?.background_color ||
                    colors.background.subtle;
                  const rippleProps =
                    Platform.OS === "android"
                      ? ({
                          android_ripple: { color: colors.primary.soft },
                        } as any)
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

                          <View className="flex-1 justify-center">
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
                              <View className="items-end">
                                <Text
                                  className={`text-lg font-semibold ${typeMeta.amountColor}`}
                                >
                                  {typeMeta.amountPrefix}
                                  {formatAmount(
                                    transaction.amount,
                                    transaction.currency
                                  )}
                                </Text>
                                {accountLabel && (
                                  <View className="mt-1.5">
                                    <Text
                                      className="text-xs text-right"
                                      style={{ color: colors.muted.foreground }}
                                    >
                                      {accountLabel}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          </View>
                        </View>
                      </TouchableHighlight>
                      {index < group.transactions.length - 1 && (
                        <View
                          className="h-px mx-4"
                          style={{ backgroundColor: colors.border }}
                        />
                      )}
                    </View>
                  );
                })}
                {/* Separator between date groups */}
                {groupIndex < filteredAndGroupedTransactions.length - 1 && (
                  <View className="h-2" />
                )}
              </View>
            ))}
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
