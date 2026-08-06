export const getFirebaseErrorMessage = (error) => {
  if (!error) return 'Something went wrong. Please try again.';

  const code = error.code || error;

  const messages = {
    'auth/email-already-in-use': 'An account already exists with this email.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/user-not-found': 'No account was found with this email.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes.',
    'auth/network-request-failed': 'Network connection lost. Please try again.',
    'auth/popup-closed-by-user': 'The Google sign-in popup was closed. Please try again.',
    'auth/cancelled-popup-request': 'The Google sign-in was cancelled. Please try again.',
    'auth/weak-password': 'Password should be at least 8 characters.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
    'auth/requires-recent-login': 'Please sign in again to continue.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/missing-password': 'Please enter your password.',
    'auth/email-change-needs-verification': 'Please verify your new email address.',
    'auth/expired-action-code': 'This link has expired. Please request a new one.',
    'auth/invalid-action-code': 'This link is invalid. Please request a new one.',
  };

  return messages[code] || error.message || 'Something went wrong. Please try again.';
};