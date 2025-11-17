import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

export default function AccountsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <ScrollView className="flex-1 px-4 pt-4">
        {/* Header */}
        <Text className="text-3xl font-bold text-white mb-6">Accounts</Text>

        {/* Bank Accounts Section */}
        <Text className="text-lg font-bold text-white mb-3">Bank Accounts</Text>
        <View className="bg-neutral-800 rounded-2xl p-4 mb-6">
          <View className="flex-row items-start mb-4">
            <View className="bg-green-500 w-12 h-12 rounded-lg items-center justify-center mr-3">
              <MaterialIcons name="account-balance" size={24} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-base font-semibold">UBOI</Text>
              <Text className="text-neutral-400 text-sm mt-1">
                Updated 18 hours ago
              </Text>
            </View>
          </View>
          <View className="mt-2">
            <Text className="text-neutral-400 text-sm mb-1">Balance</Text>
            <Text className="text-white text-2xl font-bold">₹21,680.00</Text>
          </View>
        </View>

        {/* Cash Section */}
        <Text className="text-lg font-bold text-white mb-3">Cash</Text>
        <View className="bg-neutral-800 rounded-2xl p-4 mb-6">
          <View className="flex-row items-start mb-4">
            <View className="bg-green-500 w-12 h-12 rounded-lg items-center justify-center mr-3">
              <MaterialIcons name="attach-money" size={24} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-base font-semibold">Cash</Text>
              <Text className="text-neutral-400 text-sm mt-1">
                Updated 17 hours ago
              </Text>
            </View>
          </View>
          <View className="mt-2">
            <Text className="text-neutral-400 text-sm mb-1">Balance</Text>
            <Text className="text-white text-2xl font-bold">₹8,180.00</Text>
          </View>
        </View>

        {/* Add Account Section */}
        <TouchableOpacity className="border-2 border-dashed border-neutral-600 rounded-2xl p-4 mb-6">
          <View className="flex-row items-center">
            <View className="bg-neutral-700 w-10 h-10 rounded-full items-center justify-center mr-3">
              <MaterialIcons name="add" size={24} color="white" />
            </View>
            <Text className="text-white text-base font-semibold">
              Add Account
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
