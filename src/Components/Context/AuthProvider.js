// src/Context/AuthProvider.js
import React, { createContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import useFirebase from '../Hooks/useFirebase';

const API_BASE = String(process.env.REACT_APP_API_BASE || 'https://creatimal-charmon-perfume-backend.vercel.app')
  .trim()
  .replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000, // axios timeout
});

function safeStr(v) {
  return v === null || v === undefined ? '' : String(v);
}

// ✅ Default context shape (prevents undefined destructure bugs)
export const AuthContext = createContext({
  user: null,
  isLoading: true, // firebase loading
  token: '',
  isAdmin: null, // null while checking
  isAdminLoading: true, // admin check loading
  signInUsingGoogle: async () => null,
  logOut: async () => {},
});

const ADMIN_CHECK_ENDPOINT = '/admins';

// extra safety: don’t let admin-check spinner hang forever
const ADMIN_CHECK_HARD_TIMEOUT_MS = 8000;

// if user exists but token not ready yet, wait a bit before deciding
const TOKEN_WAIT_MS = 1500;

const AuthProvider = ({ children }) => {
  const { user, isLoading, token, signInUsingGoogle, logOut } = useFirebase();

  const [isAdmin, setIsAdmin] = useState(null); // null = checking
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    // CancelToken is compatible with axios v0.x and v1.x
    const cancelSource =
      axios.CancelToken && axios.CancelToken.source
        ? axios.CancelToken.source()
        : null;

    let tokenWaitTimer = null;
    let hardTimeoutTimer = null;

    const finish = (adminValue) => {
      if (!alive) return;
      setIsAdmin(adminValue);
      setIsAdminLoading(false);
    };

    const startLoading = () => {
      if (!alive) return;
      setIsAdmin(null);
      setIsAdminLoading(true);
    };

    const checkAdmin = async () => {
      // 1) While Firebase is restoring auth, keep admin check pending
      if (isLoading) {
        startLoading();
        return;
      }

      const email = safeStr(user?.email).trim();
      const bearer = safeStr(token).trim();

      // 2) Not logged in => not admin
      if (!email) {
        finish(false);
        return;
      }

      // 3) Logged in but token not ready yet:
      // wait a short moment instead of immediately making you "not admin"
      if (!bearer) {
        startLoading();

        tokenWaitTimer = setTimeout(() => {
          // after waiting, if still no token -> treat as not admin (prevents infinite loading)
          const stillNoToken = !safeStr(token).trim();
          if (stillNoToken) finish(false);
        }, TOKEN_WAIT_MS);

        return;
      }

      // 4) Token exists -> do admin check
      startLoading();

      // Hard timeout so request can’t hang forever
      hardTimeoutTimer = setTimeout(() => {
        if (cancelSource) cancelSource.cancel('ADMIN_CHECK_HARD_TIMEOUT');
        // if cancelSource not available, still end loading safely
        finish(false);
      }, ADMIN_CHECK_HARD_TIMEOUT_MS);

      try {
        await api.get(ADMIN_CHECK_ENDPOINT, {
          headers: { Authorization: `Bearer ${bearer}` },
          // for axios that supports cancelToken
          ...(cancelSource ? { cancelToken: cancelSource.token } : {}),
        });

        // If backend returns 200 => admin
        if (alive) {
          clearTimeout(hardTimeoutTimer);
          finish(true);
        }
      } catch (err) {
        if (!alive) return;

        clearTimeout(hardTimeoutTimer);

        // axios cancel
        if (axios.isCancel && axios.isCancel(err)) {
          // canceled (navigation/unmount/timeout) => already finished above or will finish in cleanup
          finish(false);
          return;
        }

        const status = err?.response?.status;

        // 401/403 => not admin
        if (status === 401 || status === 403) {
          finish(false);
          return;
        }

        // Any other error => treat as not admin (safe default)
        // (You can change this to keep pending if you prefer.)
        // eslint-disable-next-line no-console
        console.error('Admin check failed:', err);
        finish(false);
      }
    };

    checkAdmin();

    return () => {
      alive = false;

      if (tokenWaitTimer) clearTimeout(tokenWaitTimer);
      if (hardTimeoutTimer) clearTimeout(hardTimeoutTimer);

      if (cancelSource) {
        try {
          cancelSource.cancel('AuthProvider unmounted');
        } catch {
          // ignore
        }
      }
    };
  }, [isLoading, user?.email, token]);

  const value = useMemo(() => {
    return {
      user,
      isLoading,
      token,
      isAdmin, // true/false/null
      isAdminLoading,
      signInUsingGoogle,
      logOut,
    };
  }, [user, isLoading, token, isAdmin, isAdminLoading, signInUsingGoogle, logOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
