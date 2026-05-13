// Header.jsx
// @flow strict

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './Header.css';
import { HashLink } from 'react-router-hash-link';
import { useHistory } from 'react-router-dom';
import axios from 'axios';

import useFirebase from '../../Components/Hooks/useFirebase';

const API_BASE = 'https://creatimal-charmon-perfume-backend.vercel.app';

// Backend route you already have (admin-only). We use it to detect admin:
// - If request succeeds => admin
// - If 401/403 => not admin
const LIST_ADMINS_ENDPOINT = '/admins';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

function safeStr(v) {
  return v === null || v === undefined ? '' : String(v);
}

const Header = () => {
  const history = useHistory();

  const {
    user = null,
    logout,
    logOut,
    signOutUser,
    signOut: signOutFn,
  } = useFirebase() || {};

  const effectiveLogout = logout || logOut || signOutUser || signOutFn;

  // Admin detection state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  const myEmail = useMemo(() => safeStr(user?.email).trim(), [user]);

  /* =========================
     Detect admin (frontend UI only)
     IMPORTANT: This is only for showing/hiding menu items.
     Backend MUST still enforce admin on protected routes.
     ========================= */
  useEffect(() => {
    let alive = true;

    async function checkAdmin() {
      setAdminLoading(true);
      setIsAdmin(false);

      try {
        if (!user?.email) {
          if (alive) {
            setIsAdmin(false);
            setAdminLoading(false);
          }
          return;
        }

        // Try cached result to reduce requests
        const cacheKey = `isAdmin:${safeStr(user.email).toLowerCase()}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached === 'true') {
          if (alive) {
            setIsAdmin(true);
            setAdminLoading(false);
          }
          return;
        }
        if (cached === 'false') {
          if (alive) {
            setIsAdmin(false);
            setAdminLoading(false);
          }
          return;
        }

        const token =
          typeof user.getIdToken === 'function' ? await user.getIdToken(true) : '';

        if (!token) {
          if (alive) {
            setIsAdmin(false);
            setAdminLoading(false);
          }
          return;
        }

        // This endpoint is admin-only in your backend.
        // If it succeeds -> admin. If 403/401 -> not admin.
        await api.get(LIST_ADMINS_ENDPOINT, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (alive) {
          setIsAdmin(true);
          sessionStorage.setItem(cacheKey, 'true');
          setAdminLoading(false);
        }
      } catch (err) {
        const status = err?.response?.status;

        // 401/403 => not admin (expected for normal users)
        if (alive) {
          setIsAdmin(false);

          if (user?.email) {
            const cacheKey = `isAdmin:${safeStr(user.email).toLowerCase()}`;
            sessionStorage.setItem(cacheKey, 'false');
          }

          setAdminLoading(false);
        }

        // Optional debug:
        // if (status !== 401 && status !== 403) console.error('Admin check failed:', err);
        void status;
      }
    }

    checkAdmin();

    return () => {
      alive = false;
    };
  }, [user]);

  const handleLogout = useCallback(async () => {
    try {
      if (typeof effectiveLogout !== 'function') {
        // eslint-disable-next-line no-console
        console.error(
          '[Header] Logout function not found. Your hook must return logout() or logOut().'
        );
        return;
      }

      // Clear admin cache for this email (optional cleanup)
      if (myEmail) {
        sessionStorage.removeItem(`isAdmin:${myEmail.toLowerCase()}`);
      }

      await effectiveLogout();
      history.push('/login');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Logout failed:', err);
    }
  }, [effectiveLogout, history, myEmail]);

  return (
    <header className="header-wrapper w-100">
      <nav className="navbar navbar-expand-lg header-style">
        <div className="container header-inner">
          {/* Brand / Logo */}
          <HashLink className="navbar-brand d-flex align-items-center header-brand" to="/home#home">
            <span className="header-brand-text">CHARMON</span>
          </HashLink>

          {/* Toggler button (mobile) */}
          <button
            className="navbar-toggler header-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="header-toggler-icon" />
          </button>

          {/* Collapsible content */}
          <div className="collapse navbar-collapse" id="mainNavbar">
            {/* Center nav links */}
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 header-nav-links">
              <li className="nav-item">
                <HashLink className="nav-link header-link" to="/home#home">
                  Home
                </HashLink>
              </li>

              <li className="nav-item">
                <HashLink className="nav-link header-link" to="/products">
                  Products
                </HashLink>
              </li>

              {/* ✅ Admin-only: Add Products */}
              {!adminLoading && isAdmin ? (
                <li className="nav-item">
                  <HashLink className="nav-link header-link" to="/addProducts">
                    Add Products
                  </HashLink>
                </li>
              ) : null}

              <li className="nav-item">
                <HashLink className="nav-link header-link" to="/myOrders">
                  My Orders
                </HashLink>
              </li>

              {/* ✅ Admin-only: Customer Orders */}
              {!adminLoading && isAdmin ? (
                <li className="nav-item">
                  <HashLink className="nav-link header-link" to="/customerOrders">
                    Customer Orders
                  </HashLink>
                </li>
              ) : null}

              <li className="nav-item">
                <HashLink className="nav-link header-link" to="/blog">
                  Blog
                </HashLink>
              </li>

              <li className="nav-item">
                <HashLink className="nav-link header-link" to="/about">
                  About Us
                </HashLink>
              </li>

              <li className="nav-item">
                <HashLink className="nav-link header-link" to="/contact">
                  Contact Us
                </HashLink>
              </li>

              {/* ✅ Admin-only: Admin page */}
              {!adminLoading && isAdmin ? (
                <li className="nav-item">
                  <HashLink className="nav-link header-link" to="/admin">
                    Admin
                  </HashLink>
                </li>
              ) : null}
            </ul>

            {/* Right-side CTA + Auth */}
            <div className="d-flex align-items-center header-right">
              <HashLink to="/home#products" className="btn header-cta-btn">
                Shop Now
              </HashLink>

              {/* Premium Auth area */}
              <div className="ms-3 d-flex align-items-center gap-2">
                {user?.email ? (
                  <>
                    <span className="tcs-auth-badge" title={user?.email}>
                      {String(user?.displayName || 'Account')}
                    </span>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="tcs-auth-btn tcs-auth-btn--ghost"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <HashLink to="/login" className="tcs-auth-btn tcs-auth-btn--solid">
                    Login
                  </HashLink>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
