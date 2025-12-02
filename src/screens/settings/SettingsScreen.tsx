import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { useThemeColors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

export default function SettingsScreen() {
  const colors = useThemeColors();
  const { session } = useSupabaseSession();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const user = session?.user;

  const displayName =
    (user?.user_metadata as any)?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "Guest";

  const email = user?.email ?? "";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join("") || "U";

  const handleAccountSettings = () => {
    router.push("/(auth)/account-settings");
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView
      className="flex-1 px-4 pt-6"
      style={{ backgroundColor: colors.background.DEFAULT }}
    >
      <View className="items-center mb-8">
        <View
          className="w-24 h-24 rounded-full items-center justify-center"
          style={{
            backgroundColor: colors.primary.soft,
            borderColor: colors.primary.border,
            borderWidth: 1,
          }}
        >
          <Text className="text-2xl font-semibold" style={{ color: colors.primary.DEFAULT }}>
            {initials}
          </Text>
        </View>
        <Text
          className="mt-4 text-lg font-semibold text-center"
          style={{ color: colors.foreground }}
        >
          {displayName}
        </Text>
        {email ? (
          <Text
            className="mt-1 text-sm text-center"
            style={{ color: colors.muted.foreground }}
          >
            {email}
          </Text>
        ) : null}
      </View>

      <View
        className="rounded-2xl overflow-hidden mb-6"
        style={{ backgroundColor: colors.muted.DEFAULT }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleAccountSettings}
          className="flex-row items-center justify-between px-4 py-4"
        >
          <View className="flex-row items-center gap-3">
            <View
              className="w-9 h-9 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.primary.soft }}
            >
              <MaterialIcons
                name="person-outline"
                size={20}
                color={colors.primary.DEFAULT}
              />
            </View>
            <View>
              <Text
                className="text-base font-medium"
                style={{ color: colors.foreground }}
              >
                Account Settings
              </Text>
              <Text
                className="text-xs mt-0.5"
                style={{ color: colors.muted.foreground }}
              >
                Update your name or password
              </Text>
            </View>
          </View>
          <MaterialIcons
            name="chevron-right"
            size={22}
            color={colors.muted.foreground}
          />
        </TouchableOpacity>
      </View>

      <View
        className="mt-auto mb-4"
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowLogoutConfirm(true)}
          className="w-full rounded-xl flex-row items-center justify-center gap-2 px-4 py-3"
          style={{ backgroundColor: colors.destructive.DEFAULT }}
        >
          <MaterialIcons
            name="logout"
            size={20}
            color={colors.destructive.foreground}
          />
          <Text
            className="text-base font-semibold"
            style={{ color: colors.destructive.foreground }}
          >
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: colors.overlay }}
          onPress={() => setShowLogoutConfirm(false)}
        >
          <Pressable
            className="w-full rounded-2xl p-5"
            style={{ backgroundColor: colors.background.DEFAULT }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              className="text-lg font-semibold mb-2"
              style={{ color: colors.foreground }}
            >
              Logout
            </Text>
            <Text
              className="text-sm mb-4"
              style={{ color: colors.muted.foreground }}
            >
              Are you sure you want to logout?
            </Text>
            <View className="flex-row justify-end gap-3 mt-2">
              <TouchableOpacity
                onPress={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: colors.muted.DEFAULT }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ color: colors.muted.foreground }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogout}
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: colors.destructive.DEFAULT }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: colors.destructive.foreground }}
                >
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}


