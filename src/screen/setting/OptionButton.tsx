import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { AppButton, useTheme } from '@/ui';

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

/** Setting option — built on AppButton core with selected surface. */
export function OptionButton({ label, selected = false, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <AppButton
      label={label}
      onPress={onPress}
      style={selected ? styles.selected : styles.default}
      labelStyle={selected ? styles.labelSelected : styles.labelDefault}
      accessibilityState={{ selected }}
    />
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    default: {
      backgroundColor: colors.background,
      borderColor: colors.border,
    },
    selected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    labelDefault: {
      color: colors.text,
    },
    labelSelected: {
      color: colors.onPrimary,
    },
  });
}
