import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function ForgotPassword() {
  const { t } = useTranslation();
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
        t('contact.form.error')
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
            <h1 className="text-2xl font-bold text-center mb-4 dark:text-white">{t('contact.form.success')}</h1>
            <p className="text-textSecondary dark:text-gray-400 mb-6">
              {t('contact.form.message')}
            </p>
            <p className="text-sm text-textSecondary dark:text-gray-400 mb-8">
              {t('contact.form.message')}
            </p>
            <Link to="/auth/login" className="btn-primary inline-block w-full text-center">
              {t('common.back')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 dark:text-white">{t('auth.forgotPassword')}</h1>
        <p className="text-center text-textSecondary dark:text-gray-400 mb-8">
          {t('auth.emailPlaceholder')}
        </p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 dark:text-white">
              {t('auth.emailLabel')}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={t('auth.emailPlaceholder')}
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
              t('contact.form.send')
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/auth/login" className="text-primary hover:underline">
            ← {t('common.back')}
          </Link>
        </div>
      </div>
    </div>
  );
}
