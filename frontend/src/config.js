// VITE_API_BASE_URL is baked in at build time (Vite only exposes env vars
// prefixed VITE_). Falls back to the local dev API when unset so nothing
// changes for local `npm run dev`.
export const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5016';
