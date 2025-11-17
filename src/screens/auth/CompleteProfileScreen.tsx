import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { supabase } from "@/lib/supabase";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { AuthScaffold } from "./components/AuthScaffold";
import { FormField } from "./components/FormField";
import { PrimaryButton } from "./components/PrimaryButton";

export default function CompleteProfileScreen() {
  const { session, isLoading } = useSupabaseSession();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/(public)/sign-in");
    }
  }, [isLoading, session]);

  const handleContinue = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Please share your name so we can personalize things.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      data: { full_name: name.trim() },
    });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.replace("/(auth)/(tabs)");
  };

  return (
    <AuthScaffold
      title="Tell us about you"
      subtitle="One last step before jumping into your budget."
    >
      <View className="gap-4">
        <Text className="text-base text-neutral-500 dark:text-neutral-400">
          Use the full name you’d like to see inside Budget Tracker.
        </Text>

        {error ? (
          <Text className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-600 dark:border-rose-700/50 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </Text>
        ) : null}

        <FormField
          label="Full name"
          value={name}
          onChangeText={setName}
          placeholder="Alex Budgeter"
        />

        <PrimaryButton
          label={loading ? "Saving..." : "Continue to app"}
          loading={loading}
          onPress={handleContinue}
        />
      </View>
    </AuthScaffold>
  );
}


