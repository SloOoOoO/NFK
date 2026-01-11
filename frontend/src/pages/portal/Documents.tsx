import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { documentsAPI } from '../../services/api';

interface Document {
  id: number;
  name: string;
  fileName: string;
  size: number;
  clientId?: number;
  createdAt: string;
  updatedAt?: string;
}

export default function Documents() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState('all');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await documentsAPI.getAll();
      const docsData = Array.isArray(response.data) ? response.data : [];
      setDocuments(docsData);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setError('Fehler beim Laden der Dokumente');
      setDocuments([]); // Empty state on error
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await documentsAPI.upload(file);
      await fetchDocuments();
      e.target.value = ''; // Reset input
    } catch (err: any) {
      console.error('Error uploading document:', err);
      alert('Fehler beim Hochladen des Dokuments');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'xlsx': case 'xls': return '📊';
      case 'docx': case 'doc': return '📝';
      case 'zip': return '📎';
      default: return '📁';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = async (id: number) => {
    try {
      await documentsAPI.download(id);
      // Download functionality not fully implemented in backend
      alert('Download-Funktion wird bald verfügbar sein');
    } catch (err: any) {
      console.error('Error downloading document:', err);
      alert('Download noch nicht verfügbar');
    }
  };

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

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">⚠️ {error} - Demo-Daten werden angezeigt</p>
          </div>
        )}

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
              <label className="btn-primary whitespace-nowrap cursor-pointer">
                {uploading ? '⏳ Lädt hoch...' : '📤 Hochladen'}
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
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
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
              <p className="text-textSecondary">Lade Dokumente...</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{getFileIcon(doc.fileName)}</div>
                  <button className="text-textSecondary hover:text-primary">⋮</button>
                </div>
                
                <h3 className="font-medium text-textPrimary mb-2 truncate" title={doc.fileName}>
                  {doc.fileName}
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800`}>
                      {doc.fileName.split('.').pop()?.toUpperCase() || 'FILE'}
                    </span>
                    <span className="text-textSecondary text-xs">{formatFileSize(doc.size)}</span>
                  </div>
                  
                  <div className="text-textSecondary text-xs">
                    Hochgeladen: {new Date(doc.createdAt).toLocaleDateString('de-DE')}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                  <button 
                    onClick={() => handleDownload(doc.id)}
                    className="flex-1 text-sm text-primary hover:underline"
                  >
                    📥 Download
                  </button>
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
                      <button 
                        onClick={() => handleDownload(doc.id)}
                        className="text-primary hover:underline mr-3"
                      >
                        Download
                      </button>
                      <button className="text-primary hover:underline">Vorschau</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredDocuments.length === 0 && !loading && (
          <div className="bg-white p-12 rounded-lg shadow-sm text-center">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-textPrimary mb-2">Keine Dokumente gefunden</h3>
            <p className="text-textSecondary mb-4">Laden Sie Ihr erstes Dokument hoch.</p>
            <label className="btn-primary cursor-pointer inline-block">
              📤 Dokument hochladen
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        )}
      </main>
    </div>
  );
}
