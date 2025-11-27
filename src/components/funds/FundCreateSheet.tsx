import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { Account } from "@/types/account";
import { Category } from "@/types/category";
import { PrimaryButton } from "@/screens/auth/components/PrimaryButton";
import { createCategoryFund } from "@/lib/categoryFunds";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

type FundCreateSheetProps = {
  visible: boolean;
  category: Category | null;
  accounts: Account[];
  accountTotals: Record<string, number>;
  defaultAccountId?: string | null;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
};

export function FundCreateSheet({
  visible,
  category,
  accounts,
  accountTotals,
  defaultAccountId = null,
  onClose,
  onCreated,
}: FundCreateSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["65%", "88%"], []);

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    defaultAccountId
  );
  const [initialAmount, setInitialAmount] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setSelectedAccountId(defaultAccountId || null);
      setInitialAmount("");
      setTargetAmount("");
      setError(null);
    }
  }, [visible, defaultAccountId]);

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

  const selectedAccount = useMemo(() => {
    if (selectedAccountId) {
      return accounts.find((account) => account.id === selectedAccountId) || null;
    }
    if (defaultAccountId) {
      return accounts.find((account) => account.id === defaultAccountId) || null;
    }
    return null;
  }, [accounts, selectedAccountId, defaultAccountId]);

  const reservedInAccount = selectedAccount
    ? accountTotals[selectedAccount.id] || 0
    : 0;
  const freeBalance = selectedAccount
    ? Math.max(selectedAccount.balance - reservedInAccount, 0)
    : 0;

  const formatBalance = (amount: number, currency: string) => {
    const mainUnit = amount / 100;
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    return `${symbol}${mainUnit.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleSubmit = async () => {
    if (!category) return;
    if (!selectedAccount) {
      setError("Select an account to reserve money from");
      return;
    }

    const amountNum = parseFloat(initialAmount || "0");
    if (initialAmount.trim().length && (isNaN(amountNum) || amountNum < 0)) {
      setError("Enter a valid initial amount");
      return;
    }

    const amountSmallest = Math.round(amountNum * 100);
    if (amountSmallest > freeBalance) {
      setError("Not enough free-to-plan balance in this account");
      return;
    }

    const targetNum = targetAmount.trim().length
      ? parseFloat(targetAmount)
      : null;
    if (targetAmount.trim().length && (targetNum === null || isNaN(targetNum) || targetNum <= 0)) {
      setError("Target must be a positive number");
      return;
    }
    const targetSmallest =
      targetNum !== null ? Math.round(targetNum * 100) : null;

    setSubmitting(true);
    try {
      await createCategoryFund({
        categoryId: category.id,
        accountId: selectedAccount.id,
        accountCurrency: selectedAccount.currency,
        initialAmount: amountSmallest,
        targetAmount: targetSmallest,
      });
      await onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Unable to create fund");
    } finally {
      setSubmitting(false);
    }
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
      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center justify-between mb-5">
          <View>
            <Text className="text-white text-xl font-semibold">Create Fund</Text>
            {category && (
              <Text className="text-neutral-400 text-sm mt-1">{category.name}</Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <Text className="text-neutral-300 text-sm mb-2">Account</Text>
        {accounts.length === 0 ? (
          <View className="bg-neutral-800 rounded-2xl px-4 py-3 mb-4">
            <Text className="text-neutral-400 text-sm">
              Add an account first to create a fund.
            </Text>
          </View>
        ) : defaultAccountId ? (
          <View className="bg-neutral-800 rounded-2xl px-4 py-3 mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <MaterialIcons name="account-balance" size={20} color="#fff" style={{ marginRight: 12 }} />
              <Text className="text-white text-base">
                {selectedAccount?.name || "Account"}
              </Text>
            </View>
            <Text className="text-neutral-500 text-xs">Locked</Text>
          </View>
        ) : (
          <View className="bg-neutral-800 rounded-2xl mb-4">
            {accounts.map((account, index) => (
              <TouchableOpacity
                key={account.id}
                className={`px-4 py-3 flex-row items-center justify-between ${
                  index !== accounts.length - 1 ? "border-b border-neutral-700" : ""
                } ${selectedAccount?.id === account.id ? "bg-green-600/20" : ""}`}
                onPress={() => setSelectedAccountId(account.id)}
              >
                <View className="flex-row items-center">
                  <MaterialIcons name="account-balance" size={20} color="#fff" style={{ marginRight: 12 }} />
                  <View>
                    <Text className="text-white text-base">{account.name}</Text>
                    <Text className="text-neutral-400 text-xs mt-1 uppercase">
                      {account.currency}
                    </Text>
                  </View>
                </View>
                {selectedAccount?.id === account.id && (
                  <MaterialIcons name="check-circle" size={20} color="#22c55e" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedAccount && (
          <Text className="text-neutral-400 text-xs mb-4">
            Free to plan · {formatBalance(freeBalance, selectedAccount.currency)}
          </Text>
        )}

        <Text className="text-neutral-300 text-sm mb-2">Initial amount</Text>
        <TextInput
          value={initialAmount}
          onChangeText={(text) => {
            setError(null);
            setInitialAmount(text.replace(/[^\d.]/g, ""));
          }}
          placeholder="0.00"
          placeholderTextColor="#6b7280"
          keyboardType="decimal-pad"
          className="bg-neutral-800 rounded-2xl px-4 py-3 text-white text-base mb-5"
        />

        <View className="mb-5">
          <Text className="text-neutral-300 text-sm mb-2">Target (optional)</Text>
          <TextInput
            value={targetAmount}
            onChangeText={(text) => {
              setError(null);
              setTargetAmount(text.replace(/[^\d.]/g, ""));
            }}
            placeholder="e.g., 5000"
            placeholderTextColor="#6b7280"
            keyboardType="decimal-pad"
            className="bg-neutral-800 rounded-2xl px-4 py-3 text-white text-base"
          />
          <Text className="text-neutral-500 text-xs mt-2">
            Helps build a progress bar for this fund.
          </Text>
        </View>

        {error && (
          <Text className="text-red-500 text-sm mb-4">{error}</Text>
        )}

        <PrimaryButton
          label="Create Fund"
          onPress={handleSubmit}
          loading={submitting}
        />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

