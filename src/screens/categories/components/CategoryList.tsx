import { View } from "react-native";
import { Category, CategoryReservation } from "@/types/category";
import { Account } from "@/types/account";
import { CategoryCard } from "./CategoryCard/CategoryCard";

type CategoryListProps = {
  categories: Category[];
  accounts: Account[];
  reservations: CategoryReservation[];
  expandedCategories: Record<string, boolean>;
  onToggleCategory: (category: Category) => void;
  onShowActions: (category: Category) => void;
  onEditCategory: (category: Category) => void;
  onManageReservations: (category: Category) => void;
  getReservationsForCategory: (id: string) => CategoryReservation[];
  getTotalReserved: (id: string) => number;
};

export function CategoryList({
  categories,
  accounts,
  reservations,
  expandedCategories,
  onToggleCategory,
  onShowActions,
  onEditCategory,
  onManageReservations,
  getReservationsForCategory,
  getTotalReserved,
}: CategoryListProps) {
  return (
    <View>
      {categories.map((category) => {
        const categoryReservations = getReservationsForCategory(category.id);
        const totalReserved = getTotalReserved(category.id);
        const isExpanded = !!expandedCategories[category.id];

        return (
          <CategoryCard
            key={category.id}
            category={category}
            categoryReservations={categoryReservations}
            totalReserved={totalReserved}
            isExpanded={isExpanded}
            onToggle={() => onToggleCategory(category)}
            onShowActions={() => onShowActions(category)}
            onEditCategory={() => onEditCategory(category)}
            accounts={accounts}
            onManageReservations={() => onManageReservations(category)}
          />
        );
      })}
    </View>
  );
}

