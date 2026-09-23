
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const ORIGIN = API_BASE.replace(/\/api\/?$/, '');

export function getImageUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${ORIGIN}${path}`;
}