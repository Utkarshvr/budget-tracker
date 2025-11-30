import { Text, View } from "react-native";
import { CategoryReservation } from "@/types/category";
import { formatBalance, formatDate } from "../../utils";

type ReservationItemProps = {
  reservation: CategoryReservation & { categoryName: string; categoryEmoji: string };
  showDivider: boolean;
};

export function ReservationItem({ reservation, showDivider }: ReservationItemProps) {
  const updatedLabel = reservation.updated_at
    ? `Updated ${formatDate(reservation.updated_at)}`
    : null;

  return (
    <View>
      <View className="flex-row items-center justify-between px-3 py-2">
        <View className="flex-row items-center flex-1 pr-2">
          <View className="w-9 h-9 rounded-full bg-muted items-center justify-center">
            <Text style={{ fontSize: 18 }}>{reservation.categoryEmoji}</Text>
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-foreground text-sm font-semibold">
              {reservation.categoryName}
            </Text>
            {updatedLabel && (
              <Text className="text-muted-foreground text-xs mt-0.5">
                {updatedLabel}
              </Text>
            )}
          </View>
        </View>
        <Text className="text-primary text-sm font-semibold">
          {formatBalance(reservation.reserved_amount, reservation.currency)}
        </Text>
      </View>
      {showDivider && <View className="h-px bg-border" />}
    </View>
  );
}

