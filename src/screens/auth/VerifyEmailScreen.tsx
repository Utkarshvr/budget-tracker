import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Text, View, Linking, Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import { AuthScaffold } from "./components/AuthScaffold";
import { PrimaryButton } from "./components/PrimaryButton";

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email || "";
  const [loading, setLoading] = useState(false);

  const handleOpenGmail = async () => {
    try {
      const gmailUrl = `googlegmail://`;
      const canOpen = await Linking.canOpenURL(gmailUrl);
      
      if (canOpen) {
        await Linking.openURL(gmailUrl);
      } else {
        // Fallback to opening email app or browser
        await Linking.openURL(`mailto:${email}`);
      }
    } catch (error) {
      Alert.alert("Error", "Could not open Gmail. Please check your email manually.");
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Success", "Verification email sent! Please check your inbox.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to resend email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      title="Verify Your Email"
      subtitle="We've sent a verification email to your inbox. Please check it to continue using BudgetWise."
    >
      <View className="gap-4">
        <View className="rounded-2xl border border-neutral-200 bg-neutral-100/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
          <Text className="text-sm text-neutral-600 dark:text-neutral-400">
            We've sent a confirmation email to {email}. Please check your inbox to continue.
          </Text>
        </View>

        <PrimaryButton
          label="Open Gmail"
          onPress={handleOpenGmail}
        />

        <View className="gap-2">
          <Text className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Didn't get the email? Check your spam folder or tap below to resend.
          </Text>
          
          <Text
            className="text-center text-base font-semibold text-blue-500 dark:text-blue-400"
            onPress={handleResendEmail}
          >
            {loading ? "Sending..." : "Resend Email"}
          </Text>
        </View>

        <View className="mt-4 gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Text className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Already confirmed your email on another device?
          </Text>
          
          <Text
            className="text-center text-base font-semibold text-blue-500 dark:text-blue-400"
            onPress={() => router.replace("/(public)/sign-in")}
          >
            Go to Sign In
          </Text>
        </View>
      </View>
    </AuthScaffold>
  );
}

