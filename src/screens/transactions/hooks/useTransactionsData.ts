import { useState, useEffect, useMemo } from "react";
import { Session } from "@supabase/supabase-js";
import { Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import { Transaction } from "@/types/transaction";
import { getDateRangeForPeriod, type DateRangeFilter } from "../utils/dateRange";

export function useTransactionsData(session: Session | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<DateRangeFilter>("month");
  const [currentPeriodDate, setCurrentPeriodDate] = useState(new Date());

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

  const handleFilterTypeChange = (type: DateRangeFilter) => {
    setFilterType(type);
    // Reset to current period when changing filter type
    setCurrentPeriodDate(new Date());
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

  return {
    transactions,
    loading,
    refreshing,
    filterType,
    setFilterType: handleFilterTypeChange,
    currentPeriodDate,
    setCurrentPeriodDate,
    currentDateRange,
    filteredAndGroupedTransactions,
    handleRefresh,
    handlePreviousPeriod,
    handleNextPeriod,
  };
}

