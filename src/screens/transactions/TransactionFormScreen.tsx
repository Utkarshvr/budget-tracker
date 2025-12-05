import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { Account } from "@/types/account";
import {
  Transaction,
  TransactionFormData,
  TransactionType,
} from "@/types/transaction";
import {
  Category,
  CategoryReservation,
  CategoryFormData,
} from "@/types/category";
import { TransactionTypeSheet } from "./components/TransactionTypeSheet";
import { AccountSelectSheet } from "./components/AccountSelectSheet";
import { CategoryFormSheet } from "@/screens/categories/components/CategoryFormSheet";
import { ACCOUNT_TYPE_ICONS } from "@/screens/accounts/utils";
import { useThemeColors, getCategoryBackgroundColor } from "@/constants/theme";
import { getErrorMessage } from "@/utils/errorHandler";

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
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showTypeSheet, setShowTypeSheet] = useState(false);
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const [accountSheetMode, setAccountSheetMode] = useState<"from" | "to">(
    "from"
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryFormSheet, setShowCategoryFormSheet] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submittingCategory, setSubmittingCategory] = useState(false);

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
        date: transaction.created_at,
      };
    }
    return {
      note: "",
      type: "expense",
      amount: initialAmount,
      from_account_id: null,
      to_account_id: null,
      category_id: null,
      date: new Date().toISOString(),
    };
  };

  const [formData, setFormData] =
    useState<TransactionFormData>(getInitialFormData());

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
        date: transaction.created_at,
      });
    }
  }, [transaction?.id]);

  // Update amount when initialAmount changes (for adding mode)
  useEffect(() => {
    if (!isEditing) {
      setFormData((prev) => ({ ...prev, amount: initialAmount }));
    }
  }, [initialAmount, isEditing]);

  const selectedDate = useMemo(
    () => (formData.date ? new Date(formData.date) : new Date()),
    [formData.date]
  );

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // On Android, the picker can be dismissed without selecting
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      // On Android, if the picker is dismissed, event.type will be "dismissed"
      if (event.type === "dismissed") {
        return;
      }
    }

    if (selectedDate) {
      setFormData({
        ...formData,
        date: selectedDate.toISOString(),
      });
    }

    // On iOS, close the picker after selection or cancellation
    if (Platform.OS === "ios") {
      setShowDatePicker(false);
    }
  };

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
      const errorMessage = getErrorMessage(error, "Failed to fetch accounts");
      Alert.alert("Error", errorMessage);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchCategories = async () => {
    if (!session?.user) return;

    try {
      // Exclude archived categories from transaction forms
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("is_archived", false)
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

  const handleCreateCategory = async (categoryFormData: CategoryFormData) => {
    if (!session?.user) return;
    setSubmittingCategory(true);

    try {
      const trimmedName = categoryFormData.name.trim();

      // Check for duplicate category by (name, category_type) combination (case-insensitive name)
      // Include archived categories to check for duplicates
      let duplicateQuery = supabase
        .from("categories")
        .select("id, name, category_type, is_archived")
        .eq("user_id", session.user.id)
        .eq("category_type", categoryFormData.category_type);

      // When editing, exclude the current category from the duplicate check
      if (editingCategory) {
        duplicateQuery = duplicateQuery.neq("id", editingCategory.id);
      }

      const { data: allCategories, error: duplicateError } =
        await duplicateQuery;

      if (duplicateError) throw duplicateError;

      // Check for case-insensitive duplicate with same category_type
      const duplicateCategory = allCategories?.find(
        (cat) => cat.name.toLowerCase() === trimmedName.toLowerCase()
      );

      // If creating a new category and an archived category with the same (name, type) exists
      // Automatically restore it without prompting
      if (
        !editingCategory &&
        duplicateCategory &&
        duplicateCategory.is_archived
      ) {
        const { data: restoredCategory, error } = await supabase
          .from("categories")
          .update({
            is_archived: false,
            emoji: categoryFormData.emoji,
            background_color: categoryFormData.background_color,
            category_type: categoryFormData.category_type,
          })
          .eq("id", duplicateCategory.id)
          .select()
          .single();

        if (error) throw error;

        // Refresh categories and auto-select the restored category
        await fetchCategories();
        if (restoredCategory) {
          setSelectedCategory(restoredCategory);
          setFormData((prev) => ({
            ...prev,
            category_id: restoredCategory.id,
          }));
        }
        setShowCategoryFormSheet(false);
        setEditingCategory(null);
        return;
      }

      // Check for active duplicate (non-archived) with same (name, type)
      if (duplicateCategory && !duplicateCategory.is_archived) {
        Alert.alert(
          "Duplicate Category",
          `A ${categoryFormData.category_type} category with the name "${trimmedName}" already exists. Please choose a different name.`
        );
        setSubmittingCategory(false);
        return;
      }

      if (editingCategory) {
        // UPDATE MODE: Update existing category
        const { data: updatedCategory, error } = await supabase
          .from("categories")
          .update({
            name: trimmedName,
            emoji: categoryFormData.emoji,
            background_color: categoryFormData.background_color,
            // Don't update category_type when editing
          })
          .eq("id", editingCategory.id)
          .select()
          .single();

        if (error) throw error;

        // Refresh categories and maintain selection if it was selected
        await fetchCategories();
        if (updatedCategory && selectedCategory?.id === editingCategory.id) {
          setSelectedCategory(updatedCategory);
        }
      } else {
        // CREATE MODE: Create new category
        const { data: newCategory, error } = await supabase
          .from("categories")
          .insert({
            user_id: session.user.id,
            name: trimmedName,
            emoji: categoryFormData.emoji,
            background_color: categoryFormData.background_color,
            category_type: categoryFormData.category_type,
          })
          .select()
          .single();

        if (error) throw error;

        // Refresh categories and auto-select the newly created category
        await fetchCategories();
        if (newCategory) {
          setSelectedCategory(newCategory);
          setFormData((prev) => ({ ...prev, category_id: newCategory.id }));
        }
      }

      setShowCategoryFormSheet(false);
      setEditingCategory(null);
    } catch (error: any) {
      const errorMessage = getErrorMessage(
        error,
        `Failed to ${editingCategory ? "update" : "create"} category`
      );
      Alert.alert("Error", errorMessage);
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryFormSheet(true);
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
          const oldAmount =
            isEditing && transaction?.type === "expense"
              ? transaction.amount
              : 0;
          const availableAmount = reservation.reserved_amount + oldAmount;

          if (amountSmallest > availableAmount) {
            newErrors.amount =
              "Amount exceeds reserved balance for this category";
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
            created_at: formData.date || transaction.created_at,
          })
          .eq("id", transaction.id)
          .select()
          .single();

        if (error) throw error;

        // Handle reservation adjustments for expense transactions
        if (
          transaction.type === "expense" &&
          oldCategoryId &&
          oldFromAccountId
        ) {
          // Add back the old amount to reservation
          const oldReservation = reservations.find(
            (r) =>
              r.category_id === oldCategoryId &&
              r.account_id === oldFromAccountId
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
            created_at: formData.date || new Date().toISOString(),
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
      const errorMessage = getErrorMessage(
        error,
        `Failed to ${isEditing ? "update" : "add"} transaction`
      );
      Alert.alert("Error", errorMessage);
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
    // If clicking on the already selected category, deselect it
    if (selectedCategory?.id === category?.id) {
      setSelectedCategory(null);
      setFormData({
        ...formData,
        category_id: null,
      });
    } else {
      setSelectedCategory(category);
      setFormData({
        ...formData,
        category_id: category?.id || null,
      });
    }
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
        return "arrow-outward";
      case "income":
        return "arrow-outward";
      case "transfer":
        return "sync-alt";
      default:
        return "arrow-outward";
    }
  };

  const colors = useThemeColors();
  const categoryBgColor = getCategoryBackgroundColor(colors);

  const getTypeIconColor = () => {
    switch (formData.type) {
      case "expense":
        return colors.transaction.expense.badgeIcon;
      case "income":
        return colors.transaction.income.badgeIcon;
      case "transfer":
        return colors.transaction.transfer.badgeIcon;
      default:
        return colors.transaction.expense.badgeIcon;
    }
  };

  const getNotePlaceholder = () => {
    switch (formData.type) {
      case "expense":
        return "What did you spend on?";
      case "income":
        return "What did you receive?";
      case "transfer":
        return "Transfer note (optional)";
      default:
        return "What did you spend on?";
    }
  };

  const getAccountLabel = (accountId: string | null) => {
    if (!accountId) return "Select Account";
    const account = accounts.find((a) => a.id === accountId);
    return account?.name || "Select Account";
  };

  const getAccountTypeColor = (type: Account["type"]): string => {
    const colorMap: Record<Account["type"], string> = {
      cash: "#22c55e", // green-500
      checking: "#3b82f6", // blue-500
      savings: "#a855f7", // purple-500
      credit_card: "#f97316", // orange-500
    };
    return colorMap[type] || "#6b7280";
  };

  const getAccountIcon = (accountId: string | null) => {
    if (!accountId) return "account-balance-wallet";
    const account = accounts.find((a) => a.id === accountId);
    return account
      ? (ACCOUNT_TYPE_ICONS[account.type] as any)
      : "account-balance-wallet";
  };

  const getAccountIconColor = (accountId: string | null) => {
    if (!accountId) return "white";
    const account = accounts.find((a) => a.id === accountId);
    return account ? getAccountTypeColor(account.type) : "white";
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
            const oldAmount =
              isEditing &&
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
  }, [
    categories,
    reservations,
    formData.type,
    formData.from_account_id,
    isEditing,
    transaction,
  ]);

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
                  onChangeText={(text) =>
                    setFormData({ ...formData, amount: text })
                  }
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
                onChangeText={(text) =>
                  setFormData({ ...formData, note: text })
                }
                placeholder={getNotePlaceholder()}
                placeholderTextColor="#6b7280"
                className="flex-1 text-white text-base"
              />
            </View>
            {errors.note && (
              <Text className="text-red-500 text-sm mt-1 ml-16">
                {errors.note}
              </Text>
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
                  color={getTypeIconColor()}
                  style={{
                    marginRight: 8,
                    transform: [
                      {
                        rotate: formData.type === "income" ? "180deg" : "0deg",
                      },
                    ],
                  }}
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
                    name={getAccountIcon(formData.from_account_id)}
                    size={20}
                    color={getAccountIconColor(formData.from_account_id)}
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
                    name={getAccountIcon(formData.to_account_id)}
                    size={20}
                    color={getAccountIconColor(formData.to_account_id)}
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

          {/* Date Field - Always visible for all transaction types */}
          {true && (
            <TouchableOpacity
              key={`date-field-${formData.type}`}
              onPress={() => setShowDatePicker(true)}
              className="px-4 py-4 border-b border-neutral-800"
            >
              <View className="flex-row items-center">
                <Text className="text-neutral-400 text-base w-16">Date</Text>
                <Text className="text-white text-base">
                  {formatDisplayDate(selectedDate)}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Categories List (Income / Expense) */}
          {(formData.type === "expense" || formData.type === "income") && (
            <View className="px-4 py-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-neutral-500 text-xs font-semibold uppercase">
                  {formData.type === "income"
                    ? "INCOME CATEGORIES"
                    : "CATEGORIES"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setEditingCategory(null);
                    setShowCategoryFormSheet(true);
                  }}
                  className="flex-row items-center"
                >
                  <MaterialIcons name="add" size={20} color="#22c55e" />
                  <Text className="text-green-500 text-xs font-semibold ml-1">
                    New Category
                  </Text>
                </TouchableOpacity>
              </View>
              {displayCategories.length > 0 ? (
                displayCategories.map(({ category, amountLeft }) => (
                  <View
                    key={category.id}
                    className="flex-row items-center justify-between mb-4"
                  >
                    <TouchableOpacity
                      onPress={() => handleCategorySelect(category)}
                      className="flex-row items-center flex-1"
                    >
                      <View
                        className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: categoryBgColor }}
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
                      <TouchableOpacity
                        onPress={() => handleEditCategory(category)}
                        className="p-2 mr-2"
                      >
                        <MaterialIcons name="edit" size={18} color="#9ca3af" />
                      </TouchableOpacity>
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
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View className="py-4">
                  <Text className="text-neutral-500 text-sm text-center">
                    No categories yet. Tap "New" to create one.
                  </Text>
                </View>
              )}
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
        reservations={reservations}
        onClose={() => setShowAccountSheet(false)}
        onSelect={handleAccountSelect}
      />

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* Category Form Sheet */}
      <CategoryFormSheet
        visible={showCategoryFormSheet}
        category={editingCategory}
        defaultCategoryType={
          editingCategory
            ? editingCategory.category_type
            : formData.type === "income"
              ? "income"
              : "expense"
        }
        onClose={() => {
          setShowCategoryFormSheet(false);
          setEditingCategory(null);
        }}
        onSubmit={handleCreateCategory}
        loading={submittingCategory}
      />
    </>
  );
}
