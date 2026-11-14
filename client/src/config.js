/** Base URL for API + Socket.io. Empty = same host (production single-app deploy). */
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');