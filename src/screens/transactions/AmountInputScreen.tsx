import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type AmountInputScreenProps = {
  visible: boolean;
  onClose: () => void;
  onContinue: (amount: string) => void;
};

export default function AmountInputScreen({
  visible,
  onClose,
  onContinue,
}: AmountInputScreenProps) {
  // Integer and decimal parts managed separately
  const [integerPart, setIntegerPart] = useState("0"); // e.g. "123"
  const [hasDecimal, setHasDecimal] = useState(false);
  const [decimalPart, setDecimalPart] = useState(""); // "", "1", or "12"

  const amountString = useMemo(() => {
    const intStr = integerPart || "0";
    if (!hasDecimal) {
      return `${intStr}.00`;
    }
    const paddedDecimal =
      decimalPart.length === 0
        ? "00"
        : decimalPart.length === 1
          ? `${decimalPart}0`
          : decimalPart.slice(0, 2);
    return `${intStr}.${paddedDecimal}`;
  }, [integerPart, hasDecimal, decimalPart]);

  const numericAmount = useMemo(() => parseFloat(amountString), [amountString]);
  const handleNumberPress = (num: string) => {
    if (!hasDecimal) {
      // Before decimal: build the integer part
      if (integerPart === "0") {
        setIntegerPart(num);
      } else {
        setIntegerPart(integerPart + num);
      }
    } else {
      // After decimal: allow up to 2 digits
      if (decimalPart.length < 2) {
        setDecimalPart(decimalPart + num);
      }
    }
  };

  const handleBackspace = () => {
    // Nothing to delete
    if (integerPart === "0" && !hasDecimal) return;

    if (hasDecimal) {
      if (decimalPart.length > 0) {
        // Delete decimal digits first
        setDecimalPart(decimalPart.slice(0, -1));
        return;
      }
      // No decimal digits left: remove decimal point itself
      setHasDecimal(false);
      return;
    }

    // Delete from integer part
    if (integerPart.length <= 1) {
      setIntegerPart("0");
    } else {
      setIntegerPart(integerPart.slice(0, -1));
    }
  };

  const handleDecimal = () => {
    if (!hasDecimal) {
      setHasDecimal(true);
      setDecimalPart("");
    }
  };

  const handleContinue = () => {
    if (numericAmount > 0) {
      onContinue(amountString);
      // Reset for next time
      setIntegerPart("0");
      setHasDecimal(false);
      setDecimalPart("");
    }
  };

  const handleClose = () => {
    // Reset on close
    setIntegerPart("0");
    setHasDecimal(false);
    setDecimalPart("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black">
        {/* Header */}
        <View className="flex-row items-center justify-end px-6 pt-14 pb-6">
          <TouchableOpacity onPress={handleClose}>
            <MaterialIcons name="close" size={32} color="white" />
          </TouchableOpacity>
        </View>

        {/* Amount Display */}
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-7xl font-bold">
            <Text
              className={
                integerPart === "0" && !hasDecimal
                  ? "text-neutral-500"
                  : "text-white"
              }
            >
              ₹{/* Integer part */}
              {integerPart}
            </Text>
            {/* Decimal part, only after user taps "." */}
            {hasDecimal && (
              <>
                <Text className="text-white">.</Text>
                {/* first decimal digit */}
                <Text
                  className={
                    decimalPart.length >= 1 ? "text-white" : "text-neutral-500"
                  }
                >
                  {decimalPart[0] ?? "0"}
                </Text>
                {/* second decimal digit */}
                <Text
                  className={
                    decimalPart.length === 2 ? "text-white" : "text-neutral-500"
                  }
                >
                  {decimalPart[1] ?? "0"}
                </Text>
              </>
            )}
          </Text>
        </View>

        {/* Custom Numpad */}
        <View className="pb-8 px-6">
          <View className="flex-row justify-between mb-4">
            <NumpadButton text="1" onPress={() => handleNumberPress("1")} />
            <NumpadButton text="2" onPress={() => handleNumberPress("2")} />
            <NumpadButton text="3" onPress={() => handleNumberPress("3")} />
          </View>

          <View className="flex-row justify-between mb-4">
            <NumpadButton text="4" onPress={() => handleNumberPress("4")} />
            <NumpadButton text="5" onPress={() => handleNumberPress("5")} />
            <NumpadButton text="6" onPress={() => handleNumberPress("6")} />
          </View>

          <View className="flex-row justify-between mb-4">
            <NumpadButton text="7" onPress={() => handleNumberPress("7")} />
            <NumpadButton text="8" onPress={() => handleNumberPress("8")} />
            <NumpadButton text="9" onPress={() => handleNumberPress("9")} />
          </View>

          <View className="flex-row justify-between mb-6">
            <NumpadButton text="." onPress={handleDecimal} />
            <NumpadButton text="0" onPress={() => handleNumberPress("0")} />
            <NumpadButton icon="backspace" onPress={handleBackspace} />
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            onPress={handleContinue}
            disabled={numericAmount <= 0}
            className={`rounded-full py-4 ${
              numericAmount > 0 ? "bg-green-500" : "bg-neutral-800"
            }`}
          >
            <Text
              className={`text-center text-lg font-semibold ${
                numericAmount > 0 ? "text-black" : "text-neutral-500"
              }`}
            >
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

type NumpadButtonProps = {
  text?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
};

function NumpadButton({ text, icon, onPress }: NumpadButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-[30%] aspect-square items-center justify-center"
      activeOpacity={0.6}
    >
      {icon ? (
        <MaterialIcons name={icon} size={28} color="white" />
      ) : (
        <Text className="text-white text-3xl font-normal">{text}</Text>
      )}
    </TouchableOpacity>
  );
}
