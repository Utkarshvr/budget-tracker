import { Tabs, usePathname } from "expo-router";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Text,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AmountInputScreen from "@/screens/transactions/AmountInputScreen";
import TransactionFormScreen from "@/screens/transactions/TransactionFormScreen";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [showAmountInput, setShowAmountInput] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState("0.00");
  const pathname = usePathname();
  const isSettingsTab = pathname?.includes("/settings");

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#22c55e",
          tabBarInactiveTintColor: "#6b7280",
          tabBarStyle: {
            backgroundColor: "#171717",
            borderTopColor: "#262626",
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 8,
          },
        }}
        initialRouteName="transactions"
      >
        <Tabs.Screen
          name="index"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: "Transactions",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="receipt-long" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="accounts"
          options={{
            title: "Accounts",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons
                name="account-balance-wallet"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: "Categories",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="category" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="settings" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      {!isSettingsTab && (
        <TouchableOpacity
          style={[
            styles.fab,
            {
              bottom: 60 + insets.bottom + 20, // Above the tab bar with safe area
            },
          ]}
          className="flex-row items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary-strong"
          onPress={() => setShowAmountInput(true)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={28} color="white" />
          <Text className="text-white text-base font-semibold">
            Transaction
          </Text>
        </TouchableOpacity>
      )}

      {/* Amount Input Screen */}
      <AmountInputScreen
        visible={showAmountInput}
        onClose={() => setShowAmountInput(false)}
        onContinue={(amount) => {
          setTransactionAmount(amount);
          setShowAmountInput(false);
          setShowAddTransaction(true);
        }}
      />

      {/* Add Transaction Screen */}
      {showAddTransaction && (
        <View
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <TransactionFormScreen
            initialAmount={transactionAmount}
            onClose={() => setShowAddTransaction(false)}
            onSuccess={() => {
              setShowAddTransaction(false);
              setTransactionAmount("0.00");
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
