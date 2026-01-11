import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { adminAPI } from '../../services/api';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [headerText, setHeaderText] = useState({ welcomeTitle: '', welcomeSubtitle: '' });
  const [editingHeader, setEditingHeader] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, headerRes] = await Promise.allSettled([
        adminAPI.getAllUsers(),
        adminAPI.getHeaderText(),
      ]);

      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value.data);
      }

      if (headerRes.status === 'fulfilled') {
        setHeaderText(headerRes.value.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch admin data:', error);
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        alert('Sie haben keine Berechtigung für diese Seite');
        navigate('/portal/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      // Refresh users list
      const response = await adminAPI.getAllUsers();
      setUsers(response.data);
      alert('Benutzerrolle erfolgreich aktualisiert');
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('Fehler beim Aktualisieren der Benutzerrolle');
    }
  };

  const handleHeaderTextUpdate = async () => {
    try {
      await adminAPI.updateHeaderText(headerText);
      setEditingHeader(false);
      alert('Header-Text erfolgreich aktualisiert');
    } catch (error) {
      console.error('Failed to update header text:', error);
      alert('Fehler beim Aktualisieren des Header-Textes');
    }
  };

  const roles = ['SuperAdmin', 'Consultant', 'Receptionist', 'Client', 'DATEVManager'];

  return (
    <div className="flex min-h-screen bg-secondary">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-primary">Admin Dashboard</h1>
          
          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-300">
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'users'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-textSecondary hover:text-primary'
              }`}
            >
              👥 Benutzerverwaltung
            </button>
            <button
              onClick={() => setActiveTab('header')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'header'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-textSecondary hover:text-primary'
              }`}
            >
              ✏️ Header-Text
            </button>
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Benutzerverwaltung</h2>
              
              {loading ? (
                <div className="text-center py-8">Lädt...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-textSecondary">Keine Benutzer gefunden</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">E-Mail</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Rolle</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Erstellt am</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-secondary/50">
                          <td className="px-4 py-3 text-sm">{user.id}</td>
                          <td className="px-4 py-3 text-sm font-medium">{user.fullName}</td>
                          <td className="px-4 py-3 text-sm">{user.email}</td>
                          <td className="px-4 py-3 text-sm">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              {roles.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs ${
                                user.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {user.isActive ? 'Aktiv' : 'Inaktiv'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-textSecondary">
                            {new Date(user.createdAt).toLocaleDateString('de-DE')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Header Text Tab */}
          {activeTab === 'header' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Dashboard Header-Text</h2>
                {!editingHeader ? (
                  <button
                    onClick={() => setEditingHeader(true)}
                    className="btn-primary text-sm"
                  >
                    Bearbeiten
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleHeaderTextUpdate}
                      className="btn-primary text-sm"
                    >
                      Speichern
                    </button>
                    <button
                      onClick={() => setEditingHeader(false)}
                      className="btn-secondary text-sm"
                    >
                      Abbrechen
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-2">
                    Willkommenstitel
                  </label>
                  {editingHeader ? (
                    <input
                      type="text"
                      value={headerText.welcomeTitle}
                      onChange={(e) =>
                        setHeaderText({ ...headerText, welcomeTitle: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="z.B. Willkommen zurück"
                    />
                  ) : (
                    <p className="text-lg font-semibold">{headerText.welcomeTitle}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-2">
                    Untertitel
                  </label>
                  {editingHeader ? (
                    <input
                      type="text"
                      value={headerText.welcomeSubtitle}
                      onChange={(e) =>
                        setHeaderText({ ...headerText, welcomeSubtitle: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="z.B. Ihr persönliches Steuerberatungsportal"
                    />
                  ) : (
                    <p className="text-textSecondary">{headerText.welcomeSubtitle}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
