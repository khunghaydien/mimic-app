import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/api';
import { AppScreen, useTheme } from '@/ui';

export function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <AppScreen>
      <View style={styles.content}>
        <Text style={styles.hello}>
          {t('home.hello', { name: user?.name ?? '' })}
        </Text>
      </View>
    </AppScreen>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    content: {
      paddingHorizontal: 16,
    },
    hello: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
  });
}
