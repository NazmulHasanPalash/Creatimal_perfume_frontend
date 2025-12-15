// @flow strict

import * as React from 'react';
import './ContactFirstBanner.css';

function ContactFirstBanner() {
  return (
    <div className="contact-first-banner-wrapper">
      <div className="card text-bg-dark contact-first-banner-card">
        <div className="contact-first-banner-glow" />

        <img
          src="image\perfume\p-12.png"
          className="card-img contact-first-banner-image"
          alt="Charmon perfume bottle"
        />

        <div className="card-img-overlay contact-first-banner-overlay">
          <div className="contact-first-banner-content">
            <span className="contact-first-banner-chip">Contact</span>
            <h5 className="card-title contact-first-banner-title">Charmon</h5>
            <p className="contact-first-banner-text">
              Share your vision with us — from signature scents to event
              collections, we craft perfume experiences that feel intimate,
              luxurious, and unforgettable.
            </p>
            <button
              type="button"
              className="contact-first-banner-cta"
              onClick={() => {
                const el = document.querySelector('#contacts');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Let&apos;s Talk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactFirstBanner;
