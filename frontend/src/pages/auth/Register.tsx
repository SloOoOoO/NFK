import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

export default function Register() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Personal Information
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fullLegalName, setFullLegalName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Germany');
  const [taxId, setTaxId] = useState('');

  // Firm Information (optional)
  const [hasFirm, setHasFirm] = useState(false);
  const [firmLegalName, setFirmLegalName] = useState('');
  const [firmTaxId, setFirmTaxId] = useState('');
  const [firmChamberRegistration, setFirmChamberRegistration] = useState('');
  const [firmAddress, setFirmAddress] = useState('');
  const [firmCity, setFirmCity] = useState('');
  const [firmPostalCode, setFirmPostalCode] = useState('');
  const [firmCountry, setFirmCountry] = useState('Germany');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    setLoading(true);

    try {
      const registrationData = {
        email,
        password,
        firstName,
        lastName,
        fullLegalName: fullLegalName || `${firstName} ${lastName}`,
        phoneNumber: phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
        address,
        city,
        postalCode,
        country,
        taxId,
        ...(hasFirm && {
          firmLegalName,
          firmTaxId,
          firmChamberRegistration,
          firmAddress,
          firmCity,
          firmPostalCode,
          firmCountry,
        }),
      };

      await authAPI.register(registrationData);
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(
        err.response?.data?.message || 
        'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSSO = () => {
    // TODO: Implement Google OAuth flow
    alert('Google SSO wird in Kürze verfügbar sein');
  };

  const handleDATEVSSO = () => {
    // Placeholder for DATEV SSO
    alert('DATEV SSO ist in Entwicklung. Diese Funktion wird bald verfügbar sein.');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-primary mb-4">Erfolgreich registriert!</h1>
          <p className="text-textSecondary mb-6">
            Sie werden in Kürze zur Anmeldeseite weitergeleitet...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Registrierung</h1>
            <p className="text-textSecondary">
              Erstellen Sie Ihr Konto für das NFK Steuerberatungsportal
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <div className={`w-16 h-1 ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`} />
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* SSO Options (Step 1) */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-4">Wählen Sie Ihre Registrierungsmethode</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={handleGoogleSSO}
                  className="flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-300 rounded-lg hover:border-primary hover:bg-secondary transition-colors"
                >
                  <span className="text-2xl">🔐</span>
                  <div className="text-left">
                    <div className="font-semibold">Mit Google anmelden</div>
                    <div className="text-sm text-textSecondary">Schnelle Registrierung</div>
                  </div>
                </button>

                <button
                  onClick={handleDATEVSSO}
                  className="flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-300 rounded-lg hover:border-primary hover:bg-secondary transition-colors"
                >
                  <span className="text-2xl">🔄</span>
                  <div className="text-left">
                    <div className="font-semibold">Mit DATEV anmelden</div>
                    <div className="text-sm text-textSecondary">Für DATEV-Kunden</div>
                  </div>
                </button>
              </div>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-textSecondary">Oder</span>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full btn-primary"
              >
                Mit E-Mail registrieren
              </button>

              <div className="text-center text-sm text-textSecondary">
                Haben Sie bereits ein Konto?{' '}
                <Link to="/auth/login" className="text-primary hover:underline">
                  Hier anmelden
                </Link>
              </div>
            </div>
          )}

          {/* Personal Information (Step 2) */}
          {step === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Persönliche Informationen</h2>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-2">
                    Vorname <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-2">
                    Nachname <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary mb-2">
                  Vollständiger rechtlicher Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullLegalName}
                  onChange={(e) => setFullLegalName(e.target.value)}
                  placeholder={`${firstName} ${lastName}`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary mb-2">
                  E-Mail <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-2">
                    Passwort <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-2">
                    Passwort bestätigen <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-2">
                    Telefon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+49 xxx xxxxxxx"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-2">
                    Geburtsdatum <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary mb-2">
                  Adresse <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  placeholder="Straße und Hausnummer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-2">
                    PLZ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-2">
                    Stadt <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-2">
                    Land <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Germany">Deutschland</option>
                    <option value="Austria">Österreich</option>
                    <option value="Switzerland">Schweiz</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary mb-2">
                  Steuernummer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  required
                  placeholder="12/345/67890"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                >
                  Zurück
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Weiter
                </button>
              </div>
            </form>
          )}

          {/* Firm Information (Step 3 - Optional) */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Unternehmensinformationen (Optional)</h2>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="bg-blue-50 border-l-4 border-primary p-4 rounded-lg mb-6">
                <p className="text-sm text-textSecondary">
                  Wenn Sie ein Unternehmen vertreten, können Sie hier die Firmendaten angeben.
                  Andernfalls können Sie diesen Schritt überspringen.
                </p>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="hasFirm"
                  checked={hasFirm}
                  onChange={(e) => setHasFirm(e.target.checked)}
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="hasFirm" className="text-sm font-medium text-textSecondary">
                  Ich vertrete ein Unternehmen
                </label>
              </div>

              {hasFirm && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-textSecondary mb-2">
                      Firmenname
                    </label>
                    <input
                      type="text"
                      value={firmLegalName}
                      onChange={(e) => setFirmLegalName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-textSecondary mb-2">
                        Firmensteuernummer
                      </label>
                      <input
                        type="text"
                        value={firmTaxId}
                        onChange={(e) => setFirmTaxId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-textSecondary mb-2">
                        Kammernummer
                      </label>
                      <input
                        type="text"
                        value={firmChamberRegistration}
                        onChange={(e) => setFirmChamberRegistration(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textSecondary mb-2">
                      Firmenadresse
                    </label>
                    <input
                      type="text"
                      value={firmAddress}
                      onChange={(e) => setFirmAddress(e.target.value)}
                      placeholder="Straße und Hausnummer"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-textSecondary mb-2">
                        PLZ
                      </label>
                      <input
                        type="text"
                        value={firmPostalCode}
                        onChange={(e) => setFirmPostalCode(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-textSecondary mb-2">
                        Stadt
                      </label>
                      <input
                        type="text"
                        value={firmCity}
                        onChange={(e) => setFirmCity(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-textSecondary mb-2">
                        Land
                      </label>
                      <select
                        value={firmCountry}
                        onChange={(e) => setFirmCountry(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="Germany">Deutschland</option>
                        <option value="Austria">Österreich</option>
                        <option value="Switzerland">Schweiz</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Zurück
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Wird registriert...' : 'Registrierung abschließen'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
