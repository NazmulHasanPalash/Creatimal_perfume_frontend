// Features.jsx
// @flow strict

import * as React from 'react';
import './Features.css';

function Features() {
  return (
    <section className="features-wrapper">
      <div className="card mb-3 features-card">
        <div className="row g-0 align-items-center">
          {/* Text side */}
          <div className="col-md-6">
            <div className="card-body features-content">
              <span className="features-eyebrow">Our Features</span>

              <h2 className="features-kicker">Crafted With Intent</h2>

              <h3 className="features-title">
                Only High Quality is the Core Value For Us
              </h3>

              <p className="features-text">
                At Creatimal, every detail is filtered through a single
                question: <strong>is it truly worthy of your skin?</strong> From
                the first drop of essence to the final bottle, each perfume is
                crafted to feel refined, modern, and effortlessly elegant.
              </p>

              <div className="features-chip-row">
                <span className="features-chip">Premium Ingredients</span>
                <span className="features-chip">Refined Formulations</span>
                <span className="features-chip">Timeless Aesthetics</span>
              </div>

              <p className="features-text features-text-small">
                Create premium perfumes that deliver a delightful sensory
                experience — 让香水成为表达个性与自信的工具
                <br />
                Make perfume a tool for expressing personality and confidence —
                支持合作伙伴与创业者，将热爱转化为事业
                <br />
                Support partners and entrepreneurs to turn passion into a
                lasting business.
              </p>
            </div>
          </div>

          {/* Image side */}
          <div className="col-md-6">
            <div className="features-image-wrapper">
              <div className="features-image-shell">
                <img
                  src="/image/perfume/p-8.png"
                  className="img-fluid features-image"
                  alt="Premium quality perfume bottle"
                />
                <div className="features-image-glow" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Features;
