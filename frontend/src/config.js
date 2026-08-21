// VITE_API_BASE_URL is baked in at build time (Vite only exposes env vars
// prefixed VITE_). Falls back to the local dev API when unset so nothing
// changes for local `npm run dev`.
export const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5016';

// Uploaded files come back from the API as root-relative paths ("/uploads/..."), which the
// browser would resolve against the frontend origin instead of the backend. Several screens
// re-declared this inline; new callers should import it from here.
export const toAbsoluteBackendUrl = (url) =>
  (!url ? null : url.startsWith('http') ? url : `${BACKEND_URL}${url}`);
