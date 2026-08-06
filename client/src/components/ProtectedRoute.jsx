import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessRoute } from '../config/roleConfig';

const ADMIN_EMAIL = 'britneyjacksonel@gmail.com';

const getHomePath = (role) => (role === 'Administrator' ? '/admin-dashboard' : '/dashboard');

export default function ProtectedRoute() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-shell">
        <div className="auth-card glass-card">
          <div className="loading-pill">Preparing your workspace…</div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace state={{ from: location }} />;

  // Email/password users must verify their email before accessing the app.
  // Google accounts are always verified, so they pass through.
  if (!user.emailVerified) {
    return <Navigate to="/verification-required" replace />;
  }

  const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL;
  const role = isAdmin ? 'Administrator' : (profile?.investorType || 'Investor');
  const homePath = getHomePath(role);

  return canAccessRoute(role, location.pathname)
    ? <Outlet />
    : <Navigate to={homePath} replace />;
}