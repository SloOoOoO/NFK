import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
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
              <Link to="/auth/login" className="btn-primary bg-white text-primary px-8 py-3 rounded-md hover:bg-gray-100">
                Anmelden
              </Link>
              <Link to="/contact" className="btn-secondary border-2 border-white text-white px-8 py-3 rounded-md hover:bg-white/10">
                Kontakt
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

      {/* Footer */}
      <footer className="bg-textPrimary text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 NFK Buchhaltung Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
}
