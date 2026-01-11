import { Link } from 'react-router-dom';

export default function Landing() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-primary">NFK Buchhaltung</h2>
            <div className="flex gap-4">
              <button
                onClick={scrollToTop}
                className="text-textPrimary hover:text-primary px-4 py-2"
              >
                Homepage
              </button>
              <button
                onClick={scrollToContact}
                className="text-textPrimary hover:text-primary px-4 py-2"
              >
                Contact
              </button>
              <Link
                to="/auth/register"
                className="text-textPrimary hover:text-primary px-4 py-2"
              >
                Register
              </Link>
              <Link
                to="/auth/login"
                className="btn-primary px-6 py-2 rounded-md"
              >
                Anmelden
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
              NFK Buchhaltung
            </h1>
            <p className="text-xl mb-8">
              Professionelle Steuerberatung für Ihr Unternehmen
            </p>
            <div className="flex gap-4">
              <Link to="/auth/register" className="btn-primary bg-white text-primary px-8 py-3 rounded-md hover:bg-gray-100">
                Jetzt registrieren
              </Link>
              <Link to="/auth/login" className="btn-secondary border-2 border-white text-white px-8 py-3 rounded-md hover:bg-white/10">
                Anmelden
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Services Section */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Unsere Dienstleistungen</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Steuerberatung', icon: '📊' },
              { title: 'Buchhaltung', icon: '💼' },
              { title: 'Lohnabrechnungen', icon: '💰' },
              { title: 'Unternehmensberatung', icon: '🎯' }
            ].map((service, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                <p className="text-textSecondary">Professionelle Unterstützung für Ihr Unternehmen</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Warum NFK?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">🔐</div>
              <h3 className="text-xl font-semibold mb-2">Sicher & DSGVO-konform</h3>
              <p className="text-textSecondary">Höchste Sicherheitsstandards für Ihre Daten</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">Digitales Portal</h3>
              <p className="text-textSecondary">Zugriff auf Ihre Unterlagen jederzeit und überall</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold mb-2">DATEV Integration</h3>
              <p className="text-textSecondary">Nahtlose Integration mit DATEV-Systemen</p>
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
