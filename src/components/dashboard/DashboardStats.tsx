/**
 * DashboardStats Component
 * Gestisce la visualizzazione delle statistiche principali della dashboard
 * Estratto dal Dashboard.tsx monolitico per migliorare la modularità
 */

import React from 'react';
import {
  Building2,
  Calendar,
  GraduationCap,
  Users
} from 'lucide-react';
import StatCard from './StatCard';
import { ScheduleEvent } from './ScheduleCalendar';

interface DashboardStatsProps {
  counters: {
    totalCompanies: number;
    totalEmployees: number;
  };
  calendarEvents: ScheduleEvent[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  counters,
  calendarEvents
}) => {
  // Calcola i corsi programmati futuri
  const calculateFutureCourses = () => {
    const now = new Date();
    // Raggruppa per scheduleId per evitare duplicati
    const firstSessionBySchedule: Record<string, ScheduleEvent> = {};
    
    calendarEvents.forEach(event => {
      if (!event.scheduleId) return;
      
      if (!firstSessionBySchedule[event.scheduleId] || 
          event.start < firstSessionBySchedule[event.scheduleId].start) {
        firstSessionBySchedule[event.scheduleId] = event;
      }
    });
    
    return Object.values(firstSessionBySchedule)
      .filter(event => event.start > now)
      .length;
  };

  const futureCoursesCount = calculateFutureCourses();

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <StatCard 
        title="Totale Aziende" 
        value={counters.totalCompanies.toString()} 
        icon={<Building2 className="h-7 w-7 text-blue-500" />} 
        trend=""
        trendDirection="up"
      />
      
      <StatCard 
        title="Totale Dipendenti" 
        value={counters.totalEmployees.toString()} 
        icon={<Users className="h-7 w-7 text-green-500" />} 
        trend=""
        trendDirection="up"
      />
      
      <StatCard 
        title="Corsi Programmati Futuri" 
        value={futureCoursesCount.toString()}
        icon={<GraduationCap className="h-7 w-7 text-amber-500" />} 
        trend=""
        trendDirection="up"
      />
      
      <StatCard 
        title="Corsi in Scadenza" 
        value="0" 
        icon={<Calendar className="h-7 w-7 text-red-500" />} 
        trend=""
        trendDirection="up"
      />
    </div>
  );
};

export default DashboardStats;