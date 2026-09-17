import { memo } from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/api';
import { AppScreen, useTheme } from '@/ui';

export const HomeScreen = memo(function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { colors } = useTheme();

  return (
    <AppScreen>
      <Text
        style={{
          paddingHorizontal: 16,
          fontSize: 20,
          fontWeight: '600',
          color: colors.text,
        }}
      >
        {t('home.hello', { name: user!.name })}
      </Text>
    </AppScreen>
  );
});
