import { useCallback, useEffect, useMemo, useRef } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { Category } from "@/types/category";

type FundCategoryPickerSheetProps = {
  visible: boolean;
  categories: Category[];
  onClose: () => void;
  onSelect: (category: Category | null) => void;
};

export function FundCategoryPickerSheet({
  visible,
  categories,
  onClose,
  onSelect,
}: FundCategoryPickerSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["60%", "90%"], []);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

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

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const renderItem = ({ item }: { item: Category }) => {
    const isFund = item.category_type === "fund";
    return (
      <TouchableOpacity
        className={`flex-row items-center p-4 rounded-2xl mb-3 ${
          isFund ? "bg-neutral-800/60" : "bg-neutral-800"
        }`}
        disabled={isFund}
        onPress={() => {
          onSelect(item);
        }}
      >
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
          style={{ backgroundColor: item.background_color }}
        >
          <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-white text-base font-semibold">
            {item.name}
          </Text>
          <Text className="text-neutral-400 text-xs mt-1">
            {isFund ? "Already has a fund" : "Available"}
          </Text>
        </View>
        {isFund ? (
          <Text className="text-neutral-500 text-xs font-semibold">Fund</Text>
        ) : (
          <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: "#171717" }}
      handleIndicatorStyle={{ backgroundColor: "#525252" }}
      backdropComponent={renderBackdrop}
    >
      <View className="flex-1 px-4 pt-2 pb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-xl font-bold">Choose Category</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>
        {categories.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <MaterialIcons name="category" size={40} color="#6b7280" />
            <Text className="text-neutral-400 text-sm mt-3 text-center">
              No categories yet. Create one from the Categories tab.
            </Text>
          </View>
        ) : (
          <BottomSheetFlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </BottomSheetModal>
  );
}

