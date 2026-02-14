import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/Sidebar';
import { authAPI } from '../../services/api';

export default function Profile() {
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
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
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8080/api/v1/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: user.firstName,
          lastName: user.lastName,
          phone: editForm.phoneNumber,
          phoneNumber: editForm.phoneNumber,
          address: editForm.address,
          city: editForm.city,
          postalCode: editForm.postalCode,
          country: editForm.country,
          dateOfBirth: editForm.dateOfBirth,
          taxId: editForm.taxId,
          taxNumber: editForm.taxNumber
        })
      });

      // Check if response has content before parsing JSON
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.message || 'Fehler beim Aktualisieren');
      }

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
      alert(error.message || t('profile.errorUpdate'));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('profile.notSpecified');
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const isAdmin = user?.role === 'SuperAdmin';
  const canEditField = (field: string) => {
    // For non-admin users, FullLegalName, Email, TaxId, and TaxNumber are read-only
    if (!isAdmin && ['fullLegalName', 'email', 'taxId', 'taxNumber'].includes(field)) {
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
                      {!isAdmin && <span className="text-xs ml-2 text-gray-500 dark:text-gray-500">{t('common.readOnly')}</span>}
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
                        {user.fullLegalName || t('profile.notSpecified')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary dark:text-gray-300">
                      {t('profile.email')}
                      {!isAdmin && <span className="text-xs ml-2 text-gray-500 dark:text-gray-500">{t('common.readOnly')}</span>}
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
                      {t('profile.taxId')}
                      {!isAdmin && <span className="text-xs ml-2 text-gray-500 dark:text-gray-500">{t('common.readOnly')}</span>}
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
                      {!isAdmin && <span className="text-xs ml-2 text-gray-500 dark:text-gray-500">{t('common.readOnly')}</span>}
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
          </div>
        </div>
      </main>
    </div>
  );
}
