/**
 * Base Backend API URL configuration.
 * Prioritizes VITE_BACKEND_URL, VITE_FLASK_API_URL, VITE_API_URL, VITE_SERVER_URL, VITE_PUBLIC_BACKEND_URL.
 * Falls back to relative path '' (which uses Vite dev proxy locally or same-origin in production).
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

  return '';
};

export const BACKEND_URL = getBackendUrl();

// Startup logging for environment verification in browser console
if (typeof window !== 'undefined') {
  const currentBackend = getBackendUrl() || '(relative origin)';
  console.log(
    `%c[PlacePrep API] Base Backend URL: "${currentBackend}"`,
    'color: #10b981; font-weight: bold; background: #064e3b; padding: 2px 8px; border-radius: 4px;'
  );
}
