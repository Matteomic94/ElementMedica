/**
 * DashboardCalendar Component
 * Gestisce la visualizzazione del calendario della dashboard
 * Estratto dal Dashboard.tsx monolitico per migliorare la modularità
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ScheduleCalendar, { ScheduleEvent } from './ScheduleCalendar';
import ScheduleEventModalLazy from '../schedules/ScheduleEventModal.lazy';
import { checkConsent as checkGdprConsent, logGdprAction, ConsentRequiredError } from '../../utils/gdpr';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';

// Interfaces necessarie per il calendario
interface DashboardCompany {
  id: string;
  name: string;
  ragioneSociale: string;
  sector?: string;
}

interface DashboardTrainer {
  id: string;
  firstName: string;
  lastName: string;
}

interface DashboardSchedule {
  id: string;
  courseId: string;
  course?: {
    id: string;
    title?: string;
    name?: string;
  };
  startDate: string;
  endDate: string;
  location?: string;
  status: string;
  companies?: Array<{ company: DashboardCompany }>;
  sessions?: Array<{
    id: string;
    date: string;
    start: string;
    end: string;
    trainer?: DashboardTrainer;
  }>;
}

interface DashboardCalendarProps {
  schedulesData: DashboardSchedule[];
  onScheduleCreate?: (data: any) => Promise<void>;
  className?: string;
}

// Helper function per combinare data e ora
function combineDateAndTime(dateStr: string, timeStr: string) {
  if (!dateStr || !timeStr) {
    console.warn('combineDateAndTime: missing date or time', { dateStr, timeStr });
    return new Date();
  }
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(dateStr);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

const DashboardCalendar: React.FC<DashboardCalendarProps> = ({
  schedulesData,
  onScheduleCreate,
  className = ""
}) => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const { hasPermission } = useAuth();
  
  const [calendarEvents, setCalendarEvents] = useState<ScheduleEvent[]>([]);
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [showForm, setShowForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
    isAllDay: boolean;
  } | null>(null);

  // Rimappa gli eventi ogni volta che cambia la vista o i dati
  useEffect(() => {
    if (!schedulesData.length) return;
    
    // Helper: group sessions by scheduleId+date for month view
    function groupSessionsByDay(schedules: DashboardSchedule[]) {
      const grouped: ScheduleEvent[] = [];
      schedules.forEach((s: DashboardSchedule) => {
        if (Array.isArray(s.sessions) && s.sessions.length > 0) {
          // Raggruppa per giorno
          const sessionsByDay: Record<string, DashboardSchedule['sessions'][0][]> = {};
          s.sessions.forEach((sess) => {
            const day = sess.date.split('T')[0];
            if (!sessionsByDay[day]) sessionsByDay[day] = [];
            sessionsByDay[day].push(sess);
          });
          
          Object.entries(sessionsByDay).forEach(([day, sessions]) => {
            // Tooltip con tutte le sessioni (HTML)
            const allSessions = s.sessions || [];
            const sessioniTooltipHtml = allSessions.map((ss, i: number) => {
              const dateStr = new Date(ss.date).toLocaleDateString('it-IT');
              const orario = `${ss.start || '--:--'} - ${ss.end || '--:--'}`;
              const trainer = ss.trainer ? ` (${ss.trainer.firstName} ${ss.trainer.lastName})` : '';
              return `<span style='color:#2563eb;font-weight:700'>Sessione ${i+1}: ${dateStr}, ${orario}${trainer}</span>`;
            }).join('<br>');
            
            // Aziende senza duplicati
            const aziende = [...new Set((s.companies || []).map((c) => c.company?.ragioneSociale || c.company?.name))].join(', ');
            
            const sortedSessions = sessions && sessions.length > 0 ? [...sessions].sort((a, b) => a.start.localeCompare(b.start)) : [];
            const start = combineDateAndTime(day, sortedSessions[0]?.start || '09:00');
            const end = combineDateAndTime(day, sortedSessions[sessions.length-1]?.end || '17:00');
            
            // Titolo: aggiungi " - Sessione X" solo se ci sono sessioni in giorni diversi
            let title = `${s.course?.title || s.course?.name || 'Corso'}`;
            const allSameDay = allSessions.every((ss) => ss.date.split('T')[0] === day);
            if (!allSameDay && allSessions.length > 1) {
              const idx = allSessions.findIndex((ss) => ss.date.split('T')[0] === day);
              if (idx !== -1) title += ` - Sessione ${idx + 1}`;
            }
            
            grouped.push({
              id: s.id + '-' + day,
              scheduleId: s.id,
              title,
              start,
              end,
              resource: s as any,
              status: s.status,
              tooltip: `Corso: ${s.course?.title || s.course?.name}\nAziende: ${aziende}\nLuogo: ${s.location || '-'}\nData: ${new Date(day).toLocaleDateString('it-IT')}\nStato: ${s.status}`,
              sessioniTooltipHtml
            });
          });
        } else {
          // fallback: usa startDate/endDate della schedule
          const aziende = [...new Set((s.companies || []).map((c: any) => c.company?.ragioneSociale || c.company?.name))].join(', ');
          grouped.push({
            id: s.id,
            scheduleId: s.id,
            title: s.course?.title || s.course?.name || 'Corso',
            start: new Date(s.startDate),
            end: new Date(s.endDate),
            resource: s as any,
            status: s.status,
            tooltip: `Corso: ${s.course?.title || s.course?.name}\nAziende: ${aziende}\nLuogo: ${s.location || '-'}\nData: ${s.startDate ? new Date(s.startDate).toLocaleDateString('it-IT') : '-'}\nOrario: --:--\nStato: ${s.status}`,
            sessioniTooltipHtml: ''
          });
        }
      });
      return grouped;
    }
    
    // Helper: eventi separati per sessione (settimana/giorno)
    function mapSessionsIndividually(schedules: any[]) {
      return schedules.flatMap((s: any) => {
        if (Array.isArray(s.sessions) && s.sessions.length > 0) {
          return s.sessions.map((sess: any, idx: number) => {
            const start = new Date(combineDateAndTime(sess.date, sess.start));
            const end = new Date(combineDateAndTime(sess.date, sess.end));
            const allSessions = s.sessions;
            const allSameDay = allSessions.every((ss: any) => ss.date.split('T')[0] === sess.date.split('T')[0]);
            
            let sessionTitle = s.course?.title || s.course?.name || 'Corso';
            if (!allSameDay && allSessions.length > 1) {
              const sessionNumber = allSessions.findIndex((ss: any) => ss === sess) + 1;
              sessionTitle += ` - Sessione ${sessionNumber}`;
            }
            
            const sessioniTooltipHtml = allSessions.map((ss: any, i: number) => {
              const dateStr = new Date(ss.date).toLocaleDateString('it-IT');
              const orario = `${ss.start || '--:--'} - ${ss.end || '--:--'}`;
              const trainer = ss.trainer ? ` (${ss.trainer.firstName} ${ss.trainer.lastName})` : '';
              const isCurrent = allSameDay || ss === sess;
              return `<span style='color:${isCurrent ? '#2563eb' : '#1e293b'};font-weight:${isCurrent ? 700 : 400}'>Sessione ${i+1}: ${dateStr}, ${orario}${trainer}</span>`;
            }).join('<br>');
            
            const aziende = [...new Set((s.companies || []).map((c: any) => c.company?.ragioneSociale || c.company?.name))].join(', ');
            
            return {
              id: s.id + '-' + (sess.id || idx),
              scheduleId: s.id,
              title: sessionTitle,
              start,
              end,
              allDay: false,
              resource: s,
              status: s.status,
              tooltip: `Corso: ${s.course?.title || s.course?.name}\nAziende: ${aziende}\nLuogo: ${s.location || '-'}\nData: ${new Date(sess.date).toLocaleDateString('it-IT')}\nStato: ${s.status}`,
              sessioniTooltipHtml
            };
          });
        } else {
          const aziende = [...new Set((s.companies || []).map((c: any) => c.company?.ragioneSociale || c.company?.name))].join(', ');
          return [{
            id: s.id,
            scheduleId: s.id,
            title: s.course?.title || s.course?.name || 'Corso',
            start: new Date(s.startDate),
            end: new Date(s.endDate),
            resource: s,
            status: s.status,
            tooltip: `Corso: ${s.course?.title || s.course?.name}\nAziende: ${aziende}\nLuogo: ${s.location || '-'}\nData: ${s.startDate ? new Date(s.startDate).toLocaleDateString('it-IT') : '-'}\nOrario: --:--\nStato: ${s.status}`,
            sessioniTooltipHtml: ''
          }];
        }
      });
    }
    
    // Scegli mapping in base alla vista (default: month)
    let events;
    if (calendarView === 'month') {
      events = groupSessionsByDay(schedulesData);
    } else {
      events = mapSessionsIndividually(schedulesData);
    }
    setCalendarEvents(events);
  }, [calendarView, schedulesData]);

  const handleCreateSchedule = useCallback(async (data: any) => {
    if (onScheduleCreate) {
      await onScheduleCreate(data);
      setShowForm(false);
      setSelectedSlot(null);
    }
  }, [onScheduleCreate]);

  return (
    <div className={className}>
      <ScheduleCalendar
        events={calendarEvents}
        onSelectEvent={(event) => {
          if (event.scheduleId) {
            navigate(`/schedules/${event.scheduleId}`);
          }
        }}
        onSelectSlot={(slotInfo) => {
          const start = slotInfo.start;
          const end = slotInfo.end;
          const isAllDay = start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 0 && end.getMinutes() === 0;
          setSelectedSlot({ start, end, isAllDay });
          setShowForm(true);
        }}
        view={calendarView}
        onView={(view: string) => setCalendarView(view as 'month' | 'week' | 'day')}
      />
      
      {/* Schedule Creation Modal */}
      {showForm && selectedSlot && (
        <ScheduleEventModalLazy
          trainings={[]}
          trainers={[]}
          companies={[]}
          persons={[]}
          onClose={() => {
            setShowForm(false);
            setSelectedSlot(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setSelectedSlot(null);
            if (onScheduleCreate) {
              // Refresh data after successful creation
            }
          }}
          initialDate={selectedSlot.start.toISOString().split('T')[0]}
          initialTime={{
            start: selectedSlot.isAllDay ? '09:00' : selectedSlot.start.toTimeString().slice(0, 5),
            end: selectedSlot.isAllDay ? '17:00' : selectedSlot.end.toTimeString().slice(0, 5)
          }}
        />
      )}
    </div>
  );
};

export default DashboardCalendar;