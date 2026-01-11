import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { casesAPI } from '../../services/api';

interface Case {
  id: string;
  mandant: string;
  title: string;
  status: string;
  priority: string;
  deadline: string;
  assignee: string;
}

export default function Cases() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newCase, setNewCase] = useState({
    title: '',
    mandant: '',
    priority: 'Mittel',
    deadline: '',
  });

  useEffect(() => {
    fetchCases();
  }, []);

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
      // Use demo data as fallback
      setCases([
        { id: 'FALL-2025-001', mandant: 'Schmidt GmbH', title: 'Jahresabschluss 2024', status: 'Offen', priority: 'Hoch', deadline: '15.01.2025', assignee: 'M. Berater' },
        { id: 'FALL-2025-002', mandant: 'Müller & Partner', title: 'Umsatzsteuervoranmeldung Q4', status: 'In Bearbeitung', priority: 'Mittel', deadline: '20.01.2025', assignee: 'A. Schmidt' },
        { id: 'FALL-2025-003', mandant: 'Weber Trading GmbH', title: 'Lohnabrechnung Dezember', status: 'Abgeschlossen', priority: 'Niedrig', deadline: '05.01.2025', assignee: 'M. Berater' },
        { id: 'FALL-2025-004', mandant: 'Koch Consulting', title: 'Steuerberatung Investition', status: 'Wartend', priority: 'Hoch', deadline: '18.01.2025', assignee: 'K. Fischer' },
        { id: 'FALL-2025-005', mandant: 'Becker Handels AG', title: 'Betriebsprüfung Vorbereitung', status: 'In Bearbeitung', priority: 'Hoch', deadline: '25.01.2025', assignee: 'M. Berater' },
        { id: 'FALL-2025-006', mandant: 'Schmidt GmbH', title: 'Quartalsabschluss Q4', status: 'Offen', priority: 'Mittel', deadline: '30.01.2025', assignee: 'A. Schmidt' },
      ]);
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
      setNewCase({ title: '', mandant: '', priority: 'Mittel', deadline: '' });
      await fetchCases();
    } catch (err: any) {
      console.error('Error creating case:', err);
      alert('Fehler beim Erstellen des Falls');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStatusChange = async (caseId: string, newStatus: string) => {
    try {
      await casesAPI.updateStatus(parseInt(caseId.split('-')[2]), { status: newStatus });
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
      case 'Offen':
        return 'bg-blue-100 text-blue-800';
      case 'In Bearbeitung':
        return 'bg-yellow-100 text-yellow-800';
      case 'Wartend':
        return 'bg-orange-100 text-orange-800';
      case 'Abgeschlossen':
        return 'bg-green-100 text-green-800';
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
    offen: cases.filter(c => c.status === 'Offen').length,
    inBearbeitung: cases.filter(c => c.status === 'In Bearbeitung').length,
    wartend: cases.filter(c => c.status === 'Wartend').length,
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
                onClick={() => setFilterStatus('Offen')}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  filterStatus === 'Offen'
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-textPrimary hover:bg-gray-200'
                }`}
              >
                Offen ({statusCounts.offen})
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
                onClick={() => setFilterStatus('Wartend')}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  filterStatus === 'Wartend'
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-textPrimary hover:bg-gray-200'
                }`}
              >
                Wartend ({statusCounts.wartend})
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
                          <span>{caseItem.mandant}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>📅</span>
                          <span>Frist: {caseItem.deadline}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>👤</span>
                          <span>{caseItem.assignee}</span>
                        </div>
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
                  <label className="block text-sm font-medium mb-2">Mandant *</label>
                  <input
                    type="text"
                    value={newCase.mandant}
                    onChange={(e) => setNewCase({ ...newCase, mandant: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    disabled={createLoading}
                  />
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
                  <label className="block text-sm font-medium mb-2">Frist *</label>
                  <input
                    type="date"
                    value={newCase.deadline}
                    onChange={(e) => setNewCase({ ...newCase, deadline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
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
