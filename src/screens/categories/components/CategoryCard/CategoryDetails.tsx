import { Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Category, CategoryReservation } from "@/types/category";
import { Account } from "@/types/account";
import { formatBalance } from "../../utils";
import { theme } from "@/constants/theme";

type CategoryDetailsProps = {
  category: Category;
  categoryReservations: CategoryReservation[];
  totalReserved: number;
  accounts: Account[];
  onManageReservations: () => void;
  onEditCategory?: () => void;
};

export function CategoryDetails({
  category,
  categoryReservations,
  totalReserved,
  accounts,
  onManageReservations,
  onEditCategory,
}: CategoryDetailsProps) {
  const isReserved = categoryReservations.length > 0;

  if (category.category_type === "income") {
    return (
      <View className="mt-3">
        <Text className="text-muted-foreground text-xs">
          Income categories don't hold funds. Use them to classify incoming
          money.
        </Text>
        <View className="flex-row mt-3">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center bg-muted rounded-xl py-2"
            onPress={onEditCategory}
          >
            <MaterialIcons name="edit" size={16} color={theme.colors.foreground} />
            <Text className="text-foreground text-sm font-semibold ml-2">
              Edit Category
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!isReserved) {
    return (
      <View className="mt-3">
        <Text className="text-muted-foreground text-sm">
          No funds reserved yet.
        </Text>
        <TouchableOpacity
          className="mt-3 flex-row items-center justify-center rounded-xl bg-primary-soft border border-primary-border py-2"
          onPress={onManageReservations}
        >
          <MaterialIcons name="add" size={16} color={theme.colors.primary.DEFAULT} />
          <Text className="text-primary text-sm font-semibold ml-2">
            Create Fund
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currency = categoryReservations[0]?.currency || "INR";
  const multiAccount = categoryReservations.length > 1;

  return (
    <View className="mt-3">
      <Text className="text-muted-foreground text-xs mb-2">
        Reserved from {categoryReservations.length} account
        {categoryReservations.length > 1 ? "s" : ""}
      </Text>

      <View className="rounded-2xl border border-border">
        {categoryReservations.map((reservation, index) => {
          const account = accounts.find(
            (a) => a.id === reservation.account_id
          );
          return (
            <View key={reservation.id}>
              <View className="flex-row items-center justify-between px-3 py-2">
                <View className="flex-row items-center">
                  <View className="size-1.5 rounded-full bg-primary mr-2" />
                  <Text className="text-foreground text-sm">
                    {account?.name || "Unknown account"}
                  </Text>
                </View>
                <Text className="text-primary text-sm font-semibold">
                  {formatBalance(
                    reservation.reserved_amount,
                    reservation.currency
                  )}
                </Text>
              </View>
              {index < categoryReservations.length - 1 && (
                <View className="h-px bg-border" />
              )}
            </View>
          );
        })}

        <View className="h-px bg-border" />
        <View className="flex-row items-center justify-between px-3 py-2">
          <Text className="text-muted-foreground text-xs uppercase tracking-wide">
            Total Reserved
          </Text>
          <Text className="text-primary text-base font-semibold">
            {formatBalance(totalReserved, currency)}
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap mt-3">
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center rounded-xl bg-primary-soft border border-primary-border py-2"
          onPress={onManageReservations}
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
      </View>
    </View>
  );
}

