import { Transaction } from "@/types/transaction";

export function getAccountLabel(transaction: Transaction): string | null {
  const fromName = transaction.from_account?.name;
  const toName = transaction.to_account?.name;

  switch (transaction.type) {
    case "expense":
      return fromName ? `From: ${fromName}` : null;
    case "income":
      return toName ? `To: ${toName}` : null;
    case "transfer":
      if (fromName && toName) {
        return `${fromName} → ${toName}`;
      }
      return fromName ? `From: ${fromName}` : toName ? `To: ${toName}` : null;
    case "goal":
      return fromName ? `${fromName} → Goal` : null;
    case "goal_withdraw":
      return toName ? `Goal → ${toName}` : null;
    default:
      return null;
  }
}

