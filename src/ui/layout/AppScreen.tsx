import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme';

type ScreenProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Shared screen chrome: full-bleed background. */
export function AppScreen({ children, style }: ScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return <View style={[styles.screen, style]}>{children}</View>;
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      paddingVertical: 16,
    },
  });
}
