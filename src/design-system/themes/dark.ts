/**
 * Design System - Dark Theme
 * Week 8 Implementation - Component Library
 */

import { colors } from '../tokens/colors';

export const darkTheme = {
  // Background colors
  background: {
    primary: colors.neutral[900],
    secondary: colors.neutral[800],
    tertiary: colors.neutral[700],
    elevated: colors.neutral[850],
    overlay: 'rgba(0, 0, 0, 0.8)',
  },

  // Text colors
  text: {
    primary: colors.neutral[50],
    secondary: colors.neutral[300],
    tertiary: colors.neutral[400],
    inverse: colors.neutral[900],
    disabled: colors.neutral[600],
  },

  // Border colors
  border: {
    primary: colors.neutral[700],
    secondary: colors.neutral[600],
    focus: colors.primary[400],
    error: colors.semantic.error[400],
    success: colors.semantic.success[400],
  },

  // Interactive colors
  interactive: {
    primary: {
      default: colors.primary[500],
      hover: colors.primary[400],
      active: colors.primary[300],
      disabled: colors.primary[800],
    },
    secondary: {
      default: colors.neutral[700],
      hover: colors.neutral[600],
      active: colors.neutral[500],
      disabled: colors.neutral[800],
    },
    destructive: {
      default: colors.semantic.error[500],
      hover: colors.semantic.error[400],
      active: colors.semantic.error[300],
      disabled: colors.semantic.error[800],
    },
  },

  // Status colors
  status: {
    success: {
      background: colors.semantic.success[900],
      border: colors.semantic.success[700],
      text: colors.semantic.success[200],
      icon: colors.semantic.success[400],
    },
    warning: {
      background: colors.semantic.warning[900],
      border: colors.semantic.warning[700],
      text: colors.semantic.warning[200],
      icon: colors.semantic.warning[400],
    },
    error: {
      background: colors.semantic.error[900],
      border: colors.semantic.error[700],
      text: colors.semantic.error[200],
      icon: colors.semantic.error[400],
    },
    info: {
      background: colors.primary[900],
      border: colors.primary[700],
      text: colors.primary[200],
      icon: colors.primary[400],
    },
  },

  // Shadow colors
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
  },
} as const;

// CSS Variables for dark theme
export const darkThemeCSSVars = {
  // Background
  '--color-bg-primary': darkTheme.background.primary,
  '--color-bg-secondary': darkTheme.background.secondary,
  '--color-bg-tertiary': darkTheme.background.tertiary,
  '--color-bg-elevated': darkTheme.background.elevated,
  '--color-bg-overlay': darkTheme.background.overlay,

  // Text
  '--color-text-primary': darkTheme.text.primary,
  '--color-text-secondary': darkTheme.text.secondary,
  '--color-text-tertiary': darkTheme.text.tertiary,
  '--color-text-inverse': darkTheme.text.inverse,
  '--color-text-disabled': darkTheme.text.disabled,

  // Border
  '--color-border-primary': darkTheme.border.primary,
  '--color-border-secondary': darkTheme.border.secondary,
  '--color-border-focus': darkTheme.border.focus,
  '--color-border-error': darkTheme.border.error,
  '--color-border-success': darkTheme.border.success,

  // Interactive
  '--color-interactive-primary': darkTheme.interactive.primary.default,
  '--color-interactive-primary-hover': darkTheme.interactive.primary.hover,
  '--color-interactive-primary-active': darkTheme.interactive.primary.active,
  '--color-interactive-primary-disabled': darkTheme.interactive.primary.disabled,

  // Shadows
  '--shadow-sm': darkTheme.shadow.sm,
  '--shadow-md': darkTheme.shadow.md,
  '--shadow-lg': darkTheme.shadow.lg,
  '--shadow-xl': darkTheme.shadow.xl,
} as const;

export default darkTheme;