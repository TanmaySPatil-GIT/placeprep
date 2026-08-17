/**
 * Base Backend API URL configuration.
 * Prioritizes VITE_BACKEND_URL, VITE_FLASK_API_URL, VITE_API_URL, VITE_SERVER_URL, VITE_PUBLIC_BACKEND_URL,
 * and falls back to local dev http://localhost:5000.
 */
export const getBackendUrl = () => {
  const envUrl = 
    (typeof import.meta !== 'undefined' && import.meta.env && (
      import.meta.env.VITE_BACKEND_URL || 
      import.meta.env.VITE_FLASK_API_URL || 
      import.meta.env.VITE_API_URL || 
      import.meta.env.VITE_SERVER_URL || 
      import.meta.env.VITE_PUBLIC_BACKEND_URL
    ));

  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, '');
  }

  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '[::1]') {
      return window.location.origin.replace(/\/$/, '');
    }
  }

  return 'http://localhost:5000';
};

export const BACKEND_URL = getBackendUrl();

// Startup logging for environment verification in browser console
if (typeof window !== 'undefined') {
  const currentBackend = getBackendUrl();
  console.log(
    `%c[PlacePrep API] Base Backend URL: "${currentBackend}"`,
    'color: #10b981; font-weight: bold; background: #064e3b; padding: 2px 8px; border-radius: 4px;'
  );
}

