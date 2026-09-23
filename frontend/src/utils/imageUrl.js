// Product images are served from the backend's static /uploads path, not
// through /api, so we strip a trailing "/api" off the configured API base
// URL to build the origin images live on.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const ORIGIN = API_BASE.replace(/\/api\/?$/, '');

export function getImageUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${ORIGIN}${path}`;
}