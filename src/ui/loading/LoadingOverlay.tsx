import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';

export const LoadingOverlay = ({ visible }: { visible: boolean }) => {
  const { colors } = useTheme();
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={[styles.cover, { backgroundColor: colors.overlay }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  cover: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
