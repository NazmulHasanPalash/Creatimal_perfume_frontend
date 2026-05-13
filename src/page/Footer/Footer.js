// src/components/Footer/Footer.jsx

import React from 'react';
import './Footer.css';

const Footer = () => {
  const year = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <footer className="cf-footer" role="contentinfo">
      <div className="cf-container w-100">

        <div className="cf-card w-100">

          {/* subtle glow */}
          <div className="cf-glow" aria-hidden="true" />

          {/* =========================
              Main Grid
          ========================= */}
          <div className="cf-grid">

            {/* Brand */}
            <div className="cf-col">
              <div className="cf-brand">
                <span className="cf-dot" aria-hidden="true" />
                <span className="cf-name">Creatimal</span>
              </div>

              <p className="cf-tagline">
                Perfume • Elegance • Identity
              </p>

              <p className="cf-desc">
                A refined fragrance house crafting minimalist,
                modern scents inspired by timeless luxury.
              </p>
            </div>

            {/* Navigation */}
            <div className="cf-col">
              <h3 className="cf-title">Explore</h3>

              <a className="cf-link" href="/">Home</a>
              <a className="cf-link" href="/products">Collection</a>
              <a className="cf-link" href="/about">About</a>
              <a className="cf-link" href="/contact">Contact</a>
            </div>

            {/* Contact */}
            <div className="cf-col">
              <h3 className="cf-title">Contact</h3>

              <p className="cf-text">creatimal.hub@gmail.com</p>
              <p className="cf-text">+6011-73003929</p>
              <p className="cf-text">Kuala Lumpur, Malaysia</p>
            </div>
          </div>

          {/* =========================
              Bottom Bar
          ========================= */}
          <div className="cf-bottom">
            <p className="cf-copy text-center">
              © {year} Creatimal. All rights reserved.
            </p>

            <button
              className="cf-topBtn"
              onClick={scrollToTop}
              aria-label="Back to top"
              type="button"
            >
              ↑
            </button>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;