import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function Landing() {
  const { t } = useTranslation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-primary">NFK Buchhaltung</h2>
            <div className="flex gap-4 items-center">
              <LanguageSwitcher />
              <Link
                to="/auth/register"
                className="text-textPrimary hover:text-primary px-4 py-2"
              >
                {t('common.register')}
              </Link>
              <Link
                to="/auth/login"
                className="btn-primary px-6 py-2 rounded-md"
              >
                {t('common.login')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-primary text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">
              {t('landing.title')}
            </h1>
            <p className="text-xl mb-8">
              {t('landing.subtitle')}
            </p>
            <div className="flex gap-4">
              <button
                onClick={scrollToTop}
                className="bg-white text-primary px-8 py-3 rounded-md hover:bg-gray-100 font-medium"
              >
                {t('common.homepage')}
              </button>
              <Link 
                to="/contact" 
                className="bg-primary border-2 border-white text-white px-8 py-3 rounded-md hover:bg-white hover:text-primary transition-colors font-medium"
              >
                {t('common.contact')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Services Section */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('landing.services.title')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: t('landing.services.taxConsulting'), icon: '📊' },
              { title: t('landing.services.accounting'), icon: '💼' },
              { title: t('landing.services.payroll'), icon: '💰' },
              { title: t('landing.services.businessConsulting'), icon: '🎯' }
            ].map((service, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                <p className="text-textSecondary">{t('landing.services.description')}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('landing.features.title')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">🔐</div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.features.secure')}</h3>
              <p className="text-textSecondary">{t('landing.features.secureDesc')}</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.features.portal')}</h3>
              <p className="text-textSecondary">{t('landing.features.portalDesc')}</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.features.datev')}</h3>
              <p className="text-textSecondary">{t('landing.features.datevDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-textPrimary text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 NFK Buchhaltung - {t('landing.footer')}</p>
        </div>
      </footer>
    </div>
  );
}
