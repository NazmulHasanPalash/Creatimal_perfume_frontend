// @flow strict

import * as React from 'react';
import './AboutOppurtunity.css';

function AboutOppurtunity() {
  return (
    <div className="about-opportunity-section">
      <div className="card mb-3 about-opportunity-card">
        {/* Keep the same basic structure: card > img + card-body */}
        <img
          src="image\perfume\p-4.png"
          className="card-img-top about-opportunity-image"
          alt="Charmon perfume bottle"
        />
        <div className="card-body about-opportunity-body">
          <h5 className="card-title about-opportunity-title">Opportunities</h5>

          <p className="card-text about-opportunity-text">
            Charmon Perfumes unlocks elegant business opportunities for
            fragrance lovers. Build a refined brand presence and grow your
            income with a product that feels truly premium and timeless.
          </p>

          <div className="card-text about-opportunity-join">
            <span className="about-opportunity-label">Join us</span>
            <ul className="about-opportunity-list">
              <li>Become an official Charmon agent or entrepreneur.</li>
              <li>
                Launch your own perfume line with full technical and
                supply-chain support.
              </li>
              <li>
                Receive professional training in branding, sales and marketing.
              </li>
              <li>
                Access curated marketing materials to grow both online and
                offline.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutOppurtunity;
