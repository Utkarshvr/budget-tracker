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
import { Category, CategoryFormData } from "@/types/category";
import { CategoryFormSheet } from "./components/CategoryFormSheet";
import { PrimaryButton } from "@/screens/auth/components/PrimaryButton";

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

export default function CategoriesScreen() {
  const { session } = useSupabaseSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formSheetVisible, setFormSheetVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchCategories();
    }
  }, [session]);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCategories();
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
              fetchCategories();
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
          })
          .eq("id", editingCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert({
          user_id: session.user.id,
          name: formData.name.trim(),
          emoji: formData.emoji,
          background_color: formData.background_color,
          category_type: "regular",
          fund_account_id: null,
        });

        if (error) throw error;
      }

      setFormSheetVisible(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

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
              Labels that keep your transactions organised
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleAddCategory}
            className="w-12 h-12 rounded-2xl bg-green-600 items-center justify-center"
          >
            <MaterialIcons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {categories.length === 0 ? (
          <View className="bg-neutral-800 rounded-2xl p-6 items-center">
            <MaterialIcons name="category" size={48} color="#6b7280" />
            <Text className="text-white text-lg font-semibold mt-4">
              No categories yet
            </Text>
            <Text className="text-neutral-400 text-sm text-center mt-2">
              Create your first category to start labelling transactions.
            </Text>
            <View className="w-full mt-4">
              <PrimaryButton label="Create Category" onPress={handleAddCategory} />
            </View>
          </View>
        ) : (
          <View className="flex-row flex-wrap -mx-1">
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                className="w-1/2 px-1 mb-3"
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
                        Updated {formatDate(category.updated_at)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteCategory(category)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialIcons name="more-vert" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-neutral-400 text-xs">
                    Tap to edit, hold to delete
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <CategoryFormSheet
        visible={formSheetVisible}
        category={editingCategory}
        onClose={() => setFormSheetVisible(false)}
        onSubmit={handleSubmitCategory}
        loading={submitting}
      />
    </SafeAreaView>
  );
}


