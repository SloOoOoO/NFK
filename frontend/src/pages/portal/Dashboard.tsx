import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

export default function Dashboard() {
  // Feature prefix data organization
  const AUTH_currentUser = { name: 'Max Berater', role: 'Steuerberater', avatar: 'MB' };
  
  const CLIENT_stats = {
    total: 87,
    active: 65,
    new_this_month: 5,
  };
  
  const DOC_stats = {
    total: 234,
    pending_signature: 12,
    uploaded_today: 3,
  };
  
  const COMPLY_deadlines = [
    { id: 1, title: 'Umsatzsteuervoranmeldung Q4', mandant: 'Schmidt GmbH', deadline: '20.01.2025', priority: 'high' },
    { id: 2, title: 'Jahresabschluss 2024', mandant: 'Müller & Partner', deadline: '30.01.2025', priority: 'medium' },
    { id: 3, title: 'Lohnsteueranmeldung', mandant: 'Koch Consulting', deadline: '15.01.2025', priority: 'high' },
  ];
  
  const DATEV_recent = [
    { id: 1, action: 'Export abgeschlossen', mandant: 'Schmidt GmbH', time: 'Vor 2 Stunden', status: 'success' },
    { id: 2, action: 'Synchronisation gestartet', mandant: 'Becker AG', time: 'Vor 5 Stunden', status: 'pending' },
  ];
  
  const ELSTER_status = {
    pending_submissions: 3,
    completed_this_month: 15,
  };

  return (
    <div className="flex min-h-screen bg-secondary">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Welcome Hero Section with Gradient */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-8 rounded-lg shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Willkommen zurück, {AUTH_currentUser.name}! 👋</h1>
              <p className="text-white/90 text-lg">
                Hier ist Ihre Übersicht für heute, {new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="hidden md:block">
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
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <span className="text-xs text-green-600 font-medium">+{CLIENT_stats.new_this_month} neu</span>
              </div>
              <h3 className="text-sm font-semibold text-textSecondary mb-1">Aktive Mandanten</h3>
              <p className="text-3xl font-bold text-primary">{CLIENT_stats.active}</p>
              <p className="text-xs text-textSecondary mt-2">von {CLIENT_stats.total} gesamt</p>
            </div>
          </Link>

          {/* DOC_ Stats */}
          <Link to="/portal/documents" className="block">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📄</span>
                </div>
                <span className="text-xs text-orange-600 font-medium">{DOC_stats.pending_signature} ausstehend</span>
              </div>
              <h3 className="text-sm font-semibold text-textSecondary mb-1">Dokumente</h3>
              <p className="text-3xl font-bold text-primary">{DOC_stats.total}</p>
              <p className="text-xs text-textSecondary mt-2">{DOC_stats.uploaded_today} heute hochgeladen</p>
            </div>
          </Link>

          {/* COMPLY_ Stats */}
          <Link to="/portal/cases" className="block">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⏰</span>
                </div>
                <span className="text-xs text-red-600 font-medium">Dringend</span>
              </div>
              <h3 className="text-sm font-semibold text-textSecondary mb-1">Anstehende Fristen</h3>
              <p className="text-3xl font-bold text-primary">{COMPLY_deadlines.length}</p>
              <p className="text-xs text-textSecondary mt-2">Diese Woche fällig</p>
            </div>
          </Link>

          {/* DATEV_ Stats */}
          <Link to="/portal/datev" className="block">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🔄</span>
                </div>
                <span className="text-xs text-green-600 font-medium">Aktiv</span>
              </div>
              <h3 className="text-sm font-semibold text-textSecondary mb-1">DATEV Exports</h3>
              <p className="text-3xl font-bold text-primary">{DATEV_recent.length}</p>
              <p className="text-xs text-textSecondary mt-2">Letzte 24 Stunden</p>
            </div>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* COMPLY_ Deadlines */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-textPrimary">⏰ Anstehende Fristen</h2>
              <Link to="/portal/cases" className="text-primary hover:underline text-sm">Alle anzeigen →</Link>
            </div>
            
            <div className="space-y-3">
              {COMPLY_deadlines.map((deadline) => (
                <div key={deadline.id} className="border-l-4 border-red-400 bg-red-50 p-4 rounded-r-lg hover:bg-red-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-textPrimary mb-1">{deadline.title}</h3>
                      <p className="text-sm text-textSecondary">Mandant: {deadline.mandant}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        deadline.priority === 'high' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {deadline.priority === 'high' ? '🔴 Dringend' : '🟡 Normal'}
                      </span>
                      <p className="text-sm text-textSecondary mt-2">📅 {deadline.deadline}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-textPrimary mb-4">⚡ Schnellzugriff</h2>
            
            <div className="space-y-3">
              <Link to="/portal/clients" className="block">
                <button className="w-full btn-primary text-left flex items-center gap-3 hover:scale-105 transition-transform">
                  <span>👥</span>
                  <span>Neuer Mandant</span>
                </button>
              </Link>
              <Link to="/portal/documents" className="block">
                <button className="w-full btn-secondary text-left flex items-center gap-3 hover:scale-105 transition-transform">
                  <span>📤</span>
                  <span>Dokument hochladen</span>
                </button>
              </Link>
              <Link to="/portal/cases" className="block">
                <button className="w-full btn-secondary text-left flex items-center gap-3 hover:scale-105 transition-transform">
                  <span>📁</span>
                  <span>Neuer Fall</span>
                </button>
              </Link>
              <Link to="/portal/datev" className="block">
                <button className="w-full btn-secondary text-left flex items-center gap-3 hover:scale-105 transition-transform">
                  <span>🔄</span>
                  <span>DATEV Export</span>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Grid - DATEV_ and Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* DATEV_ Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-textPrimary">🔄 DATEV Aktivitäten</h2>
              <Link to="/portal/datev" className="text-primary hover:underline text-sm">Details →</Link>
            </div>
            
            <div className="space-y-3">
              {DATEV_recent.map((item) => (
                <div key={item.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      item.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-textPrimary">{item.action}</p>
                      <p className="text-sm text-textSecondary">{item.mandant}</p>
                    </div>
                  </div>
                  <span className="text-xs text-textSecondary whitespace-nowrap">{item.time}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-textSecondary">ELSTER Einreichungen</span>
                <span className="font-semibold text-primary">{ELSTER_status.pending_submissions} ausstehend</span>
              </div>
            </div>
          </div>

          {/* Recent System Activity */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-textPrimary mb-4">📋 Letzte Aktivitäten</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    📄
                  </div>
                  <div>
                    <p className="font-medium text-textPrimary">Dokument hochgeladen</p>
                    <p className="text-sm text-textSecondary">Jahresabschluss_2024.pdf</p>
                  </div>
                </div>
                <span className="text-xs text-textSecondary">2h</span>
              </div>
              
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    ✅
                  </div>
                  <div>
                    <p className="font-medium text-textPrimary">Fall abgeschlossen</p>
                    <p className="text-sm text-textSecondary">FALL-2025-003</p>
                  </div>
                </div>
                <span className="text-xs text-textSecondary">5h</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    💬
                  </div>
                  <div>
                    <p className="font-medium text-textPrimary">Neue Nachricht</p>
                    <p className="text-sm text-textSecondary">Anna Schmidt</p>
                  </div>
                </div>
                <span className="text-xs text-textSecondary">1d</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
