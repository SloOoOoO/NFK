import { useState } from 'react';
import Sidebar from '../../components/Sidebar';

export default function DATEV() {
  const [isConnected] = useState(false); // DATEV connection status

  return (
    <div className="flex min-h-screen bg-secondary dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-textPrimary dark:text-white mb-2">DATEV Integration</h1>
          <p className="text-textSecondary dark:text-gray-400">Integration wird eingerichtet</p>
        </div>

        {/* Connection Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 mb-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className={`w-4 h-4 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-2xl font-semibold dark:text-white">
              {isConnected ? 'Verbunden' : 'Nicht verbunden'}
            </span>
          </div>
          
          <div className="text-center text-textSecondary dark:text-gray-400">
            <p className="mb-2">Status: {isConnected ? 'Aktiv' : 'Inaktiv'}</p>
            <p className="text-sm">Letzte Prüfung: {new Date().toLocaleString('de-DE')}</p>
          </div>
        </div>

        {/* Under Construction Banner */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-l-4 border-orange-400 p-8 rounded-lg">
          <div className="flex flex-col items-center text-center gap-4">
            <span className="text-6xl">🚧</span>
            <div>
              <h2 className="text-2xl font-bold text-orange-900 dark:text-orange-200 mb-3">
                Integration wird eingerichtet
              </h2>
              <p className="text-lg text-orange-800 dark:text-orange-300 mb-4">
                Die DATEV-Integration befindet sich derzeit in der Entwicklung.
              </p>
              <p className="text-orange-700 dark:text-orange-400">
                Die vollständige Funktionalität wird in Kürze verfügbar sein.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
