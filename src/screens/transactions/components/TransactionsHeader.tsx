import React, { useState } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { type ThemeColors } from "@/constants/theme";
import { formatDateRange } from "../utils/dateRange";
import LogoIcon from "@/components/LogoIcon";
import { MonthYearPickerModal } from "./MonthYearPickerModal";

type TransactionsHeaderProps = {
  totalCount: number;
  colors: ThemeColors;
  currentDateRange: { start: Date; end: Date };
  onPrev: () => void;
  onNext: () => void;
  onDateSelect?: (date: Date) => void;
};

export function TransactionsHeader({
  totalCount,
  colors,
  currentDateRange,
  onPrev,
  onNext,
  onDateSelect,
}: TransactionsHeaderProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateSelect = (date: Date) => {
    onDateSelect?.(date);
  };

  return (
    <>
      <View className="p-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center justify-center">
            <TouchableOpacity onPress={onPrev} className="pr-1 py-1">
              <MaterialIcons
                name="chevron-left"
                size={28}
                color={colors.foreground}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="px-3 py-1"
            >
              <Text
                className="text-base font-bold text-center text-foreground"
                // style={{ color: colors.foreground }}
              >
                {formatDateRange(
                  currentDateRange.start,
                  currentDateRange.end,
                  "month"
                )}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onNext} className="pl-1 py-1">
              <MaterialIcons
                name="chevron-right"
                size={28}
                color={colors.foreground}
              />
            </TouchableOpacity>
          </View>
        </View>
        <LogoIcon />
      </View>

      <MonthYearPickerModal
        visible={showDatePicker}
        currentDate={currentDateRange.start}
        colors={colors}
        onClose={() => setShowDatePicker(false)}
        onSelect={handleDateSelect}
      />
    </>
  );
}
