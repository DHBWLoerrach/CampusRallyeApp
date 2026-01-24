import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  resolveDeviceLanguage,
  translate,
  type Language,
  type Translator,
} from '@/utils/i18n';

type LanguageContextValue = {
  language: Language;
  setLanguage: (next: Language) => void;
  toggleLanguage: () => void;
  t: Translator;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

const LANGUAGE_STORAGE_KEY = '@campusrallye.language';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() =>
    resolveDeviceLanguage()
  );

  useEffect(() => {
    let active = true;
    const loadLanguage = async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (!active) return;
        if (stored === 'de' || stored === 'en') {
          setLanguageState(stored);
          return;
        }
        setLanguageState(resolveDeviceLanguage());
      } catch (error) {
        console.warn('Failed to load language preference:', error);
      }
    };
    void loadLanguage();
    return () => {
      active = false;
    };
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, next);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'de' ? 'en' : 'de');
  }, [language, setLanguage]);

  const t = useCallback<Translator>(
    (key, params) => translate(language, key, params),
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, setLanguage, t, toggleLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
