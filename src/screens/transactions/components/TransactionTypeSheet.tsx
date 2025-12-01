import { useRef, useEffect, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { TransactionType } from "@/types/transaction";

type TransactionTypeSheetProps = {
  visible: boolean;
  selectedType: TransactionType;
  onClose: () => void;
  onSelect: (type: TransactionType) => void;
};

const TRANSACTION_TYPES: {
  value: TransactionType;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}[] = [
  { value: "expense", label: "Expense", icon: "inbox" },
  { value: "income", label: "Income", icon: "add-circle-outline" },
  { value: "transfer", label: "Transfer", icon: "sync-alt" },
];

export function TransactionTypeSheet({
  visible,
  selectedType,
  onClose,
  onSelect,
}: TransactionTypeSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["60%"], []);

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

  const handleSelect = useCallback(
    (type: TransactionType) => {
      onSelect(type);
      onClose();
    },
    [onSelect, onClose]
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      onDismiss={handleDismiss}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: "#262626" }}
      handleIndicatorStyle={{ backgroundColor: "#525252" }}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={styles.container}>
        <Text style={styles.title}>Transaction type</Text>

        {TRANSACTION_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            onPress={() => handleSelect(type.value)}
            style={styles.typeOption}
          >
            <Text style={styles.typeLabel}>{type.label}</Text>
            {selectedType === type.value && (
              <MaterialIcons name="check-circle" size={24} color="#3b82f6" />
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity onPress={onClose} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save and close</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
    marginBottom: 24,
  },
  typeOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  typeLabel: {
    fontSize: 18,
    color: "white",
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: "white",
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "black",
  },
});

