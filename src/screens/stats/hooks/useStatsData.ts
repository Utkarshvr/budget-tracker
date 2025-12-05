import { useState, useEffect, useMemo, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import { Transaction } from "@/types/transaction";
import {
  getDateRangeForPeriod,
  DateRangeFilter,
} from "@/screens/transactions/utils/dateRange";
import { getErrorMessage } from "@/utils/errorHandler";

// const INCOME_CATEGORY_COLORS = [
//   "#1E5024",
//   "#0E386F",
//   "#24692E",
//   "#1558A2",
//   "#153A1A",
//   "#2A3478",
//   "#2F7A36",
//   "#0273A0",
//   "#1D5F46",
//   "#0F4391",
//   "#006B63",
//   "#331F71",
//   "#004E47",
//   "#1F2A5C",
//   "#2B6B31",
//   "#422783",
//   "#00564F",
//   "#005B6A",
//   "#1A7B74",
//   "#082B5A",
// ];
// const EXPENSE_CATEGORY_COLORS = [
//   "#8F1F1F",
//   "#4A342F",
//   "#C03E1B",
//   "#7F1242",
//   "#37241E",
//   "#B12C2C",
//   "#8B6E60",
//   "#992424",
//   "#6A0E36",
//   "#C46200",
//   "#5F473F",
//   "#A23F00",
//   "#7E1F78",
//   "#3E2B26",
//   "#8A2A0A",
//   "#5D1763",
//   "#B35000",
//   "#6E554C",
//   "#D87300",
//   "#751515",
// ];
const INCOME_CATEGORY_COLORS = [
  "#305E35",
  "#21477A",
  "#35753E",
  "#2765A9",
  "#27492C",
  "#3B4482",
  "#3F8446",
  "#167EA7",
  "#2F6B54",
  "#225299",
  "#14766F",
  "#43307C",
  "#145C55",
  "#303B69",
  "#3B7641",
  "#51388C",
  "#14635D",
  "#146875",
  "#2C857F",
  "#1B3B67",
];

const EXPENSE_CATEGORY_COLORS = [
  "#973030",
  "#58443F",
  "#C54D2D",
  "#892451",
  "#473530",
  "#B73C3C",
  "#94796C",
  "#A13535",
  "#752146",
  "#C86E14",
  "#6B554E",
  "#A94E14",
  "#883082",
  "#4D3B37",
  "#933B1D",
  "#69296F",
  "#B95E14",
  "#79625A",
  "#DB7E14",
  "#802727",
];



export interface CategoryStat {
  categoryId: string | null;
  categoryName: string;
  categoryEmoji: string;
  categoryColor: string;
  totalAmount: number;
  percentage: number;
  currency: string;
}

export interface StatsData {
  incomeStats: CategoryStat[];
  expenseStats: CategoryStat[];
  totalIncome: number;
  totalExpense: number;
  currency: string;
}

export function useStatsData(
  session: Session | null,
  period: DateRangeFilter,
  referenceDate: Date
) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate current date range based on period
  const currentDateRange = useMemo(() => {
    return getDateRangeForPeriod(period, referenceDate);
  }, [period, referenceDate]);

  const fetchTransactions = useCallback(async () => {
    if (!session?.user) return;

    const { start, end } = currentDateRange;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(
          `
          *,
          category:categories(id, name, emoji, background_color, category_type)
        `
        )
        .eq("user_id", session.user.id)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to fetch transactions"
      );
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session, currentDateRange]);

  useEffect(() => {
    if (session) {
      fetchTransactions();
    }
  }, [session, fetchTransactions]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  // Process transactions into stats
  const statsData = useMemo((): StatsData => {
    // Separate income and expense transactions
    const incomeTransactions = transactions.filter((t) => t.type === "income");
    const expenseTransactions = transactions.filter(
      (t) => t.type === "expense"
    );

    // Group by category and calculate totals
    const processCategoryStats = (
      transactionList: Transaction[],
      isIncome: boolean
    ): CategoryStat[] => {
      const categoryMap = new Map<
        string,
        {
          categoryId: string | null;
          categoryName: string;
          categoryEmoji: string;
          totalAmount: number;
          currency: string;
        }
      >();

      transactionList.forEach((transaction) => {
        const categoryId = transaction.category_id || "Other";
        const categoryName = transaction.category?.name || "Other";
        const categoryEmoji = transaction.category?.emoji || "📦";
        const amount = transaction.amount;
        const currency = transaction.currency || "INR";

        if (categoryMap.has(categoryId)) {
          const existing = categoryMap.get(categoryId)!;
          existing.totalAmount += amount;
        } else {
          categoryMap.set(categoryId, {
            categoryId,
            categoryName,
            categoryEmoji,
            totalAmount: amount,
            currency,
          });
        }
      });

      // Convert to array and calculate percentages
      const total = Array.from(categoryMap.values()).reduce(
        (sum, stat) => sum + stat.totalAmount,
        0
      );

      const colorPalette = isIncome
        ? INCOME_CATEGORY_COLORS
        : EXPENSE_CATEGORY_COLORS;

      return Array.from(categoryMap.values())
        .map((stat) => ({
          ...stat,
          percentage: total > 0 ? (stat.totalAmount / total) * 100 : 0,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .map((stat, index) => ({
          ...stat,
          categoryColor: colorPalette[index % colorPalette.length],
        }));
    };

    const incomeStats = processCategoryStats(incomeTransactions, true);
    const expenseStats = processCategoryStats(expenseTransactions, false);

    const totalIncome = incomeTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const totalExpense = expenseTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    // Get the most common currency (default to INR)
    const currencies = transactions.map((t) => t.currency || "INR");
    const currencyCounts = currencies.reduce(
      (acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const currency =
      Object.keys(currencyCounts).length > 0
        ? Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0][0]
        : "INR";

    return {
      incomeStats,
      expenseStats,
      totalIncome,
      totalExpense,
      currency,
    };
  }, [transactions]);

  return {
    statsData,
    loading,
    refreshing,
    handleRefresh,
  };
}
