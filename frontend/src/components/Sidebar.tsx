import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import DarkModeToggle from './DarkModeToggle';
import apiClient from '../services/api';

export default function Sidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser, isLoading: loading, refreshUser } = useAuth();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    // Refresh user data when sidebar mounts to ensure we have latest data
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Fetch unread message count when user is loaded
    if (currentUser) {
      fetchUnreadCount();
      // Poll every 60 seconds
      const interval = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.get('/messages/unread-count');
      setUnreadMessageCount(response.data?.unreadCount ?? 0);
    } catch {
      // Silently fail - badge just won't show
    }
  };

  const handleLogout = () => {
    // Clear tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Redirect to login page
    navigate('/auth/login');
  };

  const handleProfileClick = () => {
    navigate('/portal/profile');
  };

  const navItems: { name: string; path: string; icon: string; badge?: number }[] = [
    { name: t('dashboard.nav.dashboard'), path: '/portal/dashboard', icon: '📊' },
    { name: t('dashboard.nav.cases'), path: '/portal/cases', icon: '📁' },
    { name: t('dashboard.nav.documents'), path: '/portal/documents', icon: '📄' },
    { name: t('dashboard.nav.messages'), path: '/portal/messages', icon: '✉️', badge: unreadMessageCount },
    { name: t('dashboard.nav.calendar'), path: '/portal/calendar', icon: '📅' },
    { name: t('dashboard.nav.connections'), path: '/portal/connections', icon: '🔄' },
  ];

  // RegisteredUser can only access Dashboard and Connections
  const isRegisteredUser = currentUser?.role === 'RegisteredUser';
  const filteredNavItems = isRegisteredUser
    ? navItems.filter(item => item.path === '/portal/dashboard' || item.path === '/portal/connections')
    : currentUser?.role === 'Receptionist'
      ? navItems.filter(item => item.path !== '/portal/documents')
      : navItems;

  // Add Clients tab only for employee roles (not Client/RegisteredUser)
  const clientRoles = ['Client', 'RegisteredUser'];
  if (currentUser?.role && !clientRoles.includes(currentUser.role) && !isRegisteredUser) {
    filteredNavItems.splice(1, 0, { name: t('dashboard.nav.clients'), path: '/portal/clients', icon: '👥' });
  }

  // Add Admin tab if user is SuperAdmin
  if (currentUser?.role === 'SuperAdmin') {
    filteredNavItems.push({ name: t('dashboard.nav.admin'), path: '/portal/admin', icon: '⚙️' });
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary dark:text-blue-400">NFK Portal</h1>
            <p className="text-sm text-textSecondary dark:text-gray-400 mt-1">Steuerberatung</p>
          </div>
          <DarkModeToggle />
        </div>
      </div>
      
      <nav className="px-3">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 mb-1 rounded-md transition-colors ${
                isActive
                  ? 'bg-primary text-white dark:bg-blue-600'
                  : 'text-textPrimary dark:text-gray-300 hover:bg-secondary dark:hover:bg-gray-700'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium flex-1">{item.name}</span>
            {item.badge != null && item.badge > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {loading ? (
          <div className="text-center text-sm text-textSecondary dark:text-gray-400">{t('common.loading')}</div>
        ) : (
          <>
            <div 
              className="flex items-center gap-3 mb-3 cursor-pointer hover:bg-secondary dark:hover:bg-gray-700 p-2 rounded-md transition-colors"
              onClick={handleProfileClick}
              title="Profil anzeigen"
            >
              <div className="w-10 h-10 bg-primary dark:bg-blue-600 rounded-full flex items-center justify-center text-white">
                {getInitials(currentUser?.firstName, currentUser?.lastName)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm dark:text-gray-200">
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <p className="text-xs text-textSecondary dark:text-gray-400">
                  {currentUser?.role || 'User'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full btn-secondary text-sm flex items-center justify-center gap-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              <span>🚪</span>
              <span>{t('common.logout')}</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
