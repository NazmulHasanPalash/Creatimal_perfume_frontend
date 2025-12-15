import firebaseConfig from './firebase.config';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

/**
 * Initialize Firebase only once (prevents duplicate-app errors)
 */
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * ✅ Named exports (your Login.js needs these)
 */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * ✅ Default export kept for backward compatibility
 * (If any old code calls initializeAuthentication())
 */
const initializeAuthentication = () => app;

export default initializeAuthentication;
