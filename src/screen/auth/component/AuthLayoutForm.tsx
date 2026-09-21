import { useMemo, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type KeyboardTypeOptions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, AppScreen, useTheme } from '@/ui';

export const AuthLayoutForm = ({
  title,
  actionLabel,
  actionDisabled,
  onAction,
  linkLabel,
  onLink,
  children,
}: {
  title: string;
  actionLabel: string;
  actionDisabled: boolean;
  onAction: () => void;
  linkLabel: string;
  onLink: () => void;
  children: ReactNode;
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <AppScreen
      style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <KeyboardAvoidingView
        behavior={
          {
            ios: 'padding' as const,
            android: undefined,
            web: undefined,
            macos: undefined,
            windows: undefined,
          }[Platform.OS]
        }
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{title}</Text>
          {children}
          <AppButton
            label={actionLabel}
            onPress={onAction}
            disabled={actionDisabled}
            style={styles.submit}
          />
          <Pressable onPress={onLink} style={styles.link}>
            <Text style={styles.linkText}>{linkLabel}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
};

export const AuthField = ({
  label,
  value,
  onChange,
  placeholder,
  secureTextEntry,
  autoCapitalize,
  autoCorrect,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'words';
  autoCorrect?: boolean;
  keyboardType?: KeyboardTypeOptions;
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
      />
    </>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    screen: {
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    container: {
      flex: 1,
      justifyContent: 'center',
    },
    form: {
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
