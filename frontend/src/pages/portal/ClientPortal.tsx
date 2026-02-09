import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, casesAPI, documentsAPI, messagesAPI } from '../../services/api';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  gender?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

interface Case {
  id: number;
  title: string;
  status: string;
  dueDate?: string;
  createdAt: string;
}

interface Document {
  id: number;
  fileName: string;
  fileSize: number;
  createdAt: string;
}

interface Message {
  id: number;
  subject: string;
  senderName: string;
  createdAt: string;
}

export default function ClientPortal() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, casesRes, docsRes, messagesRes] = await Promise.allSettled([
        authAPI.getCurrentUser(),
        casesAPI.getAll(),
        documentsAPI.getAll(),
        messagesAPI.getAll(),
      ]);

      if (userRes.status === 'fulfilled') {
        setCurrentUser(userRes.value.data);
      }

      if (casesRes.status === 'fulfilled' && Array.isArray(casesRes.value.data)) {
        setCases(casesRes.value.data);
      }

      if (docsRes.status === 'fulfilled' && Array.isArray(docsRes.value.data)) {
        setDocuments(docsRes.value.data);
      }

      if (messagesRes.status === 'fulfilled' && Array.isArray(messagesRes.value.data)) {
        setMessages(messagesRes.value.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/auth/login');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Benutzer';

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">NFK Client Portal</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-textSecondary">Willkommen, {userName}</span>
              <button onClick={handleLogout} className="btn-secondary">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-primary text-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-2">Willkommen in Ihrem Portal</h2>
          <p className="text-white/90">
            Verwalten Sie Ihre Dokumente, Fälle und kommunizieren Sie mit Ihrem Steuerberater.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-textSecondary mb-1">Meine Fälle</h3>
                <p className="text-3xl font-bold text-primary">{loading ? '...' : cases.length}</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-textSecondary mb-1">Dokumente</h3>
                <p className="text-3xl font-bold text-primary">{loading ? '...' : documents.length}</p>
              </div>
              <div className="text-4xl">📄</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-textSecondary mb-1">Nachrichten</h3>
                <p className="text-3xl font-bold text-primary">{loading ? '...' : messages.length}</p>
              </div>
              <div className="text-4xl">✉️</div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Cases */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Aktuelle Fälle</h2>
              <button 
                onClick={() => navigate('/portal/cases')} 
                className="text-primary hover:underline text-sm"
              >
                Alle anzeigen
              </button>
            </div>
            <div className="space-y-4">
              {loading ? (
                <p className="text-textSecondary text-center py-4">Lädt...</p>
              ) : cases.length === 0 ? (
                <p className="text-textSecondary text-center py-4">Keine Fälle vorhanden</p>
              ) : (
                cases.slice(0, 3).map((caseItem) => (
                  <div 
                    key={caseItem.id} 
                    className="border rounded-lg p-4 hover:bg-secondary transition-colors cursor-pointer"
                    onClick={() => navigate('/portal/cases')}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-primary">CASE-{caseItem.id.toString().padStart(3, '0')}</p>
                        <p className="font-medium mt-1">{caseItem.title}</p>
                        <p className="text-sm text-textSecondary mt-1">{formatDate(caseItem.createdAt)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        caseItem.status === 'Abgeschlossen' || caseItem.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        caseItem.status === 'In Bearbeitung' || caseItem.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {caseItem.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Schnellzugriff</h2>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/portal/documents')} 
                  className="w-full btn-primary text-left flex items-center gap-3"
                >
                  <span>📤</span>
                  <span>Dokument hochladen</span>
                </button>
                <button 
                  onClick={() => navigate('/portal/messages')} 
                  className="w-full btn-secondary text-left flex items-center gap-3"
                >
                  <span>💬</span>
                  <span>Nachricht senden</span>
                </button>
                <button 
                  onClick={() => navigate('/portal/calendar')} 
                  className="w-full btn-secondary text-left flex items-center gap-3"
                >
                  <span>📅</span>
                  <span>Termin vereinbaren</span>
                </button>
              </div>
            </div>

            {/* Recent Messages */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Nachrichten</h2>
              <div className="space-y-3">
                {loading ? (
                  <p className="text-textSecondary text-center py-4">Lädt...</p>
                ) : messages.length === 0 ? (
                  <p className="text-textSecondary text-center py-4">Keine Nachrichten</p>
                ) : (
                  messages.slice(0, 2).map((message) => {
                    const now = new Date();
                    const messageDate = new Date(message.createdAt);
                    const timeAgo = Math.floor((now.getTime() - messageDate.getTime()) / 1000 / 60);
                    
                    let timeDisplay: string;
                    if (timeAgo < 60) {
                      timeDisplay = `Vor ${timeAgo} Minuten`;
                    } else if (timeAgo < 1440) {
                      timeDisplay = `Vor ${Math.floor(timeAgo / 60)} Stunden`;
                    } else {
                      // For messages older than 24 hours, show the actual date
                      timeDisplay = messageDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    }
                    
                    return (
                      <div 
                        key={message.id} 
                        className="border-b pb-3 last:border-0 cursor-pointer hover:bg-secondary p-2 rounded"
                        onClick={() => navigate('/portal/messages')}
                      >
                        <p className="font-medium text-sm">{message.senderName || 'System'}</p>
                        <p className="text-textSecondary text-sm">{message.subject}</p>
                        <p className="text-xs text-textSecondary mt-1">{timeDisplay}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Meine Dokumente</h2>
            <button 
              onClick={() => navigate('/portal/documents')} 
              className="text-primary hover:underline text-sm"
            >
              Alle anzeigen
            </button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <p className="text-textSecondary text-center py-4 col-span-full">Lädt...</p>
            ) : documents.length === 0 ? (
              <p className="text-textSecondary text-center py-4 col-span-full">Keine Dokumente vorhanden</p>
            ) : (
              documents.slice(0, 4).map((doc) => (
                <div 
                  key={doc.id} 
                  className="border rounded-lg p-4 hover:bg-secondary transition-colors cursor-pointer"
                  onClick={() => navigate('/portal/documents')}
                >
                  <div className="text-3xl mb-2">📄</div>
                  <p className="font-medium text-sm truncate">{doc.fileName}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-textSecondary">{formatFileSize(doc.fileSize)}</p>
                    <p className="text-xs text-textSecondary">{formatDate(doc.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
