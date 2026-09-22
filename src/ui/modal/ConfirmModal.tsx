import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../button';
import { useTheme } from '../theme';

export const ConfirmModal = ({
  title,
  message,
  cancelLabel,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <AppButton
              label={cancelLabel}
              onPress={onClose}
              style={styles.cancel}
              labelStyle={styles.cancelLabel}
            />
            <AppButton label={confirmLabel} onPress={onConfirm} style={styles.confirm} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      backgroundColor: colors.overlay,
    },
    sheet: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12 },
    title: { fontSize: 18, fontWeight: '700', color: colors.text },
    message: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    actions: { flexDirection: 'row', gap: 8 },
    cancel: {
      flex: 1,
      minWidth: undefined,
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    cancelLabel: { color: colors.text },
    confirm: { flex: 1, minWidth: undefined },
  });
};
