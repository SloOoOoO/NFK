import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { casesAPI, clientsAPI } from '../../services/api';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

type KanbanColumn = {
  id: string;
  title: string;
  status: string;
};

interface Client {
  id: number;
  name: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'new', title: 'Inbox/New', status: 'New' },
  { id: 'pendinginfo', title: 'Waiting for Client', status: 'PendingInfo' },
  { id: 'inprogress', title: 'In Progress', status: 'InProgress' },
  { id: 'underreview', title: 'Internal Review', status: 'UnderReview' },
  { id: 'completed', title: 'Filed/Done', status: 'Completed' },
];

export default function Cases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPendingInfoModal, setShowPendingInfoModal] = useState(false);
  const [pendingDocument, setPendingDocument] = useState('');
  const [pendingCaseId, setPendingCaseId] = useState<number | null>(null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;

    const caseId = active.id as number;
    const targetColumnId = over.id as string;
    const targetColumn = KANBAN_COLUMNS.find(col => col.id === targetColumnId);

    if (!targetColumn) return;

    const targetCase = cases.find(c => c.id === caseId);
    if (!targetCase || targetCase.status === targetColumn.status) return;

    if (targetColumn.status === 'PendingInfo') {
      setPendingCaseId(caseId);
      setShowPendingInfoModal(true);
    } else {
      await updateCaseStatus(caseId, targetColumn.status);
    }
  };

  const updateCaseStatus = async (caseId: number, newStatus: string) => {
    try {
      await casesAPI.updateStatus(caseId, { status: newStatus });
      await fetchCases();
    } catch (err: any) {
      console.error('Error updating case status:', err);
      alert('Fehler beim Aktualisieren des Status');
    }
  };

  const handlePendingInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCaseId || !pendingDocument.trim()) return;

    console.log(`Email would be sent to client about "${pendingDocument}"`);
    
    await updateCaseStatus(pendingCaseId, 'PendingInfo');
    
    setShowPendingInfoModal(false);
    setPendingDocument('');
    setPendingCaseId(null);
    setSuccessMessage(`Fall verschoben zu "Waiting for Client" - ${pendingDocument}`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

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
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'Mittel':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Niedrig':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTypeColor = (title: string) => {
    if (title.toLowerCase().includes('vat') || title.toLowerCase().includes('ust')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    } else if (title.toLowerCase().includes('income') || title.toLowerCase().includes('einkommensteuer')) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    } else if (title.toLowerCase().includes('audit') || title.toLowerCase().includes('prüfung')) {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const getDeadlineBadgeColor = (dueDate?: string) => {
    if (!dueDate) return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    
    const now = new Date();
    const deadline = new Date(dueDate);
    const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursRemaining < 24) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    if (hoursRemaining < 48) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getCasesByStatus = (status: string) => {
    return cases.filter(c => c.status === status);
  };

  return (
    <div className="flex min-h-screen bg-secondary dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-textPrimary dark:text-white mb-2">Fälle - Kanban Board</h1>
          <p className="text-textSecondary dark:text-gray-400">Drag & Drop zum Ändern des Status</p>
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
          <div className="flex gap-2 justify-end">
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

        {/* Kanban Board */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
              <p className="text-textSecondary dark:text-gray-400">Lade Fälle...</p>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
              {KANBAN_COLUMNS.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  cases={getCasesByStatus(column.status)}
                  onEdit={openEditModal}
                  onDelete={openDeleteModal}
                  onDetails={openDetailsModal}
                  getTypeColor={getTypeColor}
                  getPriorityColor={getPriorityColor}
                  getDeadlineBadgeColor={getDeadlineBadgeColor}
                  getInitials={getInitials}
                />
              ))}
            </div>
            <DragOverlay>
              {activeDragId ? (
                <CaseCard
                  caseItem={cases.find(c => c.id === activeDragId)!}
                  isDragging
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onDetails={() => {}}
                  getTypeColor={getTypeColor}
                  getPriorityColor={getPriorityColor}
                  getDeadlineBadgeColor={getDeadlineBadgeColor}
                  getInitials={getInitials}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
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

        {/* Pending Info Modal */}
        <Dialog.Root open={showPendingInfoModal} onOpenChange={setShowPendingInfoModal}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 z-50">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <Dialog.Title className="text-xl font-semibold text-textPrimary dark:text-white">
                  Waiting for Client
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <X size={24} />
                  </button>
                </Dialog.Close>
              </div>
              
              <form onSubmit={handlePendingInfoSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                    What document are we waiting for? *
                  </label>
                  <input
                    type="text"
                    value={pendingDocument}
                    onChange={(e) => setPendingDocument(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Tax documents, Invoice receipts..."
                    required
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Dialog.Close asChild>
                    <button type="button" className="flex-1 btn-secondary">
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button type="submit" className="flex-1 btn-primary">
                    Submit
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

interface KanbanColumnProps {
  column: KanbanColumn;
  cases: Case[];
  onEdit: (caseItem: Case) => void;
  onDelete: (caseItem: Case) => void;
  onDetails: (caseItem: Case) => void;
  getTypeColor: (title: string) => string;
  getPriorityColor: (priority: string) => string;
  getDeadlineBadgeColor: (dueDate?: string) => string;
  getInitials: (name: string) => string;
}

function KanbanColumn({
  column,
  cases,
  onEdit,
  onDelete,
  onDetails,
  getTypeColor,
  getPriorityColor,
  getDeadlineBadgeColor,
  getInitials,
}: KanbanColumnProps) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: 'column' },
  });

  return (
    <div
      ref={setNodeRef}
      className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[600px] flex flex-col"
    >
      <div className="mb-4">
        <h3 className="font-semibold text-textPrimary dark:text-white mb-1">
          {column.title}
        </h3>
        <span className="text-sm text-textSecondary dark:text-gray-400">
          {cases.length} {cases.length === 1 ? 'case' : 'cases'}
        </span>
      </div>
      
      <SortableContext items={cases.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 flex-1">
          {cases.map((caseItem) => (
            <SortableCaseCard
              key={caseItem.id}
              caseItem={caseItem}
              onEdit={onEdit}
              onDelete={onDelete}
              onDetails={onDetails}
              getTypeColor={getTypeColor}
              getPriorityColor={getPriorityColor}
              getDeadlineBadgeColor={getDeadlineBadgeColor}
              getInitials={getInitials}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

interface SortableCaseCardProps {
  caseItem: Case;
  onEdit: (caseItem: Case) => void;
  onDelete: (caseItem: Case) => void;
  onDetails: (caseItem: Case) => void;
  getTypeColor: (title: string) => string;
  getPriorityColor: (priority: string) => string;
  getDeadlineBadgeColor: (dueDate?: string) => string;
  getInitials: (name: string) => string;
}

function SortableCaseCard(props: SortableCaseCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.caseItem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CaseCard {...props} />
    </div>
  );
}

interface CaseCardProps {
  caseItem: Case;
  isDragging?: boolean;
  onEdit: (caseItem: Case) => void;
  onDelete: (caseItem: Case) => void;
  onDetails: (caseItem: Case) => void;
  getTypeColor: (title: string) => string;
  getPriorityColor: (priority: string) => string;
  getDeadlineBadgeColor: (dueDate?: string) => string;
  getInitials: (name: string) => string;
}

function CaseCard({
  caseItem,
  isDragging,
  onEdit,
  onDelete,
  onDetails,
  getTypeColor,
  getPriorityColor,
  getDeadlineBadgeColor,
  getInitials,
}: CaseCardProps) {
  const getTypeBadgeText = (title: string) => {
    if (title.toLowerCase().includes('vat') || title.toLowerCase().includes('ust')) {
      return 'VAT';
    } else if (title.toLowerCase().includes('income') || title.toLowerCase().includes('einkommensteuer')) {
      return 'Income Tax';
    } else if (title.toLowerCase().includes('audit') || title.toLowerCase().includes('prüfung')) {
      return 'Audit';
    }
    return 'General';
  };

  return (
    <div
      className={`bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${
        isDragging ? 'shadow-xl' : ''
      }`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onDetails(caseItem);
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-textSecondary dark:text-gray-400">
          #{caseItem.id}
        </span>
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(caseItem);
            }}
            className="text-xs px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
            title="Edit"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(caseItem);
            }}
            className="text-xs px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      <h4 className="font-semibold text-textPrimary dark:text-white mb-2 text-sm line-clamp-2">
        {caseItem.title}
      </h4>

      <p className="text-xs text-textSecondary dark:text-gray-400 mb-3">
        {caseItem.clientName}
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        {caseItem.dueDate && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDeadlineBadgeColor(caseItem.dueDate)}`}>
            📅 {new Date(caseItem.dueDate).toLocaleDateString('de-DE')}
          </span>
        )}
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(caseItem.title)}`}>
          {getTypeBadgeText(caseItem.title)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(caseItem.priority)}`}>
          {caseItem.priority}
        </span>
        <div
          className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold"
          title={caseItem.clientName}
        >
          {getInitials(caseItem.clientName)}
        </div>
      </div>
    </div>
  );
}
