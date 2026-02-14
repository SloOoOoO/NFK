import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/Sidebar';

export default function Connections() {
  const { t } = useTranslation();
  const [googleConnected, setGoogleConnected] = useState(false);
  const [datevConnected, setDatevConnected] = useState(false);

  const handleGoogleConnect = () => {
    // TODO: Implement Google SSO flow
    // For now, this is a placeholder
    window.location.href = '/api/v1/auth/google/login';
  };

  const handleDatevConnect = () => {
    // TODO: Implement DATEV SSO flow
    // For now, this is a placeholder
    window.location.href = '/api/v1/auth/datev/login';
  };

  return (
    <div className="flex min-h-screen bg-secondary dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-textPrimary dark:text-white mb-2">
            {t('connections.title')}
          </h1>
          <p className="text-textSecondary dark:text-gray-400">
            {t('connections.subtitle')}
          </p>
        </div>

        {/* Connection Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Google Connection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-blue-500 transition-colors">
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
              <div className={`w-4 h-4 rounded-full ${
                googleConnected ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-400 dark:bg-gray-600'
              }`}></div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-textSecondary dark:text-gray-400 mb-2">
                {t('connections.status.active')}: {googleConnected ? t('connections.google.connected') : t('connections.google.notConnected')}
              </p>
              {googleConnected && (
                <p className="text-xs text-textSecondary dark:text-gray-500">
                  {t('connections.status.lastSync')}: {new Date().toLocaleString('de-DE')}
                </p>
              )}
            </div>

            <button
              onClick={handleGoogleConnect}
              disabled={googleConnected}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                googleConnected
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-md'
              }`}
            >
              {googleConnected ? t('connections.google.connected') : t('connections.google.connect')}
            </button>
          </div>

          {/* DATEV Connection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-blue-500 transition-colors">
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
              <div className={`w-4 h-4 rounded-full ${
                datevConnected ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-400 dark:bg-gray-600'
              }`}></div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-textSecondary dark:text-gray-400 mb-2">
                {t('connections.status.active')}: {datevConnected ? t('connections.datev.connected') : t('connections.datev.notConnected')}
              </p>
              {datevConnected && (
                <p className="text-xs text-textSecondary dark:text-gray-500">
                  {t('connections.status.lastSync')}: {new Date().toLocaleString('de-DE')}
                </p>
              )}
            </div>

            <button
              onClick={handleDatevConnect}
              disabled={datevConnected}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                datevConnected
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-md'
              }`}
            >
              {datevConnected ? t('connections.datev.connected') : t('connections.datev.connect')}
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-400 p-6 rounded-lg">
          <div className="flex items-start gap-4">
            <span className="text-3xl">ℹ️</span>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Integration Information
              </h3>
              <p className="text-blue-800 dark:text-blue-300 mb-2">
                Connect your Google Workspace and DATEV accounts to enable seamless data synchronization.
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Click the connection buttons above to initiate the OAuth authentication flow.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
