import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function Contact() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-primary dark:text-blue-400">NFK Buchhaltung</h2>
            <div className="flex gap-4 items-center">
              <Link
                to="/"
                className="text-textPrimary dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 px-4 py-2"
              >
                {t('common.homepage')}
              </Link>
              <Link
                to="/contact"
                className="text-textPrimary dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 px-4 py-2"
              >
                {t('common.contact')}
              </Link>
              <LanguageSwitcher />
              <Link
                to="/auth/register"
                className="text-textPrimary dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 px-4 py-2"
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
      <header className="bg-primary dark:bg-blue-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4">
              {t('contact.title')}
            </h1>
            <p className="text-xl">
              {t('contact.subtitle')}
            </p>
          </div>
        </div>
      </header>

      {/* Contact Section */}
      <section className="py-20 bg-secondary dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-semibold mb-6 text-primary dark:text-blue-400">
                  {t('contact.info')}
                </h3>
                <div className="space-y-6 text-textSecondary dark:text-gray-300">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">📍</span>
                    <div>
                      <p className="font-medium text-textPrimary dark:text-white text-lg mb-1">
                        {t('contact.address')}
                      </p>
                      <p className="text-base">Bachemer Str. 10</p>
                      <p className="text-base">50931 Köln, Germany</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">📧</span>
                    <div>
                      <p className="font-medium text-textPrimary dark:text-white text-lg mb-1">
                        {t('contact.email')}
                      </p>
                      <a href="mailto:info@nfk-buchhaltung.de" className="text-base hover:text-primary dark:hover:text-blue-400">
                        info@nfk-buchhaltung.de
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">📞</span>
                    <div>
                      <p className="font-medium text-textPrimary dark:text-white text-lg mb-1">
                        {t('contact.phone')}
                      </p>
                      <a href="tel:+492211234567" className="text-base hover:text-primary dark:hover:text-blue-400">
                        +49 (0) 221 1234567
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">🕐</span>
                    <div>
                      <p className="font-medium text-textPrimary dark:text-white text-lg mb-1">
                        {t('contact.hours')}
                      </p>
                      <p className="text-base">Mo - Fr: 9:00 - 17:00 Uhr</p>
                      <p className="text-base">Sa - So: Geschlossen</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Contact Form */}
              <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md">
                <h4 className="text-xl font-semibold mb-4 text-primary dark:text-blue-400">
                  {t('contact.form.title')}
                </h4>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-textPrimary dark:text-gray-200">
                      {t('contact.form.name')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('contact.form.namePlaceholder')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-textPrimary dark:text-gray-200">
                      {t('contact.form.email')}
                    </label>
                    <input
                      type="email"
                      placeholder={t('contact.form.emailPlaceholder')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-textPrimary dark:text-gray-200">
                      {t('contact.form.subject')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('contact.form.subjectPlaceholder')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-textPrimary dark:text-gray-200">
                      {t('contact.form.message')}
                    </label>
                    <textarea
                      rows={4}
                      placeholder={t('contact.form.messagePlaceholder')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="btn-primary w-full py-3 rounded-md"
                  >
                    {t('contact.form.send')}
                  </button>
                </form>
              </div>
            </div>

            {/* Google Maps Embed */}
            <div className="h-full min-h-[600px] rounded-lg overflow-hidden shadow-lg">
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
      <footer className="bg-textPrimary dark:bg-gray-950 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 NFK Buchhaltung - {t('landing.footer')}</p>
        </div>
      </footer>
    </div>
  );
}
