import { useState } from "react";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import { AuthScaffold } from "./components/AuthScaffold";
import { FormField } from "./components/FormField";
import { PrimaryButton } from "./components/PrimaryButton";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setMessage(null);
    setError(null);

    if (!email) {
      setError("Please enter the email tied to your account.");
      return;
    }

    setLoading(true);
    const redirectTo = Linking.createURL("/(public)/reset-password");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo },
    );
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage("Check your inbox for the secure reset link.");
  };

  return (
    <AuthScaffold
      title="Forgot password?"
      subtitle="We’ll send a secure link to reset things."
      footer={
        <Text className="text-base text-neutral-500 dark:text-neutral-400">
          Changed your mind?{" "}
          <Link
            href="/(public)/sign-in"
            className="font-semibold text-neutral-900 dark:text-white"
          >
            Back to sign in
          </Link>
        </Text>
      }
    >
      <View className="gap-4">
        {error ? (
          <Text className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-600 dark:border-rose-700/50 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </Text>
        ) : null}
        {message ? (
          <Text className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-600 dark:border-emerald-700/50 dark:bg-emerald-500/10 dark:text-emerald-200">
            {message}
          </Text>
        ) : null}

        <FormField
          label="Email"
          value={email}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="you@email.com"
        />
        <PrimaryButton
          label={loading ? "Sending link..." : "Send reset link"}
          loading={loading}
          onPress={handleReset}
        />
      </View>
    </AuthScaffold>
  );
}


