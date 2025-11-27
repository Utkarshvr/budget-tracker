import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { Category } from "@/types/category";
import { Account } from "@/types/account";
import { PrimaryButton } from "@/screens/auth/components/PrimaryButton";
import { adjustCategoryFundBalance } from "@/lib/categoryFunds";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

type FundAdjustSheetProps = {
  visible: boolean;
  mode: "allocate" | "withdraw";
  category: Category | null;
  account: Account | null;
  accountTotals: Record<string, number>;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
};

export function FundAdjustSheet({
  visible,
  mode,
  category,
  account,
  accountTotals,
  onClose,
  onSuccess,
}: FundAdjustSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["45%", "65%"], []);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setAmount("");
      setError(null);
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

  const freeToPlan = useMemo(() => {
    if (!account) return 0;
    const reserved = accountTotals[account.id] || 0;
    return Math.max(account.balance - reserved, 0);
  }, [account, accountTotals]);

  const formatBalance = (value: number, currency: string) => {
    const mainUnit = value / 100;
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    return `${symbol}${mainUnit.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleSubmit = async () => {
    if (!category || !account) return;
    const amountNum = parseFloat(amount || "0");
    if (!amount.trim().length || isNaN(amountNum) || amountNum <= 0) {
      setError("Enter a valid amount");
      return;
    }
    const amountSmallest = Math.round(amountNum * 100);

    if (mode === "allocate" && amountSmallest > freeToPlan) {
      setError("Amount exceeds free-to-plan balance");
      return;
    }

    if (
      mode === "withdraw" &&
      amountSmallest > (category.fund_balance || 0)
    ) {
      setError("Cannot withdraw more than reserved");
      return;
    }

    setSubmitting(true);
    try {
      await adjustCategoryFundBalance({
        categoryId: category.id,
        amountDelta: mode === "allocate" ? amountSmallest : -amountSmallest,
        accountId: mode === "allocate" ? account.id : undefined,
      });
      await onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Unable to update fund");
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === "allocate" ? "Add to fund" : "Withdraw to account";
  const buttonLabel = mode === "allocate" ? "Add" : "Withdraw";

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
      <View className="px-4 pb-8">
        <View className="flex-row items-center justify-between mb-4 mt-2">
          <Text className="text-white text-xl font-semibold">{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {category && (
          <View className="bg-neutral-800 rounded-2xl p-4 mb-4">
            <Text className="text-white text-base font-semibold">
              {category.name}
            </Text>
            {account && (
              <Text className="text-neutral-400 text-xs mt-1">
                From {account.name}
              </Text>
            )}
            <Text className="text-neutral-300 text-xs mt-2">
              Reserved ·{" "}
              {category.fund_currency
                ? formatBalance(category.fund_balance || 0, category.fund_currency)
                : formatBalance(category.fund_balance || 0, account?.currency || "INR")}
            </Text>
            {mode === "allocate" && account && (
              <Text className="text-neutral-400 text-xs mt-1">
                Free to plan · {formatBalance(freeToPlan, account.currency)}
              </Text>
            )}
          </View>
        )}

        <View className="mb-4">
          <Text className="text-neutral-300 text-sm mb-2">Amount</Text>
          <TextInput
            value={amount}
            onChangeText={(text) => {
              setError(null);
              setAmount(text.replace(/[^\d.]/g, ""));
            }}
            placeholder="0.00"
            placeholderTextColor="#6b7280"
            keyboardType="decimal-pad"
            className="bg-neutral-800 rounded-2xl px-4 py-3 text-white text-base"
          />
        </View>

        {error && <Text className="text-red-500 text-sm mb-4">{error}</Text>}

        <PrimaryButton label={buttonLabel} onPress={handleSubmit} loading={submitting} />
      </View>
    </BottomSheetModal>
  );
}

