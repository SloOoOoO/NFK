import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { casesAPI, clientsAPI } from '../../services/api';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [newCase, setNewCase] = useState({
    title: '',
    description: '',
    clientId: 0,
    priority: 'Mittel',
    dueDate: '',
  });
  const [editCase, setEditCase] = useState({
    title: '',
    description: '',
    status: 'Neu',
    priority: 'Mittel',
    dueDate: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

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
      setSuccessMessage('Fall erfolgreich erstellt');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchCases();
    } catch (err: any) {
      console.error('Error creating case:', err);
      alert('Fehler beim Erstellen des Falls: ' + (err.response?.data?.message || err.message));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    setEditLoading(true);
    try {
      await casesAPI.update(selectedCase.id, editCase);
      setShowEditModal(false);
      setSelectedCase(null);
      setSuccessMessage('Fall erfolgreich aktualisiert');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchCases();
    } catch (err: any) {
      console.error('Error updating case:', err);
      alert('Fehler beim Aktualisieren des Falls: ' + (err.response?.data?.message || err.message));
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteCase = async () => {
    if (!selectedCase) return;
    setDeleteLoading(true);
    try {
      await casesAPI.delete(selectedCase.id);
      setShowDeleteModal(false);
      setSelectedCase(null);
      setSuccessMessage('Fall erfolgreich gelöscht');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchCases();
    } catch (err: any) {
      console.error('Error deleting case:', err);
      alert('Fehler beim Löschen des Falls: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditModal = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setEditCase({
      title: caseItem.title,
      description: caseItem.subject || '',
      status: caseItem.status,
      priority: caseItem.priority,
      dueDate: caseItem.dueDate ? caseItem.dueDate.split('T')[0] : '',
    });
    setShowEditModal(true);
  };

  const openDetailsModal = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setShowDetailsModal(true);
  };

  const openDeleteModal = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setShowDeleteModal(true);
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
    <div className="flex min-h-screen bg-secondary dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-textPrimary dark:text-white mb-2">Fälle</h1>
          <p className="text-textSecondary dark:text-gray-400">Verwalten Sie alle laufenden und abgeschlossenen Fälle</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-800 dark:text-green-200">✓ {successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">⚠️ {error} - Demo-Daten werden angezeigt</p>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 overflow-x-auto w-full">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  filterStatus === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-secondary dark:bg-gray-700 text-textPrimary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Alle ({statusCounts.all})
              </button>
              <button
                onClick={() => setFilterStatus('Neu')}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  filterStatus === 'Neu'
                    ? 'bg-primary text-white'
                    : 'bg-secondary dark:bg-gray-700 text-textPrimary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Neu ({statusCounts.neu})
              </button>
              <button
                onClick={() => setFilterStatus('In Bearbeitung')}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  filterStatus === 'In Bearbeitung'
                    ? 'bg-primary text-white'
                    : 'bg-secondary dark:bg-gray-700 text-textPrimary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                In Bearbeitung ({statusCounts.inBearbeitung})
              </button>
              <button
                onClick={() => setFilterStatus('Abgeschlossen')}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  filterStatus === 'Abgeschlossen'
                    ? 'bg-primary text-white'
                    : 'bg-secondary dark:bg-gray-700 text-textPrimary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
              <p className="text-textSecondary dark:text-gray-400">Lade Fälle...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCases.length > 0 ? (
              filteredCases.map((caseItem) => (
                <div key={caseItem.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-primary">#{caseItem.id}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                          {caseItem.status}
                        </span>
                        <span className={`text-sm font-medium ${getPriorityColor(caseItem.priority)}`}>
                          ● {caseItem.priority}
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-medium text-textPrimary dark:text-white mb-2">{caseItem.title}</h4>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-textSecondary dark:text-gray-400">
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
                      <button 
                        onClick={() => openDetailsModal(caseItem)}
                        className="btn-secondary"
                      >
                        Details
                      </button>
                      <button 
                        onClick={() => openEditModal(caseItem)}
                        className="btn-primary"
                      >
                        Bearbeiten
                      </button>
                      <button 
                        onClick={() => openDeleteModal(caseItem)}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow-sm text-center">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-xl font-semibold text-textPrimary dark:text-white mb-2">Keine Fälle gefunden</h3>
                <p className="text-textSecondary dark:text-gray-400 mb-4">Es gibt keine Fälle mit diesem Status.</p>
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
        <Dialog.Root open={showCreateModal} onOpenChange={setShowCreateModal}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto z-50">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <Dialog.Title className="text-xl font-semibold text-textPrimary dark:text-white">
                  Neuer Fall
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <X size={24} />
                  </button>
                </Dialog.Close>
              </div>
              
              <form onSubmit={handleCreateCase} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Titel *</label>
                  <input
                    type="text"
                    value={newCase.title}
                    onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                    disabled={createLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Beschreibung</label>
                  <textarea
                    value={newCase.description}
                    onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={3}
                    disabled={createLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Mandant *</label>
                  <select
                    value={newCase.clientId}
                    onChange={(e) => setNewCase({ ...newCase, clientId: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Priorität *</label>
                  <select
                    value={newCase.priority}
                    onChange={(e) => setNewCase({ ...newCase, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                    disabled={createLoading}
                  >
                    <option value="Niedrig">Niedrig</option>
                    <option value="Mittel">Mittel</option>
                    <option value="Hoch">Hoch</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Frist</label>
                  <input
                    type="date"
                    value={newCase.dueDate}
                    onChange={(e) => setNewCase({ ...newCase, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={createLoading}
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="flex-1 btn-secondary"
                      disabled={createLoading}
                    >
                      Abbrechen
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                    disabled={createLoading}
                  >
                    {createLoading ? 'Wird erstellt...' : 'Erstellen'}
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Edit Case Modal */}
        <Dialog.Root open={showEditModal} onOpenChange={setShowEditModal}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto z-50">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <Dialog.Title className="text-xl font-semibold text-textPrimary dark:text-white">
                  Fall bearbeiten
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <X size={24} />
                  </button>
                </Dialog.Close>
              </div>
              
              <form onSubmit={handleEditCase} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Titel *</label>
                  <input
                    type="text"
                    value={editCase.title}
                    onChange={(e) => setEditCase({ ...editCase, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                    disabled={editLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Beschreibung</label>
                  <textarea
                    value={editCase.description}
                    onChange={(e) => setEditCase({ ...editCase, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={3}
                    disabled={editLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Status *</label>
                  <select
                    value={editCase.status}
                    onChange={(e) => setEditCase({ ...editCase, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                    disabled={editLoading}
                  >
                    <option value="Neu">Neu</option>
                    <option value="In Bearbeitung">In Bearbeitung</option>
                    <option value="Abgeschlossen">Abgeschlossen</option>
                    <option value="Abgebrochen">Abgebrochen</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Priorität *</label>
                  <select
                    value={editCase.priority}
                    onChange={(e) => setEditCase({ ...editCase, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                    disabled={editLoading}
                  >
                    <option value="Niedrig">Niedrig</option>
                    <option value="Mittel">Mittel</option>
                    <option value="Hoch">Hoch</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Frist</label>
                  <input
                    type="date"
                    value={editCase.dueDate}
                    onChange={(e) => setEditCase({ ...editCase, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={editLoading}
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="flex-1 btn-secondary"
                      disabled={editLoading}
                    >
                      Abbrechen
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                    disabled={editLoading}
                  >
                    {editLoading ? 'Wird gespeichert...' : 'Speichern'}
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Details Case Modal */}
        <Dialog.Root open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto z-50">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <Dialog.Title className="text-xl font-semibold text-textPrimary dark:text-white">
                  Fall Details
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <X size={24} />
                  </button>
                </Dialog.Close>
              </div>
              
              <div className="p-6 space-y-4">
                {selectedCase && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">Fall-ID</label>
                      <p className="text-textPrimary dark:text-white">#{selectedCase.id}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">Titel</label>
                      <p className="text-textPrimary dark:text-white">{selectedCase.title}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">Beschreibung</label>
                      <p className="text-textPrimary dark:text-white">{selectedCase.subject || 'Keine Beschreibung'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">Mandant</label>
                      <p className="text-textPrimary dark:text-white">{selectedCase.clientName}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">Status</label>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedCase.status)}`}>
                        {selectedCase.status}
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">Priorität</label>
                      <span className={`text-sm font-medium ${getPriorityColor(selectedCase.priority)}`}>
                        ● {selectedCase.priority}
                      </span>
                    </div>
                    
                    {selectedCase.dueDate && (
                      <div>
                        <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">Frist</label>
                        <p className="text-textPrimary dark:text-white">{new Date(selectedCase.dueDate).toLocaleDateString('de-DE')}</p>
                      </div>
                    )}
                  </>
                )}
                
                <div className="flex gap-3 pt-4">
                  <Dialog.Close asChild>
                    <button className="flex-1 btn-secondary">
                      Schließen
                    </button>
                  </Dialog.Close>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Delete Confirmation Modal */}
        <Dialog.Root open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 z-50">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <Dialog.Title className="text-xl font-semibold text-textPrimary dark:text-white">
                  Fall löschen
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <X size={24} />
                  </button>
                </Dialog.Close>
              </div>
              
              <div className="p-6">
                {selectedCase && (
                  <p className="text-textSecondary dark:text-gray-300 mb-6">
                    Sind Sie sicher, dass Sie diesen Fall löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
                  </p>
                )}
                
                <div className="flex gap-3">
                  <Dialog.Close asChild>
                    <button
                      className="flex-1 btn-secondary"
                      disabled={deleteLoading}
                    >
                      Abbrechen
                    </button>
                  </Dialog.Close>
                  <button
                    onClick={handleDeleteCase}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Wird gelöscht...' : 'Löschen'}
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
