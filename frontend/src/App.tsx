import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/public/Landing';
import Login from './pages/auth/Login';
import Dashboard from './pages/portal/Dashboard';
import AdminDashboard from './pages/portal/AdminDashboard';
import ClientPortal from './pages/portal/ClientPortal';
import Clients from './pages/portal/Clients';
import Cases from './pages/portal/Cases';
import Documents from './pages/portal/Documents';
import Messages from './pages/portal/Messages';
import Calendar from './pages/portal/Calendar';
import DATEV from './pages/portal/DATEV';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth/login" element={<Login />} />
        
        {/* Portal Routes */}
        <Route path="/portal/dashboard" element={<Dashboard />} />
        <Route path="/portal/clients" element={<Clients />} />
        <Route path="/portal/cases" element={<Cases />} />
        <Route path="/portal/documents" element={<Documents />} />
        <Route path="/portal/messages" element={<Messages />} />
        <Route path="/portal/calendar" element={<Calendar />} />
        <Route path="/portal/datev" element={<DATEV />} />
        <Route path="/portal/admin" element={<AdminDashboard />} />
        <Route path="/portal/client" element={<ClientPortal />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
