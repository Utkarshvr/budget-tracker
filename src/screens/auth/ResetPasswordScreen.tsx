import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { supabase } from "@/lib/supabase";
import { AuthScaffold } from "./components/AuthScaffold";
import { FormField } from "./components/FormField";
import { PrimaryButton } from "./components/PrimaryButton";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{
    access_token?: string | string[];
    refresh_token?: string | string[];
  }>();

  const accessToken = Array.isArray(params.access_token)
    ? params.access_token[0]
    : params.access_token;
  const refreshToken = Array.isArray(params.refresh_token)
    ? params.refresh_token[0]
    : params.refresh_token;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        .then(({ error: sessionError }) => {
          if (!isMounted) return;
          if (sessionError) {
            setError(sessionError.message);
          } else {
            setSessionReady(true);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [accessToken, refreshToken]);

  const handleUpdate = async () => {
    setError(null);
    setMessage(null);

    if (!password || !confirmPassword) {
      setError("Enter and confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Password updated. Redirecting you to the app...");
    setTimeout(() => {
      router.replace("/(auth)/(tabs)");
    }, 1200);
  };

  const missingTokens = !accessToken || !refreshToken;

  return (
    <AuthScaffold
      title="Set a new password"
      subtitle="Secure your account with a fresh password."
    >
      <View className="gap-4">
        {missingTokens ? (
          <Text className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-700 dark:border-amber-700/50 dark:bg-amber-500/10 dark:text-amber-200">
            Open the reset link from your email to continue.
          </Text>
        ) : null}

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
          label="New password"
          value={password}
          secureTextEntry
          editable={sessionReady}
          onChangeText={setPassword}
          placeholder="Create a password"
        />
        <FormField
          label="Confirm password"
          value={confirmPassword}
          secureTextEntry
          editable={sessionReady}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter password"
        />

        <PrimaryButton
          label={loading ? "Updating..." : "Update password"}
          loading={loading}
          disabled={!sessionReady}
          onPress={handleUpdate}
        />
      </View>
    </AuthScaffold>
  );
}


