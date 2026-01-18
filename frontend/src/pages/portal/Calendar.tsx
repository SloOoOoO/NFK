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
  description?: string;
  location?: string;
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
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    date: '',
    time: '',
    description: '',
    location: '',
  });

  useEffect(() => {
    fetchEvents();
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      setClients(response.data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
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
        description: event.description || '',
        location: event.location || '',
        status: 'accepted' as const,
      }));
      
      setUpcomingEvents(transformedEvents);
      setEndpointAvailable(true);
    } catch (err: any) {
      console.log('Events endpoint not available:', err);
      setEndpointAvailable(false);
      setUpcomingEvents([]);
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
      'blue': 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
      'red': 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700',
      'yellow': 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
      'green': 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700',
    };
    return colors[color] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600';
  };

  const getEventIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'Termin': '📅',
      'Frist': '⏰',
      'Aufgabe': '✓',
    };
    return icons[type] || '📌';
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDetailModal(true);
  };

  const handleEditClick = () => {
    if (!selectedEvent) return;
    
    // Convert DD.MM.YYYY to YYYY-MM-DD for input[type="date"]
    const dateParts = selectedEvent.date.split('.');
    if (dateParts.length !== 3) {
      console.error('Invalid date format:', selectedEvent.date);
      alert('Ungültiges Datumsformat');
      return;
    }
    const [day, month, year] = dateParts;
    const isoDate = `${year}-${month}-${day}`;
    
    setEditForm({
      title: selectedEvent.title,
      date: isoDate,
      time: selectedEvent.time,
      description: selectedEvent.description || '',
      location: selectedEvent.location || '',
    });
    setShowEventDetailModal(false);
    setShowEditModal(true);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    
    setCreating(true);
    try {
      await eventsAPI.update(selectedEvent.id, {
        title: editForm.title,
        date: editForm.date,
        time: editForm.time,
        description: editForm.description,
        location: editForm.location,
      });
      
      setSuccessMessage('Ereignis wurde erfolgreich aktualisiert!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      setShowEditModal(false);
      setSelectedEvent(null);
      await fetchEvents();
    } catch (err: any) {
      console.error('Error updating event:', err);
      alert('Fehler beim Aktualisieren des Ereignisses');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClick = () => {
    setShowEventDetailModal(false);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEvent) return;
    
    setCreating(true);
    try {
      await eventsAPI.delete(selectedEvent.id);
      
      setSuccessMessage('Ereignis wurde erfolgreich gelöscht!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      setShowDeleteConfirm(false);
      setSelectedEvent(null);
      await fetchEvents();
    } catch (err: any) {
      console.error('Error deleting event:', err);
      alert('Fehler beim Löschen des Ereignisses');
    } finally {
      setCreating(false);
    }
  };

  const handleCompleteEvent = async () => {
    if (!selectedEvent) return;
    
    setCreating(true);
    try {
      await eventsAPI.complete(selectedEvent.id);
      
      setSuccessMessage('Ereignis wurde erfolgreich abgeschlossen!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      setShowEventDetailModal(false);
      setSelectedEvent(null);
      await fetchEvents();
    } catch (err: any) {
      console.error('Error completing event:', err);
      alert('Fehler beim Abschließen des Ereignisses');
    } finally {
      setCreating(false);
    }
  };

  const formatDateTimeDisplay = (date: string, time: string) => {
    return `${date} um ${time} Uhr`;
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
    <div className="flex min-h-screen bg-secondary dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-textPrimary dark:text-gray-100 mb-2">Kalender</h1>
          <p className="text-textSecondary dark:text-gray-400">Termine, Fristen und Aufgaben im Überblick</p>
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
              <button className="btn-secondary dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">← Zurück</button>
              <span className="font-semibold text-lg dark:text-gray-200">Januar 2025</span>
              <button className="btn-secondary dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Weiter →</button>
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
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            {viewMode === 'month' ? (
              <div>
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="text-center font-semibold text-textSecondary dark:text-gray-400 text-sm py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((item, index) => (
                    <div
                      key={index}
                      className={`min-h-24 p-2 border rounded ${
                        item.day ? 'bg-white dark:bg-gray-800 hover:bg-secondary dark:hover:bg-gray-700 cursor-pointer' : 'bg-gray-50 dark:bg-gray-900'
                      } ${item.day === 11 ? 'border-primary border-2' : 'border-gray-200 dark:border-gray-700'}`}
                    >
                      {item.day && (
                        <>
                          <div className={`text-sm font-medium mb-1 ${
                            item.day === 11 ? 'text-primary' : 'text-textPrimary dark:text-gray-200'
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
                              <div className="text-xs text-textSecondary dark:text-gray-400">
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
                <h3 className="text-xl font-semibold text-textPrimary dark:text-gray-200 mb-2">Wochenansicht</h3>
                <p className="text-textSecondary dark:text-gray-400">Wochenansicht wird in Kürze verfügbar sein</p>
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-textPrimary dark:text-gray-200 mb-4">Anstehende Ereignisse</h2>
            
            <div className="space-y-3">
              {upcomingEvents.slice(0, 6).map((event) => (
                <div 
                  key={event.id} 
                  className={`p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${getEventTypeColor(event.color)}`}
                  onClick={() => handleEventClick(event)}
                >
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

            <button className="w-full mt-4 btn-secondary dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 text-sm">
              Alle Ereignisse anzeigen
            </button>
          </div>
        </div>

        {/* Event Detail Modal */}
        <Dialog.Root open={showEventDetailModal} onOpenChange={setShowEventDetailModal}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 z-50 max-h-[90vh] overflow-y-auto">
              <Dialog.Title className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-textPrimary dark:text-gray-100">Ereignis Details</h2>
              </Dialog.Title>
              
              {selectedEvent && (
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-textPrimary dark:text-gray-100 mb-2">
                      {selectedEvent.title}
                    </h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getEventTypeColor(selectedEvent.color)}`}>
                      {getEventIcon(selectedEvent.type)} {selectedEvent.type}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-textSecondary dark:text-gray-300">
                      <span className="font-medium">Mandant:</span>
                      <span>{selectedEvent.mandant}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-textSecondary dark:text-gray-300">
                      <span className="font-medium">Datum & Uhrzeit:</span>
                      <span>{formatDateTimeDisplay(selectedEvent.date, selectedEvent.time)}</span>
                    </div>
                    
                    {selectedEvent.location && (
                      <div className="flex items-center gap-2 text-textSecondary dark:text-gray-300">
                        <span className="font-medium">Ort:</span>
                        <span>{selectedEvent.location}</span>
                      </div>
                    )}
                    
                    {selectedEvent.description && (
                      <div className="pt-2">
                        <span className="font-medium text-textSecondary dark:text-gray-300">Beschreibung:</span>
                        <p className="mt-1 text-textSecondary dark:text-gray-300 whitespace-pre-wrap">
                          {selectedEvent.description}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleEditClick}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={handleCompleteEvent}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                      disabled={creating}
                    >
                      {creating ? 'Wird abgeschlossen...' : 'Abschließen'}
                    </button>
                    <button
                      onClick={handleDeleteClick}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Event Edit Modal */}
        <Dialog.Root open={showEditModal} onOpenChange={setShowEditModal}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 z-50 max-h-[90vh] overflow-y-auto">
              <Dialog.Title className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-textPrimary dark:text-gray-100">Ereignis bearbeiten</h2>
              </Dialog.Title>
              
              <form onSubmit={handleUpdateEvent} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">Titel *</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    disabled={creating}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Datum *</label>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                      disabled={creating}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Uhrzeit *</label>
                    <input
                      type="time"
                      value={editForm.time}
                      onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                      disabled={creating}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">Beschreibung</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    disabled={creating}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">Ort (optional)</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={creating}
                  />
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
                    {creating ? 'Wird gespeichert...' : 'Speichern'}
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Delete Confirmation Modal */}
        <Dialog.Root open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 z-50">
              <Dialog.Title className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-textPrimary dark:text-gray-100">Ereignis löschen</h2>
              </Dialog.Title>
              
              <div className="p-6">
                <p className="text-textSecondary dark:text-gray-300 mb-6">
                  Möchten Sie dieses Ereignis wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
                
                {selectedEvent && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-6">
                    <p className="font-medium text-textPrimary dark:text-gray-100">{selectedEvent.title}</p>
                    <p className="text-sm text-textSecondary dark:text-gray-300 mt-1">
                      {selectedEvent.mandant} • {selectedEvent.date} • {selectedEvent.time}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Dialog.Close asChild>
                    <button
                      className="flex-1 btn-secondary"
                      disabled={creating}
                    >
                      Abbrechen
                    </button>
                  </Dialog.Close>
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                    disabled={creating}
                  >
                    {creating ? 'Wird gelöscht...' : 'Löschen'}
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </main>
    </div>
  );
}
