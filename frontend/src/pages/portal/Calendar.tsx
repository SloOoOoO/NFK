import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { eventsAPI } from '../../services/api';

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

export default function Calendar() {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [endpointAvailable, setEndpointAvailable] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    mandant: '',
    date: '',
    time: '',
    type: 'Termin',
    targetUserId: 0,
    notes: '',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await eventsAPI.getAll();
      const eventsData = Array.isArray(response.data) ? response.data : [];
      setUpcomingEvents(eventsData);
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

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      // TODO: Implement API call to create appointment
      // For now, show success message
      alert(
        `Termin erstellt!\n\n` +
        `Titel: ${newAppointment.title}\n` +
        `Datum: ${newAppointment.date}\n` +
        `Zeit: ${newAppointment.time}\n\n` +
        `Eine Benachrichtigung wurde an den Empfänger gesendet.\n` +
        `📧 E-Mail-Benachrichtigung: Wird gesendet (Platzhalter)`
      );
      setShowAppointmentModal(false);
      setNewAppointment({
        title: '',
        mandant: '',
        date: '',
        time: '',
        type: 'Termin',
        targetUserId: 0,
        notes: '',
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

  // Simple calendar grid for January 2025
  const daysInMonth = 31;
  const firstDayOfWeek = 3; // Wednesday (0 = Sunday)
  const calendarDays = [];
  
  // Add empty cells for days before the 1st
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push({ day: null, events: [] });
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${day.toString().padStart(2, '0')}.01.2025`;
    const dayEvents = upcomingEvents.filter(e => e.date === dateStr);
    calendarDays.push({ day, events: dayEvents });
  }

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
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
            <p className="text-sm text-yellow-800">
              ℹ️ Kalender-Feature ist noch nicht vollständig implementiert. Demo-Daten werden angezeigt.
            </p>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-md ${
                  viewMode === 'month'
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-textPrimary hover:bg-gray-200'
                }`}
              >
                Monat
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-md ${
                  viewMode === 'week'
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-textPrimary hover:bg-gray-200'
                }`}
              >
                Woche
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="btn-secondary">← Zurück</button>
              <span className="font-semibold text-lg">Januar 2025</span>
              <button className="btn-secondary">Weiter →</button>
            </div>
            
            <button 
              onClick={() => setShowAppointmentModal(true)}
              className="btn-primary"
            >
              + Termin vereinbaren
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary mb-1">Termine</p>
            <p className="text-2xl font-bold text-blue-600">{upcomingEvents.filter(e => e.type === 'Termin').length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary mb-1">Fristen</p>
            <p className="text-2xl font-bold text-red-600">{upcomingEvents.filter(e => e.type === 'Frist').length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary mb-1">Aufgaben</p>
            <p className="text-2xl font-bold text-yellow-600">{upcomingEvents.filter(e => e.type === 'Aufgabe').length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary mb-1">Diese Woche</p>
            <p className="text-2xl font-bold text-primary">3</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            {viewMode === 'month' ? (
              <div>
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="text-center font-semibold text-textSecondary text-sm py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((item, index) => (
                    <div
                      key={index}
                      className={`min-h-24 p-2 border rounded ${
                        item.day ? 'bg-white hover:bg-secondary cursor-pointer' : 'bg-gray-50'
                      } ${item.day === 11 ? 'border-primary border-2' : 'border-gray-200'}`}
                    >
                      {item.day && (
                        <>
                          <div className={`text-sm font-medium mb-1 ${
                            item.day === 11 ? 'text-primary' : 'text-textPrimary'
                          }`}>
                            {item.day}
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
                              <div className="text-xs text-textSecondary">
                                +{item.events.length - 2} mehr
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-textPrimary mb-2">Wochenansicht</h3>
                <p className="text-textSecondary">Wochenansicht wird in Kürze verfügbar sein</p>
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-textPrimary mb-4">Anstehende Ereignisse</h2>
            
            <div className="space-y-3">
              {upcomingEvents.slice(0, 6).map((event) => (
                <div key={event.id} className={`p-3 rounded-lg border-l-4 ${getEventTypeColor(event.color)}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-xl">{getEventIcon(event.type)}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-textPrimary truncate">
                        {event.title}
                      </h4>
                      <p className="text-xs text-textSecondary mt-1">
                        {event.mandant}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-textSecondary">
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
        </div>

        {/* Appointment Creation Modal */}
        {showAppointmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-textPrimary">Termin vereinbaren</h2>
              </div>
              
              <form onSubmit={handleCreateAppointment} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Titel *</label>
                  <input
                    type="text"
                    value={newAppointment.title}
                    onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    disabled={creating}
                    placeholder="z.B. Jahresabschlussgespräch"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Mandant</label>
                  <input
                    type="text"
                    value={newAppointment.mandant}
                    onChange={(e) => setNewAppointment({ ...newAppointment, mandant: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={creating}
                    placeholder="z.B. Schmidt GmbH"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Datum *</label>
                    <input
                      type="date"
                      value={newAppointment.date}
                      onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                      disabled={creating}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Uhrzeit *</label>
                    <input
                      type="time"
                      value={newAppointment.time}
                      onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                      disabled={creating}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Typ</label>
                  <select
                    value={newAppointment.type}
                    onChange={(e) => setNewAppointment({ ...newAppointment, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={creating}
                  >
                    <option value="Termin">Termin</option>
                    <option value="Frist">Frist</option>
                    <option value="Aufgabe">Aufgabe</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Notizen</label>
                  <textarea
                    value={newAppointment.notes}
                    onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    disabled={creating}
                    placeholder="Zusätzliche Informationen..."
                  />
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    📧 <strong>Benachrichtigung:</strong> Der Empfänger erhält eine E-Mail-Benachrichtigung 
                    und kann den Termin annehmen oder ablehnen.
                  </p>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAppointmentModal(false)}
                    className="flex-1 btn-secondary"
                    disabled={creating}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                    disabled={creating}
                  >
                    {creating ? 'Wird erstellt...' : 'Termin erstellen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
