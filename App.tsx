import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, QueryProvider, useAuth } from '@/api';
import { loadSavedLanguage } from '@/i18n';
import { type ModuleId } from '@/modules';
import {
  AuthScreen,
  HomeScreen,
  LibraryScreen,
  PracticeScreen,
  popLibraryScreen,
  popPracticeScreen,
  resetLibraryScreen,
  resetPracticeScreen,
  SettingScreen,
  type AuthScreenState,
  type LibraryScreenState,
  type PracticeScreenState,
} from '@/screen';
import {
  AppHeader,
  TabFooter,
  ThemeProvider,
  ToastProvider,
  useTheme,
} from '@/ui';

const App = () => {
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
};

const AppRoot = () => {
  const { user, ready } = useAuth();
  const { colors, mode } = useTheme();
  const styles = useMemo(() => createStyles(colors.background), [colors.background]);
  const [authScreen, setAuthScreen] = useState<AuthScreenState>({ status: 'login' });

  useEffect(() => {
    void loadSavedLanguage();
  }, []);

  useEffect(() => {
    if (user) setAuthScreen({ status: 'login' });
  }, [user]);

  return (
    <View style={styles.fill}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      {!ready ? null : user ? (
        <AppShell />
      ) : (
        <AuthScreen screen={authScreen} onScreenChange={setAuthScreen} />
      )}
    </View>
  );
};

const AppShell = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors.background), [colors.background]);
  const [activeTab, setActiveTab] = useState<ModuleId>('home');
  const [libraryScreen, setLibraryScreen] = useState<LibraryScreenState>({
    status: 'list',
  });
  const [practiceScreen, setPracticeScreen] = useState<PracticeScreenState>({
    status: 'list',
  });

  const isLibraryDetailOpen =
    activeTab === 'library' && libraryScreen.status !== 'list';
  const isPracticeDetailOpen =
    activeTab === 'practice' && practiceScreen.status !== 'list';

  const leaveLibrary = () => setLibraryScreen(resetLibraryScreen());
  const leavePractice = () => setPracticeScreen(resetPracticeScreen());

  const goHome = () => {
    setActiveTab('home');
    leaveLibrary();
    leavePractice();
  };

  const libraryTitle = {
    list: t('library.title'),
    create: t('library.detailTitle'),
    view: t('library.detailTitle'),
    update: t('library.detailTitle'),
  }[libraryScreen.status];

  const practiceTitle = {
    list: t('practice.title'),
    play: t('practice.playTitle'),
    result: t('practice.resultTitle'),
  }[practiceScreen.status];

  const headerTitle = {
    home: t('app.name'),
    library: libraryTitle,
    practice: practiceTitle,
    setting: t('setting.title'),
  }[activeTab];

  return (
    <>
      <AppHeader
        title={headerTitle}
        onOpenSetting={() => {
          setActiveTab('setting');
          leaveLibrary();
          leavePractice();
        }}
        onHome={
          activeTab !== 'home' && !isLibraryDetailOpen && !isPracticeDetailOpen
            ? goHome
            : undefined
        }
        onBack={
          isLibraryDetailOpen
            ? () => setLibraryScreen(popLibraryScreen)
            : isPracticeDetailOpen
              ? () => setPracticeScreen(popPracticeScreen())
              : undefined
        }
      />
      <View style={styles.fill}>
        <KeepAliveTab visible={activeTab === 'home'} style={styles}>
          <HomeScreen />
        </KeepAliveTab>
        <KeepAliveTab visible={activeTab === 'library'} style={styles}>
          <LibraryScreen
            visible={activeTab === 'library'}
            screen={libraryScreen}
            onScreenChange={setLibraryScreen}
            onPlay={(libraryId) => {
              setPracticeScreen({ status: 'play', libraryId });
              setActiveTab('practice');
            }}
          />
        </KeepAliveTab>
        <KeepAliveTab visible={activeTab === 'practice'} style={styles}>
          <PracticeScreen
            visible={activeTab === 'practice'}
            screen={practiceScreen}
            onScreenChange={setPracticeScreen}
          />
        </KeepAliveTab>
        <KeepAliveTab visible={activeTab === 'setting'} style={styles}>
          <SettingScreen />
        </KeepAliveTab>
      </View>
      <TabFooter
        activeTab={activeTab}
        onSelect={(tabId) => {
          setActiveTab(tabId);
          if (tabId !== 'library') leaveLibrary();
          if (tabId === 'practice') {
            setPracticeScreen({ status: 'list' });
            return;
          }
          leavePractice();
        }}
      />
    </>
  );
};

const KeepAliveTab = ({
  visible,
  style,
  children,
}: {
  visible: boolean;
  style: ReturnType<typeof createStyles>;
  children: ReactNode;
}) => {
  return (
    <View
      style={[style.fill, !visible && style.hidden]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {children}
    </View>
  );
};

const createStyles = (backgroundColor: string) => {
  return StyleSheet.create({
    fill: { flex: 1, backgroundColor },
    hidden: { display: 'none' },
  });
};

export default App;
