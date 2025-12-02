import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { Category, CategoryReservation } from "@/types/category";
import { Account } from "@/types/account";
import { PrimaryButton } from "@/screens/auth/components/PrimaryButton";
import { supabase } from "@/lib/supabase";

type CategoryReservationSheetProps = {
  visible: boolean;
  category: Category | null;
  accounts: Account[];
  reservations: CategoryReservation[];
  accountUnreserved: Record<string, number>;
  onClose: () => void;
  onUpdated: () => void;
};

const formatBalance = (amount: number, currency: string) => {
  const mainUnit = amount / 100;
  return `${currency} ${mainUnit.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export function CategoryReservationSheet({
  visible,
  category,
  accounts,
  reservations,
  accountUnreserved,
  onClose,
  onUpdated,
}: CategoryReservationSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["75%", "90%"], []);

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [action, setAction] = useState<"add" | "withdraw">("add");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setSelectedAccountId(null);
      setAmount("");
      setAction("add");
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

  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSubmit = async () => {
    if (!category || !selectedAccountId || !amount) {
      Alert.alert("Error", "Please select an account and enter an amount");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Error", "Please enter a valid positive amount");
      return;
    }

    const amountSmallest = Math.round(amountNum * 100);

    // Prevent allocating more than the account's unreserved balance
    const unreservedForAccount = accountUnreserved[selectedAccountId] || 0;
    if (action === "add" && amountSmallest > unreservedForAccount) {
      Alert.alert(
        "Insufficient unreserved funds",
        "You don't have enough unreserved money in this account to reserve that amount."
      );
      return;
    }

    const amountDelta = action === "add" ? amountSmallest : -amountSmallest;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("adjust_category_reservation", {
        p_category_id: category.id,
        p_account_id: selectedAccountId,
        p_amount_delta: amountDelta,
      });

      if (error) throw error;

      setAmount("");
      setSelectedAccountId(null);
      onUpdated();
      Alert.alert(
        "Success",
        `Successfully ${action === "add" ? "added" : "withdrew"} funds`
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update reservation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReservation = async (reservation: CategoryReservation) => {
    Alert.alert(
      "Delete Reservation",
      "Are you sure you want to remove this fund reservation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("category_reservations")
                .delete()
                .eq("id", reservation.id);

              if (error) throw error;
              onUpdated();
            } catch (error: any) {
              Alert.alert("Error", "Failed to delete reservation");
            }
          },
        },
      ]
    );
  };

  const getAccountReservation = (accountId: string): CategoryReservation | null => {
    return reservations.find((r) => r.account_id === accountId) || null;
  };

  const getAccountBalance = (accountId: string): number => {
    const account = accounts.find((a) => a.id === accountId);
    return account?.balance || 0;
  };

  if (!category) return null;

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
    >
      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center flex-1">
            <View
              className="w-12 h-12 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: category.background_color }}
            >
              <Text style={{ fontSize: 24 }}>{category.emoji}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-semibold">
                {category.name}
              </Text>
              <Text className="text-neutral-400 text-sm">Manage Funds</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Existing Reservations */}
        {reservations.length > 0 && (
          <View className="mb-6">
            <Text className="text-neutral-300 text-sm mb-3 font-semibold">
              Current Reservations
            </Text>
            {reservations.map((reservation) => {
              const account = accounts.find((a) => a.id === reservation.account_id);
              return (
                <View
                  key={reservation.id}
                  className="bg-neutral-800 rounded-2xl p-4 mb-3"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-white text-base font-semibold">
                        {account?.name || "Unknown Account"}
                      </Text>
                      <Text className="text-neutral-400 text-xs mt-1">
                        Account Balance:{" "}
                        {formatBalance(account?.balance || 0, account?.currency || "INR")}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteReservation(reservation)}
                      className="ml-2"
                    >
                      <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-neutral-700">
                    <Text className="text-neutral-400 text-xs">Reserved</Text>
                    <Text className="text-green-400 text-lg font-bold">
                      {formatBalance(reservation.reserved_amount, reservation.currency)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Add/Withdraw Section */}
        <View className="bg-neutral-800 rounded-2xl p-4 mb-6">
          <Text className="text-white text-base font-semibold mb-4">
            Add or Withdraw Funds
          </Text>

          {/* Action Selector */}
          <Text className="text-neutral-300 text-sm mb-2">Action</Text>
          <View className="flex-row mb-4">
            <TouchableOpacity
              onPress={() => setAction("add")}
              className={`flex-1 px-4 py-3 rounded-xl mr-2 ${
                action === "add" ? "bg-green-600" : "bg-neutral-700"
              }`}
            >
              <Text className="text-white text-sm font-medium text-center">
                Add Funds
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setAction("withdraw")}
              className={`flex-1 px-4 py-3 rounded-xl ${
                action === "withdraw" ? "bg-orange-600" : "bg-neutral-700"
              }`}
            >
              <Text className="text-white text-sm font-medium text-center">
                Withdraw
              </Text>
            </TouchableOpacity>
          </View>

          {/* Account Selector */}
          <Text className="text-neutral-300 text-sm mb-2">Account</Text>
          {accounts.length === 0 ? (
            <View className="bg-neutral-700 rounded-xl px-4 py-3 mb-4">
              <Text className="text-neutral-400 text-sm">
                No accounts available
              </Text>
            </View>
          ) : (
            <View className="mb-4">
              {accounts.map((account) => {
                const reservation = getAccountReservation(account.id);
                const isSelected = selectedAccountId === account.id;

                return (
                  <TouchableOpacity
                    key={account.id}
                    onPress={() => setSelectedAccountId(account.id)}
                    className={`bg-neutral-700 rounded-xl p-3 mb-2 ${
                      isSelected ? "border-2 border-green-500" : ""
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-white text-sm font-semibold">
                          {account.name}
                        </Text>
                        <Text className="text-neutral-400 text-xs mt-1">
                          Balance: {formatBalance(account.balance, account.currency)}
                        </Text>
                        {reservation && (
                          <Text className="text-green-400 text-xs mt-1">
                            Reserved: {formatBalance(reservation.reserved_amount, reservation.currency)}
                          </Text>
                        )}
                      </View>
                      {isSelected && (
                        <MaterialIcons name="check-circle" size={20} color="#22c55e" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Amount Input */}
          <Text className="text-neutral-300 text-sm mb-2">Amount</Text>
          <TextInput
            value={amount}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^\d.]/g, "");
              const parts = cleaned.split(".");
              if (parts.length > 2) {
                setAmount(parts[0] + "." + parts.slice(1).join(""));
              } else {
                setAmount(cleaned);
              }
            }}
            placeholder="0.00"
            placeholderTextColor="#6b7280"
            keyboardType="decimal-pad"
            className="bg-neutral-700 rounded-xl px-4 py-3 text-white text-base mb-4"
          />

          <PrimaryButton
            label={`${action === "add" ? "Add" : "Withdraw"} Funds`}
            onPress={handleSubmit}
            loading={submitting}
          />
        </View>

        <View className="bg-neutral-800/50 rounded-xl p-3">
          <Text className="text-neutral-400 text-xs text-center">
            💡 Tip: Reserved funds help you plan spending for specific categories.
            {action === "withdraw" && " Withdrawing makes funds available again."}
          </Text>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

