import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import DashboardCalendar from '../components/dashboard/DashboardCalendar';
import DashboardStats from '../components/dashboard/DashboardStats';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import { useDashboardData } from '../hooks/useDashboardData';
import { useGDPRConsent } from '../hooks/useGDPRConsent';

/**
 * Dashboard Component - Refactored
 * Utilizza componenti modulari per migliorare la manutenibilità
 */
const Dashboard: React.FC = () => {
  const [showGdprError, setShowGdprError] = useState(false);
  
  // Utilizzo degli hook personalizzati
  const {
    data,
    isLoading,
    error,
    gdprConsent
  } = useDashboardData();
  
  const {
    hasActiveConsent,
    error: gdprError
  } = useGDPRConsent();
  
  // Calcola i corsi futuri e in scadenza
  const futureCoursesCount = useMemo(() => {
    if (!data.schedules) return 0;
    const now = new Date();
    return data.schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.startDate);
      return scheduleDate > now;
    }).length;
  }, [data.schedules]);

  const expiringCoursesCount = useMemo(() => {
    if (!data.schedules) return 0;
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return data.schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.endDate);
      return scheduleDate >= now && scheduleDate <= thirtyDaysFromNow;
    }).length;
  }, [data.schedules]);
  
  // Gestione errori GDPR
  useEffect(() => {
    if (gdprError && !hasActiveConsent) {
      setShowGdprError(true);
    } else {
      setShowGdprError(false);
    }
  }, [gdprError, hasActiveConsent]);
  
  // Rendering del loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Panoramica generale delle attività di formazione
          </p>
        </div>
        
        {/* Errore GDPR */}
        {showGdprError && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Consenso GDPR Richiesto
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  È necessario fornire il consenso per il trattamento dei dati per visualizzare il dashboard completo.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Errore generale */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Errore nel caricamento
                </h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Stats Cards */}
        <DashboardStats 
          counters={{
            totalCompanies: data.counters?.totalCompanies || 0,
            totalEmployees: data.counters?.totalEmployees || 0
          }}
          calendarEvents={data.schedules?.map(schedule => ({
            id: schedule.id,
            title: schedule.title || 'Corso',
            start: new Date(schedule.startDate),
            end: new Date(schedule.endDate),
            scheduleId: schedule.id,
            status: schedule.status
          })) || []}
        />
        
        {/* Layout principale */}
        <div className="mt-8 space-y-8">
          {/* Calendario - Full width */}
          <div className="w-full">
            <DashboardCalendar 
              schedulesData={data.schedules || []}
              onScheduleCreate={async (scheduleData: any) => {
                // Implementazione placeholder per la creazione di schedule
                console.log('Creating schedule:', scheduleData);
              }}
            />
          </div>
          
          {/* Grafici - Full width */}
          <div className="w-full">
            <DashboardCharts />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;