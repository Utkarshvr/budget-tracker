import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { Category, CategoryReservation } from "@/types/category";
import { Account } from "@/types/account";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/utils/errorHandler";
import { useThemeColors, getCategoryBackgroundColor } from "@/constants/theme";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const colors = useThemeColors();
  const categoryBgColor = getCategoryBackgroundColor(colors);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["90%"], []);

  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<"add" | "withdraw" | null>(null);
  const [amount, setAmount] = useState("");
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
      setExpandedCard(null);
      setActiveAction(null);
      setAmount("");
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

  const handleSubmit = async (accountId: string, action: "add" | "withdraw") => {
    if (!category || !amount) {
      Alert.alert("Error", "Please enter an amount");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Error", "Please enter a valid positive amount");
      return;
    }

    const amountSmallest = Math.round(amountNum * 100);

    // Prevent allocating more than the account's unreserved balance
    const unreservedForAccount = accountUnreserved[accountId] || 0;
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
        p_account_id: accountId,
        p_amount_delta: amountDelta,
      });

      if (error) throw error;

      setAmount("");
      setExpandedCard(null);
      setActiveAction(null);
      onUpdated();
      Alert.alert(
        "Success",
        `Successfully ${action === "add" ? "added" : "withdrew"} funds`
      );
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, "Failed to update reservation");
      Alert.alert("Error", errorMessage);
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
              const errorMessage = getErrorMessage(error, "Failed to delete reservation");
              Alert.alert("Error", errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleActionClick = (reservationId: string, action: "add" | "withdraw") => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    if (expandedCard === reservationId && activeAction === action) {
      // Collapse if clicking the same button
      setExpandedCard(null);
      setActiveAction(null);
      setAmount("");
    } else {
      // Expand with new action
      setExpandedCard(reservationId);
      setActiveAction(action);
      setAmount("");
    }
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
              style={{ backgroundColor: categoryBgColor }}
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

        {/* Current Reservations */}
        {reservations.length > 0 ? (
          <View className="mb-6">
            <Text className="text-neutral-300 text-sm mb-3 font-semibold">
              Current Reservations
            </Text>
            {reservations.map((reservation) => {
              const account = accounts.find((a) => a.id === reservation.account_id);
              const isExpanded = expandedCard === reservation.id;
              const unreservedAmount = accountUnreserved[reservation.account_id] || 0;
              const freeToSpend = account ? account.balance - reservation.reserved_amount : 0;

              return (
                <View
                  key={reservation.id}
                  className="bg-neutral-800 rounded-2xl p-4 mb-3 border-2"
                  style={{ 
                    borderColor: isExpanded ? "#3b82f6" : "transparent"
                  }}
                >
                  {/* Header with Account Name and Reserved Amount */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-white text-lg font-semibold">
                        {account?.name || "Unknown Account"}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-green-400 text-xl font-bold">
                        {formatBalance(reservation.reserved_amount, reservation.currency)}
                      </Text>
                    </View>
                  </View>

                  {/* Balance Details */}
                  <View className="flex-row justify-between mb-3 pb-3 border-b border-neutral-700">
                    <View>
                      <Text className="text-neutral-400 text-xs mb-1">FULL BALANCE</Text>
                      <Text className="text-white text-sm font-medium">
                        {formatBalance(account?.balance || 0, account?.currency || "INR")}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-neutral-400 text-xs mb-1">FREE TO SPEND</Text>
                      <Text className="text-white text-sm font-medium">
                        {formatBalance(freeToSpend, account?.currency || "INR")}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  {!isExpanded && (
                    <View className="flex-row gap-2">
                      <View className="flex-[0.9] flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => handleActionClick(reservation.id, "add")}
                          className="flex-1 bg-green-600 rounded-xl py-3 items-center"
                        >
                          <Text className="text-white text-sm font-semibold">Add Funds</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleActionClick(reservation.id, "withdraw")}
                          className="flex-1 bg-neutral-700 rounded-xl py-3 items-center"
                        >
                          <Text className="text-white text-sm font-semibold">Withdraw</Text>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteReservation(reservation)}
                        className="flex-[0.1] bg-neutral-700 rounded-xl py-3 items-center justify-center"
                      >
                        <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Expanded Input Section */}
                  {isExpanded && (
                    <View>
                      {/* Selected Action Buttons */}
                      <View className="flex-row gap-2 mb-3">
                        <View className="flex-[0.8] flex-row gap-2">
                          <TouchableOpacity
                            onPress={() => handleActionClick(reservation.id, "add")}
                            className={`flex-1 rounded-xl justify-center items-center ${
                              activeAction === "add" ? "bg-green-600" : "bg-neutral-700"
                            }`}
                          >
                            <Text className="text-white text-sm font-semibold">Add Funds</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleActionClick(reservation.id, "withdraw")}
                            className={`flex-1 rounded-xl justify-center items-center ${
                              activeAction === "withdraw" ? "bg-neutral-600" : "bg-neutral-700"
                            }`}
                          >
                            <Text className="text-white text-sm font-semibold">Withdraw</Text>
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteReservation(reservation)}
                          className="flex-[0.2] bg-neutral-700 rounded-xl py-2 items-center justify-center"
                        >
                          <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>

                      {/* Amount Input and Submit */}
                      <Text className="text-neutral-300 text-xs mb-2">Enter Amount</Text>
                      <View className="flex-row gap-2">
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
                          placeholder="3000"
                          placeholderTextColor="#6b7280"
                          keyboardType="decimal-pad"
                          className="flex-1 bg-neutral-700 rounded-xl px-4 py-3 text-white text-base"
                          autoFocus
                        />
                        <TouchableOpacity
                          onPress={() => handleSubmit(reservation.account_id, activeAction!)}
                          disabled={submitting || !amount}
                          className={`rounded-xl px-6 items-center justify-center ${
                            activeAction === "add" ? "bg-green-600" : "bg-neutral-600"
                          }`}
                          style={{ opacity: submitting || !amount ? 0.5 : 1 }}
                        >
                          <Text className="text-white text-sm font-semibold">
                            {activeAction === "add" ? "Add" : "Withdraw"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View className="bg-neutral-800/50 rounded-2xl p-6 mb-6 items-center">
            <MaterialIcons name="account-balance-wallet" size={48} color="#525252" />
            <Text className="text-neutral-400 text-sm text-center mt-3">
              No reservations yet. Add funds from your accounts to start budgeting for this category.
            </Text>
          </View>
        )}

        <View className="bg-neutral-800/50 rounded-xl p-3">
          <Text className="text-neutral-400 text-xs text-center">
            💡 Tip: Reserved funds help you plan spending for specific categories. Tap on any account to add or withdraw funds.
          </Text>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

