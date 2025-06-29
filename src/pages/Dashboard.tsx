import React, { useState, useEffect } from 'react';
import { Users, Building2, GraduationCap, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { dummyData } from '../data/dummyData';
import StatCard from '../components/dashboard/StatCard';
import ScheduleCalendar, { ScheduleEvent } from '../components/dashboard/ScheduleCalendar';
import ScheduleEventModalLazy from '../components/schedules/ScheduleEventModal.lazy';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { Company, Employee, Course } from '../types';

// Interfaccia estesa per la dashboard che include campi aggiuntivi
interface DashboardCompany extends Partial<Company> {
  id: string;
  name: string;
  employeeCount?: number;
  ragione_sociale: string; // Campo obbligatorio per compatibilità con ScheduleEventModal
  sector?: string;
}

interface DashboardTrainer {
  id: string;
  first_name: string; // Campo obbligatorio per compatibilità con ScheduleEventModal
  last_name: string; // Campo obbligatorio per compatibilità con ScheduleEventModal
  firstName?: string; // Per compatibilità con i tipi definiti
  lastName?: string; // Per compatibilità con i tipi definiti
}

// Interfaccia per i dati dummy
interface DummyData {
  companies: any[];
  employees: any[];
  courses: any[];
  schedules?: any[];
}

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Funzione helper per combinare data e ora in modo robusto
function combineDateAndTime(dateStr: string, timeStr: string) {
  const [year, month, day] = dateStr.split('T')[0].split('-');
  const [hour, minute] = timeStr.split(':');
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  );
}

const Dashboard: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date; isAllDay?: boolean } | null>(null);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [trainersList, setTrainersList] = useState<DashboardTrainer[]>([]);
  const [companiesList, setCompaniesList] = useState<DashboardCompany[]>([]);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<ScheduleEvent[]>([]);
  const [schedulesData, setSchedulesData] = useState<any[]>([]); // per rimappare quando cambia vista
  const [calendarView, setCalendarView] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch real data instead of using dummyData
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Utilizzo un timeout per evitare blocchi prolungati
        const fetchWithTimeout = async (url: string, timeout = 5000) => {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), timeout);
          
          try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(id);
            if (!response.ok) {
              throw new Error(`HTTP error: ${response.status}`);
            }
            return response.json();
          } catch (error) {
            clearTimeout(id);
            console.error(`Errore nel recupero da ${url}:`, error);
            throw error;
          }
        };
        
        // Prova a recuperare i dati con gestione degli errori per ogni chiamata
        let coursesData = [], trainersData = [], companiesData = [], employeesData = [], schedulesData = [];
        
        try {
          coursesData = await fetchWithTimeout(`${API_BASE_URL}/courses`);
          console.log('Dati corsi recuperati:', coursesData.length);
        } catch (error) {
          console.warn('Impossibile recuperare i corsi, uso dati dummy', error);
          coursesData = (dummyData as any).courses || [];
        }
        
        try {
          trainersData = await fetchWithTimeout(`${API_BASE_URL}/trainers`);
          console.log('Dati formatori recuperati:', trainersData.length);
        } catch (error) {
          console.warn('Impossibile recuperare i formatori, uso dati dummy', error);
          trainersData = (dummyData as any).employees?.map((e: any) => ({
            id: e.id,
            first_name: e.firstName || '', // Garantisco sempre una stringa
            last_name: e.lastName || '',   // Garantisco sempre una stringa
            firstName: e.firstName,
            lastName: e.lastName
          })) || [];
        }
        
        try {
          companiesData = await fetchWithTimeout(`${API_BASE_URL}/companies`);
          console.log('Dati aziende recuperati:', companiesData.length);
        } catch (error) {
          console.warn('Impossibile recuperare le aziende, uso dati dummy', error);
          companiesData = (dummyData as any).companies || [];
        }
        
        try {
          employeesData = await fetchWithTimeout(`${API_BASE_URL}/employees`);
          console.log('Dati dipendenti recuperati:', employeesData.length);
        } catch (error) {
          console.warn('Impossibile recuperare i dipendenti, uso dati dummy', error);
          employeesData = (dummyData as any).employees || [];
        }
        
        // Add employeeCount and sector to each company
        const companiesWithCounts = companiesData.map((company: any) => ({
          ...company,
          employeeCount: employeesData.filter((e: any) => e.companyId === company.id || e.company_id === company.id).length,
          sector: company.industry || company.sector || company.type || '',
          // Assicura compatibilità con API legacy
          ragione_sociale: company.ragione_sociale || company.name || '' // Garantisco sempre una stringa
        }));
        
        setCoursesList(coursesData);
        setTrainersList(trainersData);
        setCompaniesList(companiesWithCounts);
        setEmployeesList(employeesData);
        
        // Fetch scheduled courses for calendar
        try {
          schedulesData = await fetchWithTimeout(`${API_BASE_URL}/schedules`);
          console.log('Dati pianificazioni recuperati:', schedulesData.length);
          setSchedulesData(schedulesData);
        } catch (error) {
          console.warn('Impossibile recuperare le pianificazioni, uso dati dummy', error);
          setSchedulesData((dummyData as any).schedules || []);
        }
        
      } catch (error) {
        console.error('Errore generale nel caricamento dei dati:', error);
        setError(error instanceof Error ? error.message : 'Errore di connessione al server');
        // Usa i dati di fallback se disponibili
        if (dummyData) {
          console.log('Utilizzo dati dummy completi a causa di errori');
          // Usa il cast per evitare errori di tipo con i dati dummy
          const dummyDataTyped = dummyData as unknown as DummyData;
          setCoursesList(dummyDataTyped.courses || []);
          setTrainersList(dummyDataTyped.employees?.map(e => ({
            id: e.id,
            first_name: e.firstName || '', // Garantisco sempre una stringa
            last_name: e.lastName || '',   // Garantisco sempre una stringa
            firstName: e.firstName,
            lastName: e.lastName
          })) || []);
          setCompaniesList(dummyDataTyped.companies?.map(c => ({
            ...c,
            ragione_sociale: c.name || ''  // Garantisco sempre una stringa
          })) || []);
          setEmployeesList(dummyDataTyped.employees || []);
          setSchedulesData(dummyDataTyped.schedules || []);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Rimappa gli eventi ogni volta che cambia la vista o i dati
  useEffect(() => {
    if (!schedulesData.length) return;
    // Helper: group sessions by scheduleId+date for month view
    function groupSessionsByDay(schedules: any[]) {
      const grouped: any[] = [];
      schedules.forEach((s: any) => {
        if (Array.isArray(s.sessions) && s.sessions.length > 0) {
          // Raggruppa per giorno
          const sessionsByDay: Record<string, any[]> = {};
          s.sessions.forEach((sess: any) => {
            const day = sess.date.split('T')[0];
            if (!sessionsByDay[day]) sessionsByDay[day] = [];
            sessionsByDay[day].push(sess);
          });
          Object.entries(sessionsByDay).forEach(([day, sessions]) => {
            // Tooltip con tutte le sessioni (HTML)
            const allSessions = s.sessions;
            const sessioniTooltipHtml = allSessions.map((ss: any, i: number) => {
              const dateStr = new Date(ss.date).toLocaleDateString('it-IT');
              const orario = `${ss.start || '--:--'} - ${ss.end || '--:--'}`;
              const trainer = ss.trainer ? ` (${ss.trainer.first_name} ${ss.trainer.last_name})` : '';
              return `<span style='color:#2563eb;font-weight:700'>Sessione ${i+1}: ${dateStr}, ${orario}${trainer}</span>`;
            }).join('<br>');
            // Aziende senza duplicati
            const aziende = [...new Set((s.companies || []).map((c: any) => c.company?.ragione_sociale || c.company?.name))].join(', ');
            // Orari del giorno
            const orari = sessions.map((sess: any, idx: number) => `Sessione ${idx + 1}: ${sess.start || '--:--'} - ${sess.end || '--:--'}${sess.trainer ? ' (' + sess.trainer.first_name + ' ' + sess.trainer.last_name + ')' : ''}`).join('\n');
            const sortedSessions = [...sessions].sort((a, b) => a.start.localeCompare(b.start));
            const start = combineDateAndTime(day, sortedSessions[0].start);
            const end = combineDateAndTime(day, sortedSessions[sessions.length-1].end);
            // Titolo: aggiungi " - Sessione X" solo se ci sono sessioni in giorni diversi
            let title = `${s.course?.title || s.course?.name || 'Corso'}`;
            const allSameDay = allSessions.every((ss: any) => ss.date.split('T')[0] === day);
            if (!allSameDay && allSessions.length > 1) {
              // Trova la sessione corrispondente a questo giorno
              const idx = allSessions.findIndex((ss: any) => ss.date.split('T')[0] === day);
              if (idx !== -1) title += ` - Sessione ${idx + 1}`;
            }
            grouped.push({
              id: s.id + '-' + day,
              scheduleId: s.id,
              title,
              start,
              end,
              resource: s,
              status: s.status,
              tooltip: `Corso: ${s.course?.title || s.course?.name}\nAziende: ${aziende}\nLuogo: ${s.location || '-'}\nData: ${new Date(day).toLocaleDateString('it-IT')}\nStato: ${s.status}`,
              sessioniTooltipHtml
            });
          });
        } else {
          // fallback: usa start_date/end_date della schedule
          const aziende = [...new Set((s.companies || []).map((c: any) => c.company?.ragione_sociale || c.company?.name))].join(', ');
          grouped.push({
            id: s.id,
            scheduleId: s.id,
            title: s.course?.title || s.course?.name || 'Corso',
            start: new Date(s.start_date),
            end: new Date(s.end_date),
            resource: s,
            status: s.status,
            tooltip: `Corso: ${s.course?.title || s.course?.name}\nAziende: ${aziende}\nLuogo: ${s.location || '-'}\nData: ${s.start_date ? new Date(s.start_date).toLocaleDateString('it-IT') : '-'}\nOrario: --:--\nStato: ${s.status}`,
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
            let sessionNumber = '';
            if (!allSameDay && allSessions.length > 1) {
              sessionNumber = ` - Sessione ${allSessions.findIndex((ss: any) => ss === sess) + 1}`;
              sessionTitle += sessionNumber;
            }
            const sessioniTooltipHtml = allSessions.map((ss: any, i: number) => {
              const dateStr = new Date(ss.date).toLocaleDateString('it-IT');
              const orario = `${ss.start || '--:--'} - ${ss.end || '--:--'}`;
              const trainer = ss.trainer ? ` (${ss.trainer.first_name} ${ss.trainer.last_name})` : '';
              const isCurrent = allSameDay || ss === sess;
              return `<span style='color:${isCurrent ? '#2563eb' : '#1e293b'};font-weight:${isCurrent ? 700 : 400}'>Sessione ${i+1}: ${dateStr}, ${orario}${trainer}</span>`;
            }).join('<br>');
            const aziende = [...new Set((s.companies || []).map((c: any) => c.company?.ragione_sociale || c.company?.name))].join(', ');
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
          const aziende = [...new Set((s.companies || []).map((c: any) => c.company?.ragione_sociale || c.company?.name))].join(', ');
          return [{
            id: s.id,
            scheduleId: s.id,
            title: s.course?.title || s.course?.name || 'Corso',
            start: new Date(s.start_date),
            end: new Date(s.end_date),
            resource: s,
            status: s.status,
            tooltip: `Corso: ${s.course?.title || s.course?.name}\nAziende: ${aziende}\nLuogo: ${s.location || '-'}\nData: ${s.start_date ? new Date(s.start_date).toLocaleDateString('it-IT') : '-'}\nOrario: --:--\nStato: ${s.status}`,
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

  const handleCreateSchedule = async (data: any) => {
    try {
      const response = await fetch('/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create schedule');
      setShowForm(false);
      setSelectedSlot(null);
      // Refresh the calendar data here
    } catch (error) {
      // RIMOSSO: console.error('Error creating schedule:', error);
    }
  };

  // Chart data
  const doughnutData = {
    labels: ['Complete', 'In Progress', 'Not Started'],
    datasets: [
      {
        data: [65, 25, 10],
        backgroundColor: ['#4ade80', '#facc15', '#f87171'],
        borderColor: ['#4ade80', '#facc15', '#f87171'],
        borderWidth: 1,
      },
    ],
  };

  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'New Employees',
        data: [12, 19, 8, 15, 12, 18],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
      {
        label: 'Completed Courses',
        data: [7, 11, 5, 8, 3, 14],
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Welcome to your occupational medicine management dashboard.</p>
        {error && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            <p className="flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>Si è verificato un errore: {error}</span>
            </p>
            <p className="text-sm mt-1">L'applicazione sta utilizzando dati di esempio. Verifica la connessione al server.</p>
          </div>
        )}
      </div>

      {/* Stats Cards - moved above calendar */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Totale Aziende" 
          value={companiesList.length.toString()} 
          icon={<Building2 className="h-7 w-7 text-blue-500" />} 
          trend=""
          trendDirection="up"
        />
        <StatCard 
          title="Totale Dipendenti" 
          value={employeesList.length.toString()} 
          icon={<Users className="h-7 w-7 text-green-500" />} 
          trend=""
          trendDirection="up"
        />
        <StatCard 
          title="Corsi Programmati Futuri" 
          value={(() => {
            // Conta solo le schedule la cui PRIMA sessione è futura (una per scheduled-course)
            const now = new Date();
            // Raggruppa per scheduleId
            const firstSessionBySchedule: Record<string, ScheduleEvent> = {};
            calendarEvents.forEach(e => {
              if (!e.scheduleId) return;
              if (!firstSessionBySchedule[e.scheduleId] || e.start < firstSessionBySchedule[e.scheduleId].start) {
                firstSessionBySchedule[e.scheduleId] = e;
              }
            });
            const futureCount = Object.values(firstSessionBySchedule).filter((e) => e.start > now).length;
            return futureCount.toString();
          })()}
          icon={<GraduationCap className="h-7 w-7 text-amber-500" />} 
          trend=""
          trendDirection="up"
        />
        <StatCard 
          title="Corsi in Scadenza" 
          value={"0"} 
          icon={<Calendar className="h-7 w-7 text-red-500" />} 
          trend=""
          trendDirection="up"
        />
      </div>

      {/* Calendar Section - now below stats */}
      <ScheduleCalendar
        events={calendarEvents}
        eventPropGetter={(event) => {
          let bg = '#f3f4f6';
          if (event.status === 'Preventivo') bg = '#fef9c3';
          else if (event.status === 'Confermato') bg = '#fef3c7';
          else if (event.status === 'Fatturato') bg = '#dbeafe';
          else if (event.status === 'Pagato') bg = '#bbf7d0';
          return {
            style: {
              backgroundColor: bg,
              color: '#334155',
              borderRadius: '0.5rem',
              border: 'none',
              padding: '2px 8px',
              fontWeight: 400,
              fontSize: '0.85rem',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              cursor: 'pointer',
            }
          };
        }}
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
        onView={setCalendarView}
      />

      {/* Charts */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Training Status Overview</h2>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Statistics</h2>
          <div className="h-64">
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity and Alerts */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              View All
            </a>
          </div>
          <ul className="space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <li key={item} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-start">
                  <span className="flex items-center justify-center bg-blue-100 rounded-full w-8 h-8 mt-1">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </span>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-800">
                      {item % 2 === 0 
                        ? 'New employee added to Acme Corp' 
                        : 'Course completion updated for John Smith'}
                    </p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Alerts</h2>
            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              View All
            </a>
          </div>
          <ul className="space-y-4">
            {[1, 2, 3].map((item) => (
              <li key={item} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-start">
                  <span className="flex items-center justify-center bg-amber-100 rounded-full w-8 h-8 mt-1">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </span>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-800">
                      {item === 1 
                        ? '5 certifications expiring this month' 
                        : item === 2 
                          ? '3 employees need to complete required training' 
                          : 'Annual health checks due for Tech Solutions Inc.'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item === 1 ? 'High priority' : 'Medium priority'}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {showForm && (
        <ScheduleEventModalLazy
          trainings={coursesList.map((c: any) => ({ ...c, title: c.title || c.name }))}
          trainers={trainersList}
          companies={companiesList}
          employees={employeesList}
          existingEvent={undefined}
          initialDate={
            selectedSlot
              ? selectedSlot.start.getFullYear() +
                '-' +
                String(selectedSlot.start.getMonth() + 1).padStart(2, '0') +
                '-' +
                String(selectedSlot.start.getDate()).padStart(2, '0')
              : undefined
          }
          initialTime={selectedSlot
            ? selectedSlot.isAllDay
              ? { start: '09:00', end: '13:00' }
              : {
                  start: selectedSlot.start.toTimeString().slice(0, 5),
                  end: selectedSlot.end.toTimeString().slice(0, 5),
                }
            : undefined}
          onClose={() => {
            setShowForm(false);
            setSelectedSlot(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setSelectedSlot(null);
            // Optionally refresh calendar data here
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;