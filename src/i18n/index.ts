import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import vi from './locales/vi.json';

export type AppLanguage = 'en' | 'vi';

const STORAGE_KEY = 'mimicapp.language';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  lng: 'vi',
  fallbackLng: 'vi',
  supportedLngs: ['en', 'vi'],
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export async function loadSavedLanguage() {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  if (saved === 'en' || saved === 'vi') {
    await i18n.changeLanguage(saved);
  }
}

export async function setAppLanguage(lang: AppLanguage) {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(STORAGE_KEY, lang);
}
