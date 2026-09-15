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
import { MenuIcon, LogoutIcon, SettingIcon } from '../icon';
import { useTheme } from '../theme';

type Props = {
  title: string;
  onOpenSetting: () => void;
};

type Anchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const MENU_WIDTH = 260;
const MENU_GAP = 6;

export function AppHeader({ title, onOpenSetting }: Props) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const menuBtnRef = useRef<RNView>(null);

  const initials = (user?.name ?? '?')
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

  const onSetting = () => {
    closeMenu();
    onOpenSetting();
  };

  const onLogout = () => {
    closeMenu();
    void logout();
  };

  const windowWidth = Dimensions.get('window').width;
  const menuStyle = anchor
    ? {
        top: anchor.y + anchor.height + MENU_GAP,
        right: Math.max(8, windowWidth - (anchor.x + anchor.width)),
      }
    : null;

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View ref={menuBtnRef} collapsable={false}>
        <Pressable
          onPress={openMenu}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('header.menu')}
        >
          <MenuIcon color={colors.text} />
        </Pressable>
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
                {user?.avatarUrl ? (
                  <Image
                    source={{ uri: user.avatarUrl }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                )}
                <View style={styles.userMeta}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.name}
                  </Text>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {user?.email}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Pressable
                onPress={onSetting}
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
                onPress={onLogout}
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
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      zIndex: 2,
    },
    title: {
      flex: 1,
      fontSize: 22,
      fontWeight: '700',
      color: colors.primary,
      marginRight: 12,
    },
    iconBtn: {
      padding: 8,
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
