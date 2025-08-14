/**
 * GDPR Admin Hook
 * Manages administrative GDPR operations and compliance reporting
 */

import React, { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import {
  DeletionRequest,
  ComplianceReport,
  UseGDPRAdminReturn,
  GDPRApiResponse
} from '../types/gdpr';

export const useGDPRAdmin = (): UseGDPRAdminReturn => {
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch pending deletion requests
  const fetchDeletionRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.get<{ requests: DeletionRequest[] }>(
        '/api/gdpr/pending-deletions'
      );
      
      if (response && response.requests) {
        setDeletionRequests(response.requests);
      } else {
        throw new Error('Failed to fetch deletion requests');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch deletion requests';
      setError(errorMessage);
      console.error('Error fetching deletion requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Process a deletion request (approve or reject)
  const processDeletionRequest = useCallback(async (
    requestId: string,
    approve: boolean,
    notes?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.post(
        `/api/gdpr/delete/process/${requestId}`,
        {
          approve,
          notes
        }
      );
      
      if (response) {
        // Remove the processed request from the list
        setDeletionRequests(prev => 
          prev.filter(request => request.id !== requestId)
        );
      } else {
        throw new Error('Failed to process deletion request');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process deletion request';
      setError(errorMessage);
      console.error('Error processing deletion request:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate compliance report
  const generateComplianceReport = useCallback(async (companyId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (companyId) {
        params.append('companyId', companyId);
      }
      
      const response = await apiService.get<{ report: ComplianceReport }>(
        `/api/gdpr/compliance-report?${params.toString()}`
      );
      
      if (response && response.report) {
        setComplianceReport(response.report);
      } else {
        throw new Error('Failed to generate compliance report');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate compliance report';
      setError(errorMessage);
      console.error('Error generating compliance report:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh all admin data
  const refreshData = useCallback(async () => {
    try {
      await Promise.all([
        fetchDeletionRequests(),
        generateComplianceReport()
      ]);
    } catch (err) {
      console.error('Error refreshing admin data:', err);
    }
  }, [fetchDeletionRequests, generateComplianceReport]);

  // Initialize data on first load
  React.useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    deletionRequests,
    complianceReport,
    loading,
    error,
    processDeletionRequest,
    generateComplianceReport,
    refreshData
  };
};

export default useGDPRAdmin;