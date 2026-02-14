import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setError('Kein Verifizierungs-Token gefunden.');
        return;
      }

      try {
        await axios.post(`${API_BASE_URL}/auth/verify-email`, { token });
        setStatus('success');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/auth/login');
        }, 3000);
      } catch (err: any) {
        console.error('Email verification failed:', err);
        setStatus('error');
        setError(
          err.response?.data?.message || 
          'E-Mail-Verifizierung fehlgeschlagen. Der Link ist möglicherweise abgelaufen.'
        );
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-secondary dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        {status === 'verifying' && (
          <>
            <div className="text-center mb-6">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
            <h1 className="text-2xl font-bold text-center mb-4 dark:text-white">
              E-Mail wird verifiziert...
            </h1>
            <p className="text-center text-textSecondary dark:text-gray-400">
              Bitte warten Sie einen Moment.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center mb-4 dark:text-white">
              E-Mail erfolgreich verifiziert!
            </h1>
            <p className="text-center text-textSecondary dark:text-gray-400 mb-6">
              Ihre E-Mail-Adresse wurde erfolgreich bestätigt. Sie können sich jetzt anmelden.
            </p>
            <p className="text-center text-sm text-textSecondary dark:text-gray-400">
              Sie werden in 3 Sekunden zur Anmeldeseite weitergeleitet...
            </p>
            <div className="mt-6">
              <Link
                to="/auth/login"
                className="block w-full text-center bg-primary text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Jetzt anmelden
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center mb-4 dark:text-white">
              Verifizierung fehlgeschlagen
            </h1>
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              </div>
            )}
            <p className="text-center text-textSecondary dark:text-gray-400 mb-6">
              Der Verifizierungs-Link ist möglicherweise abgelaufen oder ungültig.
            </p>
            <div className="space-y-3">
              <Link
                to="/auth/login"
                className="block w-full text-center bg-primary text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Zur Anmeldeseite
              </Link>
              <Link
                to="/auth/register"
                className="block w-full text-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Erneut registrieren
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
