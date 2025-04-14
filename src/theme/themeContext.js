import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from './colors';

const ThemeContext = createContext(lightTheme);

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme(); // 'light' | 'dark'

  const theme = useMemo(() => {
    return systemScheme === 'dark' ? darkTheme : lightTheme;
  }, [systemScheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
