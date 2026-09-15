import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  setAppLanguage,
  type AppLanguage,
} from '@/i18n';
import { AppScreen, PRIMARY_PRESETS, useTheme } from '@/ui';

import { ColorButton } from './ColorButton';
import { OptionButton } from './OptionButton';

export function SettingScreen() {
  const { t, i18n } = useTranslation();
  const { mode, setMode, primaryId, setPrimaryId, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const language = (i18n.language?.startsWith('vi') ? 'vi' : 'en') as AppLanguage;

  return (
    <AppScreen>
      <View style={styles.content}>
        <View style={styles.block}>
          <Text style={styles.section}>{t('setting.appearance')}</Text>
          <View style={styles.row}>
            <OptionButton
              label={t('setting.light')}
              selected={mode === 'light'}
              onPress={() => setMode('light')}
            />
            <OptionButton
              label={t('setting.dark')}
              selected={mode === 'dark'}
              onPress={() => setMode('dark')}
            />
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.section}>{t('setting.primarySection')}</Text>
          <View style={styles.swatchRow}>
            {PRIMARY_PRESETS.map((preset) => (
              <ColorButton
                key={preset.id}
                color={preset.hex}
                label={t(preset.labelKey)}
                selected={primaryId === preset.id}
                onPress={() => setPrimaryId(preset.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.section}>{t('setting.languageSection')}</Text>
          <View style={styles.row}>
            <OptionButton
              label={t('setting.vietnamese')}
              selected={language === 'vi'}
              onPress={() => void setAppLanguage('vi')}
            />
            <OptionButton
              label={t('setting.english')}
              selected={language === 'en'}
              onPress={() => void setAppLanguage('en')}
            />
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    content: {
      paddingHorizontal: 16,
      gap: 24,
    },
    block: {
      gap: 16,
    },
    section: {
      fontSize: 13,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontWeight: '700',
      color: colors.textMuted,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    swatchRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      width: '100%',
    },
  });
}
