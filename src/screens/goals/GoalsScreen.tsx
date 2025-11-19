import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { Goal, GoalActionType, GoalFormData } from "@/types/goal";
import { Account } from "@/types/account";
import { PrimaryButton } from "@/screens/auth/components/PrimaryButton";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const mainUnit = amount / 100;
  return `${symbol}${mainUnit.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatAmountInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    return parts[0] + "." + parts.slice(1).join("");
  }
  return cleaned;
}

export default function GoalsScreen() {
  const { session } = useSupabaseSession();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [goalFormVisible, setGoalFormVisible] = useState(false);
  const [goalFormData, setGoalFormData] = useState<GoalFormData>({
    title: "",
    target_amount: "",
  });
  const [goalFormErrors, setGoalFormErrors] = useState<
    Partial<Record<keyof GoalFormData, string>>
  >({});
  const [goalSubmitting, setGoalSubmitting] = useState(false);

  const [actionModal, setActionModal] = useState<{
    visible: boolean;
    type: GoalActionType;
    goal: Goal | null;
  }>({
    visible: false,
    type: "deposit",
    goal: null,
  });
  const [actionAmount, setActionAmount] = useState("");
  const [actionAccountId, setActionAccountId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => {
    if (session?.user) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    if (!session?.user) return;
    setLoading(true);
    await Promise.all([fetchGoals(), fetchAccounts()]);
    setLoading(false);
  };

  const fetchGoals = async () => {
    if (!session?.user) return;
    try {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to fetch goals");
    } finally {
      setRefreshing(false);
    }
  };

  const fetchAccounts = async () => {
    if (!session?.user) return;
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", session.user.id)
        .order("name", { ascending: true });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to fetch accounts");
    }
  };

  const handleRefresh = async () => {
    if (!session?.user) return;
    setRefreshing(true);
    await Promise.all([fetchGoals(), fetchAccounts()]);
  };

  const validateGoalForm = () => {
    const errors: Partial<Record<keyof GoalFormData, string>> = {};
    if (!goalFormData.title.trim()) {
      errors.title = "Goal title is required";
    }
    if (!goalFormData.target_amount.trim()) {
      errors.target_amount = "Target amount is required";
    } else {
      const amount = parseFloat(goalFormData.target_amount);
      if (isNaN(amount) || amount <= 0) {
        errors.target_amount = "Target must be a positive number";
      }
    }
    setGoalFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateGoal = async () => {
    if (!session?.user) return;
    if (!validateGoalForm()) return;

    const targetAmountSmallest = Math.round(
      parseFloat(goalFormData.target_amount) * 100
    );
    const currency = accounts[0]?.currency || "INR";

    setGoalSubmitting(true);
    try {
      const { error } = await supabase.from("goals").insert({
        user_id: session.user.id,
        title: goalFormData.title.trim(),
        target_amount: targetAmountSmallest,
        saved_amount: 0,
        currency,
      });

      if (error) throw error;
      setGoalFormVisible(false);
      setGoalFormData({ title: "", target_amount: "" });
      await fetchGoals();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create goal");
    } finally {
      setGoalSubmitting(false);
    }
  };

  const openGoalForm = () => {
    setGoalFormErrors({});
    setGoalFormData({ title: "", target_amount: "" });
    setGoalFormVisible(true);
  };

  const openActionModal = (goal: Goal, type: GoalActionType) => {
    const eligibleAccounts = accounts.filter(
      (account) => account.currency === goal.currency
    );
    setActionModal({ visible: true, goal, type });
    setActionAmount("");
    setActionError(null);
    setActionAccountId(eligibleAccounts[0]?.id || null);
  };

  const closeActionModal = () => {
    setActionModal({ visible: false, goal: null, type: "deposit" });
    setActionAmount("");
    setActionError(null);
    setActionAccountId(null);
  };

  const handleGoalAction = async () => {
    if (!session?.user || !actionModal.goal || !actionAccountId) {
      setActionError("Please select an account to continue");
      return;
    }

    const amountNum = parseFloat(actionAmount);
    if (!actionAmount.trim() || isNaN(amountNum) || amountNum <= 0) {
      setActionError("Enter a valid amount");
      return;
    }

    const selectedAccount = accounts.find((a) => a.id === actionAccountId);
    if (!selectedAccount) {
      setActionError("Selected account is unavailable");
      return;
    }

    if (selectedAccount.currency !== actionModal.goal.currency) {
      setActionError(
        `Select an account that uses ${actionModal.goal.currency}`
      );
      return;
    }

    const amountSmallest = Math.round(amountNum * 100);
    const remainingTarget =
      actionModal.goal.target_amount - actionModal.goal.saved_amount;

    if (
      actionModal.type === "deposit" &&
      amountSmallest > remainingTarget &&
      actionModal.goal.target_amount > 0
    ) {
      setActionError("Amount exceeds remaining target");
      return;
    }

    if (
      actionModal.type === "deposit" &&
      amountSmallest > selectedAccount.balance
    ) {
      setActionError("Account balance is too low for this transfer");
      return;
    }

    if (
      actionModal.type === "withdraw" &&
      amountSmallest > actionModal.goal.saved_amount
    ) {
      setActionError("Cannot withdraw more than saved amount");
      return;
    }

    const transactionPayload =
      actionModal.type === "deposit"
        ? {
            user_id: session.user.id,
            note: `Goal: ${actionModal.goal.title} (Save)`,
            type: "goal" as const,
            amount: amountSmallest,
            from_account_id: actionAccountId,
            to_account_id: null,
            currency: selectedAccount.currency,
          }
        : {
            user_id: session.user.id,
            note: `Goal: ${actionModal.goal.title} (Withdraw)`,
            type: "goal" as const,
            amount: amountSmallest,
            from_account_id: null,
            to_account_id: actionAccountId,
            currency: selectedAccount.currency,
          };

    setActionSubmitting(true);
    try {
      const { error: txError } = await supabase
        .from("transactions")
        .insert(transactionPayload);

      if (txError) throw txError;

      const delta = actionModal.type === "deposit" ? amountSmallest : -amountSmallest;
      const { error: goalError } = await supabase.rpc(
        "adjust_goal_saved_amount",
        {
          goal_id: actionModal.goal.id,
          amount_delta: delta,
        }
      );

      if (goalError) throw goalError;

      await Promise.all([fetchGoals(), fetchAccounts()]);
      closeActionModal();
      Alert.alert(
        "Success",
        actionModal.type === "deposit"
          ? "Savings added to goal"
          : "Amount returned to account"
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Unable to update goal");
    } finally {
      setActionSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-900 items-center justify-center">
        <ActivityIndicator size="large" color="#22c55e" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#22c55e"
          />
        }
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-3xl font-bold text-white">Goals</Text>
          <Text className="text-neutral-400 text-sm">
            {goals.length} goal{goals.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {goals.length > 0 ? (
          goals.map((goal) => {
            const progress =
              goal.target_amount > 0
                ? Math.min(goal.saved_amount / goal.target_amount, 1)
                : 0;
            const remaining =
              goal.target_amount > goal.saved_amount
                ? goal.target_amount - goal.saved_amount
                : 0;

            return (
              <View key={goal.id} className="bg-neutral-800 rounded-2xl p-4 mb-4">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="text-white text-lg font-semibold">
                      {goal.title}
                    </Text>
                    <Text className="text-neutral-400 text-sm mt-1">
                      Target · {formatCurrency(goal.target_amount, goal.currency)}
                    </Text>
                    <Text className="text-neutral-500 text-xs mt-1">
                      Remaining · {formatCurrency(remaining, goal.currency)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-white text-xl font-bold">
                      {formatCurrency(goal.saved_amount, goal.currency)}
                    </Text>
                    <Text className="text-neutral-500 text-xs mt-1">
                      {Math.round(progress * 100)}% funded
                    </Text>
                  </View>
                </View>

                <View className="h-2 w-full bg-neutral-700 rounded-full mt-4 overflow-hidden">
                  <View
                    className="h-full bg-green-500"
                    style={{ width: `${progress * 100}%` }}
                  />
                </View>

                <View className="flex-row mt-4">
                  <TouchableOpacity
                    className="flex-1 bg-green-600 rounded-xl py-3 mr-3 items-center flex-row justify-center"
                    onPress={() => openActionModal(goal, "deposit")}
                  >
                    <MaterialIcons
                      name="savings"
                      size={18}
                      color="white"
                      style={{ marginRight: 6 }}
                    />
                    <Text className="text-white font-semibold text-sm">
                      Save to goal
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-neutral-700 rounded-xl py-3 items-center flex-row justify-center"
                    onPress={() => openActionModal(goal, "withdraw")}
                    disabled={goal.saved_amount === 0}
                  >
                    <MaterialIcons
                      name="undo"
                      size={18}
                      color={goal.saved_amount === 0 ? "#9ca3af" : "white"}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      className={`font-semibold text-sm ${
                        goal.saved_amount === 0 ? "text-neutral-400" : "text-white"
                      }`}
                    >
                      Withdraw
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <View className="items-center justify-center py-12">
            <MaterialIcons name="flag-circle" size={64} color="#6b7280" />
            <Text className="text-neutral-400 text-lg mt-4 text-center">
              No goals yet
            </Text>
            <Text className="text-neutral-500 text-sm mt-2 text-center">
              Create a goal to start tracking your savings journey
            </Text>
          </View>
        )}

        <TouchableOpacity
          className="border-2 border-dashed border-neutral-600 rounded-2xl p-4 mb-6"
          onPress={openGoalForm}
        >
          <View className="flex-row items-center">
            <View className="bg-neutral-700 w-10 h-10 rounded-full items-center justify-center mr-3">
              <MaterialIcons name="add" size={24} color="white" />
            </View>
            <Text className="text-white text-base font-semibold">Add Goal</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Goal form modal */}
      <Modal
        visible={goalFormVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGoalFormVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-neutral-900 rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-bold text-white">New Goal</Text>
              <TouchableOpacity onPress={() => setGoalFormVisible(false)}>
                <MaterialIcons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-300 mb-2">
                Title
              </Text>
              <TextInput
                value={goalFormData.title}
                onChangeText={(text) =>
                  setGoalFormData({ ...goalFormData, title: text })
                }
                placeholder="For what you're saving for"
                placeholderTextColor="#6b7280"
                className="bg-neutral-800 rounded-xl px-4 py-3 text-white text-base"
              />
              {goalFormErrors.title && (
                <Text className="text-red-500 text-sm mt-1">
                  {goalFormErrors.title}
                </Text>
              )}
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-neutral-300 mb-2">
                Target Amount
              </Text>
              <TextInput
                value={goalFormData.target_amount}
                onChangeText={(text) =>
                  setGoalFormData({
                    ...goalFormData,
                    target_amount: formatAmountInput(text),
                  })
                }
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#6b7280"
                className="bg-neutral-800 rounded-xl px-4 py-3 text-white text-base"
              />
              {goalFormErrors.target_amount && (
                <Text className="text-red-500 text-sm mt-1">
                  {goalFormErrors.target_amount}
                </Text>
              )}
              <Text className="text-neutral-500 text-xs mt-2">
                Currency: {accounts[0]?.currency || "INR"} (based on your first
                account)
              </Text>
            </View>

            <PrimaryButton
              label="Create Goal"
              onPress={handleCreateGoal}
              loading={goalSubmitting}
            />
          </View>
        </View>
      </Modal>

      {/* Goal action modal */}
      <Modal
        visible={actionModal.visible}
        transparent
        animationType="slide"
        onRequestClose={closeActionModal}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-neutral-900 rounded-t-3xl p-6 max-h-[90%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-bold text-white">
                {actionModal.type === "deposit" ? "Save to Goal" : "Withdraw from Goal"}
              </Text>
              <TouchableOpacity onPress={closeActionModal}>
                <MaterialIcons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {actionModal.goal && (
              <View className="mb-4 bg-neutral-800 rounded-2xl p-4">
                <Text className="text-white text-base font-semibold">
                  {actionModal.goal.title}
                </Text>
                <Text className="text-neutral-400 text-sm mt-1">
                  Saved ·{" "}
                  {formatCurrency(
                    actionModal.goal.saved_amount,
                    actionModal.goal.currency
                  )}
                </Text>
                <Text className="text-neutral-400 text-sm">
                  Target ·{" "}
                  {formatCurrency(
                    actionModal.goal.target_amount,
                    actionModal.goal.currency
                  )}
                </Text>
              </View>
            )}

            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-300 mb-2">
                Amount
              </Text>
              <TextInput
                value={actionAmount}
                onChangeText={(text) => setActionAmount(formatAmountInput(text))}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#6b7280"
                className="bg-neutral-800 rounded-xl px-4 py-3 text-white text-base"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-300 mb-2">
                {actionModal.type === "deposit" ? "Deduct from" : "Send back to"}
              </Text>
              {accounts.filter(
                (account) =>
                  !actionModal.goal ||
                  account.currency === actionModal.goal.currency
              ).length === 0 ? (
                <View className="bg-neutral-800 rounded-xl px-4 py-3">
                  <Text className="text-neutral-500 text-base">
                    No accounts with matching currency. Create one first.
                  </Text>
                </View>
              ) : (
                accounts
                  .filter(
                    (account) =>
                      !actionModal.goal ||
                      account.currency === actionModal.goal.currency
                  )
                  .map((account) => (
                    <TouchableOpacity
                      key={account.id}
                      className={`bg-neutral-800 rounded-xl px-4 py-3 mb-2 border ${
                        actionAccountId === account.id
                          ? "border-green-500"
                          : "border-transparent"
                      }`}
                      onPress={() => setActionAccountId(account.id)}
                    >
                      <View className="flex-row items-center justify-between">
                        <View>
                          <Text className="text-white font-semibold">
                            {account.name}
                          </Text>
                          <Text className="text-neutral-400 text-xs mt-1">
                            Balance · {formatCurrency(account.balance, account.currency)}
                          </Text>
                        </View>
                        {actionAccountId === account.id && (
                          <MaterialIcons
                            name="check-circle"
                            size={20}
                            color="#22c55e"
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
              )}
            </View>

            {actionError && (
              <Text className="text-red-500 text-sm mb-4">{actionError}</Text>
            )}

            <PrimaryButton
              label={
                actionModal.type === "deposit" ? "Save to Goal" : "Withdraw to Account"
              }
              onPress={handleGoalAction}
              loading={actionSubmitting}
              disabled={
                accounts.filter(
                  (account) =>
                    !actionModal.goal ||
                    account.currency === actionModal.goal.currency
                ).length === 0
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


