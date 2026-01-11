import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { clientsAPI } from '../../services/api';

interface Client {
  id: number;
  name: string;
  email: string;
  contact: string;
  status: string;
  mandantNr?: string;
  phone?: string;
  lastContact?: string;
}

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    contact: '',
    phone: '',
  });

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
      await fetchClients();
    } catch (err: any) {
      console.error('Error creating client:', err);
      alert('Fehler beim Erstellen des Mandanten');
    } finally {
      setCreateLoading(false);
    }
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
    <div className="flex min-h-screen bg-secondary">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-textPrimary mb-2">Mandanten</h1>
          <p className="text-textSecondary">Verwalten Sie Ihre Mandanten und deren Informationen</p>
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
            <div className="flex-1 w-full md:w-auto">
              <input
                type="text"
                placeholder="Mandanten suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
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
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex gap-2 overflow-x-auto">
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
              onClick={() => setFilterStatus('Aktiv')}
              className={`px-4 py-2 rounded-md whitespace-nowrap ${
                filterStatus === 'Aktiv'
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-textPrimary hover:bg-gray-200'
              }`}
            >
              ✓ Aktiv ({statusCounts.aktiv})
            </button>
            <button
              onClick={() => setFilterStatus('Ausstehend')}
              className={`px-4 py-2 rounded-md whitespace-nowrap ${
                filterStatus === 'Ausstehend'
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-textPrimary hover:bg-gray-200'
              }`}
            >
              ⏳ Ausstehend ({statusCounts.ausstehend})
            </button>
            <button
              onClick={() => setFilterStatus('Inaktiv')}
              className={`px-4 py-2 rounded-md whitespace-nowrap ${
                filterStatus === 'Inaktiv'
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-textPrimary hover:bg-gray-200'
              }`}
            >
              ✕ Inaktiv ({statusCounts.inaktiv})
            </button>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
                <p className="text-textSecondary">Lade Mandanten...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Mandant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Ansprechpartner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Letzte Änderung
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-secondary transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-textPrimary">{client.name}</div>
                          <div className="text-sm text-textSecondary">{client.mandantNr || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-textPrimary">{client.contact}</div>
                          <div className="text-sm text-textSecondary">{client.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                            {client.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary">
                          {client.lastContact || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button className="text-primary hover:underline mr-3">Details</button>
                          <button className="text-textSecondary hover:underline">Bearbeiten</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="text-4xl mb-2">🔍</div>
                        <p className="text-textSecondary">Keine Mandanten gefunden</p>
                        <p className="text-sm text-textSecondary mt-2">
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
      </main>
    </div>
  );
}
