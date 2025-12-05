import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { type ThemeColors } from "@/constants/theme";

type MonthYearPickerModalProps = {
  visible: boolean;
  currentDate: Date;
  colors: ThemeColors;
  onClose: () => void;
  onSelect: (date: Date) => void;
};

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

export function MonthYearPickerModal({
  visible,
  currentDate,
  colors,
  onClose,
  onSelect,
}: MonthYearPickerModalProps) {
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Reset to current date when modal opens
  React.useEffect(() => {
    if (visible) {
      setSelectedYear(currentDate.getFullYear());
    }
  }, [visible, currentDate]);

  const handleYearChange = (direction: "prev" | "next") => {
    setSelectedYear((prev) => (direction === "next" ? prev + 1 : prev - 1));
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(selectedYear, monthIndex, 1);
    onSelect(newDate);
    onClose();
  };

  const handleThisMonth = () => {
    const today = new Date();
    onSelect(today);
    onClose();
  };

  const isCurrentMonth = (monthIndex: number) => {
    const today = new Date();
    return (
      selectedYear === today.getFullYear() && monthIndex === today.getMonth()
    );
  };

  const isSelectedMonth = (monthIndex: number) => {
    return (
      selectedYear === currentDate.getFullYear() &&
      monthIndex === currentDate.getMonth()
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: colors.overlay }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: colors.card.DEFAULT,
            marginTop: "auto",
            marginBottom: "auto",
            marginHorizontal: 20,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: colors.foreground,
              }}
            >
              Date
            </Text>
            <TouchableOpacity
              onPress={handleThisMonth}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: colors.foreground,
                }}
              >
                THIS MONTH
              </Text>
              <MaterialIcons name="close" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Year Selection */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 24,
              gap: 16,
            }}
          >
            <TouchableOpacity onPress={() => handleYearChange("prev")}>
              <MaterialIcons
                name="chevron-left"
                size={28}
                color={colors.foreground}
              />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.foreground,
                minWidth: 80,
                textAlign: "center",
              }}
            >
              {selectedYear}
            </Text>
            <TouchableOpacity onPress={() => handleYearChange("next")}>
              <MaterialIcons
                name="chevron-right"
                size={28}
                color={colors.foreground}
              />
            </TouchableOpacity>
          </View>

          {/* Month Grid */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            {MONTHS.map((month, index) => {
              const isSelected = isSelectedMonth(index);
              const isCurrent = isCurrentMonth(index);

              return (
                <TouchableOpacity
                  key={month}
                  onPress={() => handleMonthSelect(index)}
                  style={{
                    width: "23%",
                    aspectRatio: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 8,
                    marginBottom: 12,
                    backgroundColor: isSelected
                      ? colors.primary.DEFAULT // Red highlight for selected month
                      : isCurrent
                        ? colors.primary.soft // Subtle red for current month
                        : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isSelected ? "bold" : "500",
                      color: isSelected
                        ? colors.primary.foreground
                        : colors.foreground,
                    }}
                  >
                    {month}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
