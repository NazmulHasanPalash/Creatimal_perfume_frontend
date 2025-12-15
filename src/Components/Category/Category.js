// Category.jsx
// @flow strict

import React, { useEffect } from 'react';
import './Category.css';

function Category() {
  useEffect(() => {
    // Safety for environments without window/document (SSR, etc.)
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const elements = document.querySelectorAll('.fade-on-scroll');

    // Fallback: if IntersectionObserver not supported, just show all
    if (!('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('in-view'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target;
          if (entry.isIntersecting) {
            target.classList.add('in-view');
            target.classList.remove('out-of-view');
          } else {
            target.classList.remove('in-view');
            target.classList.add('out-of-view');
          }
        });
      },
      { threshold: 0.2 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="category-section fade-on-scroll">
      <div className="category-container">
        <h1 className="category-title">Signature Categories</h1>
        <h2 className="fregnance-title">Fragrance Moods for Every Moment</h2>
        <p className="description-style">
          Discover curated scent profiles crafted to feel luxurious, last longer,
          and leave a memorable trail—made for everyday confidence and special
          nights alike.
        </p>

        <div className="row row-cols-1 row-cols-md-4 g-4 w-100 mx-auto category-grid">
          <div className="col fade-on-scroll category-card">
            <article className="card category-premium-card h-100">
              <div className="category-image-wrapper">
                <img
                  src="image/category/long lasting.png"
                  className="card-img-top"
                  alt="Long Lasting"
                />
              </div>
              <div className="card-body">
                <h5 className="card-title">Long Lasting</h5>
                <p className="card-text">
                  Built for all-day wear—clean openings, smooth heart notes, and
                  a rich base that stays on skin and clothing with a confident,
                  premium finish.
                </p>
              </div>
            </article>
          </div>

          <div className="col fade-on-scroll category-card">
            <article className="card category-premium-card h-100">
              <div className="category-image-wrapper">
                <img
                  src="image/category/natural spices.png"
                  className="card-img-top"
                  alt="Natural Spices"
                />
              </div>
              <div className="card-body">
                <h5 className="card-title">Natural Spices</h5>
                <p className="card-text">
                  Warm, magnetic, and bold—notes of pepper, cardamom, and amber
                  bring depth and character for evenings, events, and statement
                  moments.
                </p>
              </div>
            </article>
          </div>

          <div className="col fade-on-scroll category-card">
            <article className="card category-premium-card h-100">
              <div className="category-image-wrapper">
                <img
                  src="image/category/no irritate.png"
                  className="card-img-top"
                  alt="Skin-Friendly"
                />
              </div>
              <div className="card-body">
                <h5 className="card-title">Skin-Friendly</h5>
                <p className="card-text">
                  Designed for comfort—soft, balanced blends that feel gentle on
                  skin while still projecting beautifully. Luxury that you can
                  wear with ease.
                </p>
              </div>
            </article>
          </div>

          <div className="col fade-on-scroll category-card">
            <article className="card category-premium-card h-100">
              <div className="category-image-wrapper">
                <img
                  src="image/category/steady aroma.png"
                  className="card-img-top"
                  alt="Steady Aroma"
                />
              </div>
              <div className="card-body">
                <h5 className="card-title">Steady Aroma</h5>
                <p className="card-text">
                  Smooth and consistent projection—perfectly layered accords that
                  evolve slowly and stay elegant, giving you a refined scent
                  aura from day to night.
                </p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Category;
