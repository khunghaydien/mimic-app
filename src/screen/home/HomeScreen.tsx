import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/api';
import { AppScreen, useTheme } from '@/ui';

export function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { colors } = useTheme();

  return (
    <AppScreen>
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '600', color: colors.text }}>
          {t('home.hello', { name: user!.name })}
        </Text>
      </View>
    </AppScreen>
  );
}
