import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { Account, AccountFormData, AccountType } from "@/types/account";
import { PrimaryButton } from "@/screens/auth/components/PrimaryButton";

type AccountFormSheetProps = {
  visible: boolean;
  account: Account | null;
  onClose: () => void;
  onSubmit: (data: AccountFormData) => Promise<void>;
  loading?: boolean;
};

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: "cash", label: "Cash", icon: "attach-money" },
  { value: "checking", label: "Checking", icon: "account-balance" },
  { value: "savings", label: "Savings", icon: "savings" },
  { value: "credit_card", label: "Credit Card", icon: "credit-card" },
];

export function AccountFormSheet({
  visible,
  account,
  onClose,
  onSubmit,
  loading = false,
}: AccountFormSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["70%", "95%"], []);

  const [formData, setFormData] = useState<AccountFormData>({
    name: "",
    type: "checking",
    currency: "INR", // Default, will be set from global settings
    balance: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof AccountFormData, string>>
  >({});

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

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

  useEffect(() => {
    if (account) {
      // Convert balance from smallest unit to display format
      const balanceInMainUnit = account.balance / 100;
      setFormData({
        name: account.name,
        type: account.type,
        currency: account.currency,
        balance: balanceInMainUnit.toString(),
      });
    } else {
      setFormData({
        name: "",
        type: "checking",
        currency: "INR",
        balance: "",
      });
    }
    setErrors({});
  }, [account, visible]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof AccountFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Account name is required";
    }

    if (!formData.balance.trim()) {
      newErrors.balance = "Balance is required";
    } else {
      const balanceNum = parseFloat(formData.balance);
      if (isNaN(balanceNum)) {
        newErrors.balance = "Balance must be a valid number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit(formData);
  };

  const formatBalance = (value: string): string => {
    // Remove non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, "");
    // Ensure only one decimal point
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("");
    }
    return cleaned;
  };

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
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      enableHandlePanningGesture={true}
      enableContentPanningGesture={true}
    >
      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#ffffff" }}>
            {account ? "Edit Account" : "Add Account"}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Account Name */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#d4d4d4",
              marginBottom: 8,
            }}
          >
            Account Name
          </Text>
          <TextInput
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="e.g., UBOI, Cash Wallet"
            placeholderTextColor="#6b7280"
            style={{
              backgroundColor: "#262626",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              color: "#ffffff",
              fontSize: 16,
            }}
          />
          {errors.name && (
            <Text style={{ color: "#ef4444", fontSize: 14, marginTop: 4 }}>
              {errors.name}
            </Text>
          )}
        </View>

        {/* Account Type */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#d4d4d4",
              marginBottom: 8,
            }}
          >
            Account Type
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {ACCOUNT_TYPES.map((type, index) => (
              <TouchableOpacity
                key={type.value}
                onPress={() => setFormData({ ...formData, type: type.value })}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor:
                    formData.type === type.value ? "#16a34a" : "#262626",
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                <MaterialIcons
                  name={type.icon as any}
                  size={20}
                  color="white"
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Balance */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#d4d4d4",
              marginBottom: 8,
            }}
          >
            Balance
          </Text>
          <TextInput
            value={formData.balance}
            onChangeText={(text) =>
              setFormData({ ...formData, balance: formatBalance(text) })
            }
            placeholder="0.00"
            placeholderTextColor="#6b7280"
            keyboardType="decimal-pad"
            style={{
              backgroundColor: "#262626",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              color: "#ffffff",
              fontSize: 16,
            }}
          />
          {errors.balance && (
            <Text style={{ color: "#ef4444", fontSize: 14, marginTop: 4 }}>
              {errors.balance}
            </Text>
          )}
        </View>

        {/* Submit Button */}
        <PrimaryButton
          label={account ? "Update Account" : "Create Account"}
          onPress={handleSubmit}
          loading={loading}
        />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
