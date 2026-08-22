const API_URL = (import.meta.env.VITE_API_URL || 'https://reita-backend-deployment.onrender.com').replace(/\/+$/, '');

const TOKEN_KEY = 'reita_token';

const getToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
};

const clearAuthStorage = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem('reita_user');
  window.localStorage.removeItem('reita_profile');
};

export async function apiRequest(path, { method = 'GET', body, headers = {}, auth = true } = {}) {
  const token = getToken();

  const requestHeaders = { ...headers };
  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  // Attach Authorization header only when a token exists and auth is requested.
  if (auth && token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Treat only HTTP 401 as an authentication failure.
  if (response.status === 401) {
    clearAuthStorage();
    // Allow the application/auth context to recognize the session as invalid.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('reita:unauthorized'));
    }
  }

  return response;
}

export { API_URL, getToken };