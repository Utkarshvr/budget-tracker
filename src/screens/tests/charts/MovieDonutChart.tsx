import { FA6Style } from "@expo/vector-icons/build/FontAwesome6";
import React from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { Text as SvgText } from "react-native-svg";

const categories = [
  { label: "Other", value: 53.8, color: "#FF6F61" },
  { label: "Health", value: 25.8, color: "#FFA726" },
  { label: "Gift", value: 5.6, color: "#FFEB3B" },
  { label: "Apparel", value: 5.2, color: "#64B5F6" },
  { label: "Education", value: 3.7, color: "#81C784" },
  { label: "Food", value: 3.5, color: "#AED581" },
  { label: "Transport", value: 2.4, color: "#4DD0E1" },
];

// Chart data → short labels only
const chartData = categories.map((c) => ({
  value: c.value,
  color: c.color,
  label: `${c.label}`, // ONLY percentage near the chart
  text: `${c.value}%`, // ONLY percentage near the chart
}));

const DonutWithLegend = () => {
  const { width } = useWindowDimensions();
  const radius = width * 0.28;
  const innerRadius = radius * 0.6;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Donut */}
      <View
        style={{
          paddingTop: 20,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <PieChart
          data={chartData}
          radius={radius}
          showExternalLabels
          // push labels a bit further out
          extraRadius={100}
          labelLineConfig={{
            length: 8,
            tailLength: 16,
            color: "#AAA",
            thickness: 1,
            labelComponentWidth: 42,
            // ⬇️ THIS is the main fix
            avoidOverlappingOfLabels: true,
          }}
          externalLabelComponent={(item) => (
            <SvgText
              fontSize={9}
              fontWeight="600"
              fill="#FFF"
              dy={3}
              textAnchor="middle"
            >
              {item?.text}
            </SvgText>
          )}
        />
      </View>

      {/* Legend */}
      <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
        {categories.map((cat, index) => (
          <View
            key={index}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: cat.color,
                marginRight: 10,
              }}
            />
            <Text style={{ color: "#FFF", fontSize: 14, flex: 1 }}>
              {cat.label}
            </Text>
            <Text style={{ color: "#BBB", fontSize: 14 }}>{cat.value}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default DonutWithLegend;
