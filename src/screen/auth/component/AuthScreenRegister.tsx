import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useRegister } from '@/api';
import { toast } from '@/ui';

import { AuthField, AuthLayoutForm } from './AuthLayoutForm';

export const AuthScreenRegister = ({
  onOpenLogin,
}: {
  onOpenLogin: () => void;
}) => {
  const { t } = useTranslation();
  const register = useRegister();
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
    <AuthLayoutForm
      title={t('auth.registerTitle')}
      actionLabel={t('auth.register')}
      actionDisabled={register.isPending}
      onAction={onSubmit}
      linkLabel={t('auth.goLogin')}
      onLink={onOpenLogin}
    >
      <AuthField
        label={t('auth.name')}
        value={name}
        onChange={setName}
        placeholder={t('auth.namePlaceholder')}
        autoCapitalize="words"
      />
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
