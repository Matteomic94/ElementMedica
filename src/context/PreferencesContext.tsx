/**
 * Preferences Context
 * Week 14 Implementation - User Preferences Management
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import {
  UserPreferences,
  PreferencesContextType,
  UserPreferencesFormData,
  DEFAULT_USER_PREFERENCES,
  PreferencesApiResponse
} from '../types/preferences';
import apiClient from '../services/apiClient';

// Create context
const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

// Hook to use preferences context
export const usePreferences = (): PreferencesContextType => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

// Provider props
export interface PreferencesProviderProps {
  children: React.ReactNode;
}

// Preferences provider component
export const PreferencesProvider: React.FC<PreferencesProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user preferences from API
   */
  const fetchPreferences = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<PreferencesApiResponse<UserPreferences>>(
        `/api/user/preferences`
      );

      if (response.data.success) {
        setPreferences(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to fetch preferences');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch preferences';
      setError(errorMessage);
      console.error('Error fetching preferences:', err);
      
      // Create default preferences if none exist
      const defaultPrefs: UserPreferences = {
        ...DEFAULT_USER_PREFERENCES,
        id: `pref_${user.id}`,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setPreferences(defaultPrefs);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Update user preferences
   */
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!user?.id || !preferences) return;

    setLoading(true);
    setError(null);

    try {
      const updatedPreferences = {
        ...preferences,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const response = await apiClient.put<PreferencesApiResponse<UserPreferences>>(
        `/api/user/preferences`,
        updatedPreferences
      );

      if (response.data.success) {
        setPreferences(response.data.data);
        toast.success('Preferenze aggiornate con successo');
      } else {
        throw new Error(response.data.error || 'Failed to update preferences');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(errorMessage);
      console.error('Error updating preferences:', err);
      toast.error('Errore nell\'aggiornamento delle preferenze');
    } finally {
      setLoading(false);
    }
  }, [user?.id, preferences]);

  /**
   * Reset preferences to defaults
   */
  const resetPreferences = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<PreferencesApiResponse<UserPreferences>>(
        `/api/user/preferences/reset`
      );

      if (response.data.success) {
        setPreferences(response.data.data);
        toast.success('Preferenze ripristinate ai valori predefiniti');
      } else {
        throw new Error(response.data.error || 'Failed to reset preferences');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset preferences';
      setError(errorMessage);
      console.error('Error resetting preferences:', err);
      toast.error('Errore nel ripristino delle preferenze');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load preferences when user changes
  useEffect(() => {
    if (user?.id) {
      fetchPreferences();
    } else {
      setPreferences(null);
      setError(null);
    }
  }, [user?.id, fetchPreferences]);

  // Apply theme changes to document
  useEffect(() => {
    if (!preferences) return;

    const { theme, themeColor } = preferences;
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Apply theme
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }

    // Apply theme color
    root.setAttribute('data-theme-color', themeColor);

    // Apply accessibility settings
    if (preferences.accessibility.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (preferences.accessibility.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    root.setAttribute('data-font-size', preferences.accessibility.fontSize);
  }, [preferences]);

  // Listen for system theme changes
  useEffect(() => {
    if (!preferences || preferences.theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preferences]);

  const value: PreferencesContextType = {
    preferences,
    loading,
    error,
    updatePreferences,
    resetPreferences
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export default PreferencesProvider;