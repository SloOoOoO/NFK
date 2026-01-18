import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import * as Dialog from '@radix-ui/react-dialog';

interface Event {
  id: number;
  title: string;
  clientId: number;
  clientName: string;
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
}

interface Client {
  id: number;
  companyName: string;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    clientId: 0,
    title: '',
    startTime: '',
    endTime: '',
    description: '',
    location: ''
  });

  useEffect(() => {
    fetchEvents();
    fetchClients();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/appointments', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/clients', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:8080/api/v1/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(formData)
      });
      
      setShowModal(false);
      setFormData({
        clientId: 0,
        title: '',
        startTime: '',
        endTime: '',
        description: '',
        location: ''
      });
      fetchEvents();
    } catch (error) {
      alert('Fehler beim Erstellen des Termins');
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Empty cells before first day
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.startTime.startsWith(dateStr));
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Kalender</h1>
          <p className="text-gray-600 dark:text-gray-400">Termine, Fristen und Aufgaben im Überblick</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
          <div className="flex items-center justify-between">
            {/* ONLY MONAT - NO WOCHE BUTTON */}
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-md bg-primary-600 text-white">
                Monat
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <button onClick={previousMonth} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md">← Zurück</button>
              <span className="font-semibold text-lg dark:text-gray-200">
                {currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={nextMonth} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md">Weiter →</button>
            </div>
            
            <button 
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-md"
            >
              + Termin vereinbaren
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Termine</p>
            <p className="text-2xl font-bold text-primary-600">{events.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Fristen</p>
            <p className="text-2xl font-bold text-red-600">0</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Aufgaben</p>
            <p className="text-2xl font-bold text-yellow-600">0</p>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-600 dark:text-gray-400 text-sm py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {getDaysInMonth().map((day, index) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              
              return (
                <div
                  key={index}
                  className={`min-h-24 p-2 border rounded relative ${
                    day ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' : 'bg-gray-50 dark:bg-gray-900'
                  } border-gray-200 dark:border-gray-700`}
                >
                  {day && (
                    <>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1">
                        {day}
                      </div>
                      
                      {/* EVENT MARKERS - CUTE PROFESSIONAL SYMBOLS */}
                      {dayEvents.length > 0 && (
                        <div className="absolute top-1 right-1 group">
                          {/* Cute calendar badge */}
                          <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg cursor-pointer transform hover:scale-110 transition-transform">
                            📅
                          </div>
                          
                          {/* Hover Tooltip */}
                          <div className="absolute hidden group-hover:block top-8 right-0 bg-white dark:bg-gray-800 shadow-2xl rounded-lg p-3 z-50 w-64 border-2 border-primary-200 dark:border-primary-700">
                            {dayEvents.slice(0, 3).map(event => (
                              <div key={event.id} className="mb-2 pb-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  {event.title}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                                  <span>👤</span> {event.clientName}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                  <span>🕒</span> {new Date(event.startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            ))}
                            {dayEvents.length > 3 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                                +{dayEvents.length - 3} weitere
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Event count badge */}
                      {dayEvents.length > 0 && (
                        <div className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-1">
                          {dayEvents.length} {dayEvents.length === 1 ? 'Termin' : 'Termine'}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Create Modal */}
        <Dialog.Root open={showModal} onOpenChange={setShowModal}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 z-50">
              <Dialog.Title className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold dark:text-gray-100">Termin vereinbaren</h2>
              </Dialog.Title>
              
              <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">Mandant *</label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: parseInt(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="0">Mandant auswählen</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.companyName}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">Titel *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Start *</label>
                    <input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Ende *</label>
                    <input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">Beschreibung</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">Ort</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg">
                    Abbrechen
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg">
                    Erstellen
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </main>
    </div>
  );
}
