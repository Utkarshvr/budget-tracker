import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Account } from "@/types/account";
import { Category, CategoryReservation } from "@/types/category";
import { theme } from "@/constants/theme";
import { ACCOUNT_TYPE_ICONS, ACCOUNT_TYPE_COLORS, formatBalance, getAccountReservations, getTotalReserved } from "../../utils";
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
  const accountReservations = getAccountReservations(account.id, reservations, categories);
  const totalReserved = getTotalReserved(account.id, reservations);
  const unallocated = Math.max(account.balance - totalReserved, 0);

  return (
    <LinearGradient
      colors={[theme.colors.surfaceGradient.from, theme.colors.surfaceGradient.to]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardGradient}
    >
      <TouchableOpacity
        className="rounded-3xl"
        onPress={() => onEdit(account)}
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
            <MaterialIcons name="more-vert" size={18} color={theme.colors.muted.foreground} />
          </TouchableOpacity>
        </View>

        <View className="mt-4">
          <Text className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
            Total Balance
          </Text>
          <Text className="text-primary text-2xl font-bold mt-1">
            {formatBalance(account.balance, account.currency)}
          </Text>
        </View>

        <ReservationsSection
          account={account}
          reservations={accountReservations}
          unallocated={unallocated}
          expanded={expanded}
          onToggle={onToggleExpanded}
        />
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

