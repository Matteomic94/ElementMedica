/**
 * DashboardLayout Component
 * Gestisce il layout principale della dashboard con header e struttura base
 * Parte del refactoring del Dashboard.tsx monolitico
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  error?: string | null;
  isLoading?: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  error,
  isLoading
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Welcome to your occupational medicine management dashboard.</p>
        
        {/* Error Display */}
        {error && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            <p className="flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>Si è verificato un errore: {error}</span>
            </p>
            <p className="text-sm mt-1">
              L'applicazione sta utilizzando dati di esempio. Verifica la connessione al server.
            </p>
          </div>
        )}
        
        {/* Loading State */}
        {isLoading && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-md">
            <p className="text-sm">Caricamento dati dashboard...</p>
          </div>
        )}
      </div>

      {/* Content */}
      {children}
    </div>
  );
};

export default DashboardLayout;