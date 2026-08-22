import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const API_URL = (
  import.meta.env.VITE_API_URL || 'https://reita-backend-deployment.onrender.com'
).replace(/\/+$/, '');

const TOKEN_KEY = 'reita_token';
const USER_KEY = 'reita_user';
const PROFILE_KEY = 'reita_profile';
const PENDING_VERIFICATION_EMAIL_KEY =
  'reita_pending_verification_email';

const readUsers = () => {
  try {
    return JSON.parse(
      window.localStorage.getItem('reita-users') || '[]'
    );
  } catch {
    return [];
  }
};

const saveUser = (data) => {
  const users = readUsers();

  const index = users.findIndex(
    (item) =>
      item.id === data.uid ||
      item.email === data.email
  );

  const userData = {
    id: data.uid,
    name: data.fullName,
    email: data.email,
    role: data.investorType || data.role,
    createdAt: data.createdAt,
    disabled: data.disabled || false,
  };

  if (index >= 0) {
    users[index] = {
      ...users[index],
      ...userData,
    };
  } else {
    users.push(userData);
  }

  window.localStorage.setItem(
    'reita-users',
    JSON.stringify(users)
  );
};

const saveProfile = (uid, data) => {
  if (typeof window === 'undefined' || !uid) return;

  window.localStorage.setItem(
    `reita-profile-${uid}`,
    JSON.stringify(data)
  );
};

const readPendingVerificationEmail = () => {
  if (typeof window === 'undefined') return '';

  return (
    window.sessionStorage.getItem(
      PENDING_VERIFICATION_EMAIL_KEY
    ) || ''
  );
};

const clearAuthState = () => {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(PROFILE_KEY);
};

const decodeTokenExpiry = (token) => {
  try {
    const payload = JSON.parse(
      atob(token.split('.')[1])
    );

    return payload.exp
      ? payload.exp * 1000
      : null;
  } catch {
    return null;
  }
};

const mapBackendUser = (backendUser) => ({
  id: backendUser.id,
  uid: backendUser.id,
  email: backendUser.email,
  fullName: backendUser.fullName,
  photoURL: backendUser.photoURL || '',
  investorType:
    backendUser.investorType || backendUser.role,
  role: backendUser.role,
  emailVerified: Boolean(backendUser.emailVerified),
  displayName: backendUser.fullName,
  createdAt: backendUser.createdAt,
  updatedAt: backendUser.updatedAt,
});

const createProfile = (backendUser) => ({
  uid: backendUser.id,
  fullName: backendUser.fullName,
  email: backendUser.email,
  investorType:
    backendUser.investorType || backendUser.role,
  photoURL: backendUser.photoURL || '',
  createdAt:
    backendUser.createdAt || Date.now(),
});

const storeAuth = (token, backendUser) => {
  const mappedUser = mapBackendUser(backendUser);
  const mappedProfile = createProfile(backendUser);

  window.localStorage.setItem(
    TOKEN_KEY,
    token
  );

  window.localStorage.setItem(
    USER_KEY,
    JSON.stringify(mappedUser)
  );

  window.localStorage.setItem(
    PROFILE_KEY,
    JSON.stringify(mappedProfile)
  );

  saveProfile(
    mappedUser.uid,
    mappedProfile
  );

  saveUser(mappedProfile);

  return {
    user: mappedUser,
    profile: mappedProfile,
  };
};

const backendRequest = async (
  endpoint,
  body
) => {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      'The server returned an invalid response.'
    );
  }

  if (!response.ok || !data.success) {
    const error = new Error(
      data.message || 'Request failed.'
    );

    error.code = data.code || null;
    error.status = response.status;
    error.verificationEmail =
      data.verificationEmail || null;

    throw error;
  }

  return data;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [
    pendingVerificationEmail,
    setPendingVerificationEmailState,
  ] = useState(
    readPendingVerificationEmail()
  );

  const setPendingVerificationEmail = (email) => {
    const normalizedEmail =
      email?.trim().toLowerCase() || '';

    setPendingVerificationEmailState(
      normalizedEmail
    );

    if (typeof window !== 'undefined') {
      if (normalizedEmail) {
        window.sessionStorage.setItem(
          PENDING_VERIFICATION_EMAIL_KEY,
          normalizedEmail
        );
      } else {
        window.sessionStorage.removeItem(
          PENDING_VERIFICATION_EMAIL_KEY
        );
      }
    }
  };

  // --------------------------------------------------
  // RESTORE EXISTING SESSION
  // --------------------------------------------------

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const token =
        window.localStorage.getItem(TOKEN_KEY);

      if (!token) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      const expiry = decodeTokenExpiry(token);

      if (
        expiry &&
        expiry < Date.now()
      ) {
        clearAuthState();

        if (active) {
          setLoading(false);
        }

        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/auth/me`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        let data;

        try {
          data = await response.json();
        } catch {
          throw new Error(
            'The server returned an invalid response.'
          );
        }

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message || 'Session expired.'
          );
        }

        const result = storeAuth(
          token,
          data.user
        );

        if (active) {
          setUser(result.user);
          setProfile(result.profile);
          setPendingVerificationEmail('');
        }
      } catch {
        clearAuthState();

        if (active) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  // --------------------------------------------------
  // LISTEN FOR UNAUTHORIZED API RESPONSES
  // --------------------------------------------------

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuthState();

      setUser(null);
      setProfile(null);
    };

    window.addEventListener(
      'reita:unauthorized',
      handleUnauthorized
    );

    return () => {
      window.removeEventListener(
        'reita:unauthorized',
        handleUnauthorized
      );
    };
  }, []);

  // --------------------------------------------------
  // SIGNUP
  // --------------------------------------------------

  const signup = async (
    fullName,
    email,
    password,
    investorType
  ) => {
    const data = await backendRequest(
      '/api/auth/signup',
      {
        fullName,
        email,
        password,
        investorType,
      }
    );

    setPendingVerificationEmail('');

    return {
      ...data,
      requiresEmailVerification: Boolean(data.requiresEmailVerification),
    };
  };

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  const login = async (
    email,
    password
  ) => {
    const normalizedEmail =
      email.trim().toLowerCase();

    const data = await backendRequest(
      '/api/auth/login',
      {
        email: normalizedEmail,
        password,
      }
    );
    if (!data.token || !data.user) {
      throw new Error(
        'Login succeeded but no authentication session was returned.'
      );
    }

    const result = storeAuth(
      data.token,
      data.user
    );

    setUser(result.user);
    setProfile(result.profile);
    setPendingVerificationEmail('');

    return {
      ...result,
      requiresEmailVerification: false,
    };
  };

  // --------------------------------------------------
  // VERIFY EMAIL OTP
  // --------------------------------------------------

  const verifyEmailOtp = async (
    email,
    otp
  ) => {
    const data = await backendRequest(
      '/api/auth/verify-email-otp',
      {
        email,
        otp,
      }
    );

    /*
     * The backend creates the JWT ONLY after
     * successful email verification.
     */
    if (data.token && data.user) {
      const result = storeAuth(
        data.token,
        data.user
      );

      setUser(result.user);
      setProfile(result.profile);
      setPendingVerificationEmail('');

      return {
        ...result,
        requiresEmailVerification: false,
      };
    }

    return data;
  };

  // --------------------------------------------------
  // RESEND EMAIL VERIFICATION OTP
  // --------------------------------------------------

  const resendVerificationEmail = async (
    email
  ) => {
    const data = await backendRequest(
      '/api/auth/resend-email-otp',
      {
        email,
      }
    );

    return data;
  };

  // --------------------------------------------------
  // PASSWORD RESET
  // --------------------------------------------------

  const resetPassword = async (email) => {
    const data = await backendRequest(
      '/api/auth/forgot-password',
      {
        email,
      }
    );

    return data;
  };

  const verifyPasswordResetOtp = async (
    email,
    otp
  ) => {
    const data = await backendRequest(
      '/api/auth/verify-password-reset-otp',
      {
        email,
        otp,
      }
    );

    return data;
  };

  const resendPasswordResetOtp = async (
    email
  ) => {
    const data = await backendRequest(
      '/api/auth/resend-password-reset-otp',
      {
        email,
      }
    );

    return data;
  };

  const setPassword = async (
    token,
    password
  ) => {
    const data = await backendRequest(
      '/api/auth/set-password',
      {
        token,
        password,
      }
    );

    /*
     * Do NOT automatically authenticate the user
     * after password reset.
     */
    return data;
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const logout = async () => {
    clearAuthState();

    setPendingVerificationEmail('');

    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  // --------------------------------------------------
  // EMAIL VERIFICATION STATUS
  // --------------------------------------------------

  const isEmailVerified = () => {
    /*
     * Administrators are allowed to use the system
     * without email verification.
     */
    if (user?.role === 'Administrator') {
      return true;
    }

    return Boolean(
      user?.emailVerified
    );
  };

  // --------------------------------------------------
  // CONTEXT VALUE
  // --------------------------------------------------

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      pendingVerificationEmail,

      signup,
      login,
      logout,

      verifyEmailOtp,
      resendVerificationEmail,

      resetPassword,
      verifyPasswordResetOtp,
      resendPasswordResetOtp,
      setPassword,

      isEmailVerified,
      setPendingVerificationEmail,
    }),
    [
      user,
      profile,
      loading,
      pendingVerificationEmail,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};