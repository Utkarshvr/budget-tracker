import { useState, useEffect, useMemo } from "react";
import { Session } from "@supabase/supabase-js";
import { Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import { Account, AccountFormData } from "@/types/account";
import { Category, CategoryReservation } from "@/types/category";

export function useAccountsData(session: Session | null) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reservations, setReservations] = useState<CategoryReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const groupedAccounts = useMemo(() => {
    return accounts.reduce(
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
  }, [accounts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleDeleteAccount = async (account: Account) => {
    return new Promise<void>((resolve, reject) => {
      Alert.alert(
        "Delete Account",
        `Are you sure you want to delete "${account.name}"?`,
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve() },
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
                await fetchData();
                resolve();
              } catch (error: any) {
                Alert.alert("Error", error.message || "Failed to delete account");
                reject(error);
              }
            },
          },
        ]
      );
    });
  };

  const handleSubmitAccount = async (formData: AccountFormData, editingAccount: Account | null) => {
    if (!session?.user) return;

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

      await fetchData();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save account");
      throw error;
    }
  };

  return {
    accounts,
    categories,
    reservations,
    loading,
    refreshing,
    groupedAccounts,
    handleRefresh,
    handleDeleteAccount,
    handleSubmitAccount,
  };
}

