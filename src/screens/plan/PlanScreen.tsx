import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function PlanScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <View className="flex-1 items-center justify-center px-6">
        <View className="bg-neutral-800 rounded-3xl p-8 items-center">
          <View className="w-20 h-20 bg-green-600/20 rounded-full items-center justify-center mb-6">
            <MaterialIcons name="category" size={48} color="#22c55e" />
          </View>
          
          <Text className="text-white text-2xl font-bold text-center mb-3">
            Fund Management Moved!
          </Text>
          
          <Text className="text-neutral-400 text-base text-center mb-6">
            We've simplified things! Fund reservations are now managed directly in the Categories screen.
          </Text>

          <View className="bg-neutral-900/60 rounded-2xl p-4 mb-6">
            <View className="flex-row items-start mb-3">
              <MaterialIcons name="check-circle" size={20} color="#22c55e" style={{ marginRight: 8, marginTop: 2 }} />
              <Text className="text-neutral-300 text-sm flex-1">
                Create expense categories and reserve funds from multiple accounts
              </Text>
            </View>
            <View className="flex-row items-start mb-3">
              <MaterialIcons name="check-circle" size={20} color="#22c55e" style={{ marginRight: 8, marginTop: 2 }} />
              <Text className="text-neutral-300 text-sm flex-1">
                View reserved and unreserved money when making transactions
              </Text>
            </View>
            <View className="flex-row items-start">
              <MaterialIcons name="check-circle" size={20} color="#22c55e" style={{ marginRight: 8, marginTop: 2 }} />
              <Text className="text-neutral-300 text-sm flex-1">
                Add/withdraw funds directly from category cards
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className="bg-green-600 rounded-2xl px-8 py-4 w-full"
            onPress={() => router.push("/(auth)/(tabs)/categories")}
          >
            <Text className="text-white text-center text-base font-semibold">
              Go to Categories
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-3 py-2"
            onPress={() => router.push("/(auth)/(tabs)/accounts")}
          >
            <Text className="text-neutral-400 text-sm">
              or view Accounts →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
