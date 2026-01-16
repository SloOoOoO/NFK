import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { clientsAPI } from '../../services/api';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tooltip from '@radix-ui/react-tooltip';
import { X, Mail, Plus, Folder, ArrowUpDown } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';

interface AssignedAdvisor {
  id: number;
  name: string;
  avatar?: string;
}

interface OpenCase {
  id: number;
  title: string;
  status: string;
  dueDate?: string;
  priority: number;
}

interface Client {
  id: number;
  name: string;
  email: string;
  contact: string;
  status: string;
  mandantNr?: string;
  phone?: string;
  lastContact?: string;
  taxNumber?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  healthStatus: string;
  entityType?: string;
  assignedAdvisor?: AssignedAdvisor;
  openCases?: OpenCase[];
  notes?: string;
}

const columnHelper = createColumnHelper<Client>();

export default function Clients() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [editedNotes, setEditedNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    contact: '',
    phone: '',
  });
  const [editClient, setEditClient] = useState({
    name: '',
    email: '',
    contact: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await clientsAPI.getAll();
      // Handle both array and object responses
      const clientsData = Array.isArray(response.data) ? response.data : [];
      setClients(clientsData);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
      setError('Fehler beim Laden der Mandanten');
      setClients([]); // Empty state on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await clientsAPI.create(newClient);
      setShowCreateModal(false);
      setNewClient({ name: '', email: '', contact: '', phone: '' });
      setSuccessMessage('Mandant erfolgreich erstellt');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchClients();
    } catch (err: any) {
      console.error('Error creating client:', err);
      alert('Fehler beim Erstellen des Mandanten: ' + (err.response?.data?.message || err.message));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setEditLoading(true);
    try {
      await clientsAPI.update(selectedClient.id, editClient);
      setShowEditModal(false);
      setSelectedClient(null);
      setSuccessMessage('Mandant erfolgreich aktualisiert');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchClients();
    } catch (err: any) {
      console.error('Error updating client:', err);
      alert('Fehler beim Aktualisieren des Mandanten: ' + (err.response?.data?.message || err.message));
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    setDeleteLoading(true);
    try {
      await clientsAPI.delete(selectedClient.id);
      setShowDeleteModal(false);
      setSelectedClient(null);
      setSuccessMessage('Mandant erfolgreich gelöscht');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchClients();
    } catch (err: any) {
      console.error('Error deleting client:', err);
      alert('Fehler beim Löschen des Mandanten: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeleteLoading(false);
    }
  };

  const openQuickView = (client: Client) => {
    setSelectedClient(client);
    setEditedNotes(client.notes || '');
    setShowQuickView(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedClient) return;
    setSavingNotes(true);
    try {
      await clientsAPI.updateNotes(selectedClient.id, editedNotes);
      setSuccessMessage('Notizen erfolgreich gespeichert');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchClients();
      // Update selectedClient notes
      if (selectedClient) {
        setSelectedClient({ ...selectedClient, notes: editedNotes });
      }
    } catch (err: unknown) {
      console.error('Error saving notes:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert('Fehler beim Speichern der Notizen: ' + errorMessage);
    } finally {
      setSavingNotes(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'critical':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getHealthStatusTooltip = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'Client in good standing - all requirements met';
      case 'warning':
        return 'Attention needed - pending items or deadlines approaching';
      case 'critical':
        return 'Urgent attention required - overdue items or critical issues';
      default:
        return 'Status unknown';
    }
  };

  // Define table columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-primary dark:hover:text-primary-light"
          >
            Name
            <ArrowUpDown size={14} />
          </button>
        ),
        cell: (info) => (
          <div>
            <div className="font-medium text-textPrimary dark:text-white">{info.getValue()}</div>
            <div className="text-sm text-textSecondary dark:text-gray-400">
              {info.row.original.mandantNr || '-'}
            </div>
          </div>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('entityType', {
        header: 'Entity Type',
        cell: (info) => (
          <span className="text-sm text-textPrimary dark:text-gray-300">
            {info.getValue() || 'N/A'}
          </span>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor('healthStatus', {
        header: 'Health Status',
        cell: (info) => {
          const status = info.getValue();
          return (
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <span className={`text-2xl ${getHealthStatusColor(status)}`}>●</span>
                    <span className="text-sm text-textPrimary dark:text-gray-300 capitalize">
                      {status}
                    </span>
                  </div>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-md text-sm max-w-xs z-50"
                    sideOffset={5}
                  >
                    {getHealthStatusTooltip(status)}
                    <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-700" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          );
        },
        enableSorting: false,
      }),
      columnHelper.accessor('lastContact', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-primary dark:hover:text-primary-light"
          >
            Last Contact
            <ArrowUpDown size={14} />
          </button>
        ),
        cell: (info) => (
          <span className="text-sm text-textSecondary dark:text-gray-400">
            {info.getValue() || '-'}
          </span>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('assignedAdvisor', {
        header: 'Assigned Advisor',
        cell: (info) => {
          const advisor = info.getValue();
          return advisor ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                {advisor.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-textPrimary dark:text-gray-300">{advisor.name}</span>
            </div>
          ) : (
            <span className="text-sm text-textSecondary dark:text-gray-400">Unassigned</span>
          );
        },
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const client = info.row.original;
          const isHovered = hoveredRow === client.id;
          
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openQuickView(client)}
                className="text-primary hover:underline text-sm"
              >
                View
              </button>
              {isHovered && (
                <div className="flex items-center gap-1 ml-2 animate-fade-in">
                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert('Email action - placeholder');
                          }}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <Mail size={16} className="text-gray-600 dark:text-gray-400" />
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="bg-gray-900 dark:bg-gray-700 text-white px-2 py-1 rounded text-xs z-50"
                          sideOffset={5}
                        >
                          Email
                          <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-700" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>

                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/portal/cases?clientId=${client.id}`);
                          }}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <Plus size={16} className="text-gray-600 dark:text-gray-400" />
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="bg-gray-900 dark:bg-gray-700 text-white px-2 py-1 rounded text-xs z-50"
                          sideOffset={5}
                        >
                          Create Case
                          <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-700" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>

                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert('View files - placeholder');
                          }}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <Folder size={16} className="text-gray-600 dark:text-gray-400" />
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="bg-gray-900 dark:bg-gray-700 text-white px-2 py-1 rounded text-xs z-50"
                          sideOffset={5}
                        >
                          View Files
                          <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-700" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                </div>
              )}
            </div>
          );
        },
      }),
    ],
    [hoveredRow, navigate]
  );

  // Filter clients based on search and status
  const filteredData = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (client.mandantNr?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || client.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [clients, searchTerm, filterStatus]);

  // Initialize table
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setEditClient({
      name: client.name,
      email: client.email,
      contact: client.contact,
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || '',
      postalCode: client.postalCode || '',
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (client: Client) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  };

  const statusCounts = {
    all: clients.length,
    aktiv: clients.filter(c => c.status === 'Aktiv').length,
    ausstehend: clients.filter(c => c.status === 'Ausstehend').length,
    inaktiv: clients.filter(c => c.status === 'Inaktiv').length,
  };

  return (
    <div className="flex min-h-screen bg-secondary dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-textPrimary dark:text-white mb-2">Mandanten</h1>
          <p className="text-textSecondary dark:text-gray-400">Verwalten Sie Ihre Mandanten und deren Informationen</p>
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
            <div className="flex-1 w-full md:w-auto">
              <input
                type="text"
                placeholder="Mandanten suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn-primary whitespace-nowrap"
              >
                + Neuer Mandant
              </button>
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
          <div className="flex gap-2 overflow-x-auto">
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
              onClick={() => setFilterStatus('Aktiv')}
              className={`px-4 py-2 rounded-md whitespace-nowrap ${
                filterStatus === 'Aktiv'
                  ? 'bg-primary text-white'
                  : 'bg-secondary dark:bg-gray-700 text-textPrimary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              ✓ Aktiv ({statusCounts.aktiv})
            </button>
            <button
              onClick={() => setFilterStatus('Ausstehend')}
              className={`px-4 py-2 rounded-md whitespace-nowrap ${
                filterStatus === 'Ausstehend'
                  ? 'bg-primary text-white'
                  : 'bg-secondary dark:bg-gray-700 text-textPrimary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              ⏳ Ausstehend ({statusCounts.ausstehend})
            </button>
            <button
              onClick={() => setFilterStatus('Inaktiv')}
              className={`px-4 py-2 rounded-md whitespace-nowrap ${
                filterStatus === 'Inaktiv'
                  ? 'bg-primary text-white'
                  : 'bg-secondary dark:bg-gray-700 text-textPrimary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              ✕ Inaktiv ({statusCounts.inaktiv})
            </button>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
                <p className="text-textSecondary dark:text-gray-400">Lade Mandanten...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary dark:bg-gray-700">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-gray-300 uppercase tracking-wider"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-secondary dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        onClick={() => openQuickView(row.original)}
                        onMouseEnter={() => setHoveredRow(row.original.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-12 text-center">
                        <div className="text-4xl mb-2">🔍</div>
                        <p className="text-textSecondary dark:text-gray-400">Keine Mandanten gefunden</p>
                        <p className="text-sm text-textSecondary dark:text-gray-500 mt-2">
                          Versuchen Sie einen anderen Suchbegriff oder Filter
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Client Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-textPrimary">Neuer Mandant</h2>
              </div>
              
              <form onSubmit={handleCreateClient} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    disabled={createLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">E-Mail *</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    disabled={createLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Ansprechpartner *</label>
                  <input
                    type="text"
                    value={newClient.contact}
                    onChange={(e) => setNewClient({ ...newClient, contact: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    disabled={createLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
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

        {/* Edit Client Modal */}
        <Dialog.Root open={showEditModal} onOpenChange={setShowEditModal}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto z-50">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <Dialog.Title className="text-xl font-semibold text-textPrimary dark:text-white">
                  Mandant bearbeiten
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <X size={24} />
                  </button>
                </Dialog.Close>
              </div>
              
              <form onSubmit={handleEditClient} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">Firmenname *</label>
                    <input
                      type="text"
                      value={editClient.name}
                      onChange={(e) => setEditClient({ ...editClient, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                      disabled={editLoading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">Telefon</label>
                    <input
                      type="tel"
                      value={editClient.phone}
                      onChange={(e) => setEditClient({ ...editClient, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                      disabled={editLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">E-Mail *</label>
                    <input
                      type="email"
                      value={editClient.email}
                      onChange={(e) => setEditClient({ ...editClient, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                      disabled={editLoading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">Ansprechpartner *</label>
                    <input
                      type="text"
                      value={editClient.contact}
                      onChange={(e) => setEditClient({ ...editClient, contact: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                      disabled={editLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">Adresse</label>
                    <input
                      type="text"
                      value={editClient.address}
                      onChange={(e) => setEditClient({ ...editClient, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                      disabled={editLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">Stadt</label>
                    <input
                      type="text"
                      value={editClient.city}
                      onChange={(e) => setEditClient({ ...editClient, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                      disabled={editLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">Postleitzahl</label>
                    <input
                      type="text"
                      value={editClient.postalCode}
                      onChange={(e) => setEditClient({ ...editClient, postalCode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                      disabled={editLoading}
                    />
                  </div>
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

        {/* Quick View Drawer */}
        <Dialog.Root open={showQuickView} onOpenChange={setShowQuickView}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50" />
            <Dialog.Content className="fixed top-0 right-0 bottom-0 w-full md:w-[500px] bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto animate-slide-in-right">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center z-10">
                <Dialog.Title className="text-xl font-semibold text-textPrimary dark:text-white">
                  Client Details
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <X size={24} />
                  </button>
                </Dialog.Close>
              </div>
              
              {selectedClient && (
                <div className="p-6 space-y-6">
                  {/* Contact Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-textPrimary dark:text-white mb-4">
                      Contact Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">
                          Name
                        </label>
                        <p className="text-textPrimary dark:text-white">{selectedClient.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">
                          Email
                        </label>
                        <p className="text-textPrimary dark:text-white">{selectedClient.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">
                          Phone
                        </label>
                        <p className="text-textPrimary dark:text-white">
                          {selectedClient.phone || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">
                          Address
                        </label>
                        <p className="text-textPrimary dark:text-white">
                          {selectedClient.address || 'Not provided'}
                          {selectedClient.city && `, ${selectedClient.city}`}
                          {selectedClient.postalCode && ` ${selectedClient.postalCode}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Open Cases */}
                  <div>
                    <h3 className="text-lg font-semibold text-textPrimary dark:text-white mb-4">
                      Open Cases ({selectedClient.openCases?.length || 0})
                    </h3>
                    {selectedClient.openCases && selectedClient.openCases.length > 0 ? (
                      <div className="space-y-3">
                        {selectedClient.openCases.map((caseItem) => (
                          <div
                            key={caseItem.id}
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-md"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-textPrimary dark:text-white">
                                {caseItem.title}
                              </h4>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  caseItem.status === 'Open'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : caseItem.status === 'In Progress'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                }`}
                              >
                                {caseItem.status}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm text-textSecondary dark:text-gray-400">
                              <span>
                                Due: {caseItem.dueDate ? new Date(caseItem.dueDate).toLocaleDateString() : 'N/A'}
                              </span>
                              <span>Priority: {caseItem.priority}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-textSecondary dark:text-gray-400">No open cases</p>
                    )}
                  </div>

                  {/* Internal Notes */}
                  <div>
                    <h3 className="text-lg font-semibold text-textPrimary dark:text-white mb-4">
                      Internal Notes
                    </h3>
                    <textarea
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white min-h-[120px]"
                      placeholder="Add internal notes about this client..."
                      disabled={savingNotes}
                    />
                    <button
                      onClick={handleSaveNotes}
                      className="mt-2 btn-primary w-full"
                      disabled={savingNotes}
                    >
                      {savingNotes ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-lg font-semibold text-textPrimary dark:text-white mb-4">
                      Quick Actions
                    </h3>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowQuickView(false);
                          openEditModal(selectedClient);
                        }}
                        className="btn-secondary text-left"
                      >
                        ✏️ Edit Client
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowQuickView(false);
                          navigate(`/portal/cases?clientId=${selectedClient.id}`);
                        }}
                        className="btn-secondary text-left"
                      >
                        ➕ Create Case
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowQuickView(false);
                          openDeleteModal(selectedClient);
                        }}
                        className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-left"
                      >
                        🗑️ Delete Client
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                  Mandant löschen
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <X size={24} />
                  </button>
                </Dialog.Close>
              </div>
              
              <div className="p-6">
                {selectedClient && (
                  <p className="text-textSecondary dark:text-gray-300 mb-6">
                    Sind Sie sicher, dass Sie diesen Mandanten löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
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
                    onClick={handleDeleteClient}
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
