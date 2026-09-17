import { StyleSheet } from 'react-native';

import { useTheme } from '@/ui';

export function createAuthStyles(
  colors: ReturnType<typeof useTheme>['colors'],
) {
  return StyleSheet.create({
    screen: {
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    container: {
      flex: 1,
      justifyContent: 'center',
    },
    form: {
      gap: 8,
    },
    formScroll: {
      flexGrow: 1,
      justifyContent: 'center',
      gap: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 16,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
      marginTop: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      color: colors.text,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
    },
    submit: {
      marginTop: 20,
      alignSelf: 'stretch',
      minWidth: undefined,
    },
    link: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    linkText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
  });
}
