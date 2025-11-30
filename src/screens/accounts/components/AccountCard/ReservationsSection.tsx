import { Text, View, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Account } from "@/types/account";
import { CategoryReservation } from "@/types/category";
import { theme } from "@/constants/theme";
import { formatBalance } from "../../utils";
import { ReservationItem } from "./ReservationItem";

type ReservationsSectionProps = {
  account: Account;
  reservations: Array<
    CategoryReservation & { categoryName: string; categoryEmoji: string }
  >;
  unallocated: number;
  expanded: boolean;
  onToggle: () => void;
};

export function ReservationsSection({
  account,
  reservations,
  unallocated,
  expanded,
  onToggle,
}: ReservationsSectionProps) {
  const router = useRouter();
  const hasReservations = reservations.length > 0;

  return (
    <View className="mt-4">
      {hasReservations ? (
        <>
          <TouchableOpacity
            onPress={onToggle}
            className="flex-row items-center justify-between"
          >
            <Text className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
              Reserved Funds ({reservations.length})
            </Text>
            <MaterialIcons
              name={expanded ? "expand-less" : "expand-more"}
              size={20}
              color={theme.colors.muted.foreground}
            />
          </TouchableOpacity>
          {expanded && (
            <View className="mt-2 rounded-2xl border border-border">
              {reservations.map((item, index) => (
                <ReservationItem
                  key={item.id}
                  reservation={item}
                  showDivider={index < reservations.length - 1}
                />
              ))}
            </View>
          )}
        </>
      ) : (
        <>
          <Text className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
            Reserved Funds
          </Text>
          <Text className="text-muted-foreground text-sm mt-2">
            No funds yet. Create one to reserve money for goals.
          </Text>
        </>
      )}
      <View className="mt-4">
        <Text className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
          Unreserved
        </Text>
        <Text className="text-foreground text-lg font-bold mt-1">
          {formatBalance(unallocated, account.currency)}
        </Text>
      </View>
      <TouchableOpacity
        className="mt-4 flex-row items-center justify-center rounded-2xl bg-primary-soft border border-primary-border py-2"
        onPress={() => router.push("/(auth)/(tabs)/categories")}
      >
        <MaterialIcons name="savings" size={16} color={theme.colors.primary.DEFAULT} />
        <Text className="text-primary text-sm font-semibold ml-2">
          {hasReservations ? "Manage Funds" : "+ Create Fund"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

