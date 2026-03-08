import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/Sidebar';
import { authAPI, usersAPI } from '../../services/api';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export default function Profile() {
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
      setEditForm({
        fullLegalName: response.data.fullLegalName || '',
        email: response.data.email || '',
        phoneNumber: response.data.phoneNumber || '',
        dateOfBirth: response.data.dateOfBirth ? response.data.dateOfBirth.split('T')[0] : '',
        taxId: response.data.taxId || '',
        taxNumber: response.data.taxNumber || '',
        address: response.data.address || '',
        city: response.data.city || '',
        postalCode: response.data.postalCode || '',
        country: response.data.country || '',
      });
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      if ((error as any)?.response?.status === 401) {
        navigate('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await usersAPI.updateProfile({
        phoneNumber: editForm.phoneNumber,
        address: editForm.address,
        city: editForm.city,
        postalCode: editForm.postalCode,
        country: editForm.country,
        dateOfBirth: editForm.dateOfBirth ?? null,
        taxNumber: editForm.taxNumber,
      });

      const data = response.data;

      // Update local user state
      if (data.user) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...currentUser, ...data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
      
      await fetchUserProfile();
      setIsEditing(false);
      alert(t('profile.successUpdate'));
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      alert(error.response?.data?.message || error.message || t('profile.errorUpdate'));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('profile.notSpecified');
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const handleDeleteProfile = async () => {
    // Check if confirmation text is "delete" reversed (eteled)
    const reversedDelete = 'delete'.split('').reverse().join('');
    if (deleteConfirmation.toLowerCase() !== reversedDelete) {
      alert(t('profile.deleteInvalidConfirmation') || 'Bestätigungstext ist ungültig. Bitte geben Sie "delete" rückwärts ein.');
      return;
    }

    setDeleting(true);
    try {
      await usersAPI.deleteProfile(deleteConfirmation);
      
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Redirect to login with success message
      alert(t('profile.deleteSuccess') || 'Ihr Profil wurde erfolgreich gelöscht.');
      navigate('/auth/login');
    } catch (error: any) {
      console.error('Failed to delete profile:', error);
      alert(error.response?.data?.message || t('profile.deleteError') || 'Fehler beim Löschen des Profils');
    } finally {
      setDeleting(false);
    }
  };

  const handleChangePassword = async () => {
    setChangingPassword(true);
    try {
      await import('../../services/api').then(({ default: apiClient }) =>
        apiClient.post('/auth/forgot-password', { email: user.email })
      );
      setShowChangePasswordModal(false);
      alert('Eine E-Mail mit einem Link zum Ändern Ihres Passworts wurde an Ihre E-Mail-Adresse gesendet.');
    } catch (error: any) {
      console.error('Failed to send password reset email:', error);
      alert(error.response?.data?.message || 'Fehler beim Senden der Passwort-E-Mail');
    } finally {
      setChangingPassword(false);
    }
  };

  const canEditField = (field: string) => {
    // fullLegalName, email, and taxId are always read-only for ALL roles
    if (['fullLegalName', 'email', 'taxId'].includes(field)) {
      return false;
    }
    return isEditing;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-secondary dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="text-center py-12">
            <div className="text-lg text-textSecondary dark:text-gray-400">{t('profile.loadingProfile')}</div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-secondary dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="text-center py-12">
            <div className="text-lg text-red-600 dark:text-red-400">{t('profile.errorLoading')}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-secondary dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-primary dark:text-blue-400">{t('profile.title')}</h1>
            <div className="flex gap-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary text-sm"
                >
                  ✏️ {t('profile.editButton')}
                </button>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      fetchUserProfile(); // Reset form
                    }}
                    className="btn-secondary text-sm"
                    disabled={saving}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-primary text-sm"
                    disabled={saving}
                  >
                    {saving ? t('common.saving') : `💾 ${t('profile.saveButton')}`}
                  </button>
                </>
              )}
              <button
                onClick={() => navigate('/portal/dashboard')}
                className="btn-secondary text-sm"
              >
                ← {t('common.back')}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-6">
            <div className="flex items-center gap-6 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="w-24 h-24 bg-primary dark:bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl">
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-textPrimary dark:text-white">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-textSecondary dark:text-gray-400">{user.email}</p>
                <p className="text-sm text-primary dark:text-blue-400 mt-1">{user.role}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-4 text-primary dark:text-blue-400">{t('profile.personalInfo')}</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-textSecondary dark:text-gray-300">
                      {t('profile.fullLegalName')}
                      <span className="text-xs ml-2 text-gray-500 dark:text-gray-500">{t('common.readOnly')}</span>
                    </label>
                    {canEditField('fullLegalName') ? (
                      <input
                        type="text"
                        value={editForm.fullLegalName}
                        onChange={(e) => setEditForm({ ...editForm, fullLegalName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent mt-1 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <p className="text-textPrimary dark:text-gray-200 mt-1 px-4 py-2 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                        {user.fullLegalName || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : t('profile.notSpecified'))}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary dark:text-gray-300">
                      {t('profile.email')}
                      <span className="text-xs ml-2 text-gray-500 dark:text-gray-500">{t('common.readOnly')}</span>
                    </label>
                    {canEditField('email') ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent mt-1 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <p className="text-textPrimary dark:text-gray-200 mt-1 px-4 py-2 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                        {user.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary dark:text-gray-300">{t('profile.phone')}</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.phoneNumber}
                        onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent mt-1 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <p className="text-textPrimary dark:text-gray-200 mt-1">{user.phoneNumber || t('profile.notSpecified')}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary dark:text-gray-300">{t('profile.dateOfBirth')}</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.dateOfBirth}
                        onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent mt-1 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <p className="text-textPrimary dark:text-gray-200 mt-1">{formatDate(user.dateOfBirth)}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary dark:text-gray-300">
                      Steuer-ID
                      <span className="text-xs ml-2 text-gray-500 dark:text-gray-500">{t('common.readOnly')}</span>
                    </label>
                    {canEditField('taxId') ? (
                      <input
                        type="text"
                        value={editForm.taxId}
                        onChange={(e) => setEditForm({ ...editForm, taxId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent mt-1 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <p className="text-textPrimary dark:text-gray-200 mt-1 px-4 py-2 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                        {user.taxId || t('profile.notSpecified')}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-textSecondary dark:text-gray-300">
                      Steuernummer
                    </label>
                    {canEditField('taxNumber') ? (
                      <input
                        type="text"
                        value={editForm.taxNumber}
                        onChange={(e) => setEditForm({ ...editForm, taxNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent mt-1 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <p className="text-textPrimary dark:text-gray-200 mt-1 px-4 py-2 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                        {user.taxNumber || t('profile.notSpecified')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4 text-primary dark:text-blue-400">{t('profile.addressInfo')}</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-textSecondary dark:text-gray-300">{t('profile.address')}</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent mt-1 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <p className="text-textPrimary dark:text-gray-200 mt-1">{user.address || t('profile.notSpecified')}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary dark:text-gray-300">{t('profile.city')}</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent mt-1 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <p className="text-textPrimary dark:text-gray-200 mt-1">{user.city || t('profile.notSpecified')}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary dark:text-gray-300">{t('profile.postalCode')}</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.postalCode}
                        onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent mt-1 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <p className="text-textPrimary dark:text-gray-200 mt-1">{user.postalCode || t('profile.notSpecified')}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary dark:text-gray-300">{t('profile.country')}</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.country}
                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent mt-1 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <p className="text-textPrimary dark:text-gray-200 mt-1">{user.country || t('profile.notSpecified')}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary dark:text-gray-300">Status</label>
                    <p className="text-textPrimary dark:text-gray-200 mt-1">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                        user.isActive ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {user.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {user.firmLegalName && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg mb-4 text-primary dark:text-blue-400">Unternehmensinformationen</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-textSecondary dark:text-gray-300">Firmenname</label>
                    <p className="text-textPrimary dark:text-gray-200 mt-1">{user.firmLegalName}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary dark:text-gray-300">Firmensteuernummer</label>
                    <p className="text-textPrimary dark:text-gray-200 mt-1">{user.firmTaxId || 'Nicht angegeben'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary dark:text-gray-300">Kammernummer</label>
                    <p className="text-textPrimary dark:text-gray-200 mt-1">{user.firmChamberRegistration || 'Nicht angegeben'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Profile Section */}
            <div className="mt-8 pt-6 border-t border-red-200 dark:border-red-900/50">
              <h3 className="font-semibold text-lg mb-2 text-red-600 dark:text-red-400">{t('profile.dangerZone')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t('profile.deleteWarning')}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  🔑 Passwort ändern
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  🗑️ {t('profile.deleteProfile')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Change Password Modal */}
      <Dialog.Root open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full z-50">
            <Dialog.Title className="text-xl font-bold mb-4 text-yellow-600 dark:text-yellow-400">
              🔑 Passwort ändern
            </Dialog.Title>
            <Dialog.Description className="text-gray-700 dark:text-gray-300 mb-6">
              Möchten Sie wirklich Ihr Passwort ändern? Eine E-Mail mit einem Link zum Zurücksetzen des Passworts wird an Ihre E-Mail-Adresse gesendet.
            </Dialog.Description>
            <div className="flex gap-3 justify-end">
              <Dialog.Close asChild>
                <button
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
                  disabled={changingPassword}
                >
                  Nein
                </button>
              </Dialog.Close>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? 'Wird gesendet...' : 'Ja, E-Mail senden'}
              </button>
            </div>
            <Dialog.Close asChild>
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Schließen"
                disabled={changingPassword}
              >
                <X size={24} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Profile Modal */}
      <Dialog.Root open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full z-50">
            <Dialog.Title className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">
              {t('profile.deleteModalTitle')}
            </Dialog.Title>
            
            <Dialog.Description className="text-gray-700 dark:text-gray-300 mb-6">
              <p className="mb-4" dangerouslySetInnerHTML={{ __html: t('profile.deleteModalDescription1') }} />
              <p className="mb-4">
                {t('profile.deleteModalDescription2')}
              </p>
              <p className="mb-4" dangerouslySetInnerHTML={{ __html: t('profile.deleteModalDescription3') }} />
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder={t('profile.deleteConfirmationPlaceholder')}
                autoFocus
              />
            </Dialog.Description>

            <div className="flex gap-3 justify-end">
              <Dialog.Close asChild>
                <button
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
                  disabled={deleting}
                >
                  {t('common.cancel')}
                </button>
              </Dialog.Close>
              <button
                onClick={handleDeleteProfile}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? t('profile.deleting') : t('profile.deleteConfirm')}
              </button>
            </div>

            <Dialog.Close asChild>
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label={t('common.cancel')}
                disabled={deleting}
              >
                <X size={24} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
