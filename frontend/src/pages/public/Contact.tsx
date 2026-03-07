import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Fragment, useEffect, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { useAuth } from '../../contexts/AuthContext';
import { contactAPI } from '../../services/api';

export default function Contact() {
  const { t } = useTranslation();
  const { setDarkMode } = useDarkMode();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    // Force light mode on public pages
    const previousMode = localStorage.getItem('darkMode');
    setDarkMode(false);
    
    // Restore dark mode when leaving page
    return () => {
      if (previousMode === 'true') {
        setDarkMode(true);
      }
    };
  }, [setDarkMode]);

  const getProfileIcon = (gender?: string) => {
    if (gender === 'male') return '👨';
    if (gender === 'female') return '👩';
    return '🧑'; // diverse
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Name muss mindestens 2 Zeichen lang sein.';
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
    }
    if (!formData.subject.trim() || formData.subject.trim().length < 2) {
      errors.subject = 'Betreff muss mindestens 2 Zeichen lang sein.';
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errors.message = 'Nachricht muss mindestens 10 Zeichen lang sein.';
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(false);

    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await contactAPI.submit(formData);
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-primary">NFK Buchhaltung</h2>
            <div className="flex gap-4 items-center">
              <Link
                to="/"
                className="text-textPrimary hover:text-primary px-4 py-2"
              >
                {t('common.homepage')}
              </Link>
              <Link
                to="/contact"
                className="text-textPrimary hover:text-primary px-4 py-2"
              >
                {t('common.contact')}
              </Link>
              <LanguageSwitcher />
              {isLoading ? (
                <div className="text-sm text-gray-500">Lädt...</div>
              ) : isAuthenticated && user ? (
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-gray-50 transition-colors border border-gray-200">
                    <span className="text-3xl">{getProfileIcon(user.gender)}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {user.firstName} {user.lastName}
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
                    <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-1 py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/portal/dashboard"
                              className={`${
                                active ? 'bg-primary text-white' : 'text-gray-900'
                              } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                            >
                              🏠 Dashboard
                            </Link>
                          )}
                        </Menu.Item>
                      </div>
                      <div className="px-1 py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={logout}
                              className={`${
                                active ? 'bg-red-500 text-white' : 'text-red-600'
                              } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
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
      <header className="bg-primary text-white py-16">
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
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-semibold mb-6 text-primary">
                  {t('contact.info')}
                </h3>
                <div className="space-y-6 text-textSecondary">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">📍</span>
                    <div>
                      <p className="font-medium text-textPrimary text-lg mb-1">
                        {t('contact.address')}
                      </p>
                      <p className="text-base">Bachemer Str. 10</p>
                      <p className="text-base">50931 Köln, Germany</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">📧</span>
                    <div>
                      <p className="font-medium text-textPrimary text-lg mb-1">
                        {t('contact.email')}
                      </p>
                      <a href="mailto:info@nfk-buchhaltung.de" className="text-base hover:text-primary">
                        info@nfk-buchhaltung.de
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">📞</span>
                    <div>
                      <p className="font-medium text-textPrimary text-lg mb-1">
                        {t('contact.phone')}
                      </p>
                      <a href="tel:+492211234567" className="text-base hover:text-primary">
                        +49 (0) 221 1234567
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">🕐</span>
                    <div>
                      <p className="font-medium text-textPrimary text-lg mb-1">
                        {t('contact.hours')}
                      </p>
                      <p className="text-base">{t('contact.hoursWeekdays')}</p>
                      <p className="text-base">{t('contact.hoursWeekend')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Contact Form */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="text-xl font-semibold mb-4 text-primary">
                  {t('contact.form.title')}
                </h4>

                {submitSuccess && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-700">
                    ✅ Ihre Nachricht wurde erfolgreich gesendet!
                  </div>
                )}
                {submitError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                    ❌ {submitError}
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-textPrimary">
                      {t('contact.form.name')}
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t('contact.form.namePlaceholder')}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-textPrimary">
                      {t('contact.form.email')}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t('contact.form.emailPlaceholder')}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formErrors.email && <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-textPrimary">
                      {t('contact.form.subject')}
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder={t('contact.form.subjectPlaceholder')}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent ${formErrors.subject ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formErrors.subject && <p className="mt-1 text-xs text-red-500">{formErrors.subject}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-textPrimary">
                      {t('contact.form.message')}
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      placeholder={t('contact.form.messagePlaceholder')}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent ${formErrors.message ? 'border-red-500' : 'border-gray-300'}`}
                    ></textarea>
                    {formErrors.message && <p className="mt-1 text-xs text-red-500">{formErrors.message}</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full py-3 rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Sende...' : t('contact.form.send')}
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
      <footer className="bg-textPrimary text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 NFK Buchhaltung - {t('landing.footer')}</p>
        </div>
      </footer>
    </div>
  );
}
