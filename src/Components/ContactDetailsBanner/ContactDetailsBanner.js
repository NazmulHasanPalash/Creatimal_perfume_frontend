// @flow strict

import * as React from 'react';
import './ContactDetailsBanner.css';

function ContactDetailsBanner() {
  return (
    <div className="contact-details-banner-wrapper">
      <div className="row row-cols-1 row-cols-md-3 g-4 contact-details-row">
        {/* Address Card */}
        <div className="col">
          <div className="card h-100 contact-details-card">
            <div className="card-body">
              <div className="contact-details-icon-pill">
                <i
                  className="fas fa-map-marker-alt contact-details-icon"
                  aria-hidden="true"
                />
              </div>
              <h5 className="card-title contact-details-title">
                Visit Our Studio
              </h5>
              <p className="card-text contact-details-text">
                Charmon Perfumes Studio
                <br />
                Level 12
                <br />
                Kuala Lumpur, Malaysia
              </p>
              <p className="card-text contact-details-note">
                By appointment only — curated for a calm, private scent
                experience.
              </p>
            </div>
          </div>
        </div>

        {/* Email Card */}
        <div className="col">
          <div className="card h-100 contact-details-card">
            <div className="card-body">
              <div className="contact-details-icon-pill">
                <i
                  className="far fa-envelope-open contact-details-icon"
                  aria-hidden="true"
                />
              </div>
              <h5 className="card-title contact-details-title">
                Email &amp; Support
              </h5>
              <p className="card-text contact-details-text">
                For collaborations, bulk orders or private label projects:
              </p>
              <p className="card-text contact-details-highlight">
                <a
                  href="mailto:creatimal.hub@gmail.com"
                  className="contact-details-link"
                >
                  creatimal.hub@gmail.com
                </a>
              </p>
              <p className="card-text contact-details-note">
                We usually respond within 1–2 business days.
              </p>
            </div>
          </div>
        </div>

        {/* Phone / WhatsApp Card */}
        <div className="col">
          <div className="card h-100 contact-details-card">
            <div className="card-body">
              <div className="contact-details-icon-pill">
                <i
                  className="fas fa-phone-alt contact-details-icon"
                  aria-hidden="true"
                />
              </div>
              <h5 className="card-title contact-details-title">
                Call or WhatsApp
              </h5>
              <p className="card-text contact-details-text">
                Speak with our fragrance concierge for quick enquiries:
              </p>
              <p className="card-text contact-details-highlight">
                <a href="tel:+6011-73003929" className="contact-details-link">
                  +6011-73003929
                </a>
              </p>
              <p className="card-text contact-details-note">
                Mon–Fri, 10:00–18:00 (MYT)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactDetailsBanner;
