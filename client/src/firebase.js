import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAhkj12A-SViNDcqwpGPxvEPw14V7Inlng',
  authDomain: 'reita--system.firebaseapp.com',
  projectId: 'reita--system',
  storageBucket: 'reita--system.firebasestorage.app',
  messagingSenderId: '138742571022',
  appId: '1:138742571022:web:3fc44bae7c6f179d865c5f',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };