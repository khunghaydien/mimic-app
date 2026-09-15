import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import { AuthProvider, QueryProvider, useAuth } from '@/api';
import { loadSavedLanguage } from '@/i18n';
import { type ModuleId } from '@/modules';
import { HomeScreen, LoginScreen, SettingScreen } from '@/screen';
import {
  AppHeader,
  TabFooter,
  ThemeProvider,
  ToastProvider,
  useTheme,
} from '@/ui';

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
              <AppRoot />
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppRoot() {
  const { user, ready } = useAuth();
  const { colors, mode } = useTheme();

  useEffect(() => {
    void loadSavedLanguage();
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.background,
        },
      }),
    [colors.background],
  );

  return (
    <View style={styles.root}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      {ready ? (user ? <AppShell /> : <LoginScreen />) : null}
    </View>
  );
}

function AppShell() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [activeId, setActiveId] = useState<ModuleId>('home');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          flex: 1,
          backgroundColor: colors.background,
        },
      }),
    [colors.background],
  );

  return (
    <>
      <AppHeader
        title={activeId === 'home' ? t('app.name') : t(`${activeId}.title`)}
        onOpenSetting={() => setActiveId('setting')}
      />
      <View style={styles.content}>
        {activeId === 'home' ? <HomeScreen /> : null}
        {activeId === 'setting' ? <SettingScreen /> : null}
      </View>
      <TabFooter activeId={activeId} onSelect={setActiveId} />
    </>
  );
}
