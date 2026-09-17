import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, QueryProvider, useAuth } from '@/api';
import { loadSavedLanguage } from '@/i18n';
import { type ModuleId } from '@/modules';
import {
  HomeScreen,
  LibraryScreen,
  LoginScreen,
  RegisterScreen,
  SettingScreen,
  type LibraryFormState,
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
    <SafeAreaProvider>
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
  const styles = useMemo(() => createStyles(colors.background), [colors.background]);
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');

  useEffect(() => {
    void loadSavedLanguage();
  }, []);

  useEffect(() => {
    if (user) setAuthScreen('login');
  }, [user]);

  return (
    <View style={styles.fill}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      {!ready ? null : user ? (
        <AppShell />
      ) : authScreen === 'register' ? (
        <RegisterScreen onOpenLogin={() => setAuthScreen('login')} />
      ) : (
        <LoginScreen onOpenRegister={() => setAuthScreen('register')} />
      )}
    </View>
  );
}

function AppShell() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors.background), [colors.background]);
  const [activeTab, setActiveTab] = useState<ModuleId>('home');
  const [libraryForm, setLibraryForm] = useState<LibraryFormState>({
    status: 'list',
  });

  const isLibraryFormOpen = activeTab === 'library' && libraryForm.status !== 'list';

  const goHome = () => {
    setActiveTab('home');
    setLibraryForm({ status: 'list' });
  };

  return (
    <>
      <AppHeader
        title={
          isLibraryFormOpen
            ? t('library.detailTitle')
            : activeTab === 'home'
              ? t('app.name')
              : t(`${activeTab}.title`)
        }
        onOpenSetting={() => {
          setActiveTab('setting');
          setLibraryForm({ status: 'list' });
        }}
        onHome={activeTab !== 'home' && !isLibraryFormOpen ? goHome : undefined}
        onBack={
          isLibraryFormOpen
            ? () => setLibraryForm({ status: 'list' })
            : undefined
        }
      />
      <View style={styles.fill}>
        <KeepAliveTab visible={activeTab === 'home'} style={styles}>
          <HomeScreen />
        </KeepAliveTab>
        <KeepAliveTab visible={activeTab === 'library'} style={styles}>
          <LibraryScreen form={libraryForm} onFormChange={setLibraryForm} />
        </KeepAliveTab>
        <KeepAliveTab visible={activeTab === 'setting'} style={styles}>
          <SettingScreen />
        </KeepAliveTab>
      </View>
      <TabFooter
        activeTab={activeTab}
        onSelect={(tabId) => {
          setActiveTab(tabId);
          if (tabId !== 'library') setLibraryForm({ status: 'list' });
        }}
      />
    </>
  );
}

function KeepAliveTab({
  visible,
  style,
  children,
}: {
  visible: boolean;
  style: ReturnType<typeof createStyles>;
  children: ReactNode;
}) {
  return (
    <View
      style={[style.fill, !visible && style.hidden]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {children}
    </View>
  );
}

function createStyles(backgroundColor: string) {
  return StyleSheet.create({
    fill: { flex: 1, backgroundColor },
    hidden: { display: 'none' },
  });
}
