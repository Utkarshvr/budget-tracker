import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { Category, CategoryFormData, CategoryReservation } from "@/types/category";
import { Account } from "@/types/account";
import { CategoryFormSheet } from "./components/CategoryFormSheet";
import { PrimaryButton } from "@/screens/auth/components/PrimaryButton";
import { CategoryReservationSheet } from "./components/CategoryReservationSheet";

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
  }
  return date.toLocaleDateString();
}

const formatBalance = (amount: number, currency: string) => {
  const mainUnit = amount / 100;
  return `${currency} ${mainUnit.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export default function CategoriesScreen() {
  const { session } = useSupabaseSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [reservations, setReservations] = useState<CategoryReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formSheetVisible, setFormSheetVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"income" | "expense">("expense");
  const [reservationSheetVisible, setReservationSheetVisible] = useState(false);
  const [selectedCategoryForReservation, setSelectedCategoryForReservation] = useState<Category | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    await Promise.all([fetchCategories(), fetchAccounts(), fetchReservations()]);
  };

  const fetchCategories = async () => {
    if (!session?.user) return;
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to fetch categories");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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
      console.error("Error fetching accounts:", error);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormSheetVisible(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormSheetVisible(true);
  };

  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("categories")
                .delete()
                .eq("id", category.id);

              if (error) throw error;
              fetchData();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete category");
            }
          },
        },
      ]
    );
  };

  const handleSubmitCategory = async (formData: CategoryFormData) => {
    if (!session?.user) return;
    setSubmitting(true);

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update({
            name: formData.name.trim(),
            emoji: formData.emoji,
            background_color: formData.background_color,
            // Don't update category_type when editing
          })
          .eq("id", editingCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert({
          user_id: session.user.id,
          name: formData.name.trim(),
          emoji: formData.emoji,
          background_color: formData.background_color,
          category_type: formData.category_type,
        });

        if (error) throw error;
      }

      setFormSheetVisible(false);
      setEditingCategory(null);
      fetchData();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManageReservations = (category: Category) => {
    setSelectedCategoryForReservation(category);
    setReservationSheetVisible(true);
  };

  const handleReservationUpdated = () => {
    fetchData();
  };

  const getReservationsForCategory = (categoryId: string): CategoryReservation[] => {
    return reservations.filter((r) => r.category_id === categoryId);
  };

  const getTotalReserved = (categoryId: string): number => {
    return getReservationsForCategory(categoryId).reduce(
      (sum, r) => sum + r.reserved_amount,
      0
    );
  };

  const filteredCategories = categories.filter(
    (cat) => cat.category_type === activeTab
  );

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
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-3xl font-bold text-white">Categories</Text>
            <Text className="text-neutral-500 text-sm mt-1">
              Organize your income and expenses
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleAddCategory}
            className="w-12 h-12 rounded-2xl bg-green-600 items-center justify-center"
          >
            <MaterialIcons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="flex-row mb-6 bg-neutral-800 rounded-2xl p-1">
          <TouchableOpacity
            onPress={() => setActiveTab("expense")}
            className={`flex-1 py-3 rounded-xl ${
              activeTab === "expense" ? "bg-green-600" : "bg-transparent"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                activeTab === "expense" ? "text-white" : "text-neutral-400"
              }`}
            >
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("income")}
            className={`flex-1 py-3 rounded-xl ${
              activeTab === "income" ? "bg-green-600" : "bg-transparent"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                activeTab === "income" ? "text-white" : "text-neutral-400"
              }`}
            >
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {filteredCategories.length === 0 ? (
          <View className="bg-neutral-800 rounded-2xl p-6 items-center">
            <MaterialIcons name="category" size={48} color="#6b7280" />
            <Text className="text-white text-lg font-semibold mt-4">
              No {activeTab} categories yet
            </Text>
            <Text className="text-neutral-400 text-sm text-center mt-2">
              Create your first {activeTab} category to start organizing transactions.
            </Text>
            <View className="w-full mt-4">
              <PrimaryButton label="Create Category" onPress={handleAddCategory} />
            </View>
          </View>
        ) : (
          <View className="flex-row flex-wrap -mx-1">
            {filteredCategories.map((category) => {
              const categoryReservations = getReservationsForCategory(category.id);
              const totalReserved = getTotalReserved(category.id);
              const isReserved = categoryReservations.length > 0;

              return (
                <TouchableOpacity
                  key={category.id}
                  className="w-full px-1 mb-3"
                  onPress={() => handleEditCategory(category)}
                  onLongPress={() => handleDeleteCategory(category)}
                >
                  <View className="bg-neutral-800 rounded-2xl p-4">
                    <View className="flex-row items-center mb-3">
                      <View
                        className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: category.background_color }}
                      >
                        <Text style={{ fontSize: 24 }}>{category.emoji}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-base font-semibold">
                          {category.name}
                        </Text>
                        <Text className="text-neutral-500 text-xs mt-1">
                          {category.category_type === "expense" ? "Expense" : "Income"} •{" "}
                          {formatDate(category.updated_at)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteCategory(category)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialIcons name="more-vert" size={20} color="#9ca3af" />
                      </TouchableOpacity>
                    </View>

                    {/* Reservations Section (Expense categories only) */}
                    {category.category_type === "expense" && (
                      <View className="mt-3 pt-3 border-t border-neutral-700">
                        {isReserved ? (
                          <>
                            <Text className="text-neutral-400 text-xs mb-2">
                              Reserved from {categoryReservations.length} account
                              {categoryReservations.length > 1 ? "s" : ""}
                            </Text>
                            {categoryReservations.map((reservation) => {
                              const account = accounts.find(
                                (a) => a.id === reservation.account_id
                              );
                              return (
                                <View
                                  key={reservation.id}
                                  className="flex-row items-center justify-between mb-1"
                                >
                                  <Text className="text-neutral-300 text-xs">
                                    {account?.name || "Unknown"}
                                  </Text>
                                  <Text className="text-green-400 text-xs font-semibold">
                                    {formatBalance(
                                      reservation.reserved_amount,
                                      reservation.currency
                                    )}
                                  </Text>
                                </View>
                              );
                            })}
                            <View className="mt-2 pt-2 border-t border-neutral-700/50">
                              <View className="flex-row items-center justify-between">
                                <Text className="text-white text-xs font-semibold">
                                  Total Reserved
                                </Text>
                                <Text className="text-green-400 text-sm font-bold">
                                  {formatBalance(
                                    totalReserved,
                                    categoryReservations[0]?.currency || "INR"
                                  )}
                                </Text>
                              </View>
                            </View>
                          </>
                        ) : (
                          <Text className="text-neutral-500 text-xs">
                            No funds reserved yet
                          </Text>
                        )}

                        <TouchableOpacity
                          className="mt-3 flex-row items-center justify-center rounded-xl border border-dashed border-neutral-600 py-2"
                          onPress={() => handleManageReservations(category)}
                        >
                          <MaterialIcons
                            name={isReserved ? "edit" : "add"}
                            size={16}
                            color="#22c55e"
                          />
                          <Text className="text-green-400 text-xs font-semibold ml-2">
                            {isReserved ? "Manage Funds" : "Reserve Funds"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {category.category_type === "income" && (
                      <Text className="text-neutral-400 text-xs mt-2">
                        Tap to edit • Hold to delete
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <CategoryFormSheet
        visible={formSheetVisible}
        category={editingCategory}
        defaultCategoryType={activeTab}
        onClose={() => setFormSheetVisible(false)}
        onSubmit={handleSubmitCategory}
        loading={submitting}
      />

      <CategoryReservationSheet
        visible={reservationSheetVisible}
        category={selectedCategoryForReservation}
        accounts={accounts}
        reservations={getReservationsForCategory(
          selectedCategoryForReservation?.id || ""
        )}
        onClose={() => {
          setReservationSheetVisible(false);
          setSelectedCategoryForReservation(null);
        }}
        onUpdated={handleReservationUpdated}
      />
    </SafeAreaView>
  );
}

