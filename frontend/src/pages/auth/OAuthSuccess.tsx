import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithTokens } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      // Login with the provided tokens
      loginWithTokens(accessToken, refreshToken);
      
      // Redirect to dashboard
      navigate('/portal/dashboard', { replace: true });
    } else {
      // If tokens are missing, redirect to login with error
      navigate('/auth/login?error=oauth_failed&message=' + encodeURIComponent(t('auth.errors.loginFailed')), { replace: true });
    }
  }, [searchParams, navigate, loginWithTokens, t]);

  return (
    <div className="min-h-screen bg-secondary dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <h2 className="text-xl font-semibold text-textPrimary dark:text-gray-100 mb-2">
          {t('common.loading')}
        </h2>
        <p className="text-textSecondary dark:text-gray-400">
          {t('auth.loginSubtitle')}
        </p>
      </div>
    </div>
  );
}
