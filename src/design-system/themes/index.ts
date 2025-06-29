/**
 * Design System - Themes Index
 * Week 8 Implementation - Component Library
 */

export { ThemeProvider, useTheme } from './ThemeProvider';
export type { ThemeMode, ThemeContextType, ThemeProviderProps } from './ThemeProvider';

export { lightTheme, lightThemeCSSVars } from './light';
export { darkTheme, darkThemeCSSVars } from './dark';

// Combined theme exports
export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

export const themeCSSVars = {
  light: lightThemeCSSVars,
  dark: darkThemeCSSVars,
} as const;

export type ThemeName = keyof typeof themes;