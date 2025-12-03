import { useState, useMemo } from "react";
import { Alert, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { Category, CategoryFormData } from "@/types/category";
import { theme } from "@/constants/theme";
import { useCategoriesData } from "./hooks/useCategoriesData";
import { CategoryFormSheet } from "./components/CategoryFormSheet";
import { CategoryReservationSheet } from "./components/CategoryReservationSheet";
import { CategoryActionSheet } from "./components/CategoryActionSheet";
import { CategoriesHeader } from "./components/CategoriesHeader";
import { CategoriesTabs } from "./components/CategoriesTabs";
import { CategoriesEmptyState } from "./components/CategoriesEmptyState";
import { CategoryList } from "./components/CategoryList";
import { FullScreenLoader } from "./components/FullScreenLoader";
import { getTotalReserved as getTotalReservedForAccount } from "@/screens/accounts/utils/accountHelpers";

export default function CategoriesScreen() {
  const { session } = useSupabaseSession();
  const {
    accounts,
    reservations,
    loading,
    refreshing,
    activeTab,
    filteredCategories,
    setActiveTab,
    handleRefresh,
    getReservationsForCategory,
    getTotalReserved,
  } = useCategoriesData(session);

  const [formSheetVisible, setFormSheetVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reservationSheetVisible, setReservationSheetVisible] = useState(false);
  const [selectedCategoryForReservation, setSelectedCategoryForReservation] =
    useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const accountUnreserved = useMemo(() => {
    const map: Record<string, number> = {};
    accounts.forEach((account) => {
      const totalReservedForAccount = getTotalReservedForAccount(
        account.id,
        reservations
      );
      map[account.id] = Math.max(account.balance - totalReservedForAccount, 0);
    });
    return map;
  }, [accounts, reservations]);

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
              handleRefresh();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "Failed to delete category"
              );
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
      handleRefresh();
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
    handleRefresh();
  };

  const toggleCategory = (category: Category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category.id]: !prev[category.id],
    }));
  };

  const handleShowActions = (category: Category) => {
    setSelectedCategory(category);
    setActionSheetVisible(true);
  };

  if (loading) {
    return <FullScreenLoader />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary.DEFAULT}
          />
        }
      >
        <CategoriesHeader onAddCategory={handleAddCategory} />

        <CategoriesTabs activeTab={activeTab} onChangeTab={setActiveTab} />

        {filteredCategories.length === 0 ? (
          <CategoriesEmptyState
            activeTab={activeTab}
            onCreateCategory={handleAddCategory}
          />
        ) : (
          <CategoryList
            categories={filteredCategories}
            accounts={accounts}
            reservations={reservations}
            expandedCategories={expandedCategories}
            onToggleCategory={toggleCategory}
            onShowActions={handleShowActions}
            onEditCategory={handleEditCategory}
            onManageReservations={handleManageReservations}
            getReservationsForCategory={getReservationsForCategory}
            getTotalReserved={getTotalReserved}
          />
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
        accountUnreserved={accountUnreserved}
        onClose={() => {
          setReservationSheetVisible(false);
          setSelectedCategoryForReservation(null);
        }}
        onUpdated={handleReservationUpdated}
      />

      <CategoryActionSheet
        visible={actionSheetVisible}
        category={selectedCategory}
        onClose={() => {
          setActionSheetVisible(false);
          setSelectedCategory(null);
        }}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
      />
    </SafeAreaView>
  );
}
