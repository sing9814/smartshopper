import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from './colors';

const ThemeContext = createContext();

const THEME_KEY = 'APP_THEME_MODE';

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme(); // 'light' | 'dark'
  const [themeOverride, setThemeOverride] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') {
        setThemeOverride(stored);
      }
    });
  }, []);

  useEffect(() => {
    if (themeOverride) {
      AsyncStorage.setItem(THEME_KEY, themeOverride);
    }
  }, [themeOverride]);

  const theme = useMemo(() => {
    const mode = themeOverride || systemScheme;
    return mode === 'dark' ? darkTheme : lightTheme;
  }, [themeOverride, systemScheme]);

  const toggleTheme = () => {
    setThemeOverride((prev) => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'dark';
      return systemScheme === 'dark' ? 'light' : 'dark';
    });
  };

  const isDark = (themeOverride || systemScheme) === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext).theme;
export const useToggleTheme = () => useContext(ThemeContext).toggleTheme;
export const useIsDark = () => useContext(ThemeContext).isDark;
