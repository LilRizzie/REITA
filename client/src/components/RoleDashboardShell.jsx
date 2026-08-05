import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getRoleConfig, getRoleLabel } from '../config/roleConfig';
import NotificationBell from './NotificationBell';
import ProfileMenu from './ProfileMenu';

const ADMIN_EMAIL = 'britneyjacksonel@gmail.com';

export default function RoleDashboardShell({ title, subtitle, children }) {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;
  const investorType = isAdmin ? 'Administrator' : (profile?.investorType || 'Investor');
  const config = useMemo(() => getRoleConfig(investorType), [investorType]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully.');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Unable to log out.');
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar glass-card">
        <div className="sidebar-top">
          <div className="brand-mark sidebar-brand">A</div>
          <div>
            <p className="eyebrow">REITA</p>
            <h2>Private workspace</h2>
          </div>
        </div>

        <p className="muted sidebar-copy">Luxury-grade portfolio visibility for every investor.</p>

        <nav className="sidebar-nav">
          {config.navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="role-badge">{getRoleLabel(investorType)}</div>
          <button type="button" className="btn btn-secondary logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar glass-card">
          <div className="topbar-left">
            <p className="eyebrow">Protected access</p>
            <div className="breadcrumb-row">
              <span>Workspace</span>
              <span>/</span>
              <strong>{title}</strong>
            </div>
            <p className="muted">{subtitle}</p>
          </div>

          <div className="topbar-actions">
            <label className="search-input">
              <span>⌕</span>
              <input type="search" placeholder="Search workspace" />
            </label>

            <NotificationBell />
            <ProfileMenu />
          </div>
        </header>

        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="content-panel">
          {children}
        </motion.section>
      </main>
    </div>
  );
}
