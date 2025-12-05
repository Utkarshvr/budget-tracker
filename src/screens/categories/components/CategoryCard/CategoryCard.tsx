import { Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Category, CategoryReservation } from "@/types/category";
import { Account } from "@/types/account";
import { formatBalance, formatDate } from "../../utils";
import { CategoryDetails } from "./CategoryDetails";
import { theme, useThemeColors, getCategoryBackgroundColor } from "@/constants/theme";

type CategoryCardProps = {
  category: Category;
  categoryReservations: CategoryReservation[];
  totalReserved: number;
  isExpanded: boolean;
  onToggle: () => void;
  onShowActions: () => void;
  onEditCategory: () => void;
  accounts: Account[];
  onManageReservations: () => void;
};

export function CategoryCard({
  category,
  categoryReservations,
  totalReserved,
  isExpanded,
  onToggle,
  onShowActions,
  onEditCategory,
  accounts,
  onManageReservations,
}: CategoryCardProps) {
  const colors = useThemeColors();
  const categoryBgColor = getCategoryBackgroundColor(colors);
  const isReserved = categoryReservations.length > 0;
  const fundCurrency = categoryReservations[0]?.currency || "INR";

  return (
    <View
      className="rounded-xl mb-3 overflow-hidden bg-background-subtle"
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onToggle}
        className="flex-row items-center px-4 py-2"
      >
        <View
          className="w-14 h-14 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: categoryBgColor }}
        >
          <Text style={{ fontSize: 28 }}>{category.emoji}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-foreground text-base font-semibold mb-1">
            {category.name}
          </Text>
          <View className="flex-row items-center">
            {isReserved ? (
              <View className="flex-row items-center">
                <View className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5" />
                <Text className="text-primary text-xs font-medium">
                  {formatBalance(totalReserved, fundCurrency)}
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <View className="w-1.5 h-1.5 rounded-full bg-muted-foreground mr-1.5" />
                <Text className="text-muted-foreground text-xs font-medium">
                  No fund
                </Text>
              </View>
            )}
          </View>
        </View>
        <View className="flex-row items-center ml-2">
          {category.category_type === "expense" && (
            <View className="w-9 h-9 rounded-full items-center justify-center mr-1.5">
              <MaterialIcons
                name={
                  isExpanded ? "expand-less" : "keyboard-arrow-down"
                }
                size={24}
                color={theme.colors.muted.foreground}
              />
            </View>
          )}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onShowActions();
            }}
            className="w-9 h-9 rounded-full items-center justify-center"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons
              name="more-vert"
              size={20}
              color={theme.colors.muted.foreground}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <>
          <View className="h-px bg-border mx-4" />
          <View className="px-4 pt-3 pb-4">
            <Text className="text-muted-foreground text-xs mb-3">
              Updated {formatDate(category.updated_at)}
            </Text>
            <CategoryDetails
              category={category}
              categoryReservations={categoryReservations}
              totalReserved={totalReserved}
              accounts={accounts}
              onManageReservations={onManageReservations}
              onEditCategory={onEditCategory}
            />
          </View>
        </>
      )}
    </View>
  );
}

