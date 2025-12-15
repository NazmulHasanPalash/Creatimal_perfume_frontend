// FirstHomePageBanner.jsx
// @flow strict

import * as React from 'react';
import './FirstHomePageBanner.css';

function FirstHomePageBanner() {
  return (
    <section className="first-banner-wrapper w-100 mx-auto">
      <div
        id="carouselExampleRide"
        className="carousel slide carousel-fade first-banner"
        data-bs-ride="carousel"
      >
        <div className="carousel-inner">
          {/* Slide 1 */}
          <div className="carousel-item active" data-bs-interval="6000">
            <div className="first-banner-image-layer">
              <img
                src="/image/perfume/p-1.png"
                className="d-block w-100 first-banner-image"
                alt="Signature perfume collection"
              />
            </div>
            <div className="first-banner-overlay">
              <div className="first-banner-caption">
                <h2 className="first-banner-title">Elevate Every Moment</h2>
                <p className="first-banner-text">
                  Discover carefully crafted fragrances that speak your style.
                </p>
                <button
                  type="button"
                  className="first-banner-btn"
                  onClick={() => {
                    const el = document.querySelector('#products');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Explore Scents
                </button>
              </div>
            </div>
          </div>

          {/* Slide 2 */}
          <div className="carousel-item" data-bs-interval="6000">
            <div className="first-banner-image-layer">
              <img
                src="/image/perfume/p-2.png"
                className="d-block w-100 first-banner-image"
                alt="Luxury perfume bottle close-up"
              />
            </div>
            <div className="first-banner-overlay">
              <div className="first-banner-caption">
                <h2 className="first-banner-title">
                  Minimal. Modern. Timeless.
                </h2>
                <p className="first-banner-text">
                  A curated palette of notes for those who love subtle luxury.
                </p>
                <button
                  type="button"
                  className="first-banner-btn"
                  onClick={() => {
                    const el = document.querySelector('#products');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Shop Collection
                </button>
              </div>
            </div>
          </div>

          {/* Slide 3 */}
          <div className="carousel-item" data-bs-interval="6000">
            <div className="first-banner-image-layer">
              <img
                src="/image/perfume/p-3.png"
                className="d-block w-100 first-banner-image"
                alt="Perfume arrangement with soft lighting"
              />
            </div>
            <div className="first-banner-overlay">
              <div className="first-banner-caption">
                <h2 className="first-banner-title">
                  Signature Scents, Refined
                </h2>
                <p className="first-banner-text">
                  Designed to leave a gentle, unforgettable impression.
                </p>
                <button
                  type="button"
                  className="first-banner-btn"
                  onClick={() => {
                    const el = document.querySelector('#products');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  View All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Prev / Next controls */}
        <button
          className="carousel-control-prev first-banner-control"
          type="button"
          data-bs-target="#carouselExampleRide"
          data-bs-slide="prev"
        >
          <span
            className="carousel-control-prev-icon first-banner-control-icon"
            aria-hidden="true"
          />
          <span className="visually-hidden">Previous</span>
        </button>
        <button
          className="carousel-control-next first-banner-control"
          type="button"
          data-bs-target="#carouselExampleRide"
          data-bs-slide="next"
        >
          <span
            className="carousel-control-next-icon first-banner-control-icon"
            aria-hidden="true"
          />
          <span className="visually-hidden">Next</span>
        </button>

        {/* Indicators (dots) */}
        <div className="carousel-indicators first-banner-indicators">
          <button
            type="button"
            data-bs-target="#carouselExampleRide"
            data-bs-slide-to="0"
            className="active"
            aria-current="true"
            aria-label="Slide 1"
          />
          <button
            type="button"
            data-bs-target="#carouselExampleRide"
            data-bs-slide-to="1"
            aria-label="Slide 2"
          />
          <button
            type="button"
            data-bs-target="#carouselExampleRide"
            data-bs-slide-to="2"
            aria-label="Slide 3"
          />
        </div>
      </div>
    </section>
  );
}

export default FirstHomePageBanner;
