import { useRef, useEffect, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { Category } from "@/types/category";
import { theme } from "@/constants/theme";

type CategoryActionSheetProps = {
  visible: boolean;
  category: Category | null;
  onClose: () => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

export function CategoryActionSheet({
  visible,
  category,
  onClose,
  onEdit,
  onDelete,
}: CategoryActionSheetProps) {
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
    if (category) {
      onEdit(category);
      onClose();
    }
  }, [category, onEdit, onClose]);

  const handleDelete = useCallback(() => {
    if (category) {
      onDelete(category);
      onClose();
    }
  }, [category, onDelete, onClose]);

  if (!category) return null;

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
            <View style={styles.headerContent}>
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: category.background_color },
                ]}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {category.name}
              </Text>
            </View>
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
                Edit Category
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
              <Text style={styles.deleteButtonText}>Delete Category</Text>
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
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 20,
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

