export default function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Offene Fälle</h3>
          <p className="text-4xl font-bold text-primary">5</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Dokumente</h3>
          <p className="text-4xl font-bold text-primary">23</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Nachrichten</h3>
          <p className="text-4xl font-bold text-primary">3</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Letzte Aktivitäten</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="font-medium">Neues Dokument hochgeladen</p>
              <p className="text-sm text-textSecondary">Vor 2 Stunden</p>
            </div>
            <span className="text-primary">📄</span>
          </div>
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="font-medium">Fall aktualisiert</p>
              <p className="text-sm text-textSecondary">Vor 1 Tag</p>
            </div>
            <span className="text-primary">📊</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Neue Nachricht erhalten</p>
              <p className="text-sm text-textSecondary">Vor 3 Tagen</p>
            </div>
            <span className="text-primary">✉️</span>
          </div>
        </div>
      </div>
    </div>
  );
}
