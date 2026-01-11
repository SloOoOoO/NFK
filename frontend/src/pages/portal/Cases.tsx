import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { casesAPI, clientsAPI } from '../../services/api';

interface Case {
  id: number;
  title: string;
  subject: string;
  clientId: number;
  clientName: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Client {
  id: number;
  name: string;
}

export default function Cases() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newCase, setNewCase] = useState({
    title: '',
    description: '',
    clientId: 0,
    priority: 'Mittel',
    dueDate: '',
  });

  useEffect(() => {
    fetchCases();
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      const clientsData = Array.isArray(response.data) ? response.data : [];
      setClients(clientsData);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchCases = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await casesAPI.getAll();
      const casesData = Array.isArray(response.data) ? response.data : [];
      setCases(casesData);
    } catch (err: any) {
      console.error('Error fetching cases:', err);
      setError('Fehler beim Laden der Fälle');
      setCases([]); // Empty state on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await casesAPI.create(newCase);
      setShowCreateModal(false);
      setNewCase({ title: '', description: '', clientId: 0, priority: 'Mittel', dueDate: '' });
      await fetchCases();
    } catch (err: any) {
      console.error('Error creating case:', err);
      alert('Fehler beim Erstellen des Falls');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStatusChange = async (caseId: number, newStatus: string) => {
    try {
      await casesAPI.updateStatus(caseId, { status: newStatus });
      await fetchCases();
    } catch (err: any) {
      console.error('Error updating case status:', err);
      alert('Fehler beim Aktualisieren des Status');
    }
  };

  // Suppress unused warning - function ready for future use
  void handleStatusChange;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Neu':
        return 'bg-blue-100 text-blue-800';
      case 'In Bearbeitung':
        return 'bg-yellow-100 text-yellow-800';
      case 'Abgeschlossen':
        return 'bg-green-100 text-green-800';
      case 'Abgebrochen':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Hoch':
        return 'text-red-600';
      case 'Mittel':
        return 'text-yellow-600';
      case 'Niedrig':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredCases = filterStatus === 'all' 
    ? cases 
    : cases.filter(c => c.status === filterStatus);

  const statusCounts = {
    all: cases.length,
    neu: cases.filter(c => c.status === 'Neu').length,
    inBearbeitung: cases.filter(c => c.status === 'In Bearbeitung').length,
    abgeschlossen: cases.filter(c => c.status === 'Abgeschlossen').length,
  };

  return (
    <div className="flex min-h-screen bg-secondary">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-textPrimary mb-2">Fälle</h1>
          <p className="text-textSecondary">Verwalten Sie alle laufenden und abgeschlossenen Fälle</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">⚠️ {error} - Demo-Daten werden angezeigt</p>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 overflow-x-auto w-full">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  filterStatus === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-textPrimary hover:bg-gray-200'
                }`}
              >
                Alle ({statusCounts.all})
              </button>
              <button
                onClick={() => setFilterStatus('Neu')}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  filterStatus === 'Neu'
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-textPrimary hover:bg-gray-200'
                }`}
              >
                Neu ({statusCounts.neu})
              </button>
              <button
                onClick={() => setFilterStatus('In Bearbeitung')}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  filterStatus === 'In Bearbeitung'
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-textPrimary hover:bg-gray-200'
                }`}
              >
                In Bearbeitung ({statusCounts.inBearbeitung})
              </button>
              <button
                onClick={() => setFilterStatus('Abgeschlossen')}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  filterStatus === 'Abgeschlossen'
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-textPrimary hover:bg-gray-200'
                }`}
              >
                Abgeschlossen ({statusCounts.abgeschlossen})
              </button>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn-primary whitespace-nowrap"
              >
                + Neuer Fall
              </button>
              <button className="btn-secondary whitespace-nowrap">
                📥 Export
              </button>
            </div>
          </div>
        </div>

        {/* Cases List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
              <p className="text-textSecondary">Lade Fälle...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCases.length > 0 ? (
              filteredCases.map((caseItem) => (
                <div key={caseItem.id} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-primary">{caseItem.id}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                          {caseItem.status}
                        </span>
                        <span className={`text-sm font-medium ${getPriorityColor(caseItem.priority)}`}>
                          ● {caseItem.priority}
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-medium text-textPrimary mb-2">{caseItem.title}</h4>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-textSecondary">
                        <div className="flex items-center gap-1">
                          <span>👥</span>
                          <span>{caseItem.clientName}</span>
                        </div>
                        {caseItem.dueDate && (
                          <div className="flex items-center gap-1">
                            <span>📅</span>
                            <span>Frist: {new Date(caseItem.dueDate).toLocaleDateString('de-DE')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="btn-secondary">Details</button>
                      <button className="btn-primary">Bearbeiten</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 rounded-lg shadow-sm text-center">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-xl font-semibold text-textPrimary mb-2">Keine Fälle gefunden</h3>
                <p className="text-textSecondary mb-4">Es gibt keine Fälle mit diesem Status.</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  + Neuer Fall erstellen
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create Case Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-textPrimary">Neuer Fall</h2>
              </div>
              
              <form onSubmit={handleCreateCase} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Titel *</label>
                  <input
                    type="text"
                    value={newCase.title}
                    onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    disabled={createLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Beschreibung</label>
                  <textarea
                    value={newCase.description}
                    onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    disabled={createLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Mandant *</label>
                  <select
                    value={newCase.clientId}
                    onChange={(e) => setNewCase({ ...newCase, clientId: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    disabled={createLoading}
                  >
                    <option value={0}>Mandant auswählen...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Priorität *</label>
                  <select
                    value={newCase.priority}
                    onChange={(e) => setNewCase({ ...newCase, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    disabled={createLoading}
                  >
                    <option value="Niedrig">Niedrig</option>
                    <option value="Mittel">Mittel</option>
                    <option value="Hoch">Hoch</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Frist</label>
                  <input
                    type="date"
                    value={newCase.dueDate}
                    onChange={(e) => setNewCase({ ...newCase, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={createLoading}
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 btn-secondary"
                    disabled={createLoading}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                    disabled={createLoading}
                  >
                    {createLoading ? 'Wird erstellt...' : 'Erstellen'}
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
