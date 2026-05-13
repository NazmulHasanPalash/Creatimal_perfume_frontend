// src/Components/Hooks/useFirebase.js
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onIdTokenChanged,
} from 'firebase/auth';
import initializeAuthentication from '../Firebase/firebase.init';

initializeAuthentication();

/**
 * ✅ useFirebase (Safe for React Router v5)
 * - user is ALWAYS an object: {} when logged out (prevents user.email crash)
 * - token is "" when logged out
 * - isLoading is for initial auth restore + sign-in/out actions
 * - isAdmin + isAdminLoading included (for AdminRouter)
 * - cancels admin check requests on unmount / changes (no memory leaks)
 */

const API_BASE = String(process.env.REACT_APP_API_BASE || 'https://creatimal-charmon-perfume-backend.vercel.app')
  .trim()
  .replace(/\/+$/, '');

// IMPORTANT: This endpoint MUST be admin-protected on backend.
// If GET /admins is admin-only, keep it.
const ADMIN_CHECK_ENDPOINT = '/admins';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

function safeStr(v) {
  return v === null || v === undefined ? '' : String(v);
}

const useFirebase = () => {
  // ✅ NEVER null -> prevents "can't access property email, user is null"
  const [user, setUser] = useState({}); // {} when logged out
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // admin
  const [isAdmin, setIsAdmin] = useState(false); // boolean default
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  // stable auth instance
  const auth = useMemo(() => getAuth(), []);

  // prevent setState after unmount
  const mountedRef = useRef(false);

  // track initial restore (so loading stops after first callback)
  const initialResolvedRef = useRef(false);

  // abort controller for admin check
  const adminAbortRef = useRef(null);

  const cancelAdminRequest = useCallback(() => {
    if (adminAbortRef.current) {
      try {
        adminAbortRef.current.abort();
      } catch (_) {}
      adminAbortRef.current = null;
    }
  }, []);

  // =========================
  // Firebase auth + token listener
  // =========================
  useEffect(() => {
    mountedRef.current = true;
    setIsLoading(true);
    initialResolvedRef.current = false;

    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      try {
        if (!mountedRef.current) return;

        if (!currentUser) {
          // logged out
          setUser({});
          setToken('');
          setIsAdmin(false);
          setIsAdminLoading(false);
          cancelAdminRequest();
          return;
        }

        // logged in
        setUser(currentUser);

        const idToken = await currentUser.getIdToken();
        if (!mountedRef.current) return;

        setToken(safeStr(idToken).trim());
      } catch (err) {
        console.error('onIdTokenChanged error:', err);
        if (!mountedRef.current) return;

        setUser({});
        setToken('');
        setIsAdmin(false);
        setIsAdminLoading(false);
        cancelAdminRequest();
      } finally {
        if (mountedRef.current && !initialResolvedRef.current) {
          initialResolvedRef.current = true;
          setIsLoading(false);
        } else if (mountedRef.current) {
          // on token refresh callbacks, keep isLoading false
          setIsLoading(false);
        }
      }
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
      cancelAdminRequest();
    };
  }, [auth, cancelAdminRequest]);

  // =========================
  // Admin check (runs when email+token become available)
  // =========================
  useEffect(() => {
    const email = safeStr(user?.email).trim();
    const bearer = safeStr(token).trim();

    // If not logged in, ensure resolved admin state (no infinite loading)
    if (!email || !bearer) {
      setIsAdmin(false);
      setIsAdminLoading(false);
      cancelAdminRequest();
      return;
    }

    // start admin check
    setIsAdminLoading(true);

    // cancel previous request
    cancelAdminRequest();

    const controller = new AbortController();
    adminAbortRef.current = controller;

    (async () => {
      try {
        await api.get(ADMIN_CHECK_ENDPOINT, {
          headers: { Authorization: `Bearer ${bearer}` },
          signal: controller.signal,
        });

        if (!mountedRef.current) return;
        setIsAdmin(true);
      } catch (err) {
        if (!mountedRef.current) return;

        const aborted =
          controller.signal.aborted ||
          err?.name === 'CanceledError' ||
          err?.code === 'ERR_CANCELED';

        if (aborted) return;

        const status = err?.response?.status;

        // 401/403 => not admin
        if (status === 401 || status === 403) {
          setIsAdmin(false);
        } else {
          console.error('Admin check failed:', err);
          // Safe fallback: not admin (and STOP loading)
          setIsAdmin(false);
        }
      } finally {
        if (!mountedRef.current) return;
        if (controller.signal.aborted) return;
        setIsAdminLoading(false);
      }
    })();

    return () => {
      try {
        controller.abort();
      } catch (_) {}
    };
  }, [user?.email, token, cancelAdminRequest]);

  // =========================
  // Actions
  // =========================
  const signInUsingGoogle = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const u = result?.user;

      if (!mountedRef.current) return {};

      setUser(u || {});
      if (!u) {
        setToken('');
        setIsAdmin(false);
        return {};
      }

      // force fresh token right after login
      const idToken = await u.getIdToken(true);
      if (!mountedRef.current) return u;

      setToken(safeStr(idToken).trim());
      return u;
    } catch (err) {
      console.error('Google sign-in failed:', err);
      if (mountedRef.current) {
        setUser({});
        setToken('');
        setIsAdmin(false);
        setIsAdminLoading(false);
      }
      throw err;
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  };

  const logOut = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      if (!mountedRef.current) return;

      setUser({});
      setToken('');
      setIsAdmin(false);
      setIsAdminLoading(false);
      cancelAdminRequest();
    } catch (err) {
      console.error('Logout failed:', err);
      throw err;
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  };

  return {
    user, // ✅ always {}
    token,
    isLoading,

    // ✅ admin
    isAdmin, // ✅ boolean always
    isAdminLoading,

    signInUsingGoogle,
    logOut,
  };
};

export default useFirebase;
