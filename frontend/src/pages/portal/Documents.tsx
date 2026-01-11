import { useState } from 'react';
import Sidebar from '../../components/Sidebar';

export default function Documents() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState('all');

  const documents = [
    { id: 1, name: 'Jahresabschluss_2024.pdf', mandant: 'Schmidt GmbH', type: 'Abschluss', size: '2.4 MB', updated: '10.01.2025', icon: '📊' },
    { id: 2, name: 'Rechnung_12345.pdf', mandant: 'Müller & Partner', type: 'Rechnung', size: '245 KB', updated: '09.01.2025', icon: '🧾' },
    { id: 3, name: 'Kontoauszug_Dezember.pdf', mandant: 'Weber Trading GmbH', type: 'Kontoauszug', size: '1.2 MB', updated: '08.01.2025', icon: '💳' },
    { id: 4, name: 'Lohnabrechnung_12-2024.pdf', mandant: 'Koch Consulting', type: 'Lohn', size: '890 KB', updated: '07.01.2025', icon: '💰' },
    { id: 5, name: 'Belege_Q4_2024.zip', mandant: 'Becker Handels AG', type: 'Belege', size: '15.8 MB', updated: '06.01.2025', icon: '📎' },
    { id: 6, name: 'Steuerbescheid_2023.pdf', mandant: 'Schmidt GmbH', type: 'Bescheid', size: '567 KB', updated: '05.01.2025', icon: '📄' },
    { id: 7, name: 'Vertrag_Beraterleistung.pdf', mandant: 'Müller & Partner', type: 'Vertrag', size: '423 KB', updated: '04.01.2025', icon: '📝' },
    { id: 8, name: 'Betriebsprüfung_Unterlagen.pdf', mandant: 'Becker Handels AG', type: 'Prüfung', size: '3.2 MB', updated: '03.01.2025', icon: '🔍' },
  ];

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Abschluss': 'bg-blue-100 text-blue-800',
      'Rechnung': 'bg-green-100 text-green-800',
      'Kontoauszug': 'bg-purple-100 text-purple-800',
      'Lohn': 'bg-yellow-100 text-yellow-800',
      'Belege': 'bg-orange-100 text-orange-800',
      'Bescheid': 'bg-red-100 text-red-800',
      'Vertrag': 'bg-indigo-100 text-indigo-800',
      'Prüfung': 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredDocuments = filterType === 'all'
    ? documents
    : documents.filter(doc => doc.type === filterType);

  const documentTypes = ['all', ...Array.from(new Set(documents.map(d => d.type)))];

  return (
    <div className="flex min-h-screen bg-secondary">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-textPrimary mb-2">Dokumente</h1>
          <p className="text-textSecondary">Dokumentenverwaltung und Archiv</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 items-center">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">Alle Typen</option>
                {documentTypes.filter(t => t !== 'all').map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              
              <div className="flex gap-1 border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-textSecondary'}`}
                >
                  ◫
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'text-textSecondary'}`}
                >
                  ☰
                </button>
              </div>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Dokumente suchen..."
                className="flex-1 md:flex-none md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button className="btn-primary whitespace-nowrap">
                📤 Hochladen
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary mb-1">Gesamt</p>
            <p className="text-2xl font-bold text-primary">{documents.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary mb-1">Größe</p>
            <p className="text-2xl font-bold text-primary">25.4 MB</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary mb-1">Heute</p>
            <p className="text-2xl font-bold text-primary">2</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary mb-1">Diese Woche</p>
            <p className="text-2xl font-bold text-primary">8</p>
          </div>
        </div>

        {/* Documents Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{doc.icon}</div>
                  <button className="text-textSecondary hover:text-primary">⋮</button>
                </div>
                
                <h3 className="font-medium text-textPrimary mb-2 truncate" title={doc.name}>
                  {doc.name}
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-textSecondary">Mandant:</span>
                    <span className="font-medium text-textPrimary text-xs">{doc.mandant}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(doc.type)}`}>
                      {doc.type}
                    </span>
                    <span className="text-textSecondary text-xs">{doc.size}</span>
                  </div>
                  
                  <div className="text-textSecondary text-xs">
                    Aktualisiert: {doc.updated}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                  <button className="flex-1 text-sm text-primary hover:underline">📥 Download</button>
                  <button className="flex-1 text-sm text-primary hover:underline">👁️ Vorschau</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Dokument</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Mandant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Typ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Größe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Aktualisiert</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-secondary transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{doc.icon}</span>
                        <span className="font-medium text-textPrimary">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-textSecondary">{doc.mandant}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(doc.type)}`}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-textSecondary">{doc.size}</td>
                    <td className="px-6 py-4 text-sm text-textSecondary">{doc.updated}</td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-primary hover:underline mr-3">Download</button>
                      <button className="text-primary hover:underline">Vorschau</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredDocuments.length === 0 && (
          <div className="bg-white p-12 rounded-lg shadow-sm text-center">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-textPrimary mb-2">Keine Dokumente gefunden</h3>
            <p className="text-textSecondary mb-4">Laden Sie Ihr erstes Dokument hoch.</p>
            <button className="btn-primary">📤 Dokument hochladen</button>
          </div>
        )}
      </main>
    </div>
  );
}
