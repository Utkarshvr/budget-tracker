import { useRef, useEffect, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { Account } from "@/types/account";
import { theme } from "@/constants/theme";

type AccountActionSheetProps = {
  visible: boolean;
  account: Account | null;
  onClose: () => void;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
};

export function AccountActionSheet({
  visible,
  account,
  onClose,
  onEdit,
  onDelete,
}: AccountActionSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["40%"], []);

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

  const handleEdit = useCallback(() => {
    if (account) {
      onEdit(account);
      onClose();
    }
  }, [account, onEdit, onClose]);

  const handleDelete = useCallback(() => {
    if (account) {
      onDelete(account);
      onClose();
    }
  }, [account, onDelete, onClose]);

  if (!account) return null;

  const colors = theme.colors;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      onDismiss={handleDismiss}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: colors.background.subtle }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
      backdropComponent={renderBackdrop}
      enableHandlePanningGesture={true}
      enableContentPanningGesture={true}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.contentWrapper}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {account.name}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: colors.background.DEFAULT },
              ]}
            >
              <MaterialIcons name="close" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              onPress={handleEdit}
              style={[
                styles.actionButton,
                { backgroundColor: colors.background.DEFAULT },
              ]}
            >
              <MaterialIcons
                name="edit"
                size={20}
                color={colors.foreground}
                style={styles.actionIcon}
              />
              <Text style={[styles.actionText, { color: colors.foreground }]}>
                Edit Account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              style={[
                styles.actionButton,
                styles.deleteButton,
                { backgroundColor: colors.destructive.DEFAULT },
              ]}
            >
              <MaterialIcons
                name="delete"
                size={20}
                color="#ffffff"
                style={styles.actionIcon}
              />
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  contentWrapper: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  deleteButton: {
    marginTop: 4,
  },
  actionIcon: {
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});

