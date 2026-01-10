import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/public/Landing';
import Login from './pages/auth/Login';
import Dashboard from './pages/portal/Dashboard';
import AdminDashboard from './pages/portal/AdminDashboard';
import ClientPortal from './pages/portal/ClientPortal';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth/login" element={<Login />} />
        
        {/* Portal Routes */}
        <Route path="/portal/dashboard" element={<Dashboard />} />
        <Route path="/portal/admin" element={<AdminDashboard />} />
        <Route path="/portal/client" element={<ClientPortal />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
