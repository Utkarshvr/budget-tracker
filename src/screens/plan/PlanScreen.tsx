import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { Account } from "@/types/account";
import { Category } from "@/types/category";
import { computeAccountFundTotals } from "@/utils/funds";
import { FundCreateSheet } from "@/components/funds/FundCreateSheet";
import { FundCategoryPickerSheet } from "@/screens/plan/components/FundCategoryPickerSheet";

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

export default function PlanScreen() {
  const router = useRouter();
  const { session } = useSupabaseSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [createSheetVisible, setCreateSheetVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const fundedCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.category_type === "fund" && category.fund_account_id
      ),
    [categories]
  );

  const accountTotals = useMemo(
    () => computeAccountFundTotals(fundedCategories),
    [fundedCategories]
  );

  useEffect(() => {
    if (session?.user) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    if (!session?.user) return;
    setLoading(true);
    await Promise.all([fetchAccounts(), fetchCategories()]);
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
      console.error("Unable to load accounts", error);
      return;
    }
    setAccounts(data || []);
  };

  const fetchCategories = async () => {
    if (!session?.user) return;
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", session.user.id)
      .order("name", { ascending: true });

    if (error) {
      console.error("Unable to load categories", error);
      return;
    }
    setCategories(data || []);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const groupedByAccount = accounts.map((account) => {
    const funds = fundedCategories.filter(
      (category) => category.fund_account_id === account.id
    );
    const reserved = accountTotals[account.id] || 0;
    const free = Math.max(account.balance - reserved, 0);
    return {
      account,
      funds,
      reserved,
      free,
    };
  });

  const handleAddFund = (account: Account) => {
    setSelectedAccount(account);
    setPickerVisible(true);
  };

  const handleCategoryPicked = (category: Category | null) => {
    setPickerVisible(false);
    if (category) {
      setSelectedCategory(category);
      setCreateSheetVisible(true);
    }
  };

  const handleFundCreated = async () => {
    await fetchCategories();
  };

  const handleFundRowPress = (category: Category) => {
    router.push({
      pathname: "/(auth)/category/[id]",
      params: { id: category.id },
    });
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
            <Text className="text-3xl font-bold text-white">Plan</Text>
            <Text className="text-neutral-500 text-sm mt-1">
              Funds grouped by their accounts
            </Text>
          </View>
        </View>

        {accounts.length === 0 ? (
          <View className="bg-neutral-800 rounded-3xl p-6 items-center">
            <MaterialIcons name="account-balance-wallet" size={48} color="#6b7280" />
            <Text className="text-white text-lg font-semibold mt-4">
              Add an account to start planning
            </Text>
            <Text className="text-neutral-400 text-sm text-center mt-2">
              Funds live inside accounts. Create an account first to reserve money.
            </Text>
          </View>
        ) : (
          groupedByAccount.map(({ account, funds, reserved, free }) => (
            <View key={account.id} className="bg-neutral-800 rounded-3xl p-4 mb-4">
              <View className="mb-3">
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
                  Free to plan · {formatBalance(free, account.currency)}
                </Text>
              </View>

              {funds.length === 0 ? (
                <View className="bg-neutral-900/50 rounded-2xl p-4 mb-3">
                  <Text className="text-neutral-400 text-sm">
                    No funded categories yet. Put money aside for the things you care about.
                  </Text>
                </View>
              ) : (
                funds.map((category) => {
                  const target = category.fund_target_amount || 0;
                  const progress =
                    target > 0 ? Math.min(category.fund_balance / target, 1) : 1;

                  return (
                    <TouchableOpacity
                      key={category.id}
                      className="bg-neutral-900/60 rounded-2xl p-4 mb-3"
                      onPress={() => handleFundRowPress(category)}
                    >
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center">
                          <View
                            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                            style={{ backgroundColor: category.background_color }}
                          >
                            <Text style={{ fontSize: 22 }}>{category.emoji}</Text>
                          </View>
                          <View>
                            <Text className="text-white text-base font-semibold">
                              {category.name}
                            </Text>
                            <Text className="text-neutral-400 text-xs mt-1">
                              Reserved ·{" "}
                              {formatBalance(
                                category.fund_balance || 0,
                                category.fund_currency || account.currency
                              )}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-white text-sm font-semibold">
                          {category.fund_currency
                            ? formatBalance(
                                category.fund_balance || 0,
                                category.fund_currency
                              )
                            : formatBalance(category.fund_balance || 0, account.currency)}
                        </Text>
                      </View>
                      <View className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                        <View
                          className="h-2 rounded-full bg-green-500"
                          style={{ width: `${progress * 100}%` }}
                        />
                      </View>
                      {target > 0 && (
                        <Text className="text-neutral-400 text-xs mt-2">
                          {formatBalance(category.fund_balance || 0, category.fund_currency || account.currency)}{" "}
                          / {formatBalance(target, category.fund_currency || account.currency)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}

              <TouchableOpacity
                className="mt-2 flex-row items-center justify-center rounded-2xl border border-dashed border-neutral-600 py-3"
                onPress={() => handleAddFund(account)}
              >
                <MaterialIcons name="add" size={18} color="#22c55e" />
                <Text className="text-green-400 text-sm font-semibold ml-2">
                  Add Fund
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <FundCategoryPickerSheet
        visible={pickerVisible}
        categories={categories}
        onClose={() => setPickerVisible(false)}
        onSelect={handleCategoryPicked}
      />

      <FundCreateSheet
        visible={createSheetVisible}
        category={selectedCategory}
        accounts={accounts}
        accountTotals={accountTotals}
        defaultAccountId={selectedAccount?.id}
        onClose={() => {
          setCreateSheetVisible(false);
          setSelectedCategory(null);
        }}
        onCreated={handleFundCreated}
      />
    </SafeAreaView>
  );
}

