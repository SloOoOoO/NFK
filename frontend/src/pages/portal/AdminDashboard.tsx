import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { adminAPI } from '../../services/api';
import apiClient from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [newRole, setNewRole] = useState('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [consultantUsers, setConsultantUsers] = useState<any[]>([]);
  const [selectedConsultantId, setSelectedConsultantId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

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

      // Fetch consultant/superadmin users for assistant assignment
      const consultantsRes = await apiClient.get('/users?role=Consultant');
      const superAdminsRes = await apiClient.get('/users?role=SuperAdmin');
      const allConsultants = [
        ...(Array.isArray(consultantsRes.data) ? consultantsRes.data : []),
        ...(Array.isArray(superAdminsRes.data) ? superAdminsRes.data : []),
      ];
      setConsultantUsers(allConsultants);
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

  const openEditModal = async (user: any) => {
    setSelectedUser(user);
    // Fetch full user details to get all fields
    let details = user;
    try {
      const res = await adminAPI.getUserDetails(user.id);
      details = res.data;
    } catch {
      // Fall back to user list data
    }
    setEditForm({
      firstName: details.firstName || '',
      lastName: details.lastName || '',
      fullLegalName: details.fullLegalName || details.fullName || '',
      email: details.email || '',
      phoneNumber: details.phoneNumber || '',
      taxId: details.taxId || '',
      taxNumber: details.taxNumber || '',
      vatId: details.vatId || '',
      clientType: details.clientType || '',
      companyName: details.companyName || '',
      salutation: details.salutation || '',
      commercialRegister: details.commercialRegister || '',
      gender: details.gender || '',
      address: details.address || '',
      city: details.city || '',
      postalCode: details.postalCode || '',
      country: details.country || '',
      dateOfBirth: details.dateOfBirth ? details.dateOfBirth.split('T')[0] : '',
    });
    setShowEditModal(true);
  };

  const handleUserUpdate = async () => {
    if (!selectedUser) return;
    try {
      await adminAPI.updateUserProfile(selectedUser.id, {
        ...editForm,
        dateOfBirth: editForm.dateOfBirth || null,
        phoneNumber: editForm.phoneNumber || null,
        taxId: editForm.taxId || null,
        taxNumber: editForm.taxNumber || null,
        vatId: editForm.vatId || null,
        commercialRegister: editForm.commercialRegister || null,
        address: editForm.address || null,
        city: editForm.city || null,
        postalCode: editForm.postalCode || null,
        country: editForm.country || null,
      });
      const response = await adminAPI.getAllUsers();
      setUsers(response.data);
      setShowEditModal(false);
      alert('Benutzer erfolgreich aktualisiert');
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Fehler beim Aktualisieren des Benutzers');
    }
  };

  const openAssignmentModal = async (user: any) => {
    setSelectedUser(user);
    setSelectedConsultantId(null);
    // Try to fetch existing assignment
    try {
      const res = await adminAPI.getAssistantAssignment(user.id);
      if (res.data?.consultantUserId) {
        setSelectedConsultantId(res.data.consultantUserId);
      }
    } catch {
      // No existing assignment - that's fine
    }
    setShowAssignmentModal(true);
  };

  const handleAssignmentSave = async () => {
    if (!selectedUser || !selectedConsultantId) return;
    try {
      await adminAPI.setAssistantAssignment(selectedUser.id, selectedConsultantId);
      setShowAssignmentModal(false);
      alert('Assistent erfolgreich zugewiesen');
    } catch (error) {
      console.error('Failed to assign assistant:', error);
      alert('Fehler beim Zuweisen des Assistenten');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (deleteConfirmText !== 'eteled') {
      alert('Bitte geben Sie "delete" rückwärts ein (eteled), um die Löschung zu bestätigen.');
      return;
    }
    try {
      await adminAPI.deleteUser(selectedUser.id, deleteConfirmText);
      const response = await adminAPI.getAllUsers();
      setUsers(response.data);
      setShowDeleteUserModal(false);
      setShowEditModal(false);
      setDeleteConfirmText('');
      alert('Benutzer erfolgreich gelöscht');
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Fehler beim Löschen des Benutzers');
    }
  };

  const roles = ['SuperAdmin', 'Consultant', 'Receptionist', 'Assistant'];

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
                              {currentUser?.role === 'SuperAdmin' && user.role !== 'SuperAdmin' && user.id !== currentUser?.id && (
                                <button
                                  onClick={() => openRoleModal(user)}
                                  className="px-3 py-1 bg-primary dark:bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-700 text-xs"
                                >
                                  Rolle ändern
                                </button>
                              )}
                              {currentUser?.role === 'SuperAdmin' && user.role === 'Assistant' && (
                                <button
                                  onClick={() => openAssignmentModal(user)}
                                  className="px-3 py-1 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 text-xs"
                                >
                                  Zuweisung
                                </button>
                              )}
                              {currentUser?.role === 'SuperAdmin' && (
                                <button
                                  onClick={() => openEditModal(user)}
                                  className="px-3 py-1 bg-gray-600 dark:bg-gray-700 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 text-xs"
                                >
                                  Bearbeiten
                                </button>
                              )}
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
            <div className="space-y-8">
              {/* Login Activity Section */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-6 dark:text-white">Login-Statistiken</h2>

                {loading ? (
                  <div className="text-center py-8 text-textSecondary dark:text-gray-400">Lädt...</div>
                ) : !statistics ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    Keine Statistiken verfügbar
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Login count summary cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow text-white">
                        <div className="text-4xl font-bold mb-2">
                          {statistics.loginActivity?.daily ?? 0}
                        </div>
                        <div className="text-blue-100 font-medium">Anmeldungen heute</div>
                        <div className="text-blue-200 text-sm mt-1">Tagesstatistik</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow text-white">
                        <div className="text-4xl font-bold mb-2">
                          {statistics.loginActivity?.monthly ?? 0}
                        </div>
                        <div className="text-green-100 font-medium">Anmeldungen diesen Monat</div>
                        <div className="text-green-200 text-sm mt-1">Monatsstatistik</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow text-white">
                        <div className="text-4xl font-bold mb-2">
                          {statistics.loginActivity?.yearly ?? 0}
                        </div>
                        <div className="text-purple-100 font-medium">Anmeldungen dieses Jahr</div>
                        <div className="text-purple-200 text-sm mt-1">Jahresstatistik</div>
                      </div>
                    </div>

                    {/* Login Activity Chart */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">
                        📈 Anmeldungsaktivität – letzte 30 Tage
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                        {statistics.loginActivity?.last30Days?.length > 0 ? (
                          <ResponsiveContainer width="100%" height={280}>
                            <AreaChart
                              data={statistics.loginActivity.last30Days}
                              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="loginGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: '#6b7280' }}
                                tickFormatter={(value: string) => {
                                  const d = new Date(value);
                                  return `${d.getDate()}.${d.getMonth() + 1}`;
                                }}
                                interval={4}
                              />
                              <YAxis
                                tick={{ fontSize: 11, fill: '#6b7280' }}
                                allowDecimals={false}
                                width={30}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#1f2937',
                                  border: 'none',
                                  borderRadius: '8px',
                                  color: '#f9fafb',
                                }}
                                labelFormatter={(label) =>
                                  new Date(String(label)).toLocaleDateString('de-DE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })
                                }
                                formatter={(value) => [Number(value), 'Anmeldungen'] as [number, string]}
                              />
                              <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fill="url(#loginGradient)"
                                dot={false}
                                activeDot={{ r: 5, fill: '#3b82f6' }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500">
                            Noch keine Anmeldedaten vorhanden
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                    Vorname <span className="text-gray-400 text-xs">(schreibgeschützt)</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                    Nachname <span className="text-gray-400 text-xs">(schreibgeschützt)</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Vollständiger rechtlicher Name <span className="text-gray-400 text-xs">(schreibgeschützt)</span>
                </label>
                <input
                  type="text"
                  value={editForm.fullLegalName || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  E-Mail <span className="text-gray-400 text-xs">(schreibgeschützt)</span>
                </label>
                <input
                  type="email"
                  value={editForm.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Anrede</label>
                  <select
                    value={editForm.salutation || ''}
                    onChange={(e) => setEditForm({ ...editForm, salutation: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">--</option>
                    <option value="Herr">Herr</option>
                    <option value="Frau">Frau</option>
                    <option value="Divers">Divers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Geschlecht</label>
                  <select
                    value={editForm.gender || ''}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">--</option>
                    <option value="male">Männlich</option>
                    <option value="female">Weiblich</option>
                    <option value="diverse">Divers</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Mandantenart</label>
                <select
                  value={editForm.clientType || ''}
                  onChange={(e) => setEditForm({ ...editForm, clientType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                >
                  <option value="">--</option>
                  <option value="Privatperson">Privatperson</option>
                  <option value="Einzelunternehmen">Einzelunternehmen</option>
                  <option value="GmbH">GmbH</option>
                  <option value="UG">UG</option>
                  <option value="GbR">GbR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Firmenname</label>
                <input
                  type="text"
                  value={editForm.companyName || ''}
                  onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
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
                  Adresse
                </label>
                <input
                  type="text"
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                    PLZ
                  </label>
                  <input
                    type="text"
                    value={editForm.postalCode || ''}
                    onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                    Land
                  </label>
                  <select
                    value={editForm.country || ''}
                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">—</option>
                    <option value="Deutschland">Deutschland</option>
                    <option value="Österreich">Österreich</option>
                    <option value="Schweiz">Schweiz</option>
                    <option value="Frankreich">Frankreich</option>
                    <option value="Niederlande">Niederlande</option>
                    <option value="Belgien">Belgien</option>
                    <option value="Polen">Polen</option>
                    <option value="Tschechien">Tschechien</option>
                    <option value="Dänemark">Dänemark</option>
                    <option value="Italien">Italien</option>
                    <option value="Spanien">Spanien</option>
                    <option value="Vereinigtes Königreich">Vereinigtes Königreich</option>
                    <option value="USA">USA</option>
                    <option value="Türkei">Türkei</option>
                    <option value="Andere">Andere</option>
                  </select>
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

              <hr className="border-gray-200 dark:border-gray-700 my-2" />
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Steuerdaten</p>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Steuer-ID
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
                  Steuernummer
                </label>
                <input
                  type="text"
                  value={editForm.taxNumber || ''}
                  onChange={(e) => setEditForm({ ...editForm, taxNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  USt-IdNr.
                </label>
                <input
                  type="text"
                  value={editForm.vatId || ''}
                  onChange={(e) => setEditForm({ ...editForm, vatId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Handelsregister
                </label>
                <input
                  type="text"
                  value={editForm.commercialRegister || ''}
                  onChange={(e) => setEditForm({ ...editForm, commercialRegister: e.target.value })}
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

            {selectedUser?.role !== 'SuperAdmin' && (
              <div className="mt-6 border-t border-red-200 dark:border-red-900 pt-4">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-2">Gefahrenbereich</p>
                <button
                  onClick={() => { setShowDeleteUserModal(true); setDeleteConfirmText(''); }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  Benutzer löschen
                </button>
              </div>
            )}

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

      {/* Assistant Assignment Modal */}
      <Dialog.Root open={showAssignmentModal} onOpenChange={setShowAssignmentModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <Dialog.Title className="text-xl font-bold mb-4 dark:text-white">
              Assistent zuweisen
            </Dialog.Title>
            <Dialog.Description className="text-sm text-textSecondary dark:text-gray-400 mb-4">
              Berater für {selectedUser?.fullName} auswählen
            </Dialog.Description>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                Berater / SuperAdmin
              </label>
              <select
                value={selectedConsultantId || ''}
                onChange={(e) => setSelectedConsultantId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
              >
                <option value="">-- Berater auswählen --</option>
                {consultantUsers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.role})
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
                onClick={handleAssignmentSave}
                disabled={!selectedConsultantId}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
      {/* Delete User Confirmation Modal */}
      <Dialog.Root open={showDeleteUserModal} onOpenChange={setShowDeleteUserModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <Dialog.Title className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">
              Benutzer löschen
            </Dialog.Title>
            <Dialog.Description className="text-sm text-textSecondary dark:text-gray-400 mb-4">
              Diese Aktion kann nicht rückgängig gemacht werden. Der Benutzer <strong className="dark:text-white">{selectedUser?.fullName}</strong> wird vollständig gelöscht, inklusive aller Dokumente, Termine und Fälle.
            </Dialog.Description>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                Geben Sie <strong>delete</strong> rückwärts ein, um die Löschung zu bestätigen:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="eteled"
                className="w-full px-4 py-2 border border-red-300 dark:border-red-600 rounded-md focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <button className="btn-secondary">
                  Abbrechen
                </button>
              </Dialog.Close>
              <button
                onClick={handleDeleteUser}
                disabled={deleteConfirmText !== 'eteled'}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Endgültig löschen
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
