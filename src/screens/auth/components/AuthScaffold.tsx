import { LinearGradient } from "expo-linear-gradient";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ReactNode } from "react";

type AuthScaffoldProps = {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
};

export function AuthScaffold({
  title,
  subtitle,
  footer,
  children,
}: AuthScaffoldProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-neutral-50 dark:bg-neutral-950"
      style={{ paddingTop: insets.top }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.select({
          ios: insets.top,
          android: -20,
        })}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: Math.max(insets.bottom, 16),
            }}
            bounces={false}
          >
            <View className="gap-8 py-8" style={{ justifyContent: "center", flexGrow: 1 }}>
              <View className="gap-3">
                <View className="h-16 w-16 overflow-hidden rounded-2xl bg-neutral-900/20">
                  <LinearGradient
                    colors={["#0f172a", "#4338ca", "#14b8a6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text className="text-lg font-semibold uppercase text-white">
                      BT
                    </Text>
                  </LinearGradient>
                </View>
                <Text className="text-xs font-semibold uppercase tracking-[0.5em] text-neutral-500 dark:text-neutral-400">
                  Budget Tracker
                </Text>
                <Text className="text-3xl font-semibold text-neutral-900 dark:text-white">
                  {title}
                </Text>
                {subtitle ? (
                  <Text className="text-base text-neutral-500 dark:text-neutral-400">
                    {subtitle}
                  </Text>
                ) : null}
              </View>

              <View className="gap-6 rounded-3xl border border-neutral-100 bg-white/90 p-6 shadow-2xl shadow-neutral-900/10 dark:border-neutral-800 dark:bg-neutral-900/70 dark:shadow-black/30">
                {children}
              </View>
            </View>
            {footer ? (
              <View className="mt-8 items-center pb-6">{footer}</View>
            ) : null}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}


