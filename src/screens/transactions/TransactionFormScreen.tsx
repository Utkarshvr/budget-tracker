import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { Account } from "@/types/account";
import { Transaction, TransactionFormData, TransactionType } from "@/types/transaction";
import { Category, CategoryReservation } from "@/types/category";
import { TransactionTypeSheet } from "./components/TransactionTypeSheet";
import { AccountSelectSheet } from "./components/AccountSelectSheet";

type TransactionFormScreenProps = {
  initialAmount?: string;
  transaction?: Transaction | null; // For editing mode
  onClose: () => void;
  onSuccess: () => void;
};

export default function TransactionFormScreen({
  initialAmount = "0.00",
  transaction = null,
  onClose,
  onSuccess,
}: TransactionFormScreenProps) {
  const { session } = useSupabaseSession();
  const insets = useSafeAreaInsets();
  const isEditing = !!transaction;
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reservations, setReservations] = useState<CategoryReservation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showTypeSheet, setShowTypeSheet] = useState(false);
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const [accountSheetMode, setAccountSheetMode] = useState<"from" | "to">("from");

  // Initialize form data based on whether we're editing or adding
  const getInitialFormData = (): TransactionFormData => {
    if (transaction) {
      return {
        note: transaction.note,
        type: transaction.type,
        amount: (transaction.amount / 100).toFixed(2),
        from_account_id: transaction.from_account_id,
        to_account_id: transaction.to_account_id,
        category_id: transaction.category_id,
      };
    }
    return {
      note: "",
      type: "expense",
      amount: initialAmount,
      from_account_id: null,
      to_account_id: null,
      category_id: null,
    };
  };

  const [formData, setFormData] = useState<TransactionFormData>(getInitialFormData());

  const [errors, setErrors] = useState<
    Partial<Record<keyof TransactionFormData, string>>
  >({});

  useEffect(() => {
    if (session) {
      fetchAccounts();
      fetchCategories();
      fetchReservations();
    }
  }, [session]);

  // Initialize form when transaction changes (for editing)
  useEffect(() => {
    if (transaction) {
      setFormData({
        note: transaction.note,
        type: transaction.type,
        amount: (transaction.amount / 100).toFixed(2),
        from_account_id: transaction.from_account_id,
        to_account_id: transaction.to_account_id,
        category_id: transaction.category_id,
      });
    }
  }, [transaction?.id]);

  // Update amount when initialAmount changes (for adding mode)
  useEffect(() => {
    if (!isEditing) {
      setFormData((prev) => ({ ...prev, amount: initialAmount }));
    }
  }, [initialAmount, isEditing]);

  // Update selectedCategory when category_id changes
  useEffect(() => {
    if (formData.category_id) {
      const category = categories.find((c) => c.id === formData.category_id);
      setSelectedCategory(category || null);
    } else {
      setSelectedCategory(null);
    }
  }, [formData.category_id, categories]);

  const fetchAccounts = async () => {
    if (!session?.user) return;

    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", session.user.id)
        .order("name", { ascending: true });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to fetch accounts");
    } finally {
      setLoadingAccounts(false);
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
      // Don't show alert for categories, just log it
      console.error("Error fetching categories:", error);
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
      console.error("Error fetching reservations:", error);
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof TransactionFormData, string>> = {};

    if (!formData.note.trim()) {
      newErrors.note = "Transaction note is required";
    }

    if (!formData.amount.trim()) {
      newErrors.amount = "Amount is required";
    } else {
      const amountNum = parseFloat(formData.amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = "Amount must be a valid positive number";
      }
    }

    if (formData.type === "expense") {
      if (!formData.from_account_id) {
        newErrors.from_account_id = "From account is required for expenses";
      }

      // Check if category has reservation and validate amount against it
      if (selectedCategory && formData.from_account_id) {
        const reservation = reservations.find(
          (r) =>
            r.category_id === selectedCategory.id &&
            r.account_id === formData.from_account_id
        );

        if (reservation) {
          const amountNum = parseFloat(formData.amount || "0");
          const amountSmallest = Math.round(amountNum * 100);
          
          // For editing, we need to account for the old amount being added back
          const oldAmount = isEditing && transaction?.type === "expense" 
            ? transaction.amount 
            : 0;
          const availableAmount = reservation.reserved_amount + oldAmount;

          if (amountSmallest > availableAmount) {
            newErrors.amount = "Amount exceeds reserved balance for this category";
          }
        }
      }
    }

    if (formData.type === "income" && !formData.to_account_id) {
      newErrors.to_account_id = "To account is required for income";
    }

    if (formData.type === "transfer") {
      if (!formData.from_account_id) {
        newErrors.from_account_id = "From account is required for transfers";
      }
      if (!formData.to_account_id) {
        newErrors.to_account_id = "To account is required for transfers";
      }
      if (
        formData.from_account_id &&
        formData.to_account_id &&
        formData.from_account_id === formData.to_account_id
      ) {
        newErrors.to_account_id = "From and To accounts must be different";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!session?.user) return;

    setSubmitting(true);
    try {
      // Convert amount to smallest currency unit (paise/cents)
      const amountInSmallestUnit = Math.round(
        parseFloat(formData.amount) * 100
      );

      // Get currency from the account
      let currency = transaction?.currency || "INR"; // Use existing currency when editing
      if (formData.type === "expense" && formData.from_account_id) {
        const account = accounts.find((a) => a.id === formData.from_account_id);
        currency = account?.currency || currency;
      } else if (formData.type === "income" && formData.to_account_id) {
        const account = accounts.find((a) => a.id === formData.to_account_id);
        currency = account?.currency || currency;
      } else if (formData.type === "transfer" && formData.from_account_id) {
        const account = accounts.find((a) => a.id === formData.from_account_id);
        currency = account?.currency || currency;
      }

      if (isEditing && transaction) {
        // UPDATE MODE: Update existing transaction
        const oldAmount = transaction.amount;
        const oldCategoryId = transaction.category_id;
        const oldFromAccountId = transaction.from_account_id;

        // Update transaction in Supabase
        const { data, error } = await supabase
          .from("transactions")
          .update({
            note: formData.note.trim(),
            type: formData.type,
            amount: amountInSmallestUnit,
            from_account_id: formData.from_account_id,
            to_account_id: formData.to_account_id,
            category_id: formData.category_id,
            currency: currency,
          })
          .eq("id", transaction.id)
          .select()
          .single();

        if (error) throw error;

        // Handle reservation adjustments for expense transactions
        if (transaction.type === "expense" && oldCategoryId && oldFromAccountId) {
          // Add back the old amount to reservation
          const oldReservation = reservations.find(
            (r) => r.category_id === oldCategoryId && r.account_id === oldFromAccountId
          );

          if (oldReservation) {
            await supabase.rpc("adjust_category_reservation", {
              p_category_id: oldCategoryId,
              p_account_id: oldFromAccountId,
              p_amount_delta: oldAmount, // Add back the old amount
            });
          }
        }

        // Deduct the new amount if it's an expense with a category
        if (
          formData.type === "expense" &&
          selectedCategory &&
          formData.from_account_id
        ) {
          const reservation = reservations.find(
            (r) =>
              r.category_id === selectedCategory.id &&
              r.account_id === formData.from_account_id
          );

          if (reservation) {
            const { error: reservationError } = await supabase.rpc(
              "adjust_category_reservation",
              {
                p_category_id: selectedCategory.id,
                p_account_id: formData.from_account_id,
                p_amount_delta: -amountInSmallestUnit,
              }
            );

            if (reservationError) {
              // Rollback transaction update
              await supabase
                .from("transactions")
                .update({
                  note: transaction.note,
                  type: transaction.type,
                  amount: transaction.amount,
                  from_account_id: transaction.from_account_id,
                  to_account_id: transaction.to_account_id,
                  category_id: transaction.category_id,
                  currency: transaction.currency,
                })
                .eq("id", transaction.id);
              throw reservationError;
            }
          }
        }

        Alert.alert("Success", "Transaction updated successfully", [
          {
            text: "OK",
            onPress: () => {
              onSuccess();
              onClose();
            },
          },
        ]);
      } else {
        // INSERT MODE: Create new transaction
        const { data, error } = await supabase
          .from("transactions")
          .insert({
            user_id: session.user.id,
            note: formData.note.trim(),
            type: formData.type,
            amount: amountInSmallestUnit,
            from_account_id: formData.from_account_id,
            to_account_id: formData.to_account_id,
            category_id: formData.category_id,
            currency: currency,
          })
          .select()
          .single();

        if (error) throw error;

        // If expense transaction with a reserved category, deduct from reservation
        if (
          formData.type === "expense" &&
          selectedCategory &&
          formData.from_account_id
        ) {
          const reservation = reservations.find(
            (r) =>
              r.category_id === selectedCategory.id &&
              r.account_id === formData.from_account_id
          );

          if (reservation) {
            const { error: reservationError } = await supabase.rpc(
              "adjust_category_reservation",
              {
                p_category_id: selectedCategory.id,
                p_account_id: formData.from_account_id,
                p_amount_delta: -amountInSmallestUnit,
              }
            );

            if (reservationError) {
              // Rollback transaction
              await supabase.from("transactions").delete().eq("id", data.id);
              throw reservationError;
            }
          }
        }

        Alert.alert("Success", "Transaction added successfully", [
          {
            text: "OK",
            onPress: () => {
              onSuccess();
              onClose();
            },
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || `Failed to ${isEditing ? "update" : "add"} transaction`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleTypeChange = (type: TransactionType) => {
    setFormData({
      ...formData,
      type,
      // Reset account selections when type changes
      from_account_id: null,
      to_account_id: null,
      // Reset category for transfer type
      category_id: type === "transfer" ? null : formData.category_id,
    });
    setErrors({});
    if (type === "transfer") {
      setSelectedCategory(null);
    }
  };

  const handleCategorySelect = (category: Category | null) => {
    setSelectedCategory(category);
    setFormData({
      ...formData,
      category_id: category?.id || null,
    });
  };

  const handleAccountSelect = (account: Account) => {
    if (accountSheetMode === "from") {
      setFormData({ ...formData, from_account_id: account.id });
    } else {
      setFormData({ ...formData, to_account_id: account.id });
    }
  };

  const openAccountSheet = (mode: "from" | "to") => {
    setAccountSheetMode(mode);
    setShowAccountSheet(true);
  };

  const getTypeLabel = () => {
    switch (formData.type) {
      case "expense":
        return "Expense";
      case "income":
        return "Income";
      case "transfer":
        return "Transfer";
      default:
        return "Expense";
    }
  };

  const getTypeIcon = () => {
    switch (formData.type) {
      case "expense":
        return "inbox";
      case "income":
        return "add-circle-outline";
      case "transfer":
        return "sync-alt";
      default:
        return "inbox";
    }
  };

  const getAccountLabel = (accountId: string | null) => {
    if (!accountId) return "Select Account";
    const account = accounts.find((a) => a.id === accountId);
    return account?.name || "Select Account";
  };

  // Categories to display based on transaction type
  const displayCategories = useMemo(() => {
    if (formData.type === "transfer") {
      return [];
    }

    const categoryType = formData.type === "income" ? "income" : "expense";

    return categories
      .filter((c) => c.category_type === categoryType)
      .map((category) => {
        let amountLeft: number | null = null;

        if (formData.type === "expense" && formData.from_account_id) {
          const reservation = reservations.find(
            (r) =>
              r.category_id === category.id &&
              r.account_id === formData.from_account_id
          );

          // Only set amountLeft if reservation exists (even if amount is 0)
          // If no reservation exists, keep it null (don't show "left" text)
          if (reservation) {
            // For editing, add back the old amount if it's the same category/account
            const oldAmount = isEditing && 
              transaction?.type === "expense" &&
              transaction.category_id === category.id &&
              transaction.from_account_id === formData.from_account_id
              ? transaction.amount
              : 0;
            amountLeft = (reservation.reserved_amount + oldAmount) / 100;
          }
        }

        return {
          category,
          amountLeft,
        };
      });
  }, [categories, reservations, formData.type, formData.from_account_id, isEditing, transaction]);

  if (loadingAccounts) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-900 items-center justify-center">
        <ActivityIndicator size="large" color="#22c55e" />
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView className="flex-1 bg-neutral-900">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-neutral-800">
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-white">
            {isEditing ? "Edit transaction" : `₹${formData.amount}`}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >

          {/* Amount Field (only for editing) */}
          {isEditing && (
            <View className="px-4 py-4 border-b border-neutral-800">
              <View className="flex-row items-center">
                <Text className="text-neutral-400 text-base w-16">Amount</Text>
                <TextInput
                  value={formData.amount}
                  onChangeText={(text) => setFormData({ ...formData, amount: text })}
                  placeholder="0.00"
                  placeholderTextColor="#6b7280"
                  keyboardType="decimal-pad"
                  className="flex-1 text-white text-base"
                />
              </View>
              {errors.amount && (
                <Text className="text-red-500 text-sm mt-1 ml-16">
                  {errors.amount}
                </Text>
              )}
            </View>
          )}

          {/* For Field */}
          <View className="px-4 py-4 border-b border-neutral-800">
            <View className="flex-row items-center">
              <Text className="text-neutral-400 text-base w-16">For</Text>
              <TextInput
                value={formData.note}
                onChangeText={(text) => setFormData({ ...formData, note: text })}
                placeholder="What did you spend on?"
                placeholderTextColor="#6b7280"
                className="flex-1 text-white text-base"
              />
            </View>
            {errors.note && (
              <Text className="text-red-500 text-sm mt-1 ml-16">{errors.note}</Text>
            )}
          </View>

          {/* Type Field */}
          <TouchableOpacity
            onPress={() => setShowTypeSheet(true)}
            className="px-4 py-4 border-b border-neutral-800"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <Text className="text-neutral-400 text-base w-16">Type</Text>
                <MaterialIcons
                  name={getTypeIcon() as any}
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white text-base">{getTypeLabel()}</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* From Account (for Expense and Transfer) */}
          {(formData.type === "expense" || formData.type === "transfer") && (
            <TouchableOpacity
              onPress={() => openAccountSheet("from")}
              className="px-4 py-4 border-b border-neutral-800"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <Text className="text-neutral-400 text-base w-16">From</Text>
                  <MaterialIcons
                    name="account-balance-wallet"
                    size={20}
                    color="white"
                    style={{ marginRight: 8 }}
                  />
                  <Text className="text-white text-base">
                    {getAccountLabel(formData.from_account_id)}
                  </Text>
                </View>
              </View>
              {errors.from_account_id && (
                <Text className="text-red-500 text-sm mt-1 ml-16">
                  {errors.from_account_id}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* To Account (for Income and Transfer) */}
          {(formData.type === "income" || formData.type === "transfer") && (
            <TouchableOpacity
              onPress={() => openAccountSheet("to")}
              className="px-4 py-4 border-b border-neutral-800"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <Text className="text-neutral-400 text-base w-16">To</Text>
                  <MaterialIcons
                    name="account-balance-wallet"
                    size={20}
                    color="white"
                    style={{ marginRight: 8 }}
                  />
                  <Text className="text-white text-base">
                    {getAccountLabel(formData.to_account_id)}
                  </Text>
                </View>
              </View>
              {errors.to_account_id && (
                <Text className="text-red-500 text-sm mt-1 ml-16">
                  {errors.to_account_id}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Categories List (Income / Expense) */}
          {(formData.type === "expense" || formData.type === "income") &&
            displayCategories.length > 0 && (
              <View className="px-4 py-6">
                <Text className="text-neutral-500 text-xs font-semibold uppercase mb-3">
                  {formData.type === "income" ? "INCOME CATEGORIES" : "CATEGORIES"}
                </Text>
                {displayCategories.map(({ category, amountLeft }) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => handleCategorySelect(category)}
                    className="flex-row items-center justify-between mb-4"
                  >
                    <View className="flex-row items-center flex-1">
                      <View
                        className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: category.background_color }}
                      >
                        <Text style={{ fontSize: 24 }}>{category.emoji}</Text>
                      </View>
                      <View
                        className={`flex-1 ${
                          formData.type === "expense" &&
                          formData.from_account_id &&
                          amountLeft !== null
                            ? ""
                            : "justify-center"
                        }`}
                      >
                        <Text className="text-white text-base font-medium">
                          {category.name}
                        </Text>
                        {formData.type === "expense" &&
                          formData.from_account_id &&
                          amountLeft !== null && (
                            <Text className="text-neutral-500 text-sm">
                              {`₹${amountLeft.toFixed(2)} left`}
                            </Text>
                          )}
                      </View>
                      <View
                        className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                          selectedCategory?.id === category.id
                            ? "border-green-500 bg-green-500"
                            : "border-neutral-600"
                        }`}
                      >
                        {selectedCategory?.id === category.id && (
                          <MaterialIcons name="check" size={16} color="black" />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
        </ScrollView>

        {/* Add/Update Transaction Button - Fixed at Bottom */}
        <View
          className="absolute bottom-0 left-0 right-0 bg-neutral-900 px-4 pt-2"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            className="bg-primary rounded-full py-4 items-center justify-center"
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-primary-foreground text-base font-bold">
                {isEditing ? "Update Transaction" : "Add Transaction"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Transaction Type Sheet */}
      <TransactionTypeSheet
        visible={showTypeSheet}
        selectedType={formData.type}
        onClose={() => setShowTypeSheet(false)}
        onSelect={handleTypeChange}
      />

      {/* Account Select Sheet */}
      <AccountSelectSheet
        visible={showAccountSheet}
        accounts={accounts}
        selectedAccountId={
          accountSheetMode === "from"
            ? formData.from_account_id
            : formData.to_account_id
        }
        title={accountSheetMode === "from" ? "From Account" : "To Account"}
        excludeAccountId={
          formData.type === "transfer" && accountSheetMode === "to"
            ? formData.from_account_id
            : null
        }
        onClose={() => setShowAccountSheet(false)}
        onSelect={handleAccountSelect}
      />

    </>
  );
}

