import { useMemo, type ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MODULES, type ModuleId } from '@/modules';
import { HomeIcon, LibraryIcon, PracticeIcon, SettingIcon } from '../icon';
import type { IconProps } from '../icon/types';
import { useTheme } from '../theme';

const TAB_ICONS: Record<ModuleId, ComponentType<IconProps>> = {
  home: HomeIcon,
  library: LibraryIcon,
  practice: PracticeIcon,
  setting: SettingIcon,
};

type Props = {
  activeTab: ModuleId;
  onSelect: (id: ModuleId) => void;
};

export const TabFooter = ({ activeTab, onSelect }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
      {MODULES.map((id) => {
        const active = id === activeTab;
        const iconColor = active ? colors.primary : colors.footerInactive;
        const Icon = TAB_ICONS[id];

        return (
          <Pressable
            key={id}
            onPress={() => onSelect(id)}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={t(`tabs.${id}`)}
          >
            <Icon color={iconColor} />
            <Text style={[styles.label, { color: iconColor }]}>
              {t(`tabs.${id}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => {
  return StyleSheet.create({
    footer: {
      flexDirection: 'row',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    item: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
    },
    pressed: {
      opacity: 0.6,
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
    },
  });
};
