import { useRef, useEffect, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { Transaction } from "@/types/transaction";
import { type ThemeColors, getCategoryBackgroundColor } from "@/constants/theme";
import { type TransactionTypeMeta } from "../utils/typeMeta";
import { formatAmount } from "../utils/formatting";
import { getAccountLabel } from "../utils/accountLabel";

type TransactionActionSheetProps = {
  visible: boolean;
  transaction: Transaction | null;
  colors: ThemeColors;
  typeMeta: {
    DEFAULT_TYPE_META: TransactionTypeMeta;
    TRANSACTION_TYPE_META: Record<string, TransactionTypeMeta>;
  };
  onClose: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
};

function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getAccountName(transaction: Transaction): string {
  switch (transaction.type) {
    case "expense":
      return transaction.from_account?.name || "Unknown";
    case "income":
      return transaction.to_account?.name || "Unknown";
    case "transfer":
      return transaction.from_account?.name || "Unknown";
    case "goal":
      return transaction.from_account?.name || "Unknown";
    case "goal_withdraw":
      return transaction.to_account?.name || "Unknown";
    default:
      return "Unknown";
  }
}

export function TransactionActionSheet({
  visible,
  transaction,
  colors,
  typeMeta,
  onClose,
  onEdit,
  onDelete,
}: TransactionActionSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["90%"], []);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleEdit = useCallback(() => {
    if (transaction) {
      onEdit(transaction);
      onClose();
    }
  }, [transaction, onEdit, onClose]);

  const handleDelete = useCallback(() => {
    if (transaction) {
      onDelete(transaction);
      onClose();
    }
  }, [transaction, onDelete, onClose]);

  if (!transaction) return null;

  const meta =
    typeMeta.TRANSACTION_TYPE_META[transaction.type] ||
    typeMeta.DEFAULT_TYPE_META;
  const categoryEmoji = transaction.category?.emoji || "💸";
  const showTransferIcon =
    !transaction.category?.emoji && transaction.type === "transfer";
  const categoryBg = getCategoryBackgroundColor(colors);

  const categoryName =
    transaction.category?.name ||
    transaction.type.replace("_", " ").charAt(0).toUpperCase() +
      transaction.type.replace("_", " ").slice(1);
  const accountName = getAccountName(transaction);
  const formattedDate = formatDateForDisplay(transaction.created_at);
  const formattedAmount = formatAmount(
    transaction.amount,
    transaction.currency
  );
  const amountColor =
    transaction.type === "expense"
      ? colors.destructive.DEFAULT
      : transaction.type === "income"
        ? colors.success.DEFAULT
        : colors.muted.foreground;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      onDismiss={handleDismiss}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: colors.background.subtle }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
      backdropComponent={renderBackdrop}
      enableHandlePanningGesture={true}
      enableContentPanningGesture={true}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.contentWrapper}>
          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.closeButton,
              { backgroundColor: colors.background.DEFAULT },
            ]}
          >
            <MaterialIcons name="close" size={20} color={colors.foreground} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: showTransferIcon
                    ? colors.transaction.transfer.badgeBg
                    : categoryBg,
                },
              ]}
            >
              {showTransferIcon ? (
                <MaterialIcons
                  name="swap-horiz"
                  size={40}
                  color={colors.transaction.transfer.badgeIcon}
                />
              ) : (
                <Text style={styles.iconEmoji}>{categoryEmoji}</Text>
              )}
            </View>
          </View>

          {/* Amount */}
          <Text style={[styles.amount, { color: amountColor }]}>
            {meta.amountPrefix}
            {formattedAmount}
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.foreground }]}>
            {transaction.note}
          </Text>

          {/* Details Section */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.foreground }]}>
                Date
              </Text>
              <Text
                style={[styles.detailValue, { color: colors.muted.foreground }]}
              >
                {formattedDate}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.foreground }]}>
                Category
              </Text>
              <Text
                style={[styles.detailValue, { color: colors.muted.foreground }]}
              >
                {categoryName}
              </Text>
            </View>

            {transaction.type === "transfer" ? (
              <>
                <View style={styles.detailRow}>
                  <Text
                    style={[styles.detailLabel, { color: colors.foreground }]}
                  >
                    From Account
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: colors.muted.foreground },
                    ]}
                  >
                    {transaction.from_account?.name || "Unknown"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text
                    style={[styles.detailLabel, { color: colors.foreground }]}
                  >
                    To Account
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: colors.muted.foreground },
                    ]}
                  >
                    {transaction.to_account?.name || "Unknown"}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.detailRow}>
                <Text
                  style={[styles.detailLabel, { color: colors.foreground }]}
                >
                  Account
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: colors.muted.foreground },
                  ]}
                >
                  {accountName}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            onPress={handleEdit}
            style={[
              styles.editButton,
              { backgroundColor: colors.background.DEFAULT },
            ]}
          >
            <Text style={[styles.editButtonText, { color: colors.foreground }]}>
              Edit Transaction
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            style={[
              styles.deleteButton,
              { backgroundColor: colors.destructive.DEFAULT },
            ]}
          >
            <Text style={styles.deleteButtonText}>Delete Transaction</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  contentWrapper: {
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    marginBottom: 16,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: {
    fontSize: 40,
  },
  amount: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 32,
  },
  detailsContainer: {
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "400",
  },
  buttonsContainer: {
    gap: 12,
    marginTop: "auto",
  },
  editButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});
