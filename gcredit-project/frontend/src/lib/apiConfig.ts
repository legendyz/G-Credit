/**
 * Centralized API configuration.
 * All API calls should import API_BASE_URL from this file.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
