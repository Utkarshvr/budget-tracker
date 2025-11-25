import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { Account } from "@/types/account";
import { Fund, FundFormData } from "@/types/fund";
import { PrimaryButton } from "@/screens/auth/components/PrimaryButton";
import { FundFormSheet } from "./components/FundFormSheet";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

const formatBalance = (amount: number, currency: string) => {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const mainUnit = amount / 100;
  return `${symbol}${mainUnit.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
};

type FundActionType = "allocate" | "withdraw";

export default function FundsScreen() {
  const { session } = useSupabaseSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingFund, setEditingFund] = useState<Fund | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [actionModal, setActionModal] = useState<{
    visible: boolean;
    type: FundActionType;
    fund: Fund | null;
  }>({ visible: false, type: "allocate", fund: null });
  const [actionAmount, setActionAmount] = useState("");
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
    await Promise.all([fetchAccounts(), fetchFunds()]);
    setLoading(false);
  };

  const fetchAccounts = async () => {
    if (!session?.user) return;
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", session.user.id)
      .order("name", { ascending: true });

    if (error) {
      Alert.alert("Error", error.message || "Unable to load accounts");
      return;
    }
    setAccounts(data || []);
    setExpanded((prev) => {
      const next: Record<string, boolean> = { ...prev };
      (data || []).forEach((account) => {
        if (typeof next[account.id] === "undefined") {
          next[account.id] = true;
        }
      });
      return next;
    });
  };

  const fetchFunds = async () => {
    if (!session?.user) return;
    const { data, error } = await supabase
      .from("account_funds")
      .select("*")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      Alert.alert("Error", error.message || "Unable to load funds");
      return;
    }
    setFunds(data || []);
  };

  const accountTotals = useMemo(() => {
    return funds.reduce<Record<string, number>>((acc, fund) => {
      acc[fund.account_id] = (acc[fund.account_id] || 0) + fund.balance;
      return acc;
    }, {});
  }, [funds]);

const availableForAccount = (account: Account) => {
    const reserved = accountTotals[account.id] || 0;
    return Math.max(account.balance - reserved, 0);
  };

  const toggleExpanded = (accountId: string) => {
    setExpanded((prev) => ({ ...prev, [accountId]: !prev[accountId] }));
  };

  const handleSubmitFund = async (payload: FundFormData) => {
    if (!session?.user || !payload.account_id) return;
    setFormSubmitting(true);

    try {
      if (editingFund) {
        const { error } = await supabase
          .from("account_funds")
          .update({
            name: payload.name.trim(),
            emoji: payload.emoji,
            background_color: payload.background_color,
            account_id:
              editingFund.balance === 0 ? payload.account_id : editingFund.account_id,
          })
          .eq("id", editingFund.id);

        if (error) throw error;
      } else {
        const targetAccount = accounts.find((a) => a.id === payload.account_id);
        const currency = targetAccount?.currency || "INR";

        const { data: created, error } = await supabase
          .from("account_funds")
          .insert({
            user_id: session.user.id,
            account_id: payload.account_id,
            name: payload.name.trim(),
            emoji: payload.emoji,
            background_color: payload.background_color,
            balance: 0,
            currency,
          })
          .select()
          .single();

        if (error) throw error;

        const initial = parseFloat(payload.initial_allocation || "0");
        if (created && initial > 0) {
          const amountSmallest = Math.round(initial * 100);
          const { error: adjustError } = await supabase.rpc(
            "adjust_account_fund_balance",
            {
              p_fund_id: created.id,
              p_amount_delta: amountSmallest,
            }
          );
          if (adjustError) throw adjustError;
        }
      }

      setFormVisible(false);
      setEditingFund(null);
      await fetchFunds();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Unable to save fund");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteFund = (fund: Fund) => {
    if (fund.balance > 0) {
      Alert.alert(
        "Balance remaining",
        "Withdraw the fund to zero before deleting it."
      );
      return;
    }

    Alert.alert(
      "Delete Fund",
      `Delete "${fund.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("account_funds")
              .delete()
              .eq("id", fund.id);
            if (error) {
              Alert.alert("Error", error.message || "Unable to delete fund");
            } else {
              fetchFunds();
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const openActionModal = (fund: Fund, type: FundActionType) => {
    setActionModal({ visible: true, type, fund });
    setActionAmount("");
    setActionError(null);
  };

  const performFundAction = async () => {
    if (!actionModal.fund) return;
    const amountNum = parseFloat(actionAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setActionError("Enter a valid amount");
      return;
    }

    const amountSmallest = Math.round(amountNum * 100);
    const account = accounts.find((a) => a.id === actionModal.fund?.account_id);

    if (!account) {
      setActionError("Linked account is missing");
      return;
    }

    const available = availableForAccount(account);

    if (actionModal.type === "allocate" && amountSmallest > available) {
      setActionError("Not enough free balance in this account");
      return;
    }

    if (actionModal.type === "withdraw" && amountSmallest > actionModal.fund.balance) {
      setActionError("Cannot withdraw more than the fund balance");
      return;
    }

    setActionSubmitting(true);
    try {
      const delta = actionModal.type === "allocate" ? amountSmallest : -amountSmallest;
      const { error } = await supabase.rpc("adjust_account_fund_balance", {
        p_fund_id: actionModal.fund.id,
        p_amount_delta: delta,
      });
      if (error) throw error;

      setActionModal({ visible: false, type: "allocate", fund: null });
      setActionAmount("");
      setActionError(null);
      fetchFunds();
    } catch (error: any) {
      setActionError(error.message || "Unable to update fund");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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
      >
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-3xl font-bold text-white">Funds</Text>
            <Text className="text-neutral-500 text-sm mt-1">
              Allocate money inside each account
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setEditingFund(null);
              setFormVisible(true);
            }}
            className="w-12 h-12 rounded-2xl bg-green-600 items-center justify-center"
          >
            <MaterialIcons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {accounts.length === 0 ? (
          <View className="bg-neutral-800 rounded-2xl p-6 items-center">
            <MaterialIcons name="account-balance" size={48} color="#6b7280" />
            <Text className="text-white text-lg font-semibold mt-4">
              Add an account first
            </Text>
            <Text className="text-neutral-400 text-sm text-center mt-2">
              Funds live inside accounts. Create an account to get started.
            </Text>
          </View>
        ) : (
          accounts.map((account) => {
            const accountFunds = funds.filter(
              (fund) => fund.account_id === account.id
            );
            const reserved = accountTotals[account.id] || 0;
            const freeBalance = availableForAccount(account);
            const isExpanded = expanded[account.id];

            return (
              <View key={account.id} className="bg-neutral-800 rounded-3xl p-4 mb-4">
                <TouchableOpacity
                  className="flex-row items-center justify-between"
                  onPress={() => toggleExpanded(account.id)}
                >
                  <View>
                    <Text className="text-white text-lg font-semibold">
                      {account.name}
                    </Text>
                    <Text className="text-neutral-400 text-xs mt-1">
                      Total · {formatBalance(account.balance, account.currency)}
                    </Text>
                    <Text className="text-neutral-400 text-xs mt-1">
                      Reserved · {formatBalance(reserved, account.currency)}
                    </Text>
                    <Text className="text-neutral-300 text-xs mt-1">
                      Free to plan · {formatBalance(freeBalance, account.currency)}
                    </Text>
                  </View>
                  <MaterialIcons
                    name={isExpanded ? "expand-less" : "expand-more"}
                    size={28}
                    color="#9ca3af"
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View className="mt-4">
                    {accountFunds.length === 0 ? (
                      <View className="bg-neutral-900/60 rounded-2xl p-4">
                        <Text className="text-neutral-400 text-sm">
                          No funds yet. Reserve part of this balance for upcoming plans.
                        </Text>
                        <View className="w-full mt-3">
                          <PrimaryButton
                            label="Create Fund"
                            onPress={() => {
                              setEditingFund(null);
                              setFormVisible(true);
                            }}
                          />
                        </View>
                      </View>
                    ) : (
                      accountFunds.map((fund) => (
                        <View
                          key={fund.id}
                          className="bg-neutral-900/60 rounded-2xl p-4 mb-3"
                        >
                          <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                              <View
                                className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                                style={{ backgroundColor: fund.background_color }}
                              >
                                <Text style={{ fontSize: 22 }}>{fund.emoji}</Text>
                              </View>
                              <View>
                                <Text className="text-white text-base font-semibold">
                                  {fund.name}
                                </Text>
                                <Text className="text-neutral-400 text-xs mt-1">
                                  Updated {formatDate(fund.updated_at)}
                                </Text>
                              </View>
                            </View>
                            <Text className="text-green-400 text-base font-semibold">
                              {formatBalance(fund.balance, fund.currency)}
                            </Text>
                          </View>

                          <View className="flex-row mt-4">
                            <TouchableOpacity
                              className="flex-1 bg-green-600/80 rounded-2xl py-2 mr-2 items-center"
                              onPress={() => openActionModal(fund, "allocate")}
                            >
                              <Text className="text-white text-sm font-semibold">
                                Add
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              className={`flex-1 rounded-2xl py-2 items-center ${
                                fund.balance === 0
                                  ? "bg-neutral-700"
                                  : "bg-neutral-100/10 border border-neutral-500/40"
                              }`}
                              onPress={() => openActionModal(fund, "withdraw")}
                              disabled={fund.balance === 0}
                            >
                              <Text className="text-white text-sm font-semibold">
                                Withdraw
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="w-10 h-10 rounded-2xl bg-neutral-800 items-center justify-center ml-2"
                              onPress={() => {
                                setEditingFund(fund);
                                setFormVisible(true);
                              }}
                            >
                              <MaterialIcons name="edit" size={18} color="#9ca3af" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="w-10 h-10 rounded-2xl bg-neutral-800 items-center justify-center ml-2"
                              onPress={() => handleDeleteFund(fund)}
                            >
                              <MaterialIcons name="delete" size={18} color="#f87171" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <FundFormSheet
        visible={formVisible}
        fund={editingFund}
        accounts={accounts}
        accountTotals={accountTotals}
        onClose={() => {
          setFormVisible(false);
          setEditingFund(null);
        }}
        onSubmit={handleSubmitFund}
        loading={formSubmitting}
      />

      {actionModal.fund && (
        <View className="absolute inset-0 bg-black/70 justify-end">
          <View className="bg-neutral-900 rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-bold">
                {actionModal.type === "allocate" ? "Allocate to Fund" : "Withdraw to Account"}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setActionModal({ visible: false, type: "allocate", fund: null })
                }
              >
                <MaterialIcons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View className="bg-neutral-800 rounded-2xl p-4 mb-4">
              <Text className="text-white text-lg font-semibold">
                {actionModal.fund.name}
              </Text>
              <Text className="text-neutral-400 text-sm mt-1">
                Current balance ·{" "}
                {formatBalance(actionModal.fund.balance, actionModal.fund.currency)}
              </Text>
              {actionModal.type === "allocate" && (
                <Text className="text-neutral-400 text-xs mt-1">
                  Free balance ·{" "}
                  {(() => {
                    const account = accounts.find(
                      (a) => a.id === actionModal.fund?.account_id
                    );
                    if (!account) return formatBalance(0, actionModal.fund.currency);
                    return formatBalance(
                      availableForAccount(account),
                      actionModal.fund.currency
                    );
                  })()}
                </Text>
              )}
            </View>

            <View className="mb-4">
              <Text className="text-neutral-300 text-sm mb-2">Amount</Text>
              <TextInput
                value={actionAmount}
                onChangeText={(text) => {
                  setActionError(null);
                  setActionAmount(text.replace(/[^\d.]/g, ""));
                }}
                placeholder="0.00"
                placeholderTextColor="#6b7280"
                keyboardType="decimal-pad"
                className="bg-neutral-800 rounded-2xl px-4 py-3 text-white text-base"
              />
            </View>

            {actionError && (
              <Text className="text-red-500 text-sm mb-4">{actionError}</Text>
            )}

            <PrimaryButton
              label={actionModal.type === "allocate" ? "Add Funds" : "Withdraw"}
              onPress={performFundAction}
              loading={actionSubmitting}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}


