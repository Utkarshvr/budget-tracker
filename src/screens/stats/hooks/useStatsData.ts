import { useState, useEffect, useMemo, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import { Transaction } from "@/types/transaction";
import { getDateRangeForPeriod, DateRangeFilter } from "@/screens/transactions/utils/dateRange";

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
      Alert.alert("Error", error.message || "Failed to fetch transactions");
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
    const incomeTransactions = transactions.filter(
      (t) => t.type === "income"
    );
    const expenseTransactions = transactions.filter(
      (t) => t.type === "expense"
    );

    // Group by category and calculate totals
    const processCategoryStats = (
      transactionList: Transaction[]
    ): CategoryStat[] => {
      const categoryMap = new Map<
        string,
        {
          categoryId: string | null;
          categoryName: string;
          categoryEmoji: string;
          categoryColor: string;
          totalAmount: number;
          currency: string;
        }
      >();

      transactionList.forEach((transaction) => {
        const categoryId = transaction.category_id || "uncategorized";
        const categoryName =
          transaction.category?.name || "Uncategorized";
        const categoryEmoji = transaction.category?.emoji || "📦";
        const categoryColor =
          transaction.category?.background_color || "#64748B";
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
            categoryColor,
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

      return Array.from(categoryMap.values())
        .map((stat) => ({
          ...stat,
          percentage: total > 0 ? (stat.totalAmount / total) * 100 : 0,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);
    };

    const incomeStats = processCategoryStats(incomeTransactions);
    const expenseStats = processCategoryStats(expenseTransactions);

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

