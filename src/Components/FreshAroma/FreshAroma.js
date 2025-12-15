// FreshAroma.jsx
// @flow strict

import * as React from 'react';
import './FreshAroma.css';

function FreshAroma() {
  return (
    <section className="fresh-aroma-wrapper">
      <div className="fresh-aroma-card">
        {/* Decorative gradient border glow */}
        <div className="fresh-aroma-border" />

        <div className="fresh-aroma-inner">
          {/* Image side */}
          <div className="fresh-aroma-image-layer">
            <div className="fresh-aroma-image-shell">
              <img
                src="/image/perfume/p-10.png"
                className="fresh-aroma-img"
                alt="Fresh aroma perfume bottle"
              />
              <div className="fresh-aroma-img-glow" />
            </div>
          </div>

          {/* Content side */}
          <div className="fresh-aroma-content">
            <span className="fresh-aroma-label">Perfume</span>
            <h2 className="fresh-aroma-title">Fresh Aroma</h2>
            <p className="fresh-aroma-text">
              <small>
                Fresh Aroma is crafted in small batches, blending bright citrus,
                soft florals, and smooth woods for a clean, modern scent. Each
                note is added with precision, tested on skin, and refined until
                the fragrance feels light, fresh, and effortlessly elegant all
                day.
              </small>
            </p>

            <button
              type="button"
              className="fresh-aroma-btn"
              onClick={() => {
                const el = document.querySelector('#products');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Discover Scent
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FreshAroma;
