import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

export default function AuthLayout() {
  const { session, isLoading } = useSupabaseSession();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950">
        <ActivityIndicator color="#0f172a" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(public)/sign-in" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
