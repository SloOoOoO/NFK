import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { authAPI, adminAPI } from '../../services/api';

export default function Profile() {
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
      await adminAPI.updateUserProfile(user.id, editForm);
      await fetchUserProfile();
      setIsEditing(false);
      alert('Profil erfolgreich aktualisiert');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Fehler beim Aktualisieren des Profils');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nicht angegeben';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const isAdmin = user?.role === 'SuperAdmin';

  if (loading) {
    return (
      <div className="flex min-h-screen bg-secondary">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="text-center py-12">
            <div className="text-lg text-textSecondary">Lade Profil...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-secondary">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="text-center py-12">
            <div className="text-lg text-red-600">Profil konnte nicht geladen werden</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-secondary">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-primary">Mein Profil</h1>
            <div className="flex gap-2">
              {isAdmin && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary text-sm"
                >
                  ✏️ Bearbeiten
                </button>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="btn-secondary text-sm"
                    disabled={saving}
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-primary text-sm"
                    disabled={saving}
                  >
                    {saving ? 'Speichert...' : '💾 Speichern'}
                  </button>
                </>
              )}
              <button
                onClick={() => navigate('/portal/dashboard')}
                className="btn-secondary text-sm"
              >
                ← Zurück
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <div className="flex items-center gap-6 mb-8 pb-6 border-b border-gray-200">
              <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-white text-3xl">
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-textPrimary">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-textSecondary">{user.email}</p>
                <p className="text-sm text-primary mt-1">{user.role}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-4 text-primary">Persönliche Informationen</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-textSecondary">Vollständiger Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.fullLegalName}
                        onChange={(e) => setEditForm({ ...editForm, fullLegalName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent mt-1"
                      />
                    ) : (
                      <p className="text-textPrimary mt-1">{user.fullLegalName || 'Nicht angegeben'}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary">E-Mail</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent mt-1"
                      />
                    ) : (
                      <p className="text-textPrimary mt-1">{user.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary">Telefon</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.phoneNumber}
                        onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent mt-1"
                      />
                    ) : (
                      <p className="text-textPrimary mt-1">{user.phoneNumber || 'Nicht angegeben'}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary">Geburtsdatum</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.dateOfBirth}
                        onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent mt-1"
                      />
                    ) : (
                      <p className="text-textPrimary mt-1">{formatDate(user.dateOfBirth)}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary">Steuernummer</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.taxId}
                        onChange={(e) => setEditForm({ ...editForm, taxId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent mt-1"
                      />
                    ) : (
                      <p className="text-textPrimary mt-1">{user.taxId || 'Nicht angegeben'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4 text-primary">Adresse</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-textSecondary">Straße</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent mt-1"
                      />
                    ) : (
                      <p className="text-textPrimary mt-1">{user.address || 'Nicht angegeben'}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary">Stadt</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent mt-1"
                      />
                    ) : (
                      <p className="text-textPrimary mt-1">{user.city || 'Nicht angegeben'}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary">Postleitzahl</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.postalCode}
                        onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent mt-1"
                      />
                    ) : (
                      <p className="text-textPrimary mt-1">{user.postalCode || 'Nicht angegeben'}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary">Land</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.country}
                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent mt-1"
                      />
                    ) : (
                      <p className="text-textPrimary mt-1">{user.country || 'Nicht angegeben'}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary">Status</label>
                    <p className="text-textPrimary mt-1">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {user.firmLegalName && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-lg mb-4 text-primary">Unternehmensinformationen</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-textSecondary">Firmenname</label>
                    <p className="text-textPrimary mt-1">{user.firmLegalName}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary">Firmensteuernummer</label>
                    <p className="text-textPrimary mt-1">{user.firmTaxId || 'Nicht angegeben'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary">Kammernummer</label>
                    <p className="text-textPrimary mt-1">{user.firmChamberRegistration || 'Nicht angegeben'}</p>
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
