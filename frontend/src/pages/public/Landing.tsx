import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { authAPI } from '../../services/api';
import { useDarkMode } from '../../contexts/DarkModeContext';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  gender?: string;
}

export default function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setDarkMode } = useDarkMode();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Force light mode on public pages
    const previousMode = localStorage.getItem('darkMode');
    setDarkMode(false);
    
    // Check if user is logged in
    checkAuth();
    
    // Restore dark mode when leaving page
    return () => {
      if (previousMode === 'true') {
        setDarkMode(true);
      }
    };
  }, [setDarkMode]);

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const response = await authAPI.getCurrentUser();
        setCurrentUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        // Token invalid or expired
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    setCurrentUser(null);
    // Stay on homepage
  };

  const getProfileIcon = (gender?: string) => {
    if (gender === 'male') return '👨';
    if (gender === 'female') return '👩';
    return '🧑'; // diverse
  };

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
              {loading ? (
                <div className="text-sm text-gray-500">Lädt...</div>
              ) : isAuthenticated && currentUser ? (
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-gray-50 transition-colors border border-gray-200">
                    <span className="text-3xl">{getProfileIcon(currentUser.gender)}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {currentUser.firstName} {currentUser.lastName}
                    </span>
                  </Menu.Button>
                  
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      <div className="p-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => navigate('/portal/dashboard')}
                              className={`${active ? 'bg-gray-100' : ''} group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm`}
                            >
                              📊 Dashboard
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleLogout}
                              className={`${active ? 'bg-gray-100' : ''} group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-600`}
                            >
                              🚪 Abmelden
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              ) : (
                <>
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
                </>
              )}
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
