/**
 * Theme Definitions
 * 
 * Defines color schemes and styles for light and dark themes.
 * Based on the web application's theme system.
 */

export interface Theme {
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  bgCardHover: string;
  bgModal: string;
  bgInput: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;

  // Border colors
  borderColor: string;

  // Accent colors
  accent: string;
  accentHover: string;
  accentDisabled: string;
  buttonAccent: string;
  buttonAccentHover: string;
  buttonAccentDisabled: string;

  // Button colors
  buttonSecondary: string;
  buttonSecondaryHover: string;

  // Control colors
  controlBg: string;
  stepSelectorBg: string;

  // Status colors
  success: string;
  error: string;
  warning: string;
}

export const darkTheme: Theme = {
  // Background colors
  bgPrimary: '#121212',
  bgSecondary: '#1e1e1e',
  bgCard: '#1e1e1e',
  bgCardHover: '#2a2a2a',
  bgModal: '#1e1e1e',
  bgInput: '#333333',

  // Text colors
  textPrimary: '#ffffff',
  textSecondary: '#999999',
  textDisabled: '#666666',

  // Border colors
  borderColor: '#333333',

  // Accent colors (Spotify green)
  accent: '#1DB954',
  accentHover: '#1ed760',
  accentDisabled: '#1DB95480',
  buttonAccent: '#1DB954',
  buttonAccentHover: '#1ed760',
  buttonAccentDisabled: '#1DB95480',

  // Button colors
  buttonSecondary: '#333333',
  buttonSecondaryHover: '#444444',

  // Control colors
  controlBg: '#2a2a2a',
  stepSelectorBg: '#1e1e1e',

  // Status colors
  success: '#1DB954',
  error: '#ff4444',
  warning: '#ffbb33',
};

export const lightTheme: Theme = {
  // Background colors
  bgPrimary: '#f8f8f8',
  bgSecondary: '#ffffff',
  bgCard: '#ffffff',
  bgCardHover: '#f0f0f0',
  bgModal: '#ffffff',
  bgInput: '#f0f0f0',

  // Text colors
  textPrimary: '#333333',
  textSecondary: '#666666',
  textDisabled: '#999999',

  // Border colors
  borderColor: '#e0e0e0',

  // Accent colors (Darker orange for text/icons, lighter for buttons)
  accent: '#ca7648',
  accentHover: '#d68a5c',
  accentDisabled: '#ca764880',
  buttonAccent: '#FDE6A9',
  buttonAccentHover: '#F9D27D',
  buttonAccentDisabled: '#FDE6A980',

  // Button colors
  buttonSecondary: '#e8e8e8',
  buttonSecondaryHover: '#d8d8d8',

  // Control colors
  controlBg: '#f0f0f0',
  stepSelectorBg: '#f5f5f5',

  // Status colors
  success: '#4CAF50',
  error: '#f44336',
  warning: '#ff9800',
};

// Helper function to get the current theme
export const getTheme = (isDark: boolean): Theme => {
  return isDark ? darkTheme : lightTheme;
};
