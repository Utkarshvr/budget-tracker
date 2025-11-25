import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { Category } from "@/types/category";
import { supabase } from "@/lib/supabase";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

type CategorySelectSheetProps = {
  visible: boolean;
  selectedCategoryId: string | null;
  onClose: () => void;
  onSelect: (category: Category | null) => void;
  transactionType: "expense" | "income" | "transfer";
};

export function CategorySelectSheet({
  visible,
  selectedCategoryId,
  onClose,
  onSelect,
  transactionType,
}: CategorySelectSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["60%", "90%"], []);
  const { session } = useSupabaseSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
      fetchCategories();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  useEffect(() => {
    if (session && visible) {
      fetchCategories();
    }
  }, [session, visible]);

  const fetchCategories = async () => {
    if (!session?.user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", session.user.id)
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
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

  const renderCategoryItem = ({ item }: { item: Category }) => (
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
          backgroundColor: item.background_color,
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
      </View>
      {selectedCategoryId === item.id && (
        <MaterialIcons name="check-circle" size={24} color="#22c55e" />
      )}
    </TouchableOpacity>
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
              No categories yet. Create one from the Categories tab.
            </Text>
          </View>
        ) : (
          <BottomSheetFlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </BottomSheetModal>
  );
}

