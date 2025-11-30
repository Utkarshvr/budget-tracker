import React, { memo, useCallback } from "react";
import { TouchableOpacity, View, Text, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeColors } from "@/constants/theme";
import type { DateRangeFilter } from "../utils/dateRange";

type FilterDropdownProps = {
  visible: boolean;
  filterType: DateRangeFilter;
  onClose: () => void;
  onSelect: (type: DateRangeFilter) => void;
  buttonLayout: { x: number; y: number; width: number; height: number };
};

const FILTER_OPTIONS: DateRangeFilter[] = ["week", "month", "year"];

export const FilterDropdown = memo<FilterDropdownProps>(
  ({ visible, filterType, onClose, onSelect, buttonLayout }) => {
    const colors = useThemeColors();

    const handleSelect = useCallback(
      (type: DateRangeFilter) => {
        onSelect(type);
        onClose();
      },
      [onSelect, onClose]
    );

    if (!visible) return null;

    // Calculate dropdown position (right-aligned with button, below it)
    const dropdownTop = buttonLayout.y + buttonLayout.height + 4;

    return (
      <>
        <Pressable
          onPress={onClose}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
        />
        <View
          style={{
            position: "absolute",
            right: 16,
            top: dropdownTop,
            backgroundColor: colors.background.subtle,
            borderRadius: 8,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            zIndex: 1000,
            minWidth: 120,
          }}
        >
          {FILTER_OPTIONS.map((type, index) => (
            <TouchableOpacity
              key={type}
              onPress={() => handleSelect(type)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: index < 2 ? 1 : 0,
                borderBottomColor: colors.border,
                backgroundColor:
                  filterType === type ? colors.primary.soft : "transparent",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    textTransform: "capitalize",
                    color: colors.foreground,
                  }}
                >
                  {type}
                </Text>
                {filterType === type && (
                  <MaterialIcons
                    name="check"
                    size={20}
                    color={colors.primary.DEFAULT}
                  />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </>
    );
  }
);

FilterDropdown.displayName = "FilterDropdown";

