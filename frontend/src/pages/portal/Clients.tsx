import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { clientsAPI } from '../../services/api';
import apiClient from '../../services/api';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

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
}

interface ClientUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [newClient, setNewClient] = useState({
    userId: 0,
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
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);

  useEffect(() => {
    fetchClients();
    fetchClientUsers();
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

  const fetchClientUsers = async () => {
    try {
      const response = await apiClient.get('/users?role=Client');
      const usersData = Array.isArray(response.data) ? response.data : [];
      setClientUsers(usersData);
    } catch (err: any) {
      console.error('Error fetching client users:', err);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await clientsAPI.create(newClient);
      setShowCreateModal(false);
      setNewClient({ userId: 0, name: '', email: '', contact: '', phone: '' });
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

  const openDetailsModal = (client: Client) => {
    setSelectedClient(client);
    setShowDetailsModal(true);
  };

  const openDeleteModal = (client: Client) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.mandantNr?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aktiv':
        return 'bg-green-100 text-green-800';
      case 'Inaktiv':
        return 'bg-gray-100 text-gray-800';
      case 'Ausstehend':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-gray-300 uppercase tracking-wider">
                      Mandant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-gray-300 uppercase tracking-wider">
                      Ansprechpartner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-gray-300 uppercase tracking-wider">
                      Letzte Änderung
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary dark:text-gray-300 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-secondary dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-textPrimary dark:text-white">{client.name}</div>
                          <div className="text-sm text-textSecondary dark:text-gray-400">{client.mandantNr || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-textPrimary dark:text-white">{client.contact}</div>
                          <div className="text-sm text-textSecondary dark:text-gray-400">{client.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                            {client.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-gray-400">
                          {client.lastContact || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button 
                            onClick={() => openDetailsModal(client)}
                            className="text-primary hover:underline mr-3"
                          >
                            Details
                          </button>
                          <button 
                            onClick={() => openEditModal(client)}
                            className="text-primary hover:underline mr-3"
                          >
                            Bearbeiten
                          </button>
                          <button 
                            onClick={() => openDeleteModal(client)}
                            className="text-red-600 dark:text-red-400 hover:underline"
                          >
                            Löschen
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
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
                  <label className="block text-sm font-medium mb-2">Client auswählen *</label>
                  <select
                    value={newClient.userId || ''}
                    onChange={(e) => {
                      const userId = parseInt(e.target.value);
                      const selectedUser = clientUsers.find(u => u.id === userId);
                      setNewClient({
                        ...newClient,
                        userId,
                        name: selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : '',
                        email: selectedUser?.email || ''
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    disabled={createLoading}
                  >
                    <option value="">Client auswählen...</option>
                    {clientUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={newClient.name}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
                    required
                    disabled
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">E-Mail *</label>
                  <input
                    type="email"
                    value={newClient.email}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
                    required
                    disabled
                    readOnly
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
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewClient({ userId: 0, name: '', email: '', contact: '', phone: '' });
                    }}
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

        {/* Details Client Modal */}
        <Dialog.Root open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto z-50">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <Dialog.Title className="text-xl font-semibold text-textPrimary dark:text-white">
                  Mandant Details
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <X size={24} />
                  </button>
                </Dialog.Close>
              </div>
              
              <div className="p-6 space-y-4">
                {selectedClient && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">Firmenname</label>
                      <p className="text-textPrimary dark:text-white">{selectedClient.name}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">Telefon</label>
                      <p className="text-textPrimary dark:text-white">{selectedClient.phone || 'Nicht angegeben'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">E-Mail</label>
                      <p className="text-textPrimary dark:text-white">{selectedClient.email}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">Ansprechpartner</label>
                      <p className="text-textPrimary dark:text-white">{selectedClient.contact}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">Steuernummer / Mandantennummer</label>
                      <p className="text-textPrimary dark:text-white">{selectedClient.mandantNr || 'Nicht angegeben'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">Adresse</label>
                      <p className="text-textPrimary dark:text-white">{selectedClient.address || 'Nicht angegeben'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">Stadt</label>
                      <p className="text-textPrimary dark:text-white">{selectedClient.city || 'Nicht angegeben'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">Postleitzahl</label>
                      <p className="text-textPrimary dark:text-white">{selectedClient.postalCode || 'Nicht angegeben'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">Status</label>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedClient.status)}`}>
                        {selectedClient.status}
                      </span>
                    </div>
                  </div>
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
