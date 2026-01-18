import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import { AxiosError } from 'axios';

interface ApiError {
  message?: string;
}

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check for SSO errors
    const ssoError = searchParams.get('error');
    if (ssoError === 'datev_failed') {
      setError('DATEV Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } else if (ssoError === 'google_failed') {
      setError('Google Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      const { accessToken, refreshToken, user } = response.data;
      
      // Update auth context with user data and tokens
      login(user, accessToken, refreshToken);
      
      // Redirect to homepage
      navigate('/');
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data) {
        const apiError = err.response.data as ApiError;
        setError(apiError.message || t('auth.errors.loginFailed'));
      } else {
        setError(t('auth.errors.loginFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDATEVLogin = () => {
    // Redirect to DATEV OAuth endpoint
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
    window.location.href = `${apiUrl}/auth/datev/login`;
  };

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth endpoint
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
    window.location.href = `${apiUrl}/auth/google/login`;
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">{t('common.login')}</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              {t('auth.emailLabel')}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium">
                {t('auth.passwordLabel')}
              </label>
              <Link to="/auth/forgot-password" className="text-sm text-primary hover:underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
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
                <span>{t('common.loading')}</span>
              </>
            ) : (
              t('auth.loginButton')
            )}
          </button>
        </form>

        {/* SSO Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">oder</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* SSO Buttons */}
        <div className="space-y-3">
          {/* DATEV SSO */}
          <button
            onClick={handleDATEVLogin}
            type="button"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#0066CC" />
              <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Mit DATEV anmelden</span>
          </button>

          {/* Google SSO */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Mit Google anmelden</span>
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link to="/auth/register" className="text-primary hover:underline">
            {t('auth.noAccount')} {t('auth.registerHere')}
          </Link>
        </div>
      </div>
    </div>
  );
}
