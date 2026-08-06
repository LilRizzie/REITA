import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext(null);
const ADMIN_EMAIL = 'britneyjacksonel@gmail.com';

const readUsers = () => {
  try { return JSON.parse(window.localStorage.getItem('reita-users') || '[]'); } catch { return []; }
};
const saveUser = (data) => {
  if (data.email?.toLowerCase() === ADMIN_EMAIL) return;
  const users = readUsers();
  const index = users.findIndex((item) => item.id === data.uid || item.email === data.email);
  const userData = { id: data.uid, name: data.fullName, email: data.email, role: data.investorType, createdAt: data.createdAt, disabled: data.disabled || false };
  if (index >= 0) users[index] = { ...users[index], ...userData }; else users.push(userData);
  window.localStorage.setItem('reita-users', JSON.stringify(users));
};

const getStoredProfile = (uid) => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(`reita-profile-${uid}`);
  return raw ? JSON.parse(raw) : null;
};

const saveProfile = (uid, data) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(`reita-profile-${uid}`, JSON.stringify(data));
};

const clearAuthState = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('firebase:authUser');
  window.localStorage.removeItem('firebase:authUser:');
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const storedProfile = getStoredProfile(firebaseUser.uid);
        const isAdmin = firebaseUser.email?.toLowerCase() === ADMIN_EMAIL;
        const resolvedProfile = storedProfile || {
          uid: firebaseUser.uid,
          fullName: firebaseUser.displayName || 'Investor',
          email: firebaseUser.email || '',
          investorType: 'Investor',
          photoURL: firebaseUser.photoURL || '',
          createdAt: Date.now(),
        };

        resolvedProfile.investorType = isAdmin ? 'Administrator' : (resolvedProfile.investorType === 'Property Agent' ? 'Property Agent' : 'Investor');

        saveProfile(firebaseUser.uid, resolvedProfile);
        if (!isAdmin) saveUser(resolvedProfile);
        setProfile(resolvedProfile);
        setUser(firebaseUser);
      } else {
        setUser(null);
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (fullName, email, password, investorType) => {
    if (!['Investor', 'Property Agent'].includes(investorType)) throw new Error('Select Investor or Property Agent.');
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const currentUser = credential.user;

    await sendEmailVerification(currentUser);

    const profileData = {
      uid: currentUser.uid,
      fullName,
      email,
      investorType,
      photoURL: currentUser.photoURL || '',
      createdAt: Date.now(),
    };

    saveProfile(currentUser.uid, profileData);
    saveUser(profileData);
    setProfile(profileData);

    return { success: true, email };
  };

  const login = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);

    if (!credential.user.emailVerified) {
      throw new Error('Your email has not been verified. Please check your inbox.');
    }

    return credential;
  };

  const loginWithGoogle = async () => {
    const credential = await signInWithPopup(auth, googleProvider);
    const currentUser = credential.user;
    const isAdmin = currentUser.email?.toLowerCase() === ADMIN_EMAIL;
    const profileData = {
      uid: currentUser.uid,
      fullName: currentUser.displayName || 'Investor',
      email: currentUser.email || '',
      investorType: isAdmin ? 'Administrator' : 'Investor',
      photoURL: currentUser.photoURL || '',
      createdAt: Date.now(),
    };

    saveProfile(currentUser.uid, profileData);
    if (!isAdmin) saveUser(profileData);
    setProfile(profileData);
    return credential;
  };

  const logout = async () => {
    await firebaseSignOut(auth);

    setUser(null);
    setProfile(null);
    setLoading(false);

    clearAuthState();
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const resendVerificationEmail = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No user is currently signed in.');
    await sendEmailVerification(currentUser);
  };

  const isEmailVerified = () => {
    const currentUser = auth.currentUser;
    return Boolean(currentUser?.emailVerified);
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signup,
      login,
      loginWithGoogle,
      logout,
      resetPassword,
      resendVerificationEmail,
      isEmailVerified,
    }),
    [loading, profile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};