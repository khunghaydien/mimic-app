import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRegister } from '@/api';
import { AppButton, AppScreen, toast, useTheme } from '@/ui';

import { createAuthStyles } from '../authStyles';

export function RegisterScreen({ onOpenLogin }: { onOpenLogin: () => void }) {
  const { t } = useTranslation();
  const register = useRegister();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createAuthStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = () => {
    const nameValue = name.trim();
    const emailValue = email.trim();
    if (!nameValue) {
      toast.show('error', t('auth.errorName'));
      return;
    }
    if (!emailValue || !emailValue.includes('@')) {
      toast.show('error', t('auth.errorEmail'));
      return;
    }
    if (!password) {
      toast.show('error', t('auth.errorPassword'));
      return;
    }
    register.mutate({ name: nameValue, email: emailValue, password });
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
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.formScroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{t('auth.registerTitle')}</Text>

          <Text style={styles.label}>{t('auth.name')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
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
