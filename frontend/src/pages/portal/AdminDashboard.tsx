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
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [newRole, setNewRole] = useState('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const usersRes = await adminAPI.getAllUsers();
      setUsers(usersRes.data);
      
      // Fetch audit logs and statistics for tabs
      fetchAuditLogs();
      fetchStatistics();
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

  const fetchStatistics = async () => {
    try {
      const response = await adminAPI.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      setStatistics(null);
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

  const roles = ['SuperAdmin', 'Admin', 'Consultant', 'Receptionist', 'Client', 'DATEVManager'];

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

          {/* Audit Logs Tab */}
          {activeTab === 'logs' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Audit Logs</h2>
              
              {loading ? (
                <div className="text-center py-8 text-textSecondary dark:text-gray-400">Lädt...</div>
              ) : !auditLogs || (Array.isArray(auditLogs) && auditLogs.length === 0) || ((auditLogs as any).data && (auditLogs as any).data.length === 0) ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  Noch keine Audit-Logs vorhanden
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
                      {((auditLogs as any).data || auditLogs).map((log: any) => (
                        <tr key={log.id} className="border-b dark:border-gray-700 hover:bg-secondary/50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm dark:text-gray-300">
                            {new Date(log.timestamp).toLocaleString('de-DE')}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium dark:text-gray-200">
                            {typeof log.user === 'object' 
                              ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || 'System'
                              : log.user || 'System'}
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
                          <td className="px-4 py-3 text-sm dark:text-gray-300">{log.ipAddress || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm dark:text-gray-300">{log.details || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Analytics/Statistics Tab */}
          {activeTab === 'analytics' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-6 dark:text-white">Statistiken</h2>
              
              {loading ? (
                <div className="text-center py-8 text-textSecondary dark:text-gray-400">Lädt...</div>
              ) : !statistics ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  Keine Statistiken verfügbar
                </div>
              ) : (
                <div className="space-y-8">
                  {/* User Statistics */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Benutzerstatistiken</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow text-white">
                        <div className="text-4xl font-bold mb-2">
                          {statistics.totalUsers?.toLocaleString('de-DE') || 0}
                        </div>
                        <div className="text-blue-100">Gesamte Benutzer</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow text-white">
                        <div className="text-4xl font-bold mb-2">
                          {statistics.totalClients?.toLocaleString('de-DE') || 0}
                        </div>
                        <div className="text-green-100">Klienten</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow text-white">
                        <div className="text-4xl font-bold mb-2">
                          {statistics.activeUsers?.toLocaleString('de-DE') || 0}
                        </div>
                        <div className="text-purple-100">Aktive Benutzer</div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg shadow text-white">
                        <div className="text-4xl font-bold mb-2">
                          {statistics.monthlyActive?.count?.toLocaleString('de-DE') || 0}
                        </div>
                        <div className="text-orange-100">Aktiv diesen Monat</div>
                      </div>
                    </div>
                  </div>

                  {/* Active Users */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Aktive Benutzer</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                          {statistics.dailyActive?.count || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Heute angemeldet</div>
                      </div>
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                          {statistics.weeklyActive?.count || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Diese Woche angemeldet</div>
                      </div>
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                          {statistics.monthlyActive?.count || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Diesen Monat angemeldet</div>
                      </div>
                    </div>
                  </div>

                  {/* New Signups */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Neue Registrierungen</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                          {statistics.newSignups?.today || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Heute</div>
                      </div>
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                          {statistics.newSignups?.thisWeek || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Diese Woche</div>
                      </div>
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                          {statistics.newSignups?.thisMonth || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Diesen Monat</div>
                      </div>
                    </div>
                  </div>

                  {/* Key Events */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Wichtige Ereignisse</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-secondary dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-200">Ereignis</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold dark:text-gray-200">Heute</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold dark:text-gray-200">Diese Woche</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b dark:border-gray-700">
                            <td className="px-4 py-3 text-sm dark:text-gray-300">🔐 Erfolgreiche Anmeldungen</td>
                            <td className="px-4 py-3 text-sm text-right font-medium dark:text-gray-200">
                              {statistics.keyEvents?.loginsToday || 0}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium dark:text-gray-200">
                              {statistics.keyEvents?.loginsThisWeek || 0}
                            </td>
                          </tr>
                          <tr className="border-b dark:border-gray-700">
                            <td className="px-4 py-3 text-sm dark:text-gray-300">📄 Dokument-Uploads</td>
                            <td className="px-4 py-3 text-sm text-right font-medium dark:text-gray-200">
                              {statistics.keyEvents?.documentUploadsToday || 0}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium dark:text-gray-200">
                              {statistics.keyEvents?.documentUploadsThisWeek || 0}
                            </td>
                          </tr>
                          <tr className="border-b dark:border-gray-700">
                            <td className="px-4 py-3 text-sm dark:text-gray-300">📊 DATEV Synchronisationen abgeschlossen</td>
                            <td className="px-4 py-3 text-sm text-right font-medium dark:text-gray-200">
                              {statistics.keyEvents?.datevSyncsCompletedToday || 0}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium dark:text-gray-200">
                              {statistics.keyEvents?.datevSyncsCompletedThisWeek || 0}
                            </td>
                          </tr>
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
