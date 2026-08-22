import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfileImage } from '../utils/propertyStorage';

export default function ProfileMenu() {
  const { profile, user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const role = user?.role || profile?.investorType || 'Investor';
  const displayName = profile?.fullName || 'Investor';

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="profile-menu-wrap" ref={ref}>
      <button type="button" className="profile-pill" onClick={() => setOpen((value) => !value)}>
        {user?.uid && getProfileImage(user.uid) ? <img className="mini-avatar" src={getProfileImage(user.uid)} alt="" /> : null}
        <strong>{displayName}</strong>
        <span>{role}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="dropdown-menu"
          >
            <div className="dropdown-header">Workspace profile</div>
            <div className="dropdown-item">
              <strong>{displayName}</strong>
              <span>{profile?.email}</span>
            </div>
            <div className="dropdown-item">
              <strong>Role</strong>
              <span>{role}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
