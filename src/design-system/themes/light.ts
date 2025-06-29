/**
 * Design System - Light Theme
 * Week 8 Implementation - Component Library
 */

import { colors } from '../tokens/colors';

export const lightTheme = {
  // Background colors
  background: {
    primary: colors.neutral[50],
    secondary: colors.neutral[100],
    tertiary: colors.neutral[200],
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text colors
  text: {
    primary: colors.neutral[900],
    secondary: colors.neutral[700],
    tertiary: colors.neutral[500],
    inverse: '#ffffff',
    disabled: colors.neutral[400],
  },

  // Border colors
  border: {
    primary: colors.neutral[200],
    secondary: colors.neutral[300],
    focus: colors.primary[500],
    error: colors.semantic.error[500],
    success: colors.semantic.success[500],
  },

  // Interactive colors
  interactive: {
    primary: {
      default: colors.primary[600],
      hover: colors.primary[700],
      active: colors.primary[800],
      disabled: colors.primary[300],
    },
    secondary: {
      default: colors.neutral[100],
      hover: colors.neutral[200],
      active: colors.neutral[300],
      disabled: colors.neutral[50],
    },
    destructive: {
      default: colors.semantic.error[600],
      hover: colors.semantic.error[700],
      active: colors.semantic.error[800],
      disabled: colors.semantic.error[300],
    },
  },

  // Status colors
  status: {
    success: {
      background: colors.semantic.success[50],
      border: colors.semantic.success[200],
      text: colors.semantic.success[800],
      icon: colors.semantic.success[600],
    },
    warning: {
      background: colors.semantic.warning[50],
      border: colors.semantic.warning[200],
      text: colors.semantic.warning[800],
      icon: colors.semantic.warning[600],
    },
    error: {
      background: colors.semantic.error[50],
      border: colors.semantic.error[200],
      text: colors.semantic.error[800],
      icon: colors.semantic.error[600],
    },
    info: {
      background: colors.primary[50],
      border: colors.primary[200],
      text: colors.primary[800],
      icon: colors.primary[600],
    },
  },

  // Shadow colors
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
} as const;

// CSS Variables for light theme
export const lightThemeCSSVars = {
  // Background
  '--color-bg-primary': lightTheme.background.primary,
  '--color-bg-secondary': lightTheme.background.secondary,
  '--color-bg-tertiary': lightTheme.background.tertiary,
  '--color-bg-elevated': lightTheme.background.elevated,
  '--color-bg-overlay': lightTheme.background.overlay,

  // Text
  '--color-text-primary': lightTheme.text.primary,
  '--color-text-secondary': lightTheme.text.secondary,
  '--color-text-tertiary': lightTheme.text.tertiary,
  '--color-text-inverse': lightTheme.text.inverse,
  '--color-text-disabled': lightTheme.text.disabled,

  // Border
  '--color-border-primary': lightTheme.border.primary,
  '--color-border-secondary': lightTheme.border.secondary,
  '--color-border-focus': lightTheme.border.focus,
  '--color-border-error': lightTheme.border.error,
  '--color-border-success': lightTheme.border.success,

  // Interactive
  '--color-interactive-primary': lightTheme.interactive.primary.default,
  '--color-interactive-primary-hover': lightTheme.interactive.primary.hover,
  '--color-interactive-primary-active': lightTheme.interactive.primary.active,
  '--color-interactive-primary-disabled': lightTheme.interactive.primary.disabled,

  // Shadows
  '--shadow-sm': lightTheme.shadow.sm,
  '--shadow-md': lightTheme.shadow.md,
  '--shadow-lg': lightTheme.shadow.lg,
  '--shadow-xl': lightTheme.shadow.xl,
} as const;

export default lightTheme;