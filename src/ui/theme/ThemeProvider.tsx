import AsyncStorage from '@react-native-async-storage/async-storage';
import { Component, createContext, useContext, type ReactNode } from 'react';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark';
type PrimaryId = 'orange' | 'blue' | 'green' | 'purple' | 'red';

export const PRIMARY_PRESETS: {
  id: PrimaryId;
  hex: string;
  labelKey: string;
}[] = [
  { id: 'orange', hex: '#FF7A00', labelKey: 'setting.primaryOrange' },
  { id: 'blue', hex: '#2563EB', labelKey: 'setting.primaryBlue' },
  { id: 'green', hex: '#16A34A', labelKey: 'setting.primaryGreen' },
  { id: 'purple', hex: '#7C3AED', labelKey: 'setting.primaryPurple' },
  { id: 'red', hex: '#E11D48', labelKey: 'setting.primaryRed' },
];

const light = {
  background: '#F5F6F8',
  text: '#123047',
  textMuted: '#3A5163',
  border: '#E5E5E5',
  footerInactive: '#000000',
  success: '#16A34A',
  danger: '#D64545',
  onPrimary: '#FFFFFF',
};

const dark = {
  background: '#0F1419',
  text: '#F4F7FA',
  textMuted: '#9AA8B5',
  border: '#2A3441',
  footerInactive: '#C5D0DA',
  success: '#22C55E',
  danger: '#FF6B6B',
  onPrimary: '#FFFFFF',
};

function getThemeColors(mode: ThemeMode, primaryId: PrimaryId) {
  const primary = PRIMARY_PRESETS.find((item) => item.id === primaryId)!.hex;
  return { ...(mode === 'dark' ? dark : light), primary };
}

type ThemeValue = {
  mode: ThemeMode;
  primaryId: PrimaryId;
  colors: ReturnType<typeof getThemeColors>;
  setMode: (mode: ThemeMode) => void;
  setPrimaryId: (id: PrimaryId) => void;
};

const ThemeContext = createContext<ThemeValue>({
  mode: 'light',
  primaryId: 'orange',
  colors: getThemeColors('light', 'orange'),
  setMode: () => undefined,
  setPrimaryId: () => undefined,
});

export class ThemeProvider extends Component<
  { children: ReactNode },
  { mode: ThemeMode; primaryId: PrimaryId }
> {
  state = {
    mode: (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light') as ThemeMode,
    primaryId: 'orange' as PrimaryId,
  };
  private themeValue: ThemeValue | null = null;

  async componentDidMount() {
    const [mode, primaryId] = await Promise.all([
      AsyncStorage.getItem('mimicapp.themeMode'),
      AsyncStorage.getItem('mimicapp.primaryId'),
    ]);
    this.setState({
      mode: mode === 'dark' ? 'dark' : 'light',
      primaryId: (primaryId as PrimaryId) || 'orange',
    });
  }

  setMode = (mode: ThemeMode) => {
    this.setState({ mode });
    void AsyncStorage.setItem('mimicapp.themeMode', mode);
  };

  setPrimaryId = (primaryId: PrimaryId) => {
    this.setState({ primaryId });
    void AsyncStorage.setItem('mimicapp.primaryId', primaryId);
  };

  render() {
    const { mode, primaryId } = this.state;
    let themeValue = this.themeValue;
    if (
      !themeValue ||
      themeValue.mode !== mode ||
      themeValue.primaryId !== primaryId
    ) {
      themeValue = {
        mode,
        primaryId,
        colors: getThemeColors(mode, primaryId),
        setMode: this.setMode,
        setPrimaryId: this.setPrimaryId,
      };
      this.themeValue = themeValue;
    }
    return (
      <ThemeContext.Provider value={themeValue}>
        {this.props.children}
      </ThemeContext.Provider>
    );
  }
}

export const useTheme = () => useContext(ThemeContext);
