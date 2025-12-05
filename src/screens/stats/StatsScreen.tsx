import { useState, useMemo } from "react";
import {
  ScrollView,
  RefreshControl,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { PieChart } from "react-native-gifted-charts";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { useThemeColors } from "@/constants/theme";
import { useStatsData } from "./hooks/useStatsData";
import { DateRangeFilter } from "@/screens/transactions/utils/dateRange";
import { formatAmount } from "@/screens/transactions/utils/formatting";
import { CategoryStat } from "./hooks/useStatsData";
import { Text as SvgText } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function StatsScreen() {
  const colors = useThemeColors();
  const { session } = useSupabaseSession();

  const [period, setPeriod] = useState<DateRangeFilter>("month");
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [selectedType, setSelectedType] = useState<"income" | "expense">(
    "expense"
  );
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  const { statsData, loading, refreshing, handleRefresh } = useStatsData(
    session,
    period,
    referenceDate
  );

  const currentStats = useMemo(
    () =>
      selectedType === "income"
        ? statsData.incomeStats
        : statsData.expenseStats,
    [selectedType, statsData]
  );

  const totalAmount = useMemo(
    () =>
      selectedType === "income"
        ? statsData.totalIncome
        : statsData.totalExpense,
    [selectedType, statsData]
  );

  // Prepare pie chart data
  const pieData = useMemo(() => {
    if (currentStats.length === 0) return [];

    return currentStats.map((stat, index) => ({
      value: stat.percentage,
      color: stat.categoryColor,
      text: `${formatAmount(stat.totalAmount, stat.currency)}`,
      // text: `${stat.percentage.toFixed(1)}%`,
      label: `${stat.categoryEmoji} ${stat.categoryName}`,
      focused: index === 0,
      gradientCenterColor: stat.categoryColor,
    }));
  }, [currentStats]);

  const handlePreviousPeriod = () => {
    const newDate = new Date(referenceDate);
    if (period === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (period === "year") {
      newDate.setFullYear(newDate.getFullYear() - 1);
    }
    setReferenceDate(newDate);
  };

  const handleNextPeriod = () => {
    const newDate = new Date(referenceDate);
    if (period === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (period === "year") {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setReferenceDate(newDate);
  };

  const formatPeriodLabel = () => {
    if (period === "month") {
      return referenceDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } else if (period === "year") {
      return referenceDate.getFullYear().toString();
    }
    return "";
  };

  const periodOptions: { label: string; value: DateRangeFilter }[] = [
    { label: "Monthly", value: "month" },
    { label: "Annually", value: "year" },
  ];

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background.DEFAULT }}
      edges={["top"]}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary.DEFAULT}
          />
        }
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-4">
            {/* Period Navigation */}
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={handlePreviousPeriod}
                className="p-2"
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="chevron-left"
                  size={24}
                  color={colors.foreground}
                />
              </TouchableOpacity>
              <Text
                className="text-lg font-semibold"
                style={{ color: colors.foreground }}
              >
                {formatPeriodLabel()}
              </Text>
              <TouchableOpacity
                onPress={handleNextPeriod}
                className="p-2"
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={colors.foreground}
                />
              </TouchableOpacity>
            </View>

            {/* Period Selector */}
            <TouchableOpacity
              onPress={() => setShowPeriodModal(true)}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-md"
              style={{ backgroundColor: colors.background.subtle }}
              activeOpacity={0.7}
            >
              <Text
                className="text-sm font-medium"
                style={{ color: colors.foreground }}
              >
                {period === "month" ? "Monthly" : "Annually"}
              </Text>
              <MaterialIcons
                name="arrow-drop-down"
                size={20}
                color={colors.foreground}
              />
            </TouchableOpacity>
          </View>

          {/* Income/Expense Toggle */}
          <View
            className="flex-row gap-2 mb-4 p-1 rounded-lg"
            style={{ backgroundColor: colors.background.subtle }}
          >
            <TouchableOpacity
              onPress={() => setSelectedType("income")}
              className="flex-1 py-2 px-4 rounded-md items-center"
              style={{
                backgroundColor:
                  selectedType === "income"
                    ? colors.primary.DEFAULT
                    : "transparent",
              }}
              activeOpacity={0.7}
            >
              <Text
                className="text-sm font-semibold"
                style={{
                  color:
                    selectedType === "income"
                      ? colors.primary.foreground
                      : colors.muted.foreground,
                }}
              >
                Income
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedType("expense")}
              className="flex-1 py-2 px-4 rounded-md items-center"
              style={{
                backgroundColor:
                  selectedType === "expense"
                    ? colors.destructive.DEFAULT
                    : "transparent",
              }}
              activeOpacity={0.7}
            >
              <Text
                className="text-sm font-semibold"
                style={{
                  color:
                    selectedType === "expense"
                      ? colors.destructive.foreground
                      : colors.muted.foreground,
                }}
              >
                Expense
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pie Chart */}
        {currentStats.length > 0 ? (
          <View
            className="items-center"
            // style={{ backgroundColor: colors.background.subtle }}
          >
            <PieChart
              data={pieData}
              radius={100}
              
              // Text
              showText
              textSize={10}
              textColor={colors.foreground}
              
              // Stroke
              strokeWidth={2}
              strokeColor={colors.background.DEFAULT}
              
              // External Labels
              extraRadius={80}
              showExternalLabels
              showValuesAsLabels
              labelsPosition="mid"
              externalLabelComponent={(item: any) => {
                return (
                  <SvgText
                    fontSize={11}
                    fontWeight="800"
                    fill={colors.foreground}
                  >
                    {item?.label}
                  </SvgText>
                );
              }}
              labelLineConfig={{
                // length: 8,
                tailLength: 16,
                color: colors.muted.foreground,
                thickness: 1,
                labelComponentWidth: 42,
                // ⬇️ THIS is the main fix
                avoidOverlappingOfLabels: true,
              }}
            />
          </View>
        ) : (
          <View className="items-center py-12">
            <MaterialIcons
              name="pie-chart"
              size={64}
              color={colors.muted.foreground}
            />
            <Text
              className="text-base mt-4"
              style={{ color: colors.muted.foreground }}
            >
              No {selectedType} data available
            </Text>
          </View>
        )}

        {/* Category List */}
        {currentStats.length > 0 && (
          <View className="px-4">
            <Text
              className="text-lg font-semibold mb-3"
              style={{ color: colors.foreground }}
            >
              Category Breakdown
            </Text>
            {currentStats.map((stat, index) => (
              <CategoryListItem
                key={stat.categoryId || `uncategorized-${index}`}
                stat={stat}
                colors={colors}
                currency={statsData.currency}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Period Modal */}
      <Modal
        visible={showPeriodModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPeriodModal(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.overlay,
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={() => setShowPeriodModal(false)}
        >
          <View
            style={{
              backgroundColor: colors.card.DEFAULT,
              borderRadius: 12,
              padding: 20,
              minWidth: 200,
            }}
          >
            {periodOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  setPeriod(option.value);
                  setShowPeriodModal(false);
                }}
                className="py-3 px-4 rounded-md"
                style={{
                  backgroundColor:
                    period === option.value
                      ? colors.primary.soft
                      : "transparent",
                }}
                activeOpacity={0.7}
              >
                <Text
                  className="text-base font-medium"
                  style={{
                    color:
                      period === option.value
                        ? colors.primary.DEFAULT
                        : colors.foreground,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

interface CategoryListItemProps {
  stat: CategoryStat;
  colors: ReturnType<typeof useThemeColors>;
  currency: string;
}

function CategoryListItem({ stat, colors, currency }: CategoryListItemProps) {
  return (
    <View
      className="flex-row items-center justify-between py-3 px-4 mb-2 rounded-lg"
      style={{ backgroundColor: colors.background.subtle }}
    >
      <View className="flex-row items-center gap-3 flex-1">
        {/* Percentage Box */}
        <View
          className="w-12 h-12 rounded-md items-center justify-center"
          style={{ backgroundColor: stat.categoryColor }}
        >
          <Text className="text-xs font-bold text-white">
            {Math.round(stat.percentage)}%
          </Text>
        </View>

        {/* Category Info */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-base">{stat.categoryEmoji}</Text>
            <Text
              className="text-base font-medium flex-1"
              style={{ color: colors.foreground }}
              numberOfLines={1}
            >
              {stat.categoryName}
            </Text>
          </View>
        </View>
      </View>

      {/* Amount */}
      <Text
        className="text-base font-semibold ml-2"
        style={{ color: colors.foreground }}
      >
        {formatAmount(stat.totalAmount, currency)}
      </Text>
    </View>
  );
}
