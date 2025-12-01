import { Text, TouchableHighlight, View, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Transaction } from "@/types/transaction";
import { type ThemeColors } from "@/constants/theme";
import { type TransactionTypeMeta } from "../../utils/typeMeta";
import { formatAmount } from "../../utils/formatting";
import { getAccountLabel } from "../../utils/accountLabel";

type TransactionItemProps = {
  transaction: Transaction;
  isLastInGroup: boolean;
  colors: ThemeColors;
  DEFAULT_TYPE_META: TransactionTypeMeta;
  TRANSACTION_TYPE_META: Record<string, TransactionTypeMeta>;
  onPress?: (transaction: Transaction) => void;
};

export function TransactionItem({
  transaction,
  isLastInGroup,
  colors,
  DEFAULT_TYPE_META,
  TRANSACTION_TYPE_META,
  onPress,
}: TransactionItemProps) {
  const typeMeta = TRANSACTION_TYPE_META[transaction.type] || DEFAULT_TYPE_META;
  const categoryEmoji = transaction.category?.emoji || "💸";
  const categoryBg =
    transaction.category?.background_color || colors.background.subtle;
  const rippleProps =
    Platform.OS === "android"
      ? ({
          android_ripple: { color: colors.primary.soft },
        } as any)
      : {};
  const accountLabel = getAccountLabel(transaction);

  return (
    <View>
      <TouchableHighlight
        onPress={() => onPress?.(transaction)}
        underlayColor={colors.background.subtle}
        {...rippleProps}
        className="px-4"
      >
        <View className="flex-row items-center py-3">
          <View className="w-11 h-11 mr-3.5 relative">
            <View
              className="w-11 h-11 rounded-2xl items-center justify-center"
              style={{ backgroundColor: categoryBg }}
            >
              <Text className="text-2xl">{categoryEmoji}</Text>
            </View>
            {/* <View
              className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full items-center justify-center"
              style={{ backgroundColor: typeMeta.badgeBg }}
            >
              <MaterialIcons
                name={typeMeta.icon}
                size={12}
                color={typeMeta.badgeIconColor}
              />
            </View> */}
          </View>

          <View className="flex-1 justify-center">
            <View className="flex-row justify-between items-center">
              <View className="flex-1 pr-3">
                <Text
                  className="text-base font-semibold leading-5"
                  style={{ color: colors.foreground }}
                >
                  {transaction.note}
                </Text>
                <Text
                  className="text-xs mt-1"
                  style={{ color: colors.muted.foreground }}
                >
                  {transaction.category?.name ||
                    transaction.type.replace("_", " ")}
                </Text>
              </View>
              <View className="items-end">
                <Text
                  className={`text-lg font-semibold ${typeMeta.amountColor}`}
                >
                  {typeMeta.amountPrefix}
                  {formatAmount(transaction.amount, transaction.currency)}{" "}
                  {/* <View
                    className="w-5 h-5 rounded-full items-center justify-center"
                    style={{ backgroundColor: typeMeta.badgeBg }}
                  >
                    <MaterialIcons
                      name={typeMeta.icon}
                      size={12}
                      color={typeMeta.badgeIconColor}
                    />
                  </View> */}
                </Text>
                {accountLabel && (
                  <View className="mt-1.5">
                    <Text
                      className="text-xs text-right"
                      style={{ color: colors.muted.foreground }}
                    >
                      {accountLabel}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </TouchableHighlight>
      {!isLastInGroup && (
        <View
          className="h-px mx-4"
          style={{ backgroundColor: colors.border }}
        />
      )}
    </View>
  );
}
