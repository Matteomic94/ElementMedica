/**
 * GDPR Consent Management Hook
 * Handles user consent operations and state management
 */

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import {
  GDPRConsent,
  ConsentFormData,
  ConsentWithdrawalFormData,
  UseGDPRConsentReturn,
  ConsentsListResponse,
  ConsentResponse,
  ConsentType
} from '../types/gdpr';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export const useGDPRConsent = (): UseGDPRConsentReturn => {
  const [consents, setConsents] = useState<GDPRConsent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  /**
   * Fetch user's current consents
   */
  const fetchConsents = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiService.get<ConsentsListResponse>('/api/gdpr/consents');
      
      if (response && (response as any).success && (response as any).data) {
        setConsents((response as any).data.consents);
      } else if (response && (response as any).consents) {
        // Formato diretto senza wrapper
        setConsents((response as any).consents);
      } else {
        throw new Error((response as any)?.error || 'Failed to fetch consents');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch consents';
      setError(errorMessage);
      console.error('Error fetching consents:', err);
      toast.error('Failed to load consent information');
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Grant a new consent
   */
  const grantConsent = useCallback(async (data: ConsentFormData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.post<ConsentResponse>('/api/gdpr/consent', {
        consentType: data.consentType,
        purpose: data.purpose,
        legalBasis: data.legalBasis || 'consent'
      });

      if (response && (response as any).success && (response as any).data) {
        const newConsent = (response as any).data.consent;
        
        // Update local state
        setConsents(prev => {
          const filtered = prev.filter(c => c.consentType !== newConsent.consentType);
          return [...filtered, newConsent];
        });

        toast.success(`Consent granted for ${data.consentType}`);
      } else if (response && (response as any).consent) {
        // Formato diretto senza wrapper
        const newConsent = (response as any).consent;
        
        setConsents(prev => {
          const filtered = prev.filter(c => c.consentType !== newConsent.consentType);
          return [...filtered, newConsent];
        });

        toast.success(`Consent granted for ${data.consentType}`);
      } else {
        throw new Error((response as any)?.error || 'Failed to grant consent');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to grant consent';
      setError(errorMessage);
      console.error('Error granting consent:', err);
      toast.error('Failed to grant consent');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Withdraw an existing consent
   */
  const withdrawConsent = useCallback(async (data: ConsentWithdrawalFormData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.post<ConsentResponse>('/api/gdpr/consent/withdraw', {
        consentType: data.consentType,
        reason: data.reason
      });

      if (response && (response as any).success && (response as any).data) {
        const withdrawnConsent = (response as any).data.consent;
        
        // Update local state
        setConsents(prev => 
          prev.map(consent => 
            consent.consentType === withdrawnConsent.consentType
              ? { ...consent, ...withdrawnConsent }
              : consent
          )
        );

        toast.success(`Consent withdrawn for ${data.consentType}`);
      } else if (response && (response as any).consent) {
        // Formato diretto senza wrapper
        const withdrawnConsent = (response as any).consent;
        
        setConsents(prev => 
          prev.map(consent => 
            consent.consentType === withdrawnConsent.consentType
              ? { ...consent, ...withdrawnConsent }
              : consent
          )
        );

        toast.success(`Consent withdrawn for ${data.consentType}`);
      } else {
        throw new Error((response as any)?.error || 'Failed to withdraw consent');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to withdraw consent';
      setError(errorMessage);
      console.error('Error withdrawing consent:', err);
      toast.error('Failed to withdraw consent');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh consents data
   */
  const refreshConsents = useCallback(async () => {
    await fetchConsents();
  }, [fetchConsents]);

  /**
   * Get consent status for a specific type
   */
  const getConsentStatus = useCallback((consentType: string) => {
    const consent = consents.find(c => c.consentType === consentType);
    return {
      granted: consent?.consentGiven || false,
      date: consent?.consentDate,
      withdrawnAt: consent?.withdrawnAt,
      withdrawalReason: consent?.withdrawalReason
    };
  }, [consents]);

  /**
   * Check if a specific consent is active
   */
  const hasActiveConsent = useCallback((consentType: string) => {
    const consent = consents.find(c => c.consentType === consentType);
    return consent?.consentGiven && !consent?.withdrawnAt;
  }, [consents]);

  /**
   * Get all active consents
   */
  const getActiveConsents = useCallback(() => {
    return consents.filter(consent => consent.consentGiven && !consent.withdrawnAt);
  }, [consents]);

  /**
   * Get consent statistics
   */
  const getConsentStats = useCallback(() => {
    const total = consents.length;
    const active = getActiveConsents().length;
    const withdrawn = consents.filter(c => c.withdrawnAt).length;
    
    return {
      total,
      active,
      withdrawn,
      percentage: total > 0 ? Math.round((active / total) * 100) : 0
    };
  }, [consents, getActiveConsents]);

  // Load consents on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchConsents();
    } else {
      setConsents([]);
      setError(null);
    }
  }, [user, fetchConsents]);

  return {
    consents,
    loading,
    error,
    grantConsent,
    withdrawConsent,
    refreshConsents,
    // Additional utility functions
    getConsentStatus,
    hasActiveConsent,
    getActiveConsents,
    getConsentStats
  };
};

/**
 * Hook for managing a single consent type
 * Useful for individual consent toggles
 */
export const useSingleConsent = (consentType: string) => {
  const {
    loading,
    error,
    grantConsent,
    withdrawConsent,
    hasActiveConsent,
    getConsentStatus
  } = useGDPRConsent();

  const isActive = hasActiveConsent(consentType);
  const status = getConsentStatus(consentType);

  const toggle = useCallback(async (purpose: string, reason?: string) => {
    if (isActive) {
      await withdrawConsent({
        consentType: consentType as ConsentType,
        reason: reason || 'User requested withdrawal'
      });
    } else {
      await grantConsent({
        consentType: consentType as ConsentType,
        purpose
      });
    }
  }, [isActive, consentType, grantConsent, withdrawConsent]);

  return {
    isActive,
    status,
    loading,
    error,
    toggle
  };
};

export default useGDPRConsent;