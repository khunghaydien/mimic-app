import { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Override / extend default surface styles. */
  style?: ViewStyle;
  /** Override / extend default label styles. */
  labelStyle?: TextStyle;
  /** Extra a11y state (e.g. selected for option buttons). */
  accessibilityState?: { disabled?: boolean; selected?: boolean };
};

/** Core text button — other button variants compose on top of this. */
export function AppButton({
  label,
  onPress,
  disabled = false,
  style,
  labelStyle,
  accessibilityState,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, ...accessibilityState }}
      style={({ pressed }) => [
        styles.base,
        style,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, labelStyle]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    base: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      minWidth: 110,
      borderWidth: 1,
      borderRadius: 10,
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    pressed: {
      opacity: 0.75,
    },
    disabled: {
      opacity: 0.4,
    },
    label: {
      fontWeight: '600',
      fontSize: 15,
      color: colors.onPrimary,
    },
  });
}
