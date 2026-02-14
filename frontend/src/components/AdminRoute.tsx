import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

// Roles that have admin access
const ADMIN_ROLES = ['SuperAdmin', 'Admin', 'Consultant', 'Steuerberater'];

export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    const redirectUrl = `/auth/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;
    return <Navigate to={redirectUrl} replace />;
  }

  // Check if user has admin role
  const userRole = user?.role || '';
  const hasAdminAccess = ADMIN_ROLES.includes(userRole);

  if (!hasAdminAccess) {
    // Redirect to dashboard if user doesn't have admin access
    return <Navigate to="/portal/dashboard" replace />;
  }

  // Render children if authenticated and authorized
  return <>{children}</>;
}
