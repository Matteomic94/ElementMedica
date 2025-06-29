/**
 * Design System - Main Index
 * Week 8 Implementation - Component Library
 */

// Export all design system components
export * from './atoms';
export * from './molecules';
export * from './organisms';
export * from './tokens';
export * from './themes';
export * from './utils';

// Theme and utilities
export { theme, designTokens, applyDesignTokens } from './tokens';

// Re-export components for easier imports
export { Button } from './atoms/Button';
export { Input } from './atoms/Input';
export { Card } from './molecules/Card';
export { FormField } from './molecules/FormField';
export { Modal, ConfirmModal } from './molecules/Modal';
export { SearchBox } from './molecules/SearchBox';

// Types
export type {
  // Button types
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  // Input types
  InputProps,
  InputVariant,
  InputSize,
  InputState,
  // Card types
  CardProps,
  CardVariant,
  CardSize,
  // Token types
  ColorToken,
  ColorShade,
  FontFamily,
  FontSize,
  FontWeight,
  LineHeight,
  LetterSpacing,
  TextStyle,
  Spacing,
  SemanticSpacing,
  Sizing,
  BorderRadius,
  Shadow,
  ZIndex,
  Theme,
  ThemeColors,
  ThemeFontSizes,
  ThemeSpacing,
} from './tokens';