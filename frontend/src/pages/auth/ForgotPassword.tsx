import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/api/v1/auth/forgot-password`, { email });
      setSuccess(true);
    } catch (err: any) {
      console.error('Forgot password failed:', err);
      setError(
        err.response?.data?.message || 
        'Fehler beim Senden der E-Mail. Bitte versuchen Sie es erneut.'
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
            <h1 className="text-2xl font-bold text-center mb-4 dark:text-white">E-Mail gesendet</h1>
            <p className="text-textSecondary dark:text-gray-400 mb-6">
              Wenn ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link zum 
              Zurücksetzen Ihres Passworts gesendet.
            </p>
            <p className="text-sm text-textSecondary dark:text-gray-400 mb-8">
              Bitte überprüfen Sie Ihr E-Mail-Postfach und folgen Sie den Anweisungen.
            </p>
            <Link to="/auth/login" className="btn-primary inline-block w-full text-center">
              Zurück zur Anmeldung
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 dark:text-white">Passwort vergessen?</h1>
        <p className="text-center text-textSecondary dark:text-gray-400 mb-8">
          Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
        </p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 dark:text-white">
              E-Mail-Adresse
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="ihre.email@beispiel.de"
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
                <span>Wird gesendet...</span>
              </>
            ) : (
              'Link zum Zurücksetzen senden'
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
