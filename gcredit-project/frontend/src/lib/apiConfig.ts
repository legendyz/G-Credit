/**
 * Centralized API configuration.
 * All API calls should import API_BASE_URL from this file.
 *
 * In production, set VITE_API_URL to the full backend origin (e.g. https://api.gcredit.example.com/api).
 * In development, the Vite dev server proxy forwards /api to the backend, so the
 * relative fallback works without hardcoding a host.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || '/api';
