import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReCAPTCHA from 'react-google-recaptcha';
import apiClient from '../../services/api';

// Use Google's test key by default; override with VITE_RECAPTCHA_SITE_KEY in production
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const recaptchaToken = recaptchaRef.current?.getValue();
    if (!recaptchaToken) {
      setError('Bitte bestätigen Sie, dass Sie kein Roboter sind.');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/auth/forgot-password', { email, recaptchaToken });
      setSuccess(true);
    } catch (err: any) {
      console.error('Forgot password failed:', err);
      setError(
        err.response?.data?.message || 
        t('contact.form.error')
      );
      recaptchaRef.current?.reset();
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
            <h1 className="text-2xl font-bold text-center mb-4 dark:text-white">{t('auth.forgotPasswordSuccessTitle')}</h1>
            <p className="text-textSecondary dark:text-gray-400 mb-4">
              {t('auth.forgotPasswordSuccessMessage')}
            </p>
            <p className="text-sm text-textSecondary dark:text-gray-400 mb-8">
              {t('auth.forgotPasswordSuccessNote')}
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
        <h1 className="text-3xl font-bold text-center mb-2 dark:text-white">{t('auth.forgotPasswordTitle')}</h1>
        <p className="text-center text-textSecondary dark:text-gray-400 mb-8">
          {t('auth.forgotPasswordSubtitle')}
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

          <div className="flex justify-center">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
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
              t('auth.forgotPasswordSend')
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
