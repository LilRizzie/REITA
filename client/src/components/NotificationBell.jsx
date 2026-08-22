import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllReports, getAllUsers, getProperties, getReports } from '../utils/propertyStorage';

export default function NotificationBell() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [properties, setProperties] = useState([]);
  const ref = useRef(null);
  const isAdmin = user?.role === 'Administrator' || profile?.investorType === 'Administrator';

  // Properties now come from the MongoDB-backed API. For admin users the
  // backend returns all properties based on the verified JWT role.
  useEffect(() => {
    let active = true;
    getProperties(user?.uid)
      .then((list) => { if (active) setProperties(list); })
      .catch(() => { if (active) setProperties([]); });
    return () => { active = false; };
  }, [user?.uid]);

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const notifications = [];
  if (isAdmin) {
    const users = getAllUsers();
    const reports = getAllReports();
    if (users.length) notifications.push({ title: 'Registered users', text: `${users.length} user${users.length === 1 ? '' : 's'} on the platform.` });
    if (properties.length) notifications.push({ title: 'Properties tracked', text: `${properties.length} propert${properties.length === 1 ? 'y' : 'ies'} across all investors.` });
    if (reports.length) notifications.push({ title: 'Reports generated', text: `${reports.length} report${reports.length === 1 ? '' : 's'} created.` });
    if (!notifications.length) notifications.push({ title: 'No activity yet', text: 'Users and properties will appear here.' });
  } else {
    const reports = user?.uid ? getReports(user.uid) : [];
    if (properties.length) notifications.push({ title: 'Properties saved', text: `${properties.length} propert${properties.length === 1 ? 'y' : 'ies'} in your portfolio.` });
    if (reports.length) notifications.push({ title: 'Reports ready', text: `${reports.length} report${reports.length === 1 ? '' : 's'} available to view.` });
    if (!notifications.length) notifications.push({ title: 'Welcome to REITA', text: 'Add a property to get started.' });
  }

  return (
    <div className="notification-wrap" ref={ref}>
      <button type="button" className="icon-button" aria-label="Notifications" onClick={() => setOpen((value) => !value)}>
        ⌁
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="dropdown-menu notification-menu"
          >
            <div className="dropdown-header">Notifications</div>
            {notifications.map((item) => (
              <div key={item.title} className="dropdown-item">
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}