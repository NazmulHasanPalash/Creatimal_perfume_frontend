// Contacts.jsx

import React from 'react';
import './Contacts.css';

const Contacts = () => {
  return (
    <section className="contacts-section" id="contacts">
      <div className="card contacts-card shadow-lg">
        <div className="row g-0 align-items-stretch">
          {/* Info side */}
          <div className="col-md-5 contacts-info-col">
            <div className="contacts-info">
              <span className="contacts-pill">Contact Us</span>

              <h1 className="contacts-title">
                Keep In <span className="contacts-title-accent">Touch</span>
              </h1>

              <p className="contacts-subtitle">
                We&apos;d love to hear from you. Share your ideas, questions, or
                collaboration plans — we&apos;ll respond as soon as we can.
              </p>

              <div className="contacts-details">
                <p className="contacts-detail-item">
                  <i className="far fa-envelope contacts-icon" />
                  <span>Email</span>
                  <strong>creatimal.hub@gmail.com</strong>
                </p>
                <p className="contacts-detail-item">
                  <i className="fas fa-phone-square-alt contacts-icon" />
                  <span>Mobile</span>
                  <strong>+6011-73003929</strong>
                </p>
              </div>

              <div className="contacts-note">
                Prefer email? Use the form — it will open your mail app with
                your message ready to send.
              </div>
            </div>
          </div>

          {/* Form side */}
          <div className="col-md-7 contacts-form-col">
            <form
              className="contacts-form"
              action="mailto:creatimal.hub@gmail.com"
              method="post"
              encType="text/plain"
            >
              <h2 className="contacts-form-title">Contact</h2>

              <div className="contacts-field">
                <input
                  className="contacts-input"
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  required
                />
              </div>

              <div className="contacts-field">
                <input
                  className="contacts-input"
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  required
                />
              </div>

              <div className="contacts-field">
                <textarea
                  className="contacts-textarea"
                  name="message"
                  placeholder="Your Message"
                  rows="4"
                  required
                />
              </div>

              <div className="contacts-actions">
                <button
                  type="submit"
                  className="contacts-btn contacts-btn-primary"
                >
                  Send
                </button>
                <button
                  type="reset"
                  className="contacts-btn contacts-btn-ghost"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contacts;
