/**
 * Base Backend API URL configuration.
 * Prioritizes VITE_BACKEND_URL, falls back to VITE_FLASK_API_URL, then local dev http://localhost:5000.
 */
export const getBackendUrl = () => {
  const url = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_FLASK_API_URL;
  return url ? url.replace(/\/$/, '') : 'http://localhost:5000';
};

export const BACKEND_URL = getBackendUrl();
