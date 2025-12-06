import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Account } from "@/types/account";
import { Category, CategoryReservation } from "@/types/category";
import { theme } from "@/constants/theme";
import {
  ACCOUNT_TYPE_ICONS,
  ACCOUNT_TYPE_COLORS,
  formatBalance,
  getAccountReservations,
  getTotalReserved,
} from "../../utils";
import { ReservationsSection } from "./ReservationsSection";

type AccountCardProps = {
  account: Account;
  reservations: CategoryReservation[];
  categories: Category[];
  showTypeMeta: boolean;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onShowActions: (account: Account) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
};

export function AccountCard({
  account,
  reservations,
  categories,
  showTypeMeta,
  onEdit,
  onDelete,
  onShowActions,
  expanded,
  onToggleExpanded,
}: AccountCardProps) {
  const router = useRouter();

  const accountReservations = getAccountReservations(
    account.id,
    reservations,
    categories
  );

  // Placeholder-style values for clarity of the money hierarchy
  const totalBalance = account.balance;
  const reservedTotal = getTotalReserved(account.id, reservations);
  const freeToSpend = Math.max(totalBalance - reservedTotal, 0);
  const reservedFundsList = accountReservations;

  return (
    <LinearGradient
      colors={[
        theme.colors.surfaceGradient.from,
        theme.colors.surfaceGradient.to,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardGradient}
    >
      <TouchableOpacity
        className="rounded-3xl"
        // onPress={() => onEdit(account)}
        // onPress={(e) => {
        //   e.stopPropagation();
        //   onShowActions(account);
        // }}
        activeOpacity={0.9}
        style={styles.cardInner}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center flex-1 pr-3">
            <View
              className={`${ACCOUNT_TYPE_COLORS[account.type]} w-11 h-11 rounded-2xl items-center justify-center mr-3`}
            >
              <MaterialIcons
                name={ACCOUNT_TYPE_ICONS[account.type] as any}
                size={22}
                color={theme.colors.white}
              />
            </View>
            <View className="flex-1">
              <Text className="text-foreground text-base font-semibold">
                {account.name}
              </Text>
              <Text className="text-muted-foreground text-xs mt-1">
                {showTypeMeta
                  ? `${account.type.replace("_", " ")} • ${account.currency}`
                  : account.currency}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onShowActions(account);
            }}
            className="w-8 h-8 rounded-full bg-white/5 items-center justify-center"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons
              name="more-vert"
              size={18}
              color={theme.colors.muted.foreground}
            />
          </TouchableOpacity>
        </View>

        {/* Hero total balance */}
        <View className="mt-4">
          {/* <Text className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
            Total Balance
          </Text> */}
          <Text className="text-neutral-100 text-3xl text-center font-extrabold mt-1">
            {formatBalance(totalBalance, account.currency)}
          </Text>
        </View>

        {/* Mini stats row: Reserved / Free to Spend */}
        <View className="mt-4 flex-row items-center rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
          <View className="flex-1 mr-3">
            <Text className="text-muted-foreground text-[10px] uppercase tracking-[0.2em]">
              Free to plan
            </Text>
            <Text className="text-primary text-xl font-semibold mt-1">
              {formatBalance(freeToSpend, account.currency)}
            </Text>
          </View>

          <View className="w-px h-8 bg-white/10" />

          <View className="flex-1 ml-3 items-end">
            <Text className="text-muted-foreground text-[10px] uppercase tracking-[0.2em]">
              Reserved
            </Text>
            <Text className="text-[#FACC15] text-xl font-semibold mt-1">
              {formatBalance(reservedTotal, account.currency)}
            </Text>
          </View>
        </View>

        {/* Reserved funds list below stats */}
        <ReservationsSection
          reservations={reservedFundsList}
          expanded={expanded}
          onToggle={onToggleExpanded}
        />

        {/* Manage funds button at the bottom */}
        <TouchableOpacity
          className="mt-4 flex-row items-center justify-center rounded-2xl bg-primary-soft border border-primary-border py-2"
          onPress={() => router.push("/(auth)/(tabs)/categories")}
        >
          <MaterialIcons
            name="savings"
            size={16}
            color={theme.colors.primary.DEFAULT}
          />
          <Text className="text-primary text-sm font-semibold ml-2">
            Manage Funds
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  cardGradient: {
    borderRadius: 28,
    marginBottom: 16,
  },
  cardInner: {
    borderRadius: 28,
    padding: 16,
    backgroundColor: theme.colors.cardOverlay,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
});
