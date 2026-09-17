import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLogin } from '@/api';
import { AppButton, AppScreen, toast, useTheme } from '@/ui';

import { createAuthStyles } from '../authStyles';

export function LoginScreen({ onOpenRegister }: { onOpenRegister: () => void }) {
  const { t } = useTranslation();
  const login = useLogin();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createAuthStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      toast.show('error', t('auth.errorRequired'));
      return;
    }
    if (!trimmedEmail.includes('@')) {
      toast.show('error', t('auth.errorEmail'));
      return;
    }
    login.mutate({ email: trimmedEmail, password });
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
        style={styles.form}
      >
        <Text style={styles.title}>{t('app.name')}</Text>

        <Text style={styles.label}>{t('auth.email')}</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder={t('auth.emailPlaceholder')}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>{t('auth.password')}</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder={t('auth.passwordPlaceholder')}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <AppButton
          label={t('auth.login')}
          onPress={onSubmit}
          disabled={login.isPending}
          style={styles.submit}
        />

        <Pressable onPress={onOpenRegister} style={styles.link}>
          <Text style={styles.linkText}>{t('auth.goRegister')}</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}
