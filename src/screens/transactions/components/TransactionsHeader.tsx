import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { type ThemeColors } from "@/constants/theme";
import { type DateRangeFilter } from "../utils/dateRange";
import { formatDateRange } from "../utils/dateRange";

type TransactionsHeaderProps = {
  totalCount: number;
  colors: ThemeColors;
  filterType: DateRangeFilter;
  currentDateRange: { start: Date; end: Date };
  onPrev: () => void;
  onNext: () => void;
  onFilterPress: () => void;
  filterButtonRef: React.RefObject<View | null>;
};

export function TransactionsHeader({
  totalCount,
  colors,
  filterType,
  currentDateRange,
  onPrev,
  onNext,
  onFilterPress,
  filterButtonRef,
}: TransactionsHeaderProps) {
  return (
    <View className="p-2 flex-row items-center justify-between">
      <View className="flex-row items-center justify-center">
        <TouchableOpacity onPress={onPrev} className="p-1">
          <MaterialIcons
            name="chevron-left"
            size={28}
            color={colors.primary.DEFAULT}
          />
        </TouchableOpacity>
        <TouchableOpacity
          ref={filterButtonRef}
          onPress={onFilterPress}
          className="px-3 py-1"
        >
          <Text
            className="text-base font-semibold text-center"
            style={{ color: colors.foreground }}
          >
            {formatDateRange(
              currentDateRange.start,
              currentDateRange.end,
              filterType
            )}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext} className="p-1">
          <MaterialIcons
            name="chevron-right"
            size={28}
            color={colors.primary.DEFAULT}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
