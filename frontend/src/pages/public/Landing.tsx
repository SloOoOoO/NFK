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
              <button
                onClick={scrollToTop}
                className="text-textPrimary hover:text-primary px-4 py-2"
              >
                {t('common.homepage')}
              </button>
              <Link
                to="/contact"
                className="text-textPrimary hover:text-primary px-4 py-2"
              >
                {t('common.contact')}
              </Link>
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
              <Link to="/auth/register" className="btn-primary bg-white text-primary px-8 py-3 rounded-md hover:bg-gray-100">
                {t('landing.registerNow')}
              </Link>
              <Link to="/auth/login" className="btn-secondary border-2 border-white text-white px-8 py-3 rounded-md hover:bg-white/10">
                {t('common.login')}
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

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Kontakt</h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Contact Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-primary">Kontaktinformationen</h3>
                <div className="space-y-3 text-textSecondary">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="font-medium text-textPrimary">Adresse</p>
                      <p>Bachemer Str. 10</p>
                      <p>50931 Köln, Germany</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📧</span>
                    <div>
                      <p className="font-medium text-textPrimary">E-Mail</p>
                      <p>info@nfk-buchhaltung.de</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📞</span>
                    <div>
                      <p className="font-medium text-textPrimary">Telefon</p>
                      <p>+49 (0) 221 1234567</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🕐</span>
                    <div>
                      <p className="font-medium text-textPrimary">Öffnungszeiten</p>
                      <p>Mo - Fr: 9:00 - 17:00 Uhr</p>
                      <p>Sa - So: Geschlossen</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Maps Embed */}
            <div className="h-96 md:h-full min-h-[400px] rounded-lg overflow-hidden shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2512.0969305846977!2d6.915384!3d50.9380835!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47bf24e1b3c2b267%3A0x7e8c6b7e8c6b7e8d!2sBachemer%20Str.%2010%2C%2050931%20K%C3%B6ln!5e0!3m2!1sen!2sde!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="NFK Buchhaltung Standort"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-textPrimary text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 NFK Buchhaltung Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
}
