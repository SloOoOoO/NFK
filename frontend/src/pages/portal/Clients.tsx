import { useState } from 'react';
import Sidebar from '../../components/Sidebar';

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const clients = [
    { id: 1, name: 'Schmidt GmbH', email: 'info@schmidt-gmbh.de', contact: 'Anna Schmidt', status: 'Aktiv', mandantNr: 'M-1001', phone: '+49 30 123456', lastContact: '05.01.2025' },
    { id: 2, name: 'Müller & Partner', email: 'kontakt@mueller-partner.de', contact: 'Thomas Müller', status: 'Aktiv', mandantNr: 'M-1002', phone: '+49 40 234567', lastContact: '03.01.2025' },
    { id: 3, name: 'Weber Trading GmbH', email: 'info@weber-trading.de', contact: 'Sarah Weber', status: 'Inaktiv', mandantNr: 'M-1003', phone: '+49 89 345678', lastContact: '28.12.2024' },
    { id: 4, name: 'Koch Consulting', email: 'office@koch-consulting.de', contact: 'Michael Koch', status: 'Aktiv', mandantNr: 'M-1004', phone: '+49 69 456789', lastContact: '10.01.2025' },
    { id: 5, name: 'Becker Handels AG', email: 'info@becker-ag.de', contact: 'Lisa Becker', status: 'Ausstehend', mandantNr: 'M-1005', phone: '+49 221 567890', lastContact: '08.01.2025' },
  ];

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.mandantNr.toLowerCase().includes(searchTerm.toLowerCase());
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
              <button className="btn-primary whitespace-nowrap">
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
                        <div className="text-sm text-textSecondary">{client.mandantNr}</div>
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
                        {client.lastContact}
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
        </div>
      </main>
    </div>
  );
}
