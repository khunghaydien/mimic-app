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
import {
  HomeScreen,
  LibraryScreen,
  LoginScreen,
  RegisterScreen,
  SettingScreen,
} from '@/screen';
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
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const styles = useMemo(
    () => createStyles(colors.background),
    [colors.background],
  );

  useEffect(() => {
    void loadSavedLanguage();
  }, []);

  useEffect(() => {
    if (user) setAuthScreen('login');
  }, [user]);

  return (
    <View style={styles.fill}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      {ready ? (
        user ? (
          <AppShell />
        ) : authScreen === 'register' ? (
          <RegisterScreen onOpenLogin={() => setAuthScreen('login')} />
        ) : (
          <LoginScreen onOpenRegister={() => setAuthScreen('register')} />
        )
      ) : null}
    </View>
  );
}

function AppShell() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors.background),
    [colors.background],
  );
  const [activeId, setActiveId] = useState<ModuleId>('home');
  const [libraryEditingId, setLibraryEditingId] = useState<
    string | null | undefined
  >(undefined);

  const inLibraryForm = activeId === 'library' && libraryEditingId !== undefined;

  const goHome = () => {
    setActiveId('home');
    setLibraryEditingId(undefined);
  };

  return (
    <>
      <AppHeader
        title={
          inLibraryForm
            ? t('library.detailTitle')
            : activeId === 'home'
              ? t('app.name')
              : t(`${activeId}.title`)
        }
        onOpenSetting={() => {
          setActiveId('setting');
          setLibraryEditingId(undefined);
        }}
        onHome={activeId !== 'home' && !inLibraryForm ? goHome : undefined}
        onBack={
          inLibraryForm ? () => setLibraryEditingId(undefined) : undefined
        }
      />
      <View style={styles.fill}>
        {activeId === 'home' ? <HomeScreen /> : null}
        {activeId === 'library' ? (
          <LibraryScreen
            editingId={libraryEditingId}
            onEditingIdChange={setLibraryEditingId}
          />
        ) : null}
        {activeId === 'setting' ? <SettingScreen /> : null}
      </View>
      <TabFooter
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id);
          if (id !== 'library') setLibraryEditingId(undefined);
        }}
      />
    </>
  );
}

function createStyles(backgroundColor: string) {
  return StyleSheet.create({
    fill: {
      flex: 1,
      backgroundColor,
    },
  });
}
