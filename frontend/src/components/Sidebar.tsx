import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import DarkModeToggle from './DarkModeToggle';

export default function Sidebar() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      // If unauthorized, redirect to login
      if ((error as any)?.response?.status === 401) {
        navigate('/auth/login');
      }
    } finally {
      setLoading(false);
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

  const navItems = [
    { name: 'Dashboard', path: '/portal/dashboard', icon: '📊' },
    { name: 'Mandanten', path: '/portal/clients', icon: '👥' },
    { name: 'Fälle', path: '/portal/cases', icon: '📁' },
    { name: 'Dokumente', path: '/portal/documents', icon: '📄' },
    { name: 'Nachrichten', path: '/portal/messages', icon: '✉️' },
    { name: 'Kalender', path: '/portal/calendar', icon: '📅' },
    { name: 'DATEV', path: '/portal/datev', icon: '🔄' },
  ];

  // Add Admin tab if user is SuperAdmin
  if (currentUser?.role === 'SuperAdmin') {
    navItems.push({ name: 'Admin', path: '/portal/admin', icon: '⚙️' });
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
        {navItems.map((item) => (
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
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {loading ? (
          <div className="text-center text-sm text-textSecondary dark:text-gray-400">Loading...</div>
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
              <span>Abmelden</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
