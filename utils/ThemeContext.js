import { createContext, useContext } from 'react';
import { observable } from '@legendapp/state';

export const themeStore$ = observable({
  isDarkMode: false,
});

export const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);
