import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { adminAPI } from '../../services/api';
import apiClient from '../../services/api';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [headerText, setHeaderText] = useState({ welcomeTitle: '', welcomeSubtitle: '' });
  const [editingHeader, setEditingHeader] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [newRole, setNewRole] = useState('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
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
      
      // Fetch audit logs and analytics for tabs
      fetchAuditLogs();
      fetchAnalytics();
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

  const fetchAuditLogs = async () => {
    try {
      const response = await apiClient.get('/audit/logs');
      setAuditLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      setAuditLogs([]);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await apiClient.get('/analytics/page-visits');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setAnalytics(null);
    }
  };

  const openRoleModal = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    try {
      await adminAPI.updateUserRole(selectedUser.id, newRole);
      const response = await adminAPI.getAllUsers();
      setUsers(response.data);
      setShowRoleModal(false);
      alert('Benutzerrolle erfolgreich aktualisiert');
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('Fehler beim Aktualisieren der Benutzerrolle');
    }
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      fullLegalName: user.fullLegalName || user.fullName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      taxId: user.taxId || '',
      address: user.address || '',
      city: user.city || '',
      postalCode: user.postalCode || '',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
    });
    setShowEditModal(true);
  };

  const handleUserUpdate = async () => {
    if (!selectedUser) return;
    try {
      await adminAPI.updateUserProfile(selectedUser.id, editForm);
      const response = await adminAPI.getAllUsers();
      setUsers(response.data);
      setShowEditModal(false);
      alert('Benutzer erfolgreich aktualisiert');
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Fehler beim Aktualisieren des Benutzers');
    }
  };

  const handleHeaderTextUpdate = async () => {
    setSavingHeader(true);
    try {
      await adminAPI.updateHeaderText(headerText);
      setEditingHeader(false);
      alert('Header-Text erfolgreich aktualisiert');
    } catch (error) {
      console.error('Failed to update header text:', error);
      alert('Fehler beim Aktualisieren des Header-Textes');
    } finally {
      setSavingHeader(false);
    }
  };

  const roles = ['SuperAdmin', 'Consultant', 'Receptionist', 'Client', 'DATEVManager'];

  return (
    <div className="flex min-h-screen bg-secondary dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-primary dark:text-blue-400">Admin Dashboard</h1>
          
          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-300 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'users'
                  ? 'border-b-2 border-primary text-primary dark:text-blue-400'
                  : 'text-textSecondary dark:text-gray-400 hover:text-primary dark:hover:text-blue-400'
              }`}
            >
              👥 Benutzerverwaltung
            </button>
            <button
              onClick={() => setActiveTab('header')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'header'
                  ? 'border-b-2 border-primary text-primary dark:text-blue-400'
                  : 'text-textSecondary dark:text-gray-400 hover:text-primary dark:hover:text-blue-400'
              }`}
            >
              ✏️ Header-Text
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'logs'
                  ? 'border-b-2 border-primary text-primary dark:text-blue-400'
                  : 'text-textSecondary dark:text-gray-400 hover:text-primary dark:hover:text-blue-400'
              }`}
            >
              📋 Logs
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'border-b-2 border-primary text-primary dark:text-blue-400'
                  : 'text-textSecondary dark:text-gray-400 hover:text-primary dark:hover:text-blue-400'
              }`}
            >
              📊 Statistiken
            </button>
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Benutzerverwaltung</h2>
              
              {loading ? (
                <div className="text-center py-8 dark:text-gray-400">Lädt...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-textSecondary dark:text-gray-400">Keine Benutzer gefunden</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-200">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-200">E-Mail</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-200">Rolle</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-200">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-200">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b dark:border-gray-700 hover:bg-secondary/50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm font-medium dark:text-gray-200">{user.fullName}</td>
                          <td className="px-4 py-3 text-sm dark:text-gray-300">{user.email}</td>
                          <td className="px-4 py-3 text-sm dark:text-gray-300">
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs ${
                                user.isActive
                                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                              }`}
                            >
                              {user.isActive ? 'Aktiv' : 'Inaktiv'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openRoleModal(user)}
                                className="px-3 py-1 bg-primary dark:bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-700 text-xs"
                              >
                                Rolle ändern
                              </button>
                              <button
                                onClick={() => openEditModal(user)}
                                className="px-3 py-1 bg-gray-600 dark:bg-gray-700 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 text-xs"
                              >
                                Bearbeiten
                              </button>
                            </div>
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
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold dark:text-white">Dashboard Header-Text</h2>
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
                      disabled={savingHeader}
                    >
                      {savingHeader ? 'Speichert...' : 'Speichern'}
                    </button>
                    <button
                      onClick={() => setEditingHeader(false)}
                      className="btn-secondary text-sm"
                      disabled={savingHeader}
                    >
                      Abbrechen
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textSecondary dark:text-gray-300 mb-2">
                    Willkommenstitel
                  </label>
                  {editingHeader ? (
                    <textarea
                      value={headerText.welcomeTitle}
                      onChange={(e) =>
                        setHeaderText({ ...headerText, welcomeTitle: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                      placeholder="z.B. Willkommen zurück"
                      rows={3}
                    />
                  ) : (
                    <p className="text-lg font-semibold dark:text-gray-200">{headerText.welcomeTitle}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-textSecondary dark:text-gray-300 mb-2">
                    Untertitel
                  </label>
                  {editingHeader ? (
                    <textarea
                      value={headerText.welcomeSubtitle}
                      onChange={(e) =>
                        setHeaderText({ ...headerText, welcomeSubtitle: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                      placeholder="z.B. Ihr persönliches Steuerberatungsportal"
                      rows={3}
                    />
                  ) : (
                    <p className="text-textSecondary dark:text-gray-300">{headerText.welcomeSubtitle}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === 'logs' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Audit Logs</h2>
              
              {loading || auditLogs.length === 0 ? (
                <div className="text-center py-8 text-textSecondary dark:text-gray-400">
                  {loading ? 'Lädt...' : 'Keine Logs gefunden'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-200">Zeitstempel</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-200">Benutzer</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-200">Aktion</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-200">Entität</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-200">IP-Adresse</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-200">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="border-b dark:border-gray-700 hover:bg-secondary/50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm dark:text-gray-300">
                            {new Date(log.timestamp).toLocaleString('de-DE')}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium dark:text-gray-200">
                            {log.user.firstName} {log.user.lastName}
                          </td>
                          <td className="px-4 py-3 text-sm dark:text-gray-300">
                            <span className={`px-2 py-1 rounded text-xs ${
                              log.action === 'CREATE' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                              log.action === 'UPDATE' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                              log.action === 'DELETE' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm dark:text-gray-300">
                            {log.entityType} #{log.entityId}
                          </td>
                          <td className="px-4 py-3 text-sm dark:text-gray-300">{log.ipAddress}</td>
                          <td className="px-4 py-3 text-sm dark:text-gray-300">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-6 dark:text-white">Statistiken</h2>
              
              {loading || !analytics ? (
                <div className="text-center py-8 text-textSecondary dark:text-gray-400">
                  {loading ? 'Lädt...' : 'Keine Statistiken verfügbar'}
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Total this year */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow text-white">
                      <div className="text-4xl font-bold mb-2">
                        {analytics.yearly?.[0]?.visits?.toLocaleString('de-DE') || 0}
                      </div>
                      <div className="text-blue-100">Besuche dieses Jahr</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow text-white">
                      <div className="text-4xl font-bold mb-2">
                        {analytics.monthly?.[analytics.monthly.length - 1]?.visits?.toLocaleString('de-DE') || 0}
                      </div>
                      <div className="text-green-100">Besuche diesen Monat</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow text-white">
                      <div className="text-4xl font-bold mb-2">
                        {analytics.daily?.[analytics.daily.length - 1]?.visits || 0}
                      </div>
                      <div className="text-purple-100">Besuche heute</div>
                    </div>
                  </div>
                  
                  {/* Daily visits chart (last 30 days) - simplified table view */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Tägliche Besuche (letzte 30 Tage)</h3>
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <div className="grid grid-cols-7 gap-2">
                        {analytics.daily?.slice(-7).map((day: any, index: number) => (
                          <div key={index} className="text-center">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{day.date.split('.')[0]}.{day.date.split('.')[1]}</div>
                            <div className="bg-blue-500 rounded" style={{ height: `${Math.max(20, (day.visits / 200) * 100)}px` }}></div>
                            <div className="text-sm font-semibold mt-2 dark:text-gray-200">{day.visits}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Monthly visits (last 12 months) */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Monatliche Besuche (letzte 12 Monate)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-secondary dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-semibold dark:text-gray-200">Monat</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold dark:text-gray-200">Besuche</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.monthly?.map((month: any, index: number) => (
                            <tr key={index} className="border-b dark:border-gray-700">
                              <td className="px-4 py-2 text-sm dark:text-gray-300">{month.month}</td>
                              <td className="px-4 py-2 text-sm text-right font-medium dark:text-gray-200">
                                {month.visits.toLocaleString('de-DE')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Role Change Modal */}
      <Dialog.Root open={showRoleModal} onOpenChange={setShowRoleModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <Dialog.Title className="text-xl font-bold mb-4 dark:text-white">
              Rolle ändern
            </Dialog.Title>
            <Dialog.Description className="text-sm text-textSecondary dark:text-gray-400 mb-4">
              Rolle für {selectedUser?.fullName} ändern
            </Dialog.Description>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                Neue Rolle
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <button className="btn-secondary">
                  Abbrechen
                </button>
              </Dialog.Close>
              <button
                onClick={handleRoleChange}
                className="btn-primary"
              >
                Speichern
              </button>
            </div>

            <Dialog.Close asChild>
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit User Modal */}
      <Dialog.Root open={showEditModal} onOpenChange={setShowEditModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-bold mb-4 dark:text-white">
              Benutzer bearbeiten
            </Dialog.Title>
            <Dialog.Description className="text-sm text-textSecondary dark:text-gray-400 mb-4">
              Informationen für {selectedUser?.fullName} bearbeiten
            </Dialog.Description>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Vollständiger Name
                </label>
                <input
                  type="text"
                  value={editForm.fullLegalName || ''}
                  onChange={(e) => setEditForm({ ...editForm, fullLegalName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  E-Mail
                </label>
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={editForm.phoneNumber || ''}
                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Steuernummer
                </label>
                <input
                  type="text"
                  value={editForm.taxId || ''}
                  onChange={(e) => setEditForm({ ...editForm, taxId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Adresse
                </label>
                <input
                  type="text"
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                    Stadt
                  </label>
                  <input
                    type="text"
                    value={editForm.city || ''}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                    Postleitzahl
                  </label>
                  <input
                    type="text"
                    value={editForm.postalCode || ''}
                    onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Geburtsdatum
                </label>
                <input
                  type="date"
                  value={editForm.dateOfBirth || ''}
                  onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <button className="btn-secondary">
                  Abbrechen
                </button>
              </Dialog.Close>
              <button
                onClick={handleUserUpdate}
                className="btn-primary"
              >
                Speichern
              </button>
            </div>

            <Dialog.Close asChild>
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
