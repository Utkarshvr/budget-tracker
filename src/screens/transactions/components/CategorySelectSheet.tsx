import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, SectionList } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetSectionList,
} from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { Category, CategoryReservation } from "@/types/category";
import { supabase } from "@/lib/supabase";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { useThemeColors, getCategoryBackgroundColor } from "@/constants/theme";

type CategorySelectSheetProps = {
  visible: boolean;
  selectedCategoryId: string | null;
  selectedAccountId: string | null; // For filtering reserved categories
  onClose: () => void;
  onSelect: (category: Category | null) => void;
  transactionType: "expense" | "income" | "transfer";
};

const formatBalance = (amount: number, currency: string) => {
  const mainUnit = amount / 100;
  return `${currency} ${mainUnit.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export function CategorySelectSheet({
  visible,
  selectedCategoryId,
  selectedAccountId,
  onClose,
  onSelect,
  transactionType,
}: CategorySelectSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["90%"], []);
  const { session } = useSupabaseSession();
  const colors = useThemeColors();
  const categoryBgColor = getCategoryBackgroundColor(colors);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reservations, setReservations] = useState<CategoryReservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
      fetchData();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  useEffect(() => {
    if (session && visible) {
      fetchData();
    }
  }, [session, visible]);

  const fetchData = async () => {
    if (!session?.user) return;

    setLoading(true);
    try {
      // Fetch categories of the appropriate type
      const categoryType = transactionType === "income" ? "income" : "expense";
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("category_type", categoryType)
        .order("name", { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch reservations for expense categories
      if (transactionType === "expense") {
        const { data: reservationsData, error: reservationsError } = await supabase
          .from("category_reservations")
          .select("*")
          .eq("user_id", session.user.id);

        if (reservationsError) throw reservationsError;
        setReservations(reservationsData || []);
      } else {
        setReservations([]);
      }
    } catch (error: any) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const handleSelectCategory = (category: Category | null) => {
    onSelect(category);
    onClose();
  };

  // Group categories by reserved/unreserved for expense type
  const sections = useMemo(() => {
    if (transactionType !== "expense" || !selectedAccountId) {
      // For income or when no account is selected, just show all categories
      return [
        {
          title: transactionType === "income" ? "Income Categories" : "All Categories",
          data: categories,
        },
      ];
    }

    // For expense with selected account, group by reserved/unreserved
    const reserved: Array<Category & { reservedAmount?: number; currency?: string }> = [];
    const unreserved: Category[] = [];

    categories.forEach((category) => {
      const reservation = reservations.find(
        (r) => r.category_id === category.id && r.account_id === selectedAccountId
      );

      if (reservation) {
        reserved.push({
          ...category,
          reservedAmount: reservation.reserved_amount,
          currency: reservation.currency,
        });
      } else {
        unreserved.push(category);
      }
    });

    const result = [];
    if (reserved.length > 0) {
      result.push({
        title: `Reserved (for selected account)`,
        data: reserved,
      });
    }
    if (unreserved.length > 0) {
      result.push({
        title: "Unreserved",
        data: unreserved,
      });
    }

    return result;
  }, [categories, reservations, selectedAccountId, transactionType]);

  const renderCategoryItem = ({ item }: { item: Category & { reservedAmount?: number; currency?: string } }) => (
    <TouchableOpacity
      onPress={() => handleSelectCategory(item)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: selectedCategoryId === item.id ? "#16a34a20" : "#262626",
        borderRadius: 12,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: categoryBgColor,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: "#ffffff",
            fontSize: 16,
            fontWeight: "500",
          }}
        >
          {item.name}
        </Text>
        {item.reservedAmount !== undefined && item.currency && (
          <Text style={{ color: "#22c55e", fontSize: 12, marginTop: 4 }}>
            {formatBalance(item.reservedAmount, item.currency)}
          </Text>
        )}
      </View>
      {selectedCategoryId === item.id && (
        <MaterialIcons name="check-circle" size={24} color="#22c55e" />
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: "#171717",
      }}
    >
      <Text
        style={{
          color: "#9ca3af",
          fontSize: 12,
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {section.title}
      </Text>
    </View>
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      onDismiss={handleDismiss}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: "#171717" }}
      handleIndicatorStyle={{ backgroundColor: "#525252" }}
      backdropComponent={renderBackdrop}
      enableHandlePanningGesture={true}
      enableContentPanningGesture={true}
    >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            paddingTop: 8,
            paddingHorizontal: 16,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#ffffff" }}>
            Select Category
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Optional Category Option */}
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <TouchableOpacity
            onPress={() => handleSelectCategory(null)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              backgroundColor: selectedCategoryId === null ? "#16a34a20" : "transparent",
              borderRadius: 12,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: "#262626",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <MaterialIcons name="category" size={24} color="#9ca3af" />
            </View>
            <Text
              style={{
                color: "#ffffff",
                fontSize: 16,
                fontWeight: "500",
                flex: 1,
              }}
            >
              No Category
            </Text>
            {selectedCategoryId === null && (
              <MaterialIcons name="check-circle" size={24} color="#22c55e" />
            )}
          </TouchableOpacity>
        </View>

        {/* Categories List */}
        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#9ca3af" }}>Loading categories...</Text>
          </View>
        ) : categories.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 }}>
            <MaterialIcons name="category" size={48} color="#6b7280" />
            <Text style={{ color: "#9ca3af", marginTop: 16, textAlign: "center" }}>
              No {transactionType} categories yet. Create one from the Categories tab.
            </Text>
          </View>
        ) : (
          <BottomSheetSectionList
            sections={sections}
            renderItem={renderCategoryItem}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
          />
        )}
      </View>
    </BottomSheetModal>
  );
}
