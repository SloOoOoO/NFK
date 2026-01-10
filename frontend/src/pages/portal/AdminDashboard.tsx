export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-secondary p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-semibold text-textSecondary mb-2">Total Users</h3>
            <p className="text-4xl font-bold text-primary">142</p>
            <p className="text-sm text-textSecondary mt-2">+12% from last month</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-semibold text-textSecondary mb-2">Active Clients</h3>
            <p className="text-4xl font-bold text-primary">87</p>
            <p className="text-sm text-textSecondary mt-2">+5% from last month</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-semibold text-textSecondary mb-2">Open Cases</h3>
            <p className="text-4xl font-bold text-primary">23</p>
            <p className="text-sm text-textSecondary mt-2">-8% from last month</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-semibold text-textSecondary mb-2">DATEV Jobs</h3>
            <p className="text-4xl font-bold text-primary">156</p>
            <p className="text-sm text-textSecondary mt-2">This month</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { action: 'New user registered', user: 'john.doe@example.com', time: '5 minutes ago' },
                { action: 'Case updated', user: 'Client #1234', time: '1 hour ago' },
                { action: 'DATEV export completed', user: 'System', time: '2 hours ago' },
                { action: 'Document uploaded', user: 'maria.smith@example.com', time: '3 hours ago' },
              ].map((item, index) => (
                <div key={index} className="flex items-start justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{item.action}</p>
                    <p className="text-sm text-textSecondary">{item.user}</p>
                  </div>
                  <span className="text-xs text-textSecondary">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">System Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">API Server</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Database</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Redis Cache</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Hangfire Jobs</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Running</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Storage</span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">75% Used</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <button className="btn-primary text-center py-4">
                <div className="text-2xl mb-2">👥</div>
                <div>Manage Users</div>
              </button>
              <button className="btn-primary text-center py-4">
                <div className="text-2xl mb-2">📁</div>
                <div>View Cases</div>
              </button>
              <button className="btn-primary text-center py-4">
                <div className="text-2xl mb-2">🔄</div>
                <div>DATEV Jobs</div>
              </button>
              <button className="btn-primary text-center py-4">
                <div className="text-2xl mb-2">⚙️</div>
                <div>System Settings</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
