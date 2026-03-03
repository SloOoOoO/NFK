import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/Sidebar';

export default function Connections() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen bg-secondary dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-textPrimary dark:text-white">
              {t('connections.title')}
            </h1>
            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium rounded-full border border-amber-200 dark:border-amber-800">
              Demnächst
            </span>
          </div>
          <p className="text-textSecondary dark:text-gray-400">
            {t('connections.subtitle')}
          </p>
        </div>

        {/* Connection Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Google Connection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-gray-200 dark:border-gray-700 opacity-60">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-2xl shadow-lg">
                  📧
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-textPrimary dark:text-white">
                    {t('connections.google.title')}
                  </h2>
                  <p className="text-sm text-textSecondary dark:text-gray-400">
                    Google Workspace
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full border border-amber-200 dark:border-amber-800">
                  Demnächst
                </span>
                <div className="w-4 h-4 rounded-full bg-gray-400 dark:bg-gray-600"></div>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-textSecondary dark:text-gray-400 mb-2">
                {t('connections.status.active')}: {t('connections.google.notConnected')}
              </p>
            </div>

            <button
              disabled
              className="w-full px-4 py-3 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            >
              {t('connections.google.connect')}
            </button>
          </div>

          {/* DATEV Connection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-gray-200 dark:border-gray-700 opacity-60">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-2xl shadow-lg">
                  📊
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-textPrimary dark:text-white">
                    {t('connections.datev.title')}
                  </h2>
                  <p className="text-sm text-textSecondary dark:text-gray-400">
                    DATEV Integration
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full border border-amber-200 dark:border-amber-800">
                  Demnächst
                </span>
                <div className="w-4 h-4 rounded-full bg-gray-400 dark:bg-gray-600"></div>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-textSecondary dark:text-gray-400 mb-2">
                {t('connections.status.active')}: {t('connections.datev.notConnected')}
              </p>
            </div>

            <button
              disabled
              className="w-full px-4 py-3 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            >
              {t('connections.datev.connect')}
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-l-4 border-amber-400 p-6 rounded-lg">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🔜</span>
            <div>
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200 mb-2">
                Verbindungen demnächst verfügbar
              </h3>
              <p className="text-amber-800 dark:text-amber-300 mb-2">
                Die Integration mit Google Workspace und DATEV wird in Kürze verfügbar sein.
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Diese Funktion befindet sich noch in der Entwicklung. Wir informieren Sie, sobald sie verfügbar ist.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
