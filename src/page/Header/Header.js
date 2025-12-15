// Header.jsx
// @flow strict

import React, { useCallback } from 'react';
import './Header.css';
import { HashLink } from 'react-router-hash-link';
import { useHistory } from 'react-router-dom';

import useFirebase from '../../Components/Hooks/useFirebase';

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

  const handleLogout = useCallback(async () => {
    try {
      if (typeof effectiveLogout !== 'function') {
        console.error(
          '[Header] Logout function not found. Your hook must return logout() or logOut().'
        );
        return;
      }

      await effectiveLogout();
      history.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }, [effectiveLogout, history]);

  return (
    <header className="header-wrapper w-100">
      <nav className="navbar navbar-expand-lg header-style">
        <div className="container header-inner">
          {/* Brand / Logo */}
          <HashLink
            className="navbar-brand d-flex align-items-center header-brand"
            to="/home#home"
          >
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

              <li className="nav-item">
                <HashLink className="nav-link header-link" to="/addProducts">
                  Add Products
                </HashLink>
              </li>
              <li className="nav-item">
                <HashLink className="nav-link header-link" to="/customerOrders">
                  Customer Orders
                </HashLink>
              </li>

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
                    {/* Optional: small user badge (premium minimal) */}
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
