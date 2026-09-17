import { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type View as RNView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/api';
import { IconButton } from '../button';
import { BackIcon, HomeIcon, MenuIcon, LogoutIcon, SettingIcon } from '../icon';
import { useTheme } from '../theme';

type Props = {
  title: string;
  onOpenSetting: () => void;
  onHome?: () => void;
  onBack?: () => void;
};

type Anchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const MENU_WIDTH = 260;
const MENU_GAP = 6;

export function AppHeader({ title, onOpenSetting, onHome, onBack }: Props) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { name, email, avatarUrl } = user!;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const menuBtnRef = useRef<RNView>(null);

  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const closeMenu = () => {
    setMenuOpen(false);
    setAnchor(null);
  };

  const openMenu = () => {
    menuBtnRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setMenuOpen(true);
    });
  };

  const menuStyle = anchor
    ? {
        top: anchor.y + anchor.height + MENU_GAP,
        right: Math.max(
          8,
          Dimensions.get('window').width - (anchor.x + anchor.width),
        ),
      }
    : null;

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.side}>
        {onBack ? (
          <IconButton label={t('header.back')} onPress={onBack}>
            <BackIcon color={colors.text} />
          </IconButton>
        ) : onHome ? (
          <IconButton label={t('tabs.home')} onPress={onHome}>
            <HomeIcon color={colors.text} />
          </IconButton>
        ) : null}
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View ref={menuBtnRef} collapsable={false} style={styles.side}>
        <IconButton
          label={t('header.menu')}
          onPress={openMenu}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <MenuIcon color={colors.text} />
        </IconButton>
      </View>

      <Modal
        visible={menuOpen && anchor != null}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
          {menuStyle ? (
            <View style={[styles.menu, menuStyle]}>
              <View style={styles.userRow}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                )}
                <View style={styles.userMeta}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {email}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Pressable
                onPress={() => {
                  closeMenu();
                  onOpenSetting();
                }}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <SettingIcon color={colors.text} />
                <Text style={styles.menuItemLabel}>{t('header.setting')}</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  closeMenu();
                  void logout();
                }}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <LogoutIcon color={colors.danger} />
                <Text style={[styles.menuItemLabel, styles.logoutLabel]}>
                  {t('header.logout')}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingBottom: 8,
      backgroundColor: colors.background,
      zIndex: 2,
    },
    side: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    pressed: {
      opacity: 0.65,
    },
    backdrop: {
      flex: 1,
    },
    menu: {
      position: 'absolute',
      width: MENU_WIDTH,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.background,
      paddingVertical: 8,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 16,
    },
    avatarFallback: {
      width: 44,
      height: 44,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    avatarText: {
      color: colors.onPrimary,
      fontWeight: '700',
      fontSize: 15,
    },
    userMeta: {
      flex: 1,
      gap: 2,
    },
    userName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    userEmail: {
      fontSize: 13,
      color: colors.textMuted,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    menuItemLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    logoutLabel: {
      color: colors.danger,
    },
  });
}
