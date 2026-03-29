const trimSlash = (value) => value?.replace(/\/+$/, '');

export const API_BASE_URL = trimSlash(import.meta.env.VITE_API_URL) || 'http://localhost:5000';
export const SOCKET_URL = trimSlash(import.meta.env.VITE_SOCKET_URL) || API_BASE_URL;

export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const FIREBASE_IS_CONFIGURED = Object.values(FIREBASE_CONFIG).every(Boolean);
