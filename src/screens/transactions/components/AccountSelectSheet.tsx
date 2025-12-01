import { useRef, useEffect, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { Account } from "@/types/account";

type AccountSelectSheetProps = {
  visible: boolean;
  accounts: Account[];
  selectedAccountId: string | null;
  title?: string;
  excludeAccountId?: string | null;
  onClose: () => void;
  onSelect: (account: Account) => void;
};

export function AccountSelectSheet({
  visible,
  accounts,
  selectedAccountId,
  title = "Select Account",
  excludeAccountId,
  onClose,
  onSelect,
}: AccountSelectSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["50%"], []);

  const filteredAccounts = useMemo(() => {
    if (excludeAccountId) {
      return accounts.filter((account) => account.id !== excludeAccountId);
    }
    return accounts;
  }, [accounts, excludeAccountId]);

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
    (account: Account) => {
      onSelect(account);
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
        <Text style={styles.title}>{title}</Text>

        <View style={styles.accountsList}>
          {filteredAccounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              onPress={() => handleSelect(account)}
              style={styles.accountOption}
            >
              <View style={styles.accountInfo}>
                <MaterialIcons
                  name="account-balance-wallet"
                  size={24}
                  color="white"
                  style={{ marginRight: 12 }}
                />
                <Text style={styles.accountName}>{account.name}</Text>
              </View>
              {selectedAccountId === account.id && (
                <MaterialIcons name="check-circle" size={24} color="#3b82f6" />
              )}
            </TouchableOpacity>
          ))}
        </View>

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
  accountsList: {
    flex: 1,
  },
  accountOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  accountName: {
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

