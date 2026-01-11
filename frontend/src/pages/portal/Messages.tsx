import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { messagesAPI } from '../../services/api';

interface Message {
  id: number;
  sender: string;
  subject: string;
  preview: string;
  timestamp: string;
  unread: boolean;
  body: string;
}

export default function Messages() {
  const [selectedMessage, setSelectedMessage] = useState<number | null>(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [endpointAvailable, setEndpointAvailable] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await messagesAPI.getAll();
      const messagesData = Array.isArray(response.data) ? response.data : [];
      setMessages(messagesData);
      setEndpointAvailable(true);
      if (messagesData.length > 0) {
        setSelectedMessage(messagesData[0].id);
      }
    } catch (err: any) {
      console.log('Messages endpoint not available:', err);
      setEndpointAvailable(false);
      // Use demo data for now
      setMessages([
        { 
          id: 1, 
          sender: 'Anna Schmidt', 
          subject: 'Dokumente für Jahresabschluss', 
          preview: 'Sehr geehrter Herr Berater, anbei sende ich Ihnen die angeforderten Unterlagen...', 
          timestamp: '10.01.2025 14:23', 
          unread: true,
          body: 'Sehr geehrter Herr Berater,\n\nanbei sende ich Ihnen die angeforderten Unterlagen für den Jahresabschluss 2024. Bitte prüfen Sie die Vollständigkeit.\n\nMit freundlichen Grüßen\nAnna Schmidt'
        },
        { 
          id: 2, 
          sender: 'System Benachrichtigung', 
          subject: 'Fall-Update: FALL-2025-001', 
          preview: 'Der Status Ihres Falls wurde auf "In Bearbeitung" geändert...', 
          timestamp: '10.01.2025 10:15', 
          unread: true,
          body: 'Automatische Benachrichtigung:\n\nDer Status Ihres Falls FALL-2025-001 "Jahresabschluss 2024" wurde auf "In Bearbeitung" geändert.\n\nBearbeiter: M. Berater\nZeitpunkt: 10.01.2025 10:15'
        },
        { 
          id: 3, 
          sender: 'Max Berater', 
          subject: 'Rückfrage zu Belegen Q4', 
          preview: 'Guten Tag, ich habe eine Frage zu den eingereichten Belegen...', 
          timestamp: '09.01.2025 16:45', 
          unread: false,
          body: 'Guten Tag,\n\nich habe eine Frage zu den eingereichten Belegen für Q4 2024. Könnten Sie bitte die Rechnung #12345 nochmals prüfen?\n\nEs scheint ein Unstimmigkeit bei der MwSt. zu geben.\n\nBeste Grüße\nMax Berater'
        },
        { 
          id: 4, 
          sender: 'Koch Consulting', 
          subject: 'Terminvereinbarung', 
          preview: 'Sehr geehrtes Team, ich würde gerne einen Termin für eine Beratung vereinbaren...', 
          timestamp: '09.01.2025 11:30', 
          unread: false,
          body: 'Sehr geehrtes Team,\n\nich würde gerne einen Termin für eine Beratung bezüglich einer geplanten Investition vereinbaren.\n\nWären Sie am 15. oder 16. Januar verfügbar?\n\nMit freundlichen Grüßen\nHerr Koch'
        },
        { 
          id: 5, 
          sender: 'DATEV System', 
          subject: 'Export erfolgreich abgeschlossen', 
          preview: 'Ihr DATEV Export wurde erfolgreich abgeschlossen...', 
          timestamp: '08.01.2025 22:10', 
          unread: false,
          body: 'Automatische Benachrichtigung:\n\nIhr DATEV Export (Job-ID: EXP-20250108-001) wurde erfolgreich abgeschlossen.\n\nExportierte Datensätze: 245\nZeitpunkt: 08.01.2025 22:10\nStatus: Erfolgreich'
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const selectedMsg = messages.find(m => m.id === selectedMessage);

  return (
    <div className="flex min-h-screen bg-secondary">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-textPrimary mb-2">Nachrichten</h1>
          <p className="text-textSecondary">Kommunikation und Benachrichtigungen</p>
        </div>

        {/* Info Banner if endpoint not available */}
        {!endpointAvailable && !loading && (
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
            <p className="text-sm text-yellow-800">
              ℹ️ Nachrichten-Feature ist noch nicht vollständig implementiert. Demo-Daten werden angezeigt.
            </p>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button className="btn-primary">
                ✏️ Neue Nachricht
              </button>
              <button className="btn-secondary">
                📧 Alle als gelesen markieren
              </button>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Nachrichten durchsuchen..."
                className="flex-1 md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary mb-1">Gesamt</p>
            <p className="text-2xl font-bold text-primary">{messages.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary mb-1">Ungelesen</p>
            <p className="text-2xl font-bold text-blue-600">{messages.filter(m => m.unread).length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary mb-1">Heute</p>
            <p className="text-2xl font-bold text-primary">2</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary mb-1">Diese Woche</p>
            <p className="text-2xl font-bold text-primary">5</p>
          </div>
        </div>

        {/* Messages Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 bg-secondary border-b border-gray-200">
              <h2 className="font-semibold text-textPrimary">Posteingang</h2>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => setSelectedMessage(message.id)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedMessage === message.id
                      ? 'bg-blue-50 border-l-4 border-primary'
                      : 'hover:bg-secondary'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {message.unread && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                      <h3 className={`font-medium text-sm ${message.unread ? 'text-textPrimary' : 'text-textSecondary'}`}>
                        {message.sender}
                      </h3>
                    </div>
                    <span className="text-xs text-textSecondary whitespace-nowrap">
                      {message.timestamp.split(' ')[0]}
                    </span>
                  </div>
                  
                  <h4 className={`text-sm mb-1 ${message.unread ? 'font-semibold' : 'font-normal'}`}>
                    {message.subject}
                  </h4>
                  
                  <p className="text-xs text-textSecondary line-clamp-2">
                    {message.preview}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Message Preview */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
            {selectedMsg ? (
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-textPrimary mb-2">
                        {selectedMsg.subject}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-textSecondary">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs">
                            {selectedMsg.sender.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-medium">{selectedMsg.sender}</span>
                        </div>
                        <span>{selectedMsg.timestamp}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-secondary rounded" title="Antworten">
                        ↩️
                      </button>
                      <button className="p-2 hover:bg-secondary rounded" title="Weiterleiten">
                        ➡️
                      </button>
                      <button className="p-2 hover:bg-secondary rounded" title="Löschen">
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto">
                  <div className="whitespace-pre-wrap text-textPrimary">
                    {selectedMsg.body}
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-200">
                  <button className="btn-primary">
                    Antworten
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="text-6xl mb-4">✉️</div>
                  <p className="text-textSecondary">Wählen Sie eine Nachricht aus</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
