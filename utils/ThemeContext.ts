import { createContext, useContext } from 'react';
import { observable } from '@legendapp/state';

export const themeStore$ = observable({
  isDarkMode: false,
});

export type ThemeContextValue = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined
);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeContext.Provider');
  return ctx;
};

