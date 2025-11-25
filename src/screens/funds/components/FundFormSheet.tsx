import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { CATEGORY_COLORS } from "@/constants/categoryColors";
import { EMOJI_CATEGORIES } from "@/constants/emojis";
import { PrimaryButton } from "@/screens/auth/components/PrimaryButton";
import { Fund, FundFormData } from "@/types/fund";
import { Account } from "@/types/account";

type FundFormSheetProps = {
  visible: boolean;
  fund: Fund | null;
  accounts: Account[];
  accountTotals: Record<string, number>;
  onClose: () => void;
  onSubmit: (data: FundFormData) => Promise<void>;
  loading?: boolean;
};

export function FundFormSheet({
  visible,
  fund,
  accounts,
  accountTotals,
  onClose,
  onSubmit,
  loading = false,
}: FundFormSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["80%", "95%"], []);
  const [formData, setFormData] = useState<FundFormData>({
    name: "",
    emoji: "💰",
    background_color: CATEGORY_COLORS[0],
    account_id: null,
    initial_allocation: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof FundFormData, string>>
  >({});
  const [selectedEmojiCategory, setSelectedEmojiCategory] =
    useState<keyof typeof EMOJI_CATEGORIES>("common");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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
    if (fund) {
      setFormData({
        name: fund.name,
        emoji: fund.emoji,
        background_color: fund.background_color,
        account_id: fund.account_id,
        initial_allocation: "",
      });
    } else {
      setFormData({
        name: "",
        emoji: "💰",
        background_color: CATEGORY_COLORS[0],
        account_id: accounts[0]?.id || null,
        initial_allocation: "",
      });
    }
    setErrors({});
    setShowEmojiPicker(false);
  }, [fund, accounts, visible]);

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

  const getAvailableForAccount = (accountId: string | null) => {
    if (!accountId) return 0;
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return 0;
    const currentFundBalance =
      fund && fund.account_id === accountId ? fund.balance : 0;
    const reservedElsewhere = (accountTotals[accountId] || 0) - currentFundBalance;
    return Math.max(account.balance - reservedElsewhere, 0);
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof FundFormData, string>> = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Fund name is required";
    }
    if (!formData.emoji.trim()) {
      nextErrors.emoji = "Pick an emoji";
    }
    if (!formData.account_id) {
      nextErrors.account_id = "Select an account";
    }

    if (!fund && formData.initial_allocation.trim()) {
      const initialNum = parseFloat(formData.initial_allocation);
      if (isNaN(initialNum) || initialNum < 0) {
        nextErrors.initial_allocation = "Enter a valid number";
      } else if (formData.account_id) {
        const amountSmallest = Math.round(initialNum * 100);
        const available = getAvailableForAccount(formData.account_id);
        if (amountSmallest > available) {
          nextErrors.initial_allocation = "Not enough free balance in account";
        }
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (
      fund &&
      fund.balance > 0 &&
      formData.account_id &&
      formData.account_id !== fund.account_id
    ) {
      Alert.alert(
        "Move funds first",
        "Withdraw this fund before linking it to a different account."
      );
      return;
    }

    await onSubmit(formData);
  };

  return (
    <>
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        onDismiss={onClose}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: "#171717" }}
        handleIndicatorStyle={{ backgroundColor: "#525252" }}
        backdropComponent={renderBackdrop}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white text-xl font-semibold">
              {fund ? "Edit Fund" : "New Fund"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <Text className="text-neutral-300 text-sm mb-2">Emoji</Text>
          <TouchableOpacity
            onPress={() => setShowEmojiPicker(true)}
            className="w-20 h-20 rounded-3xl bg-neutral-800 items-center justify-center mb-4"
          >
            <Text style={{ fontSize: 36 }}>{formData.emoji}</Text>
          </TouchableOpacity>
          {errors.emoji && (
            <Text className="text-red-500 text-sm mb-4">{errors.emoji}</Text>
          )}

          <Text className="text-neutral-300 text-sm mb-2">Name</Text>
          <TextInput
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="e.g., Groceries, Vacations"
            placeholderTextColor="#6b7280"
            className="bg-neutral-800 rounded-2xl px-4 py-3 text-white text-base mb-2"
          />
          {errors.name && (
            <Text className="text-red-500 text-sm mb-4">{errors.name}</Text>
          )}

          <Text className="text-neutral-300 text-sm mb-3">Accent Color</Text>
          <View className="flex-row flex-wrap mb-4">
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

          <Text className="text-neutral-300 text-sm mb-2">Linked Account</Text>
          <View className="bg-neutral-800 rounded-2xl mb-2">
            {accounts.length === 0 ? (
              <View className="px-4 py-3">
                <Text className="text-red-400 text-sm">
                  Add an account before creating funds.
                </Text>
              </View>
            ) : (
              accounts.map((account, index) => (
                <TouchableOpacity
                  key={account.id}
                  onPress={() => {
                    if (fund && fund.balance > 0 && account.id !== fund.account_id) {
                      return;
                    }
                    setFormData({ ...formData, account_id: account.id });
                  }}
                  className={`px-4 py-3 ${
                    index !== accounts.length - 1 ? "border-b border-neutral-700" : ""
                  } ${formData.account_id === account.id ? "bg-green-600/10" : ""}`}
                >
                  <Text className="text-white font-semibold">{account.name}</Text>
                  <Text className="text-neutral-400 text-xs mt-1">
                    Currency · {account.currency}
                  </Text>
                  <Text className="text-neutral-400 text-xs mt-1">
                    Free balance ·{" "}
                    {(
                      getAvailableForAccount(account.id) / 100
                    ).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {account.currency}
                  </Text>
                  {fund &&
                    fund.balance > 0 &&
                    formData.account_id === account.id &&
                    fund.account_id !== account.id && (
                      <Text className="text-amber-400 text-xs mt-1">
                        Withdraw remaining balance to change account.
                      </Text>
                    )}
                </TouchableOpacity>
              ))
            )}
          </View>
          {errors.account_id && (
            <Text className="text-red-500 text-sm mb-4">{errors.account_id}</Text>
          )}

          {!fund && (
            <View className="mb-4">
              <Text className="text-neutral-300 text-sm mb-2">
                Initial Allocation (optional)
              </Text>
              <TextInput
                value={formData.initial_allocation}
                onChangeText={(text) =>
                  setFormData({ ...formData, initial_allocation: text.replace(/[^\d.]/g, "") })
                }
                placeholder="0.00"
                placeholderTextColor="#6b7280"
                keyboardType="decimal-pad"
                className="bg-neutral-800 rounded-2xl px-4 py-3 text-white text-base"
              />
              {errors.initial_allocation && (
                <Text className="text-red-500 text-sm mt-2">
                  {errors.initial_allocation}
                </Text>
              )}
            </View>
          )}

          <PrimaryButton
            label={fund ? "Save Changes" : "Create Fund"}
            onPress={handleSubmit}
            loading={loading}
          />
        </BottomSheetScrollView>
      </BottomSheetModal>

      <Modal
        visible={showEmojiPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-neutral-900 rounded-t-3xl max-h-[70%]">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-800">
              <Text className="text-white text-lg font-semibold">Choose Emoji</Text>
              <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
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
                  <Text className="text-white text-sm font-medium">{meta.name}</Text>
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
                      setShowEmojiPicker(false);
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


