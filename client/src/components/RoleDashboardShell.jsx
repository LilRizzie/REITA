import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaArrowUp, FaBars, FaBook, FaDownload, FaEnvelope, FaExternalLinkAlt, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getRoleConfig, getRoleLabel } from '../config/roleConfig';
import NotificationBell from './NotificationBell';
import ProfileMenu from './ProfileMenu';

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;
const DEV_EMAIL = 'britneyjacksonel@gmail.com';

export default function RoleDashboardShell({ title, subtitle, children }) {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const docsRef = useRef(null);

  const investorType = user?.role || profile?.investorType || 'Investor';
  const config = useMemo(() => getRoleConfig(investorType), [investorType]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (event) => {
      if (docsRef.current && !docsRef.current.contains(event.target)) {
        setDocsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully.');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Unable to log out.');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navContent = (
    <>
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
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            onClick={() => setDrawerOpen(false)}
          >
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
    </>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar glass-card sidebar-desktop">
        {navContent}
      </aside>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className="sidebar glass-card sidebar-drawer"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'tween', duration: 0.25 }}
            >
              <button type="button" className="drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                <FaTimes />
              </button>
              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="dashboard-main">
        <header className="dashboard-topbar glass-card">
          <div className="topbar-left">
            <div className="topbar-title-row">
              <button type="button" className="hamburger-btn" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
                <FaBars />
              </button>
              <div>
                <p className="eyebrow">Protected access</p>
                <div className="breadcrumb-row">
                  <span>Workspace</span>
                  <span>/</span>
                  <strong>{title}</strong>
                </div>
                <p className="muted">{subtitle}</p>
              </div>
            </div>
          </div>

          <div className="topbar-actions">
            <label className="search-input">
              <span>⌕</span>
              <input type="search" placeholder="Search workspace" />
            </label>

            <div className="docs-wrap" ref={docsRef}>
              <button type="button" className="icon-button docs-btn" onClick={() => setDocsOpen((value) => !value)} aria-label="Documentation">
                <FaBook />
              </button>
              <AnimatePresence>
                {docsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="dropdown-menu"
                  >
                    <div className="dropdown-header">Documentation</div>
                    <a className="dropdown-link" href="/REITA_User_Guide.pdf" download>
                      <FaDownload /> Download User Guide (PDF)
                    </a>
                    <a className="dropdown-link" href={APP_URL} target="_blank" rel="noopener noreferrer">
                      <FaExternalLinkAlt /> Visit Live Application
                    </a>
                    <a className="dropdown-link" href={`mailto:${DEV_EMAIL}`}>
                      <FaEnvelope /> Contact Developer
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <NotificationBell />
            <ProfileMenu />
          </div>
        </header>

        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="content-panel">
          {children}
        </motion.section>
      </main>

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            type="button"
            className="back-to-top"
            onClick={scrollToTop}
            aria-label="Back to top"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <FaArrowUp />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}