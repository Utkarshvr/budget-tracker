import { Category, CategoryReservation } from "@/types/category";

export function getAccountReservations(
  accountId: string,
  reservations: CategoryReservation[],
  categories: Category[]
) {
  return reservations
    .filter((r) => r.account_id === accountId)
    .map((reservation) => {
      const category = categories.find((c) => c.id === reservation.category_id);
      return {
        ...reservation,
        categoryName: category?.name || "Unknown",
        categoryEmoji: category?.emoji || "📁",
      };
    });
}

export function getTotalReserved(
  accountId: string,
  reservations: CategoryReservation[]
): number {
  return reservations
    .filter((r) => r.account_id === accountId)
    .reduce((sum, r) => sum + r.reserved_amount, 0);
}

