// @flow strict

import * as React from 'react';
import './AboutSecondBanner.css';

function AboutSecondBanner() {
  return (
    <section className="about-second">
      <div className="about-second-card">
        <div className="about-second-glow" />

        <div className="about-second-inner">
          {/* Left: Main perfume image */}
          <div className="about-second-image-wrap">
            <div className="about-second-image-border">
              <img
                src="image/perfume/p-9.png"
                className="about-second-image"
                alt="Elegant perfume bottle"
              />
            </div>
          </div>

          {/* Right: Text & categories */}
          <div className="about-second-content">
            <h2 className="about-second-title">Essence of Simplicity</h2>

            <p className="about-second-text">
              A modern fragrance crafted for quiet confidence. Clean lines, soft
              warmth, and a scent that feels effortlessly refined — perfect for
              both everyday moments and special evenings.
            </p>

            <p className="about-second-text-muted">
              Each bottle is blended in small batches, creating a balanced,
              long-lasting trail wrapped in a minimalist, luxurious design.
            </p>

            <div className="about-second-divider" />

            <div className="about-second-categories">
              <p className="about-second-categories-label">
                Discover our fragrance families
              </p>

              <div className="row row-cols-1 row-cols-md-4 g-4 w-100 mx-auto category-grid">
                <div className="col category-card">
                  <article className="card category-premium-card h-100">
                    <div className="category-image-wrapper">
                      <img
                        src="image/category/category-1.png"
                        className="card-img-top"
                        alt="Fresh Fragrances"
                      />
                    </div>
                    <div className="card-body">
                      <h5 className="category-title">Fresh</h5>
                      <p className="category-subtitle">Crisp & uplifting</p>
                    </div>
                  </article>
                </div>

                <div className="col category-card">
                  <article className="card category-premium-card h-100">
                    <div className="category-image-wrapper">
                      <img
                        src="image/category/category-2.png"
                        className="card-img-top"
                        alt="Woody Fragrances"
                      />
                    </div>
                    <div className="card-body">
                      <h5 className="category-title">Woody</h5>
                      <p className="category-subtitle">Warm & grounding</p>
                    </div>
                  </article>
                </div>

                <div className="col category-card">
                  <article className="card category-premium-card h-100">
                    <div className="category-image-wrapper">
                      <img
                        src="image/category/category-3.png"
                        className="card-img-top"
                        alt="Oceanic Fragrances"
                      />
                    </div>
                    <div className="card-body">
                      <h5 className="category-title">Oceanic</h5>
                      <p className="category-subtitle">Clean & airy</p>
                    </div>
                  </article>
                </div>

                <div className="col category-card">
                  <article className="card category-premium-card h-100">
                    <div className="category-image-wrapper">
                      <img
                        src="image/category/category-4.png"
                        className="card-img-top"
                        alt="Floral Fragrances"
                      />
                    </div>
                    <div className="card-body">
                      <h5 className="category-title">Floral</h5>
                      <p className="category-subtitle">Soft & romantic</p>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutSecondBanner;
