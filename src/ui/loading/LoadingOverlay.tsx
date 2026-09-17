import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';

export function LoadingOverlay({ visible }: { visible: boolean }) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.cover}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cover: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
});
