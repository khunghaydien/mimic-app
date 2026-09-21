import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLogin } from '@/api';
import { toast } from '@/ui';

import { AuthField, AuthLayoutForm } from './AuthLayoutForm';

export const AuthScreenLogin = ({
  onOpenRegister,
}: {
  onOpenRegister: () => void;
}) => {
  const { t } = useTranslation();
  const login = useLogin();
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
    <AuthLayoutForm
      title={t('app.name')}
      actionLabel={t('auth.login')}
      actionDisabled={login.isPending}
      onAction={onSubmit}
      linkLabel={t('auth.goRegister')}
      onLink={onOpenRegister}
    >
      <AuthField
        label={t('auth.email')}
        value={email}
        onChange={setEmail}
        placeholder={t('auth.emailPlaceholder')}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
      />
      <AuthField
        label={t('auth.password')}
        value={password}
        onChange={setPassword}
        placeholder={t('auth.passwordPlaceholder')}
        secureTextEntry
      />
    </AuthLayoutForm>
  );
};
