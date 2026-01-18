import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/Sidebar';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { clientsAPI, casesAPI, documentsAPI, authAPI } from '../../services/api';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState({
    clients: { total: 0, active: 0, new_this_month: 0 },
    documents: { total: 0, pending_signature: 0, uploaded_today: 0 },
    cases: { total: 0, high_priority: 0 },
  });
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [datevStatus, setDatevStatus] = useState<any>(null);
  const [datevExportsCount, setDatevExportsCount] = useState<number>(0);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
    fetchDatevStatus();
    fetchActivities();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch current user and data from all endpoints
      const [userRes, clientsRes, casesRes, docsRes] = await Promise.allSettled([
        authAPI.getCurrentUser(),
        clientsAPI.getAll(),
        casesAPI.getAll(),
        documentsAPI.getAll(),
      ]);

      // Process current user
      if (userRes.status === 'fulfilled') {
        setCurrentUser(userRes.value.data);
      }

      // Process clients
      const clients = clientsRes.status === 'fulfilled' && Array.isArray(clientsRes.value.data) 
        ? clientsRes.value.data 
        : [];
      
      // Process cases
      const cases = casesRes.status === 'fulfilled' && Array.isArray(casesRes.value.data) 
        ? casesRes.value.data 
        : [];
      
      // Process documents
      const documents = docsRes.status === 'fulfilled' && Array.isArray(docsRes.value.data) 
        ? docsRes.value.data 
        : [];

      // Compute stats from real data
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      setStats({
        clients: {
          total: clients.length,
          active: clients.filter((c: any) => c.status === 'Aktiv' || c.status === 'active').length,
          new_this_month: clients.filter((c: any) => {
            const createdAt = new Date(c.createdAt);
            return createdAt >= firstDayOfMonth;
          }).length,
        },
        documents: {
          total: documents.length,
          pending_signature: documents.filter((d: any) => d.status === 'pending_signature').length,
          uploaded_today: documents.filter((d: any) => {
            const uploadedAt = new Date(d.createdAt);
            return uploadedAt.toDateString() === now.toDateString();
          }).length,
        },
        cases: {
          total: cases.length,
          high_priority: cases.filter((c: any) => c.priority === 'Hoch' || c.priority === 'high' || c.priority === 'High').length,
        },
      });

      // Extract deadlines from cases with due dates
      const upcomingCases = cases
        .filter((c: any) => c.dueDate)
        .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 3);
      
      setDeadlines(upcomingCases.length > 0 ? upcomingCases : []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty state on error
      setStats({
        clients: { total: 0, active: 0, new_this_month: 0 },
        documents: { total: 0, pending_signature: 0, uploaded_today: 0 },
        cases: { total: 0, high_priority: 0 },
      });
      setDeadlines([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDatevStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch DATEV status
      const statusResponse = await fetch('http://localhost:8080/api/v1/datev/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setDatevStatus(statusData);
      }
      
      // Fetch DATEV jobs for the last 24 hours
      const jobsResponse = await fetch('http://localhost:8080/api/v1/datev/jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        // Count jobs completed in the last 24 hours
        const recentExports = Array.isArray(jobsData) 
          ? jobsData.filter((job: any) => {
              if (job.completedAt) {
                const completedDate = new Date(job.completedAt);
                return completedDate >= yesterday;
              }
              return false;
            }).length
          : 0;
        
        setDatevExportsCount(recentExports);
      }
    } catch (error) {
      console.error('Error fetching DATEV status:', error);
      setDatevStatus({ connected: false, lastSync: null });
      setDatevExportsCount(0);
    }
  };

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8080/api/v1/audit/recent', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Upload':
      case 'CREATE':
        return '📄';
      case 'Download':
        return '📥';
      case 'UPDATE':
        return '✏️';
      case 'DELETE':
        return '🗑️';
      default:
        return '📋';
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  return (
    <div className="flex min-h-screen bg-secondary dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Welcome Hero Section with Gradient */}
        <div className="bg-gradient-to-r from-primary to-primary/80 dark:from-blue-600 dark:to-blue-700 text-white p-8 rounded-lg shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {t('dashboard.welcomeBack')}{currentUser?.firstName ? `, ${currentUser.firstName} ${currentUser.lastName}` : ''}! 👋
              </h1>
              <p className="text-white/90 text-lg">
                {t('dashboard.overviewFor')}, {new Date().toLocaleDateString(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <LanguageSwitcher />
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl">
                📊
              </div>
            </div>
          </div>
        </div>

        {/* Key Stats Cards - CLIENT_, DOC_, COMPLY_, DATEV_ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {/* CLIENT_ Stats */}
          <Link to="/portal/clients" className="block">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">+{stats.clients.new_this_month} {t('dashboard.stats.newClients')}</span>
              </div>
              <h3 className="text-sm font-semibold text-textSecondary dark:text-gray-400 mb-1">{t('dashboard.stats.activeClients')}</h3>
              <p className="text-3xl font-bold text-primary dark:text-blue-400">{loading ? '...' : stats.clients.active}</p>
              <p className="text-xs text-textSecondary dark:text-gray-400 mt-2">{t('dashboard.stats.ofTotal', { total: stats.clients.total })}</p>
            </div>
          </Link>

          {/* DOC_ Stats */}
          <Link to="/portal/documents" className="block">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📄</span>
                </div>
                <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">{stats.documents.pending_signature} {t('dashboard.stats.documentsPending')}</span>
              </div>
              <h3 className="text-sm font-semibold text-textSecondary dark:text-gray-400 mb-1">{t('dashboard.stats.documents')}</h3>
              <p className="text-3xl font-bold text-primary dark:text-blue-400">{loading ? '...' : stats.documents.total}</p>
              <p className="text-xs text-textSecondary dark:text-gray-400 mt-2">{t('dashboard.stats.documentsToday', { count: stats.documents.uploaded_today })}</p>
            </div>
          </Link>

          {/* COMPLY_ Stats */}
          <Link to="/portal/cases" className="block">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⏰</span>
                </div>
                <span className="text-xs text-red-600 dark:text-red-400 font-medium">{t('dashboard.stats.urgent')}</span>
              </div>
              <h3 className="text-sm font-semibold text-textSecondary dark:text-gray-400 mb-1">{t('dashboard.stats.upcomingDeadlines')}</h3>
              <p className="text-3xl font-bold text-primary dark:text-blue-400">{loading ? '...' : deadlines.length}</p>
              <p className="text-xs text-textSecondary dark:text-gray-400 mt-2">{t('dashboard.stats.dueSoon')}</p>
            </div>
          </Link>

          {/* DATEV_ Stats */}
          <Link to="/portal/datev" className="block">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🔄</span>
                </div>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">{t('dashboard.stats.active')}</span>
              </div>
              <h3 className="text-sm font-semibold text-textSecondary dark:text-gray-400 mb-1">{t('dashboard.stats.datevExports')}</h3>
              <p className="text-3xl font-bold text-primary dark:text-blue-400">{loading ? '...' : datevExportsCount}</p>
              <p className="text-xs text-textSecondary dark:text-gray-400 mt-2">{t('dashboard.stats.last24Hours')}</p>
            </div>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* COMPLY_ Deadlines */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-textPrimary dark:text-gray-100">⏰ {t('dashboard.sections.deadlines')}</h2>
              <Link to="/portal/cases" className="text-primary dark:text-blue-400 hover:underline text-sm">{t('dashboard.sections.viewAll')} →</Link>
            </div>
            
            <div className="space-y-3">
              {deadlines.length === 0 ? (
                <p className="text-textSecondary dark:text-gray-400 text-center py-4">{t('dashboard.sections.noDeadlines')}</p>
              ) : (
                deadlines.map((deadline) => (
                  <div key={deadline.id} className="border-l-4 border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-r-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-textPrimary dark:text-gray-100 mb-1">{deadline.title}</h3>
                        <p className="text-sm text-textSecondary dark:text-gray-400">{t('dashboard.sections.client')}: {deadline.clientName}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          deadline.priority === 'Hoch'
                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' 
                            : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {deadline.priority === 'Hoch' ? `🔴 ${t('dashboard.sections.highPriority')}` : `🟡 ${t('dashboard.sections.normalPriority')}`}
                        </span>
                        <p className="text-sm text-textSecondary dark:text-gray-400 mt-2">📅 {new Date(deadline.dueDate).toLocaleDateString(i18n.language)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-textPrimary dark:text-gray-100 mb-4">⚡ {t('dashboard.sections.quickActions')}</h2>
            
            <div className="space-y-3">
              <Link to="/portal/clients" className="block">
                <button className="w-full btn-primary text-left flex items-center gap-3 hover:scale-105 transition-transform">
                  <span>👥</span>
                  <span>{t('dashboard.sections.newClient')}</span>
                </button>
              </Link>
              <Link to="/portal/documents" className="block">
                <button className="w-full btn-secondary dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 text-left flex items-center gap-3 hover:scale-105 transition-transform">
                  <span>📤</span>
                  <span>{t('dashboard.sections.uploadDocument')}</span>
                </button>
              </Link>
              <Link to="/portal/cases" className="block">
                <button className="w-full btn-secondary dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 text-left flex items-center gap-3 hover:scale-105 transition-transform">
                  <span>📁</span>
                  <span>{t('dashboard.sections.newCase')}</span>
                </button>
              </Link>
              <Link to="/portal/datev" className="block">
                <button className="w-full btn-secondary dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 text-left flex items-center gap-3 hover:scale-105 transition-transform">
                  <span>🔄</span>
                  <span>{t('dashboard.sections.datevExport')}</span>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Grid - DATEV_ and Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* DATEV_ Status */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-textPrimary dark:text-gray-100">🔄 {t('dashboard.sections.datevActivity')}</h2>
              <Link to="/portal/datev" className="text-primary dark:text-blue-400 hover:underline text-sm">{t('dashboard.sections.details')} →</Link>
            </div>
            
            {datevStatus ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`w-3 h-3 rounded-full ${datevStatus.connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="font-medium text-textPrimary dark:text-gray-100">
                    {datevStatus.connected ? 'Verbunden' : 'Nicht verbunden'}
                  </span>
                </div>
                
                {datevStatus.lastSync && (
                  <p className="text-sm text-textSecondary dark:text-gray-400 mb-4">
                    Letzte Synchronisation: {new Date(datevStatus.lastSync).toLocaleString('de-DE')}
                  </p>
                )}
                
                {!datevStatus.connected && (
                  <Link to="/portal/datev">
                    <button className="mt-3 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                      DATEV einrichten
                    </button>
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-textSecondary dark:text-gray-400">Laden...</p>
            )}
          </div>

          {/* Recent System Activity */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-textPrimary dark:text-gray-100 mb-4">📋 {t('dashboard.sections.recentActivity')}</h2>
            
            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={activity.id || index} className="flex items-center justify-between border-b dark:border-gray-700 pb-4 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div>
                        <p className="font-medium text-textPrimary dark:text-gray-100">{activity.description}</p>
                      </div>
                    </div>
                    <span className="text-xs text-textSecondary dark:text-gray-400">{formatRelativeTime(activity.timestamp)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-textSecondary dark:text-gray-400 text-center py-8">
                Noch keine Aktivitäten vorhanden
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
