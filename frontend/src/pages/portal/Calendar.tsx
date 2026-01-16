import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { eventsAPI, clientsAPI } from '../../services/api';
import * as Dialog from '@radix-ui/react-dialog';

interface Event {
  id: number;
  title: string;
  mandant: string;
  date: string;
  time: string;
  type: string;
  color: string;
  status?: 'pending' | 'accepted' | 'declined';
  targetUserId?: number;
}

interface Client {
  id: number;
  companyName: string;
  user?: {
    email: string;
  };
}

type DeadlineLoad = 'low' | 'medium' | 'high';
type DeadlineStatus = 'overdue' | 'today' | 'upcoming';

interface Deadline {
  id: number;
  clientName: string;
  type: string;
  hardDeadline: string; // ISO datetime string
  softDeadline: string; // ISO datetime string
  status: DeadlineStatus;
  description?: string;
}

interface DayDeadlines {
  date: string; // YYYY-MM-DD format
  load: DeadlineLoad;
  deadlines: Deadline[];
}

export default function Calendar() {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [endpointAvailable, setEndpointAvailable] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [newAppointment, setNewAppointment] = useState({
    clientId: 0,
    title: '',
    date: '',
    time: '',
    description: '',
    location: '',
  });
  
  // New state for traffic light calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [deadlineData, setDeadlineData] = useState<Map<string, DayDeadlines>>(new Map());

  useEffect(() => {
    fetchEvents();
    fetchClients();
    fetchDeadlineData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      setClients(response.data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  // Mock function to simulate deadline data fetching
  // TODO: Replace with real API call when backend is ready:
  // const response = await deadlinesAPI.getCalendarData(
  //   `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
  // );
  // const deadlineMap = new Map<string, DayDeadlines>();
  // response.data.forEach((day: DayDeadlines) => deadlineMap.set(day.date, day));
  // setDeadlineData(deadlineMap);
  const fetchDeadlineData = async () => {
    try {
      // Simulate API call
      const mockDeadlines = generateMockDeadlineData(currentMonth);
      const deadlineMap = new Map<string, DayDeadlines>();
      
      mockDeadlines.forEach(day => {
        deadlineMap.set(day.date, day);
      });
      
      setDeadlineData(deadlineMap);
    } catch (err) {
      console.error('Error fetching deadline data:', err);
    }
  };

  // Generate mock deadline data for a given month
  const generateMockDeadlineData = (month: Date): DayDeadlines[] => {
    const year = month.getFullYear();
    const monthNum = month.getMonth();
    const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
    const mockData: DayDeadlines[] = [];

    // Generate realistic deadline data
    const clientNames = ['Schmidt GmbH', 'Müller & Partner', 'Koch Consulting', 'Becker Handels AG', 'Weber Industries'];
    const deadlineTypes = ['Umsatzsteuervoranmeldung', 'Jahresabschluss', 'Lohnsteueranmeldung', 'Quartalsabschluss', 'Betriebsprüfung'];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthNum + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const numDeadlines = Math.floor(Math.random() * 8); // 0-7 deadlines per day
      
      const deadlines: Deadline[] = [];
      for (let i = 0; i < numDeadlines; i++) {
        const isOverdue = day < new Date().getDate() && monthNum === new Date().getMonth();
        const isToday = day === new Date().getDate() && monthNum === new Date().getMonth();
        
        deadlines.push({
          id: day * 100 + i,
          clientName: clientNames[Math.floor(Math.random() * clientNames.length)],
          type: deadlineTypes[Math.floor(Math.random() * deadlineTypes.length)],
          hardDeadline: `${dateStr}T${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:00:00`,
          softDeadline: `${dateStr}T${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:00:00`,
          status: isOverdue ? 'overdue' : isToday ? 'today' : 'upcoming',
          description: 'Frist einhalten',
        });
      }

      // Determine load based on number of deadlines
      let load: DeadlineLoad;
      if (numDeadlines > 5) load = 'high';
      else if (numDeadlines >= 3) load = 'medium';
      else load = 'low';

      if (numDeadlines > 0) {
        mockData.push({ date: dateStr, load, deadlines });
      }
    }

    return mockData;
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await eventsAPI.getAll();
      const eventsData = Array.isArray(response.data) ? response.data : [];
      
      // Transform backend data to frontend format
      const transformedEvents = eventsData.map((event: any) => ({
        id: event.id,
        title: event.title,
        mandant: event.mandant,
        date: formatDateToDDMMYYYY(new Date(event.date)),
        time: event.time,
        type: event.type,
        color: getColorForType(event.type),
        status: 'accepted' as const,
      }));
      
      setUpcomingEvents(transformedEvents);
      setEndpointAvailable(true);
    } catch (err: any) {
      console.log('Events endpoint not available:', err);
      setEndpointAvailable(false);
      // Use demo data
      setUpcomingEvents([
        { id: 1, title: 'Jahresabschluss Besprechung', mandant: 'Schmidt GmbH', date: '15.01.2025', time: '10:00', type: 'Termin', color: 'blue', status: 'accepted' },
        { id: 2, title: 'Frist: Umsatzsteuervoranmeldung', mandant: 'Müller & Partner', date: '20.01.2025', time: '23:59', type: 'Frist', color: 'red' },
        { id: 3, title: 'Beratungsgespräch Investition', mandant: 'Koch Consulting', date: '18.01.2025', time: '14:30', type: 'Termin', color: 'blue', status: 'pending' },
        { id: 4, title: 'DATEV Export Deadline', mandant: 'System', date: '22.01.2025', time: '18:00', type: 'Aufgabe', color: 'yellow' },
        { id: 5, title: 'Betriebsprüfung Vorbereitung', mandant: 'Becker Handels AG', date: '25.01.2025', time: '09:00', type: 'Termin', color: 'blue', status: 'accepted' },
        { id: 6, title: 'Quartalsabschluss Deadline', mandant: 'Schmidt GmbH', date: '30.01.2025', time: '23:59', type: 'Frist', color: 'red' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDateToDDMMYYYY = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const getColorForType = (type: string): string => {
    switch (type) {
      case 'Termin':
        return 'blue';
      case 'Frist':
        return 'red';
      case 'Aufgabe':
        return 'yellow';
      default:
        return 'blue';
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      // Get selected client email
      const selectedClient = clients.find(c => c.id === newAppointment.clientId);
      const clientEmail = selectedClient?.user?.email || 'unknown@example.com';

      // Create appointment via API
      await eventsAPI.create({
        clientId: newAppointment.clientId,
        title: newAppointment.title,
        description: newAppointment.description,
        date: newAppointment.date,
        time: newAppointment.time,
        location: newAppointment.location,
      });

      // Log email notification
      console.log(`Email notification would be sent to: ${clientEmail}`);

      // Show success message
      setSuccessMessage('Termin wurde erfolgreich erstellt!');
      setTimeout(() => setSuccessMessage(''), 3000);

      // Close modal and reset form
      setShowAppointmentModal(false);
      setNewAppointment({
        clientId: 0,
        title: '',
        date: '',
        time: '',
        description: '',
        location: '',
      });

      // Refresh events
      await fetchEvents();
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      alert('Fehler beim Erstellen des Termins');
    } finally {
      setCreating(false);
    }
  };

  const getEventTypeColor = (color: string) => {
    const colors: { [key: string]: string } = {
      'blue': 'bg-blue-100 text-blue-800 border-blue-300',
      'red': 'bg-red-100 text-red-800 border-red-300',
      'yellow': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'green': 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[color] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getEventIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'Termin': '📅',
      'Frist': '⏰',
      'Aufgabe': '✓',
    };
    return icons[type] || '📌';
  };

  // Get traffic light background color based on deadline load
  const getTrafficLightColor = (load: DeadlineLoad): string => {
    const colors = {
      low: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30',
      medium: 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30',
      high: 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30',
    };
    return colors[load];
  };

  // Get deadline status color
  const getDeadlineStatusColor = (status: DeadlineStatus): string => {
    const colors = {
      overdue: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      today: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
      upcoming: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    };
    return colors[status];
  };

  // Navigate to previous month
  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  // Handle day click
  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  // Format date for display
  const formatMonthYear = (date: Date): string => {
    const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
                        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Format time for display
  const formatTime = (isoDateTime: string): string => {
    const date = new Date(isoDateTime);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  // Simple calendar grid for January 2025
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const calendarDays = [];
  
  // Add empty cells for days before the 1st
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push({ day: null, events: [], dateStr: '' });
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const displayDateStr = `${day.toString().padStart(2, '0')}.${String(month + 1).padStart(2, '0')}.${year}`;
    const dayEvents = upcomingEvents.filter(e => e.date === displayDateStr);
    calendarDays.push({ day, events: dayEvents, dateStr });
  }

  // Get selected day's deadlines
  const selectedDayDeadlines = selectedDate ? deadlineData.get(selectedDate) : null;

  return (
    <div className="flex min-h-screen bg-secondary">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-textPrimary mb-2">Kalender</h1>
          <p className="text-textSecondary">Termine, Fristen und Aufgaben im Überblick</p>
        </div>

        {/* Info Banner if endpoint not available */}
        {!endpointAvailable && !loading && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ℹ️ Kalender-Feature ist noch nicht vollständig implementiert. Demo-Daten werden angezeigt.
            </p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 rounded-md">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ {successMessage}
            </p>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-md ${
                  viewMode === 'month'
                    ? 'bg-primary text-white'
                    : 'bg-secondary dark:bg-gray-700 text-textPrimary dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Monat
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-md ${
                  viewMode === 'week'
                    ? 'bg-primary text-white'
                    : 'bg-secondary dark:bg-gray-700 text-textPrimary dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Woche
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <button onClick={handlePreviousMonth} className="btn-secondary">← Zurück</button>
              <span className="font-semibold text-lg dark:text-gray-200">{formatMonthYear(currentMonth)}</span>
              <button onClick={handleNextMonth} className="btn-secondary">Weiter →</button>
            </div>
            
            <Dialog.Root open={showAppointmentModal} onOpenChange={setShowAppointmentModal}>
              <Dialog.Trigger asChild>
                <button className="btn-primary">
                  + Termin vereinbaren
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 z-50 max-h-[90vh] overflow-y-auto">
                  <Dialog.Title className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-textPrimary dark:text-gray-100">Termin vereinbaren</h2>
                  </Dialog.Title>
                  
                  <form onSubmit={handleCreateAppointment} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">Mandant *</label>
                      <select
                        value={newAppointment.clientId}
                        onChange={(e) => setNewAppointment({ ...newAppointment, clientId: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                        disabled={creating}
                      >
                        <option value="0">Mandant auswählen</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.companyName}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">Titel *</label>
                      <input
                        type="text"
                        value={newAppointment.title}
                        onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                        disabled={creating}
                        placeholder="z.B. Jahresabschlussgespräch"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">Datum *</label>
                        <input
                          type="date"
                          value={newAppointment.date}
                          onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                          required
                          disabled={creating}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">Uhrzeit *</label>
                        <input
                          type="time"
                          value={newAppointment.time}
                          onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                          required
                          disabled={creating}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">Beschreibung</label>
                      <textarea
                        value={newAppointment.description}
                        onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                        rows={3}
                        disabled={creating}
                        placeholder="Zusätzliche Informationen..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">Ort (optional)</label>
                      <input
                        type="text"
                        value={newAppointment.location}
                        onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={creating}
                        placeholder="z.B. Büro, Videoanruf"
                      />
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        📧 <strong>Benachrichtigung:</strong> Der Mandant erhält eine E-Mail-Benachrichtigung über den Termin.
                      </p>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <Dialog.Close asChild>
                        <button
                          type="button"
                          className="flex-1 btn-secondary"
                          disabled={creating}
                        >
                          Abbrechen
                        </button>
                      </Dialog.Close>
                      <button
                        type="submit"
                        className="flex-1 btn-primary"
                        disabled={creating}
                      >
                        {creating ? 'Wird erstellt...' : 'Termin erstellen'}
                      </button>
                    </div>
                  </form>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary dark:text-gray-400 mb-1">Termine</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{upcomingEvents.filter(e => e.type === 'Termin').length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary dark:text-gray-400 mb-1">Fristen</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{upcomingEvents.filter(e => e.type === 'Frist').length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary dark:text-gray-400 mb-1">Aufgaben</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{upcomingEvents.filter(e => e.type === 'Aufgabe').length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary dark:text-gray-400 mb-1">Diese Woche</p>
            <p className="text-2xl font-bold text-primary dark:text-blue-400">3</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <div className={`${selectedDate ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6`}>
            {viewMode === 'month' ? (
              <div>
                {/* Traffic light legend */}
                <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
                  <span className="font-semibold text-textPrimary dark:text-gray-200">Fristenlast:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-200 dark:bg-green-800"></div>
                    <span className="text-textSecondary dark:text-gray-400">0-2 Fristen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-200 dark:bg-orange-800"></div>
                    <span className="text-textSecondary dark:text-gray-400">3-5 Fristen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-200 dark:bg-red-800"></div>
                    <span className="text-textSecondary dark:text-gray-400">&gt;5 Fristen</span>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="text-center font-semibold text-textSecondary dark:text-gray-400 text-sm py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((item, index) => {
                    const dayDeadlines = item.dateStr ? deadlineData.get(item.dateStr) : null;
                    const load = dayDeadlines?.load || 'low';
                    const trafficLightColor = dayDeadlines ? getTrafficLightColor(load) : '';
                    const today = new Date();
                    const isToday = item.day === today.getDate() && 
                                   month === today.getMonth() && 
                                   year === today.getFullYear();
                    const isSelected = item.dateStr === selectedDate;
                    
                    return (
                      <div
                        key={index}
                        onClick={() => item.dateStr && handleDayClick(item.dateStr)}
                        className={`min-h-24 p-2 border rounded transition-all ${
                          item.day 
                            ? `${trafficLightColor || 'bg-white dark:bg-gray-800 hover:bg-secondary dark:hover:bg-gray-700'} cursor-pointer` 
                            : 'bg-gray-50 dark:bg-gray-900'
                        } ${isToday ? 'border-primary border-2 ring-2 ring-primary/20' : 'border-gray-200 dark:border-gray-700'}
                          ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
                      >
                        {item.day && (
                          <>
                            <div className="flex justify-between items-start mb-1">
                              <div className={`text-sm font-medium ${
                                isToday ? 'text-primary font-bold' : 'text-textPrimary dark:text-gray-200'
                              }`}>
                                {item.day}
                              </div>
                              {dayDeadlines && dayDeadlines.deadlines.length > 0 && (
                                <div className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                                  load === 'high' ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200' :
                                  load === 'medium' ? 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200' :
                                  'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                                }`}>
                                  {dayDeadlines.deadlines.length}
                                </div>
                              )}
                            </div>
                            <div className="space-y-1">
                              {item.events.slice(0, 2).map((event) => (
                                <div
                                  key={event.id}
                                  className={`text-xs px-1 py-0.5 rounded truncate ${getEventTypeColor(event.color)}`}
                                  title={event.title}
                                >
                                  {getEventIcon(event.type)} {event.title.substring(0, 10)}...
                                </div>
                              ))}
                              {item.events.length > 2 && (
                                <div className="text-xs text-textSecondary dark:text-gray-400">
                                  +{item.events.length - 2} mehr
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-textPrimary dark:text-gray-200 mb-2">Wochenansicht</h3>
                <p className="text-textSecondary dark:text-gray-400">Wochenansicht wird in Kürze verfügbar sein</p>
              </div>
            )}
          </div>

          {/* Upcoming Events / Selected Day Deadlines */}
          {selectedDate ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-textPrimary dark:text-gray-200">
                  Fristen am {new Date(selectedDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </h2>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Schließen"
                >
                  ✕
                </button>
              </div>
              
              {selectedDayDeadlines && selectedDayDeadlines.deadlines.length > 0 ? (
                <>
                  {/* Load indicator */}
                  <div className={`mb-4 p-3 rounded-lg border ${
                    selectedDayDeadlines.load === 'high' 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                      : selectedDayDeadlines.load === 'medium'
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200'
                      : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                  }`}>
                    <div className="font-semibold text-sm">
                      {selectedDayDeadlines.load === 'high' && '🔴 Hohe Auslastung'}
                      {selectedDayDeadlines.load === 'medium' && '🟠 Mittlere Auslastung'}
                      {selectedDayDeadlines.load === 'low' && '🟢 Geringe Auslastung'}
                    </div>
                    <div className="text-xs mt-1">
                      {selectedDayDeadlines.deadlines.length} Fristen
                      {selectedDayDeadlines.load === 'high' && ' - Keine neuen Termine empfohlen'}
                      {selectedDayDeadlines.load === 'medium' && ' - Begrenzte Kapazität'}
                      {selectedDayDeadlines.load === 'low' && ' - Kapazität verfügbar'}
                    </div>
                  </div>

                  {/* Deadline list */}
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {selectedDayDeadlines.deadlines.map((deadline) => (
                      <div
                        key={deadline.id}
                        className={`p-3 rounded-lg border ${getDeadlineStatusColor(deadline.status)}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg">⏰</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              {deadline.type}
                            </h4>
                            <p className="text-xs mt-1 font-semibold">
                              {deadline.clientName}
                            </p>
                            
                            <div className="mt-2 space-y-1 text-xs">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold">Hard Deadline:</span>
                                <span>{formatTime(deadline.hardDeadline)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-semibold">Soft Deadline:</span>
                                <span>{formatTime(deadline.softDeadline)}</span>
                              </div>
                            </div>

                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                deadline.status === 'overdue' 
                                  ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                                  : deadline.status === 'today'
                                  ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                              }`}>
                                {deadline.status === 'overdue' && '❗ Überfällig'}
                                {deadline.status === 'today' && '⚠️ Heute fällig'}
                                {deadline.status === 'upcoming' && '📅 Bevorstehend'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="text-4xl mb-2">📅</div>
                  <p className="text-textSecondary dark:text-gray-400">Keine Fristen an diesem Tag</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 lg:col-span-1">
              <h2 className="text-lg font-semibold text-textPrimary dark:text-gray-200 mb-4">Anstehende Ereignisse</h2>
              
              <div className="space-y-3">
                {upcomingEvents.slice(0, 6).map((event) => (
                  <div key={event.id} className={`p-3 rounded-lg border-l-4 ${getEventTypeColor(event.color)}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{getEventIcon(event.type)}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-textPrimary dark:text-gray-200 truncate">
                          {event.title}
                        </h4>
                        <p className="text-xs text-textSecondary dark:text-gray-400 mt-1">
                          {event.mandant}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-textSecondary dark:text-gray-400">
                          <span>📅 {event.date}</span>
                          <span>🕐 {event.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 btn-secondary text-sm">
                Alle Ereignisse anzeigen
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
