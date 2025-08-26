import { createContext, useContext } from 'react';
import { observable } from '@legendapp/state';

export type ThemeMode = 'system' | 'light' | 'dark';

export const themeStore$ = observable<{ mode: ThemeMode }>({
  mode: 'system',
});

export type ThemeContextValue = {
  isDarkMode: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined
);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeContext.Provider');
  return ctx;
};
