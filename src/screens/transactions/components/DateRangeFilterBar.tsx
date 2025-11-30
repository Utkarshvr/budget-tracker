import { Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { type RefObject } from "react";
import { type ThemeColors } from "@/constants/theme";
import { type DateRangeFilter } from "../utils/dateRange";
import { formatDateRange } from "../utils/dateRange";

type DateRangeFilterBarProps = {
  filterType: DateRangeFilter;
  currentDateRange: { start: Date; end: Date };
  onPrev: () => void;
  onNext: () => void;
  onToggleDropdown: () => void;
  showDropdown: boolean;
  filterButtonRef: RefObject<View | null>;
  colors: ThemeColors;
};

export function DateRangeFilterBar({
  filterType,
  currentDateRange,
  onPrev,
  onNext,
  onToggleDropdown,
  showDropdown,
  filterButtonRef,
  colors,
}: DateRangeFilterBarProps) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <TouchableOpacity
          onPress={onPrev}
          className="p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons
            name="chevron-left"
            size={24}
            color={colors.primary.DEFAULT}
          />
        </TouchableOpacity>
        <Text
          className="text-base font-semibold text-center"
          style={{ color: colors.foreground, marginHorizontal: 4 }}
        >
          {formatDateRange(
            currentDateRange.start,
            currentDateRange.end,
            filterType
          )}
        </Text>
        <TouchableOpacity
          onPress={onNext}
          className="p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={colors.primary.DEFAULT}
          />
        </TouchableOpacity>
      </View>
      <View className="relative">
        <TouchableOpacity
          ref={filterButtonRef}
          onPress={onToggleDropdown}
          className="flex-row items-center px-2 py-1"
        >
          <Text
            className="text-sm capitalize mr-1"
            style={{ color: colors.primary.DEFAULT }}
          >
            {filterType}
          </Text>
          <MaterialIcons
            name={showDropdown ? "expand-less" : "expand-more"}
            size={20}
            color={colors.primary.DEFAULT}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

