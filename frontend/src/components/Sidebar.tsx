import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const navItems = [
    { name: 'Dashboard', path: '/portal/dashboard', icon: '📊' },
    { name: 'Mandanten', path: '/portal/clients', icon: '👥' },
    { name: 'Fälle', path: '/portal/cases', icon: '📁' },
    { name: 'Dokumente', path: '/portal/documents', icon: '📄' },
    { name: 'Nachrichten', path: '/portal/messages', icon: '✉️' },
    { name: 'Kalender', path: '/portal/calendar', icon: '📅' },
    { name: 'DATEV', path: '/portal/datev', icon: '🔄' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">NFK Portal</h1>
        <p className="text-sm text-textSecondary mt-1">Steuerberatung</p>
      </div>
      
      <nav className="px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 mb-1 rounded-md transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-textPrimary hover:bg-secondary'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
            MB
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Max Berater</p>
            <p className="text-xs text-textSecondary">Steuerberater</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
