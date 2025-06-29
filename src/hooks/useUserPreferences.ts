/**
 * User Preferences Hook
 * Week 14 Implementation - User Preferences Management
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  UserPreferences,
  UseUserPreferencesReturn,
  UserPreferencesFormData,
  DEFAULT_USER_PREFERENCES,
  PreferencesApiResponse
} from '../types/preferences';
import apiClient from '../services/apiClient';

/**
 * Hook for managing user preferences
 */
export const useUserPreferences = (): UseUserPreferencesReturn => {
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

  /**
   * Export preferences to JSON file
   */
  const exportPreferences = useCallback(() => {
    if (!preferences) {
      toast.error('Nessuna preferenza da esportare');
      return;
    }

    try {
      const dataStr = JSON.stringify(preferences, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-preferences-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      toast.success('Preferenze esportate con successo');
    } catch (err) {
      console.error('Error exporting preferences:', err);
      toast.error('Errore nell\'esportazione delle preferenze');
    }
  }, [preferences]);

  /**
   * Import preferences from JSON file
   */
  const importPreferences = useCallback(async (file: File) => {
    if (!user?.id) return;

    try {
      const text = await file.text();
      const importedPrefs = JSON.parse(text) as UserPreferences;
      
      // Validate imported preferences
      if (!importedPrefs.userId || !importedPrefs.theme) {
        throw new Error('File di preferenze non valido');
      }

      // Update with imported preferences (keeping current user ID)
      const updatedPrefs = {
        ...importedPrefs,
        id: preferences?.id || `pref_${user.id}`,
        userId: user.id,
        updatedAt: new Date().toISOString()
      };

      await updatePreferences(updatedPrefs);
      toast.success('Preferenze importate con successo');
    } catch (err) {
      console.error('Error importing preferences:', err);
      toast.error('Errore nell\'importazione delle preferenze');
    }
  }, [user?.id, preferences?.id, updatePreferences]);

  /**
   * Get preference value by key
   */
  const getPreference = useCallback(<K extends keyof UserPreferences>(
    key: K
  ): UserPreferences[K] | undefined => {
    return preferences?.[key];
  }, [preferences]);

  /**
   * Update single preference
   */
  const updateSinglePreference = useCallback(async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    await updatePreferences({ [key]: value } as Partial<UserPreferences>);
  }, [updatePreferences]);

  /**
   * Check if preferences are loaded
   */
  const isLoaded = useCallback(() => {
    return preferences !== null;
  }, [preferences]);

  /**
   * Get theme-related preferences
   */
  const getThemePreferences = useCallback(() => {
    if (!preferences) return null;
    
    return {
      theme: preferences.theme,
      themeColor: preferences.themeColor,
      accessibility: preferences.accessibility
    };
  }, [preferences]);

  /**
   * Get notification preferences
   */
  const getNotificationPreferences = useCallback(() => {
    return preferences?.notifications || null;
  }, [preferences]);

  /**
   * Get dashboard preferences
   */
  const getDashboardPreferences = useCallback(() => {
    return preferences?.dashboard || null;
  }, [preferences]);

  // Load preferences when user changes
  useEffect(() => {
    if (user?.id) {
      fetchPreferences();
    } else {
      setPreferences(null);
      setError(null);
    }
  }, [user?.id, fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    resetPreferences,
    exportPreferences,
    importPreferences,
    // Additional utility methods
    getPreference,
    updateSinglePreference,
    isLoaded,
    getThemePreferences,
    getNotificationPreferences,
    getDashboardPreferences,
    refresh: fetchPreferences
  };
};

export default useUserPreferences;