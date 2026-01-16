import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Ungültiger oder fehlender Token. Bitte fordern Sie einen neuen Link an.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 12) {
      return 'Passwort muss mindestens 12 Zeichen lang sein';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Passwort muss mindestens einen Großbuchstaben enthalten';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Passwort muss mindestens einen Kleinbuchstaben enthalten';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Passwort muss mindestens eine Ziffer enthalten';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      return 'Passwort muss mindestens ein Sonderzeichen enthalten';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    // Validate password strength
    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/api/v1/auth/reset-password`, {
        token,
        newPassword: password
      });
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setError(
        err.response?.data?.message || 
        'Fehler beim Zurücksetzen des Passworts. Der Link ist möglicherweise abgelaufen.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-secondary dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-center mb-4 dark:text-white">Passwort erfolgreich zurückgesetzt</h1>
            <p className="text-textSecondary dark:text-gray-400 mb-6">
              Ihr Passwort wurde erfolgreich geändert. Sie werden in Kürze zur Anmeldeseite weitergeleitet.
            </p>
            <Link to="/auth/login" className="btn-primary inline-block w-full text-center">
              Jetzt anmelden
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-secondary dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-center mb-4 dark:text-white">Ungültiger Link</h1>
            <p className="text-textSecondary dark:text-gray-400 mb-6">
              Der Link zum Zurücksetzen des Passworts ist ungültig oder fehlt.
            </p>
            <Link to="/auth/forgot-password" className="btn-primary inline-block w-full text-center">
              Neuen Link anfordern
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 dark:text-white">Neues Passwort festlegen</h1>
        <p className="text-center text-textSecondary dark:text-gray-400 mb-8">
          Bitte geben Sie Ihr neues Passwort ein.
        </p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 dark:text-white">
              Neues Passwort
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              required
              disabled={loading}
            />
            <p className="text-xs text-textSecondary dark:text-gray-400 mt-2">
              Min. 12 Zeichen, 1 Groß-, 1 Kleinbuchstabe, 1 Ziffer, 1 Sonderzeichen
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 dark:text-white">
              Passwort bestätigen
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="w-full btn-primary flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin">⏳</span>
                <span>Wird gespeichert...</span>
              </>
            ) : (
              'Passwort zurücksetzen'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/auth/login" className="text-primary hover:underline">
            ← Zurück zur Anmeldung
          </Link>
        </div>
      </div>
    </div>
  );
}
