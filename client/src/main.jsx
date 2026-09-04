import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ConfirmProvider } from './context/ConfirmContext.jsx';

const storedUser = window.localStorage.getItem('reita_user');
try {
  const user = storedUser ? JSON.parse(storedUser) : null;
  const settings = user?.uid
    ? JSON.parse(window.localStorage.getItem(`reita-settings-${user.uid}`) || 'null')
    : null;
  if (settings && typeof settings.darkMode === 'boolean') {
    document.documentElement.dataset.theme = settings.darkMode ? 'dark' : 'light';
  }
} catch {
  // Ignore malformed optional presentation preferences.
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ConfirmProvider>
          <App />
          <ToastContainer position="top-right" theme="dark" autoClose={3000} />
        </ConfirmProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
