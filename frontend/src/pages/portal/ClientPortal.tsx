export default function ClientPortal() {
  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">NFK Client Portal</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-textSecondary">Welcome, Max Mustermann</span>
              <button className="btn-secondary">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-primary text-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-2">Willkommen in Ihrem Portal</h2>
          <p className="text-white/90">
            Verwalten Sie Ihre Dokumente, Fälle und kommunizieren Sie mit Ihrem Steuerberater.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-textSecondary mb-1">Meine Fälle</h3>
                <p className="text-3xl font-bold text-primary">3</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-textSecondary mb-1">Dokumente</h3>
                <p className="text-3xl font-bold text-primary">12</p>
              </div>
              <div className="text-4xl">📄</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-textSecondary mb-1">Nachrichten</h3>
                <p className="text-3xl font-bold text-primary">2</p>
              </div>
              <div className="text-4xl">✉️</div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Cases */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Aktuelle Fälle</h2>
              <button className="text-primary hover:underline text-sm">Alle anzeigen</button>
            </div>
            <div className="space-y-4">
              {[
                { id: 'CASE-001', title: 'Jahresabschluss 2024', status: 'In Bearbeitung', date: '10.01.2025' },
                { id: 'CASE-002', title: 'Umsatzsteuervoranmeldung Q4', status: 'Ausstehend', date: '08.01.2025' },
                { id: 'CASE-003', title: 'Lohnabrechnung Dezember', status: 'Abgeschlossen', date: '05.01.2025' },
              ].map((caseItem) => (
                <div key={caseItem.id} className="border rounded-lg p-4 hover:bg-secondary transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-primary">{caseItem.id}</p>
                      <p className="font-medium mt-1">{caseItem.title}</p>
                      <p className="text-sm text-textSecondary mt-1">{caseItem.date}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      caseItem.status === 'Abgeschlossen' ? 'bg-green-100 text-green-800' :
                      caseItem.status === 'In Bearbeitung' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {caseItem.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Schnellzugriff</h2>
              <div className="space-y-3">
                <button className="w-full btn-primary text-left flex items-center gap-3">
                  <span>📤</span>
                  <span>Dokument hochladen</span>
                </button>
                <button className="w-full btn-secondary text-left flex items-center gap-3">
                  <span>💬</span>
                  <span>Nachricht senden</span>
                </button>
                <button className="w-full btn-secondary text-left flex items-center gap-3">
                  <span>📅</span>
                  <span>Termin vereinbaren</span>
                </button>
              </div>
            </div>

            {/* Recent Messages */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Nachrichten</h2>
              <div className="space-y-3">
                {[
                  { from: 'Ihr Berater', subject: 'Dokumente benötigt', time: 'Vor 2 Stunden' },
                  { from: 'System', subject: 'Fall aktualisiert', time: 'Gestern' },
                ].map((message, index) => (
                  <div key={index} className="border-b pb-3 last:border-0">
                    <p className="font-medium text-sm">{message.from}</p>
                    <p className="text-textSecondary text-sm">{message.subject}</p>
                    <p className="text-xs text-textSecondary mt-1">{message.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Meine Dokumente</h2>
            <button className="text-primary hover:underline text-sm">Alle anzeigen</button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Rechnung_Q4_2024.pdf', size: '245 KB', date: '10.01.2025' },
              { name: 'Kontoauszug_Dez.pdf', size: '1.2 MB', date: '08.01.2025' },
              { name: 'Belege_2024.zip', size: '5.8 MB', date: '05.01.2025' },
              { name: 'Jahresabschluss.pdf', size: '890 KB', date: '03.01.2025' },
            ].map((doc, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-secondary transition-colors cursor-pointer">
                <div className="text-3xl mb-2">📄</div>
                <p className="font-medium text-sm truncate">{doc.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-textSecondary">{doc.size}</p>
                  <p className="text-xs text-textSecondary">{doc.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
