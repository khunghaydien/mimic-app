import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/api';
import { AppButton, AppScreen, toast, useTheme } from '@/ui';

type Props = {
  onOpenLogin: () => void;
};

export function RegisterScreen({ onOpenLogin }: Props) {
  const { t } = useTranslation();
  const { register } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || trimmedName.length > 100) {
      toast.show('error', t('auth.errorName'));
      return;
    }
    if (
      !trimmedEmail ||
      !trimmedEmail.includes('@') ||
      trimmedEmail.length > 255
    ) {
      toast.show('error', t('auth.errorEmail'));
      return;
    }
    if (password.length < 8 || password.length > 72) {
      toast.show('error', t('auth.errorPassword'));
      return;
    }

    register.mutate({
      name: trimmedName,
      email: trimmedEmail,
      password,
    });
  };

  return (
    <AppScreen
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.wrap}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{t('auth.registerTitle')}</Text>

          <Text style={styles.label}>{t('auth.name')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            maxLength={100}
            placeholder={t('auth.namePlaceholder')}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          <Text style={styles.label}>{t('auth.email')}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            maxLength={255}
            placeholder={t('auth.emailPlaceholder')}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          <Text style={styles.label}>{t('auth.password')}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            maxLength={72}
            placeholder={t('auth.passwordPlaceholder')}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          <AppButton
            label={t('auth.register')}
            onPress={onSubmit}
            disabled={register.isPending}
            style={styles.submit}
          />

          <Pressable onPress={onOpenLogin} style={styles.link}>
            <Text style={styles.linkText}>{t('auth.goLogin')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    screen: {
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    wrap: {
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
}
