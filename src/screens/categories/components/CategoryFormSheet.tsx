import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { Category, CategoryFormData } from "@/types/category";
import { PrimaryButton } from "@/screens/auth/components/PrimaryButton";
import { CATEGORY_COLORS } from "@/constants/categoryColors";
import { EMOJI_CATEGORIES } from "@/constants/emojis";

type CategoryFormSheetProps = {
  visible: boolean;
  category: Category | null;
  defaultCategoryType?: "income" | "expense"; // Default type when creating new category
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  loading?: boolean;
};

export function CategoryFormSheet({
  visible,
  category,
  defaultCategoryType = "expense",
  onClose,
  onSubmit,
  loading = false,
}: CategoryFormSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["75%", "90%"], []);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    emoji: "📁",
    background_color: CATEGORY_COLORS[0],
    category_type: defaultCategoryType,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CategoryFormData, string>>
  >({});
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] =
    useState<keyof typeof EMOJI_CATEGORIES>("common");

  const screenWidth = Dimensions.get("window").width;
  const emojiSize = (screenWidth - 64) / 8;

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        emoji: category.emoji,
        background_color: category.background_color,
        category_type: category.category_type,
      });
    } else {
      setFormData({
        name: "",
        emoji: "📁",
        background_color: CATEGORY_COLORS[0],
        category_type: defaultCategoryType,
      });
    }
    setErrors({});
    setShowEmojiMenu(false);
  }, [category, visible, defaultCategoryType]);

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

  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CategoryFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    }

    if (!formData.emoji.trim()) {
      newErrors.emoji = "Emoji is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit(formData);
  };

  return (
    <>
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        onDismiss={handleDismiss}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: "#171717" }}
        handleIndicatorStyle={{ backgroundColor: "#525252" }}
        backdropComponent={renderBackdrop}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white text-xl font-semibold">
              {category ? "Edit Category" : "New Category"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <Text className="text-neutral-300 text-sm mb-2">Emoji</Text>
          <TouchableOpacity
            onPress={() => setShowEmojiMenu(true)}
            className="w-20 h-20 rounded-3xl bg-neutral-800 items-center justify-center mb-6"
          >
            <Text style={{ fontSize: 36 }}>{formData.emoji}</Text>
          </TouchableOpacity>
          {errors.emoji && (
            <Text className="text-red-500 text-sm mb-6">{errors.emoji}</Text>
          )}

          <Text className="text-neutral-300 text-sm mb-2">Name</Text>
          <TextInput
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="e.g., Groceries, Travel"
            placeholderTextColor="#6b7280"
            className="bg-neutral-800 rounded-2xl px-4 py-3 text-white text-base mb-2"
          />
          {errors.name && (
            <Text className="text-red-500 text-sm mb-6">{errors.name}</Text>
          )}

          <Text className="text-neutral-300 text-sm mb-3">Type</Text>
          <View className="flex-row mb-6">
            <TouchableOpacity
              onPress={() => setFormData({ ...formData, category_type: "income" })}
              className={`flex-1 px-4 py-3 rounded-xl mr-2 ${
                formData.category_type === "income" ? "bg-green-600" : "bg-neutral-800"
              }`}
              disabled={category !== null} // Don't allow changing type when editing
            >
              <Text className="text-white text-sm font-medium text-center">
                Income
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFormData({ ...formData, category_type: "expense" })}
              className={`flex-1 px-4 py-3 rounded-xl ${
                formData.category_type === "expense" ? "bg-green-600" : "bg-neutral-800"
              }`}
              disabled={category !== null} // Don't allow changing type when editing
            >
              <Text className="text-white text-sm font-medium text-center">
                Expense
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-neutral-300 text-sm mb-3">Accent Color</Text>
          <View className="flex-row flex-wrap mb-6">
            {CATEGORY_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() =>
                  setFormData({ ...formData, background_color: color })
                }
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  marginRight: 12,
                  marginBottom: 12,
                  backgroundColor: color,
                  borderWidth: formData.background_color === color ? 3 : 0,
                  borderColor:
                    formData.background_color === color ? "#22c55e" : "transparent",
                }}
              />
            ))}
          </View>

          <PrimaryButton
            label={category ? "Save Changes" : "Create Category"}
            onPress={handleSubmit}
            loading={loading}
          />
        </BottomSheetScrollView>
      </BottomSheetModal>

      <Modal
        visible={showEmojiMenu}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEmojiMenu(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-neutral-900 rounded-t-3xl max-h-[70%]">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-800">
              <Text className="text-white text-lg font-semibold">Choose Emoji</Text>
              <TouchableOpacity onPress={() => setShowEmojiMenu(false)}>
                <MaterialIcons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-4 py-3"
            >
              {Object.entries(EMOJI_CATEGORIES).map(([key, meta]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() =>
                    setSelectedEmojiCategory(key as keyof typeof EMOJI_CATEGORIES)
                  }
                  className={`px-4 py-2 rounded-full mr-2 ${
                    selectedEmojiCategory === key ? "bg-green-600/30" : "bg-neutral-800"
                  }`}
                >
                  <Text className="text-white text-sm font-medium">
                    {meta.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
              <View className="flex-row flex-wrap">
                {EMOJI_CATEGORIES[selectedEmojiCategory].emojis.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    onPress={() => {
                      setFormData({ ...formData, emoji });
                      setShowEmojiMenu(false);
                    }}
                    style={{
                      width: emojiSize,
                      height: emojiSize,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 12,
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ fontSize: 28 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}


