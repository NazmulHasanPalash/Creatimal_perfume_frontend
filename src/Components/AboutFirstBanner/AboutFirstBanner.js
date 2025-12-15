// @flow strict

import * as React from 'react';
import './AboutFirstBanner.css';

function AboutFirstBanner() {
  return (
    <section className="about-banner">
      <div className="about-banner-card">
        <div className="about-banner-glow" />

        <div className="about-banner-image-shell">
          <div className="about-banner-image-border">
            <img
              src="image/perfume/p-5.png"
              className="about-banner-image"
              alt="Premium perfume bottle"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutFirstBanner;
