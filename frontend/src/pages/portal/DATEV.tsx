import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { datevAPI } from '../../services/api';

interface ExportJob {
  id: string;
  type: string;
  mandant: string;
  status: string;
  records: number;
  started: string;
  completed: string;
  duration: string;
}

export default function DATEV() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [endpointAvailable, setEndpointAvailable] = useState(false);
  const [isConnected, setIsConnected] = useState(false); // DATEV connection status

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await datevAPI.getJobs();
      const jobsData = Array.isArray(response.data) ? response.data : [];
      setExportJobs(jobsData);
      setEndpointAvailable(true);
    } catch (err: any) {
      console.log('DATEV jobs endpoint not available:', err);
      setEndpointAvailable(false);
      // Use demo data
      setExportJobs([
        { id: 'EXP-2025-001', type: 'Buchungsdaten', mandant: 'Schmidt GmbH', status: 'Abgeschlossen', records: 245, started: '10.01.2025 14:30', completed: '10.01.2025 14:32', duration: '2 Min' },
        { id: 'EXP-2025-002', type: 'Stammdaten', mandant: 'Müller & Partner', status: 'In Bearbeitung', records: 89, started: '10.01.2025 15:15', completed: '-', duration: '-' },
        { id: 'EXP-2025-003', type: 'Lohndaten', mandant: 'Koch Consulting', status: 'Fehler', records: 0, started: '09.01.2025 22:10', completed: '09.01.2025 22:11', duration: '1 Min' },
        { id: 'EXP-2025-004', type: 'Buchungsdaten', mandant: 'Becker Handels AG', status: 'Wartend', records: 0, started: '-', completed: '-', duration: '-' },
        { id: 'EXP-2025-005', type: 'Jahresabschluss', mandant: 'Schmidt GmbH', status: 'Abgeschlossen', records: 567, started: '08.01.2025 18:45', completed: '08.01.2025 18:50', duration: '5 Min' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const recentSyncs = [
    { id: 1, action: 'Buchungsdaten Import', mandant: 'Schmidt GmbH', timestamp: '10.01.2025 14:32', status: 'Erfolgreich' },
    { id: 2, action: 'Stammdaten Sync', mandant: 'Müller & Partner', timestamp: '10.01.2025 12:15', status: 'Erfolgreich' },
    { id: 3, action: 'Lohndaten Export', mandant: 'Koch Consulting', timestamp: '09.01.2025 22:11', status: 'Fehler' },
    { id: 4, action: 'Automatischer Backup', mandant: 'System', timestamp: '09.01.2025 02:00', status: 'Erfolgreich' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Abgeschlossen':
        return 'bg-green-100 text-green-800';
      case 'In Bearbeitung':
        return 'bg-blue-100 text-blue-800';
      case 'Wartend':
        return 'bg-yellow-100 text-yellow-800';
      case 'Fehler':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredJobs = filterStatus === 'all'
    ? exportJobs
    : exportJobs.filter(job => job.status === filterStatus);

  return (
    <div className="flex min-h-screen bg-secondary">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-textPrimary mb-2">DATEV Integration</h1>
              <p className="text-textSecondary">Export, Import und Synchronisation mit DATEV</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-textSecondary">Status:</span>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                isConnected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {isConnected ? '🟢 Verbunden' : '🟡 Nicht verbunden'}
              </span>
            </div>
          </div>
        </div>

        {/* Under Construction Banner */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-400 p-6 rounded-lg mb-6">
          <div className="flex items-start gap-4">
            <span className="text-4xl">🚧</span>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-orange-900 mb-2">In Entwicklung</h3>
              <p className="text-orange-800 mb-3">
                Die DATEV-Integration befindet sich derzeit in der Entwicklung. 
                Die vollständige Funktionalität wird in Kürze verfügbar sein.
              </p>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>✓ Grundlegende Architektur implementiert</li>
                <li>✓ Export-Jobs-Verwaltung vorbereitet</li>
                <li>🔄 DATEV-API-Verbindung in Arbeit</li>
                <li>🔄 Automatische Synchronisation geplant</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-primary p-4 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="font-semibold text-primary mb-1">DATEV Schnittstelle</h3>
              <p className="text-sm text-textSecondary">
                Nutzen Sie die DATEV-Schnittstelle um Buchungsdaten, Stammdaten und weitere Informationen 
                zwischen NFK und DATEV zu synchronisieren. Beachten Sie, dass diese Funktion spezielle 
                Berechtigungen erfordert.
              </p>
              {!endpointAvailable && !loading && (
                <p className="text-sm text-yellow-800 mt-2">
                  ⚠️ DATEV-Feature ist noch nicht vollständig implementiert. Demo-Daten werden angezeigt.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-md ${
                  filterStatus === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-textPrimary hover:bg-gray-200'
                }`}
              >
                Alle
              </button>
              <button
                onClick={() => setFilterStatus('Abgeschlossen')}
                className={`px-4 py-2 rounded-md ${
                  filterStatus === 'Abgeschlossen'
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-textPrimary hover:bg-gray-200'
                }`}
              >
                Abgeschlossen
              </button>
              <button
                onClick={() => setFilterStatus('In Bearbeitung')}
                className={`px-4 py-2 rounded-md ${
                  filterStatus === 'In Bearbeitung'
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-textPrimary hover:bg-gray-200'
                }`}
              >
                Aktiv
              </button>
              <button
                onClick={() => setFilterStatus('Fehler')}
                className={`px-4 py-2 rounded-md ${
                  filterStatus === 'Fehler'
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-textPrimary hover:bg-gray-200'
                }`}
              >
                Fehler
              </button>
            </div>
            
            <button className="btn-primary">
              🔄 Neuer Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary mb-1">Gesamt Exports</p>
            <p className="text-2xl font-bold text-primary">{exportJobs.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary mb-1">Abgeschlossen</p>
            <p className="text-2xl font-bold text-green-600">{exportJobs.filter(j => j.status === 'Abgeschlossen').length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary mb-1">In Bearbeitung</p>
            <p className="text-2xl font-bold text-blue-600">{exportJobs.filter(j => j.status === 'In Bearbeitung').length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-textSecondary mb-1">Fehler</p>
            <p className="text-2xl font-bold text-red-600">{exportJobs.filter(j => j.status === 'Fehler').length}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Export Jobs List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-textPrimary mb-4">Export Jobs</h2>
              
              {filteredJobs.length > 0 ? (
                <div className="space-y-3">
                  {filteredJobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:bg-secondary transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-primary">{job.id}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                              {job.status}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-textSecondary">Typ:</span>
                              <span className="font-medium text-textPrimary">{job.type}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-textSecondary">Mandant:</span>
                              <span className="text-textPrimary">{job.mandant}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-textSecondary">Datensätze:</span>
                              <span className="text-textPrimary">{job.records > 0 ? job.records : '-'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right text-xs text-textSecondary">
                          <div>Gestartet: {job.started}</div>
                          {job.completed !== '-' && <div>Abgeschlossen: {job.completed}</div>}
                          {job.duration !== '-' && <div className="font-medium mt-1">Dauer: {job.duration}</div>}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button className="text-sm text-primary hover:underline">Details</button>
                        {job.status === 'Fehler' && (
                          <button className="text-sm text-primary hover:underline">Wiederholen</button>
                        )}
                        {job.status === 'Abgeschlossen' && (
                          <button className="text-sm text-primary hover:underline">Download</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-2">🔄</div>
                  <p className="text-textSecondary">Keine Export Jobs mit diesem Status</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Syncs */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-textPrimary mb-4">Letzte Synchronisationen</h2>
              
              <div className="space-y-3">
                {recentSyncs.map((sync) => (
                  <div key={sync.id} className="pb-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-sm text-textPrimary">{sync.action}</h4>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        sync.status === 'Erfolgreich'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {sync.status}
                      </span>
                    </div>
                    <p className="text-xs text-textSecondary">{sync.mandant}</p>
                    <p className="text-xs text-textSecondary mt-1">{sync.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-textPrimary mb-4">Schnellaktionen</h2>
              
              <div className="space-y-2">
                <button className="w-full btn-primary text-left flex items-center gap-3">
                  <span>📤</span>
                  <span>Buchungsdaten exportieren</span>
                </button>
                <button className="w-full btn-secondary text-left flex items-center gap-3">
                  <span>📥</span>
                  <span>Stammdaten importieren</span>
                </button>
                <button className="w-full btn-secondary text-left flex items-center gap-3">
                  <span>🔄</span>
                  <span>Synchronisation starten</span>
                </button>
                <button className="w-full btn-secondary text-left flex items-center gap-3">
                  <span>📊</span>
                  <span>Export Historie</span>
                </button>
              </div>
            </div>

            {/* Help */}
            <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold mb-2">📚 Hilfe benötigt?</h3>
              <p className="text-sm text-white/90 mb-4">
                Lesen Sie unsere Dokumentation zur DATEV-Integration oder kontaktieren Sie den Support.
              </p>
              <button className="w-full bg-white text-primary px-4 py-2 rounded-md hover:bg-white/90 transition-colors text-sm font-medium">
                Dokumentation öffnen
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
