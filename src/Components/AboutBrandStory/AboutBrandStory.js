// @flow strict

import * as React from 'react';
import './AboutBrandStory.css';

function AboutBrandStory() {
  return (
    <section className="brand-story-section">
      <div className="brand-story-shell">
        {/* Left: Image & abstract shape */}
        <div className="brand-story-media">
          <div className="brand-story-orbit" />
          <figure className="brand-story-photo">
            <img
              src="image/perfume/p-11.png"
              className="brand-story-image"
              alt="Charmon perfume bottle"
            />
          </figure>
        </div>

        {/* Right: Text */}
        <div className="brand-story-copy">
          <p className="brand-story-tag">Brand Story</p>
          <h2 className="brand-story-heading">
            A scent that changed everything.
          </h2>
          <p className="brand-story-body">
            Charmon began with someone who never wore perfume—until one soft
            rose aroma quietly shifted her mood and made life feel lighter. She
            discovered fragrance isn&apos;t a mask for others, but a simple
            ritual for herself. Now, Charmon creates mindful scents that let you
            feel calm, confident, and completely you.
          </p>
        </div>
      </div>
    </section>
  );
}

export default AboutBrandStory;
