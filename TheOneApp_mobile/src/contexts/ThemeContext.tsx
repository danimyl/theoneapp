/**
 * Theme Context
 * 
 * Provides theme values and theme switching functionality throughout the app.
 * Uses the settings store to persist theme preference.
 */

import React, { createContext, useContext, useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { Theme, getTheme } from '../styles/themes';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDarkMode, setIsDarkMode } = useSettingsStore();

  const toggleTheme = useCallback(() => {
    setIsDarkMode(!isDarkMode);
  }, [isDarkMode, setIsDarkMode]);

  const value = {
    theme: getTheme(isDarkMode),
    isDark: isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
