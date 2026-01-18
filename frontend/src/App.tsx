import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import './i18n/config';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load all route components
const Landing = lazy(() => import('./pages/public/Landing'));
const Contact = lazy(() => import('./pages/public/Contact'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const Dashboard = lazy(() => import('./pages/portal/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/portal/AdminDashboard'));
const ClientPortal = lazy(() => import('./pages/portal/ClientPortal'));
const Clients = lazy(() => import('./pages/portal/Clients'));
const Cases = lazy(() => import('./pages/portal/Cases'));
const Documents = lazy(() => import('./pages/portal/Documents'));
const Messages = lazy(() => import('./pages/portal/Messages'));
const Calendar = lazy(() => import('./pages/portal/Calendar'));
const DATEV = lazy(() => import('./pages/portal/DATEV'));
const Profile = lazy(() => import('./pages/portal/Profile'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            
            {/* Portal Routes */}
            <Route path="/portal/dashboard" element={<Dashboard />} />
            <Route path="/portal/profile" element={<Profile />} />
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
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
