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
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { Account } from "@/types/account";
import { TransactionFormData, TransactionType } from "@/types/transaction";
import { Category, CategoryReservation } from "@/types/category";
import { PrimaryButton } from "@/screens/auth/components/PrimaryButton";
import { CategorySelectSheet } from "./components/CategorySelectSheet";

const TRANSACTION_TYPES: { value: TransactionType; label: string; icon: string }[] = [
  { value: "expense", label: "Expense", icon: "arrow-downward" },
  { value: "income", label: "Income", icon: "mail" },
  { value: "transfer", label: "Transfer", icon: "swap-horiz" },
];

export default function AddTransactionScreen() {
  const router = useRouter();
  const { session } = useSupabaseSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reservations, setReservations] = useState<CategoryReservation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showFromAccounts, setShowFromAccounts] = useState(false);
  const [showToAccounts, setShowToAccounts] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);

  const [formData, setFormData] = useState<TransactionFormData>({
    note: "",
    type: "expense",
    amount: "",
    from_account_id: null,
    to_account_id: null,
    category_id: null,
  });

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

          if (amountSmallest > reservation.reserved_amount) {
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
      let currency = "INR"; // default
      if (formData.type === "expense" && formData.from_account_id) {
        const account = accounts.find((a) => a.id === formData.from_account_id);
        currency = account?.currency || "INR";
      } else if (formData.type === "income" && formData.to_account_id) {
        const account = accounts.find((a) => a.id === formData.to_account_id);
        currency = account?.currency || "INR";
      } else if (formData.type === "transfer" && formData.from_account_id) {
        const account = accounts.find((a) => a.id === formData.from_account_id);
        currency = account?.currency || "INR";
      }

      // Insert transaction into Supabase
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
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const formatAmount = (value: string): string => {
    // Remove non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, "");
    // Ensure only one decimal point
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("");
    }
    return cleaned;
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
    setShowFromAccounts(false);
    setShowToAccounts(false);
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

  if (loadingAccounts) {
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
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white">Add Transaction</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Transaction Note */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-neutral-300 mb-2">
            For?
          </Text>
          <TextInput
            value={formData.note}
            onChangeText={(text) => setFormData({ ...formData, note: text })}
            placeholder="e.g., Job Income, Groceries"
            placeholderTextColor="#6b7280"
            className="bg-neutral-800 rounded-xl px-4 py-3 text-white text-base"
          />
          {errors.note && (
            <Text className="text-red-500 text-sm mt-1">{errors.note}</Text>
          )}
        </View>

        {/* Transaction Type */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-neutral-300 mb-2">
            Type
          </Text>
          <View className="flex-row flex-wrap">
            {TRANSACTION_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                onPress={() => handleTypeChange(type.value)}
                className={`flex-row items-center px-4 py-2 rounded-xl mr-2 mb-2 ${
                  formData.type === type.value
                    ? "bg-green-600"
                    : "bg-neutral-800"
                }`}
              >
                <MaterialIcons
                  name={type.icon as any}
                  size={20}
                  color="white"
                  style={{ marginRight: 6 }}
                />
                <Text className="text-white text-sm font-medium">
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amount */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-neutral-300 mb-2">
            Amount
          </Text>
          <TextInput
            value={formData.amount}
            onChangeText={(text) =>
              setFormData({ ...formData, amount: formatAmount(text) })
            }
            placeholder="0.00"
            placeholderTextColor="#6b7280"
            keyboardType="decimal-pad"
            className="bg-neutral-800 rounded-xl px-4 py-3 text-white text-base"
          />
          {errors.amount && (
            <Text className="text-red-500 text-sm mt-1">{errors.amount}</Text>
          )}
        </View>

        {/* From Account (for Expense and Transfer) */}
        {(formData.type === "expense" || formData.type === "transfer") && (
          <View className="mb-6">
            {accounts.length === 0 ? (
              <View className="bg-neutral-800 rounded-xl px-4 py-3">
                <Text className="text-neutral-500 text-base">
                  No accounts available. Please add an account first.
                </Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setShowFromAccounts(!showFromAccounts)}
                  className="bg-neutral-800 rounded-xl px-4 py-3 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1">
                    <MaterialIcons
                      name="account-balance"
                      size={20}
                      color="white"
                      style={{ marginRight: 12 }}
                    />
                    <Text className="text-white text-base flex-1">
                      {formData.from_account_id
                        ? accounts.find((a) => a.id === formData.from_account_id)
                            ?.name || "Select account"
                        : "Select account"}
                    </Text>
                  </View>
                  <MaterialIcons
                    name={showFromAccounts ? "expand-less" : "expand-more"}
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>
                {showFromAccounts && (
                  <View className="bg-neutral-800 rounded-xl mt-2">
                    {                    accounts.map((account) => (
                      <TouchableOpacity
                        key={account.id}
                        onPress={() => {
                          setFormData({
                            ...formData,
                            from_account_id: account.id,
                          });
                          setShowFromAccounts(false);
                        }}
                        className={`px-4 py-3 border-b border-neutral-700 ${
                          formData.from_account_id === account.id
                            ? "bg-green-600/20"
                            : ""
                        }`}
                      >
                        <View className="flex-row items-center">
                          <MaterialIcons
                            name="account-balance"
                            size={20}
                            color="white"
                            style={{ marginRight: 12 }}
                          />
                          <Text className="text-white text-base flex-1">
                            {account.name}
                          </Text>
                          {formData.from_account_id === account.id && (
                            <MaterialIcons
                              name="check-circle"
                              size={20}
                              color="#22c55e"
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
            {errors.from_account_id && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.from_account_id}
              </Text>
            )}
          </View>
        )}

        {/* Category Selection (for Expense and Income) */}
        {(formData.type === "expense" || formData.type === "income") && (
          <View className="mb-6">
            <Text className="text-sm font-medium text-neutral-300 mb-2">
              Category (Optional)
            </Text>
            <TouchableOpacity
              onPress={() => setShowCategorySheet(true)}
              className="bg-neutral-800 rounded-xl px-4 py-3 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1">
                {selectedCategory ? (
                  <>
                    <View
                      className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                      style={{ backgroundColor: selectedCategory.background_color }}
                    >
                      <Text style={{ fontSize: 20 }}>{selectedCategory.emoji}</Text>
                    </View>
                    <Text className="text-white text-base flex-1">
                      {selectedCategory.name}
                    </Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons
                      name="category"
                      size={20}
                      color="white"
                      style={{ marginRight: 12 }}
                    />
                    <Text className="text-white text-base flex-1">
                      Select category
                    </Text>
                  </>
                )}
              </View>
              <MaterialIcons name="chevron-right" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}

        {/* To Account (for Income and Transfer) */}
        {(formData.type === "income" || formData.type === "transfer") && (
          <View className="mb-6">
            <Text className="text-sm font-medium text-neutral-300 mb-2">
              To
            </Text>
            {accounts.length === 0 ? (
              <View className="bg-neutral-800 rounded-xl px-4 py-3">
                <Text className="text-neutral-500 text-base">
                  No accounts available. Please add an account first.
                </Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setShowToAccounts(!showToAccounts)}
                  className="bg-neutral-800 rounded-xl px-4 py-3 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1">
                    <MaterialIcons
                      name="account-balance"
                      size={20}
                      color="white"
                      style={{ marginRight: 12 }}
                    />
                    <Text className="text-white text-base flex-1">
                      {formData.to_account_id
                        ? accounts.find((a) => a.id === formData.to_account_id)
                            ?.name || "Select account"
                        : "Select account"}
                    </Text>
                  </View>
                  <MaterialIcons
                    name={showToAccounts ? "expand-less" : "expand-more"}
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>
                {showToAccounts && (
                  <View className="bg-neutral-800 rounded-xl mt-2">
                    {accounts
                      .filter(
                        (account) =>
                          formData.type !== "transfer" ||
                          account.id !== formData.from_account_id
                      )
                      .map((account) => (
                        <TouchableOpacity
                          key={account.id}
                          onPress={() => {
                            setFormData({
                              ...formData,
                              to_account_id: account.id,
                            });
                            setShowToAccounts(false);
                          }}
                          className={`px-4 py-3 border-b border-neutral-700 ${
                            formData.to_account_id === account.id
                              ? "bg-green-600/20"
                              : ""
                          }`}
                        >
                          <View className="flex-row items-center">
                            <MaterialIcons
                              name="account-balance"
                              size={20}
                              color="white"
                              style={{ marginRight: 12 }}
                            />
                            <Text className="text-white text-base flex-1">
                              {account.name}
                            </Text>
                            {formData.to_account_id === account.id && (
                              <MaterialIcons
                                name="check-circle"
                                size={20}
                                color="#22c55e"
                              />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                  </View>
                )}
              </>
            )}
            {errors.to_account_id && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.to_account_id}
              </Text>
            )}
          </View>
        )}

        {/* Submit Button */}
        <View className="mt-4">
          <PrimaryButton
            label="Add Transaction"
            onPress={handleSubmit}
            loading={submitting}
          />
        </View>
      </ScrollView>

      {/* Category Select Sheet */}
      <CategorySelectSheet
        visible={showCategorySheet}
        selectedCategoryId={formData.category_id}
        selectedAccountId={
          formData.type === "expense" 
            ? formData.from_account_id 
            : formData.type === "income" 
            ? formData.to_account_id 
            : null
        }
        onClose={() => setShowCategorySheet(false)}
        onSelect={handleCategorySelect}
        transactionType={formData.type}
      />
    </SafeAreaView>
  );
}

