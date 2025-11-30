import { Text, View } from "react-native";
import { Account } from "@/types/account";
import { CategoryReservation } from "@/types/category";
import { AccountCard } from "./AccountCard/AccountCard";

type AccountsSectionProps = {
  title: string;
  accounts: Account[];
  reservations: CategoryReservation[];
  categories: Array<{ id: string; name: string; emoji: string }>;
  showTypeMeta: boolean;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  expandedReservations: Record<string, boolean>;
  onToggleReservations: (accountId: string) => void;
};

export function AccountsSection({
  title,
  accounts,
  reservations,
  categories,
  showTypeMeta,
  onEdit,
  onDelete,
  expandedReservations,
  onToggleReservations,
}: AccountsSectionProps) {
  if (accounts.length === 0) {
    return null;
  }

  return (
    <View className="mb-6">
      <Text className="text-lg font-bold text-foreground mb-3">{title}</Text>
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          reservations={reservations}
          categories={categories}
          showTypeMeta={showTypeMeta}
          onEdit={onEdit}
          onDelete={onDelete}
          expanded={expandedReservations[account.id] || false}
          onToggleExpanded={() => onToggleReservations(account.id)}
        />
      ))}
    </View>
  );
}

