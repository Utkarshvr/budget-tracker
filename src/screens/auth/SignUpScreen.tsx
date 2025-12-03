import { useState } from "react";
import { Link, router } from "expo-router";
import { Text, View } from "react-native";
import { supabase } from "@/lib/supabase";
import { AuthScaffold } from "./components/AuthScaffold";
import { FormField } from "./components/FormField";
import { PrimaryButton } from "./components/PrimaryButton";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError("Please fill in every field.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      const { error: signinError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signinError) {
        setError(signinError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.replace("/(public)/complete-profile");
  };

  return (
    <AuthScaffold
      title="Create your account"
      subtitle="Track budgets, stay accountable, and hit financial goals."
      footer={
        <Text className="text-base text-neutral-500 dark:text-neutral-400">
          Already have an account?{" "}
          <Link
            href="/(public)/sign-in"
            className="font-semibold text-neutral-900 dark:text-white"
          >
            Sign in
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
        <FormField
          label="Email"
          value={email}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="you@email.com"
        />
        <FormField
          label="Password"
          value={password}
          secureTextEntry
          autoCapitalize="none"
          onChangeText={setPassword}
          placeholder="Create a password"
        />
        <FormField
          label="Confirm password"
          value={confirmPassword}
          secureTextEntry
          onChangeText={setConfirmPassword}
          placeholder="Re-enter password"
        />

        <PrimaryButton
          label={loading ? "Creating..." : "Create account"}
          loading={loading}
          onPress={handleSignUp}
        />
      </View>
    </AuthScaffold>
  );
}


