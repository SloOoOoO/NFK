import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import './i18n/config';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Lazy load all route components
const Landing = lazy(() => import('./pages/public/Landing'));
const Contact = lazy(() => import('./pages/public/Contact'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
const Dashboard = lazy(() => import('./pages/portal/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/portal/AdminDashboard'));
const ClientPortal = lazy(() => import('./pages/portal/ClientPortal'));
const Clients = lazy(() => import('./pages/portal/Clients'));
const Cases = lazy(() => import('./pages/portal/Cases'));
const Documents = lazy(() => import('./pages/portal/Documents'));
const Messages = lazy(() => import('./pages/portal/Messages'));
const Calendar = lazy(() => import('./pages/portal/Calendar'));
const Connections = lazy(() => import('./pages/portal/Connections'));
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
            <Route path="/auth/verify-email" element={<VerifyEmail />} />
            
            {/* Portal Routes */}
            <Route path="/portal/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/portal/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/portal/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
            <Route path="/portal/cases" element={<ProtectedRoute><Cases /></ProtectedRoute>} />
            <Route path="/portal/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            <Route path="/portal/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/portal/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
            <Route path="/portal/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
            <Route path="/portal/datev" element={<ProtectedRoute><DATEV /></ProtectedRoute>} />
            <Route path="/portal/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/portal/client" element={<ProtectedRoute><ClientPortal /></ProtectedRoute>} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
