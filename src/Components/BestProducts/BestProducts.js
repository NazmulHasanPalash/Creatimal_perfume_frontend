// BestProducts.jsx
// @flow strict

import React, { useEffect } from 'react';
import './BestProducts.css';

function BestProducts() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const elements = document.querySelectorAll('.fade-on-scroll');
    if (!elements.length) return;

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
    <section className="best-products-section" id="products">
      <div className="container-inner">
        <header className="bp-header fade-on-scroll">
          <h1 className="category-title">Best Products</h1>
          <h2 className="fregnance-title">Best Sellers Products</h2>
          <p className="description-style">
            The stylish and organized perfume products crafted for every mood and moment.
          </p>
        </header>

        <div className="row row-cols-1 row-cols-md-3 g-5 w-100 mx-auto cards-grid">
          {/* Card 1 */}
          <div className="col fade-on-scroll product-card">
            <article className="card premium-card">
              <div className="image-wrapper">
                <img
                  src="image/product_image/confident.jpg"
                  className="card-img-top"
                  alt="Confident perfume bottle"
                  loading="lazy"
                />
              </div>
              <div className="card-body">
                <h5 className="card-title">Confident</h5>
                <p className="card-text">
                  A bold and empowering scent that leaves a lasting impression.
                </p>
                <div className="product-meta">
                  <span className="product-quantity">30 ml</span>
                  <span className="product-price">RM 60</span>
                </div>
                <button type="button" className="btn-buy-now">
                  Buy Now
                </button>
              </div>
            </article>
          </div>

          {/* Card 2 */}
          <div className="col fade-on-scroll product-card">
            <article className="card premium-card">
              <div className="image-wrapper">
                <img
                  src="image/product_image/exquisite.jpg"
                  className="card-img-top"
                  alt="Exquisite perfume bottle"
                  loading="lazy"
                />
              </div>
              <div className="card-body">
                <h5 className="card-title">Exquisite</h5>
                <p className="card-text">
                  A refined blend of floral and woody notes for special moments.
                </p>
                <div className="product-meta">
                  <span className="product-quantity">30 ml</span>
                  <span className="product-price">RM 60</span>
                </div>
                <button type="button" className="btn-buy-now">
                  Buy Now
                </button>
              </div>
            </article>
          </div>

          {/* Card 3 */}
          <div className="col fade-on-scroll product-card">
            <article className="card premium-card">
              <div className="image-wrapper">
                <img
                  src="image/product_image/fresh.jpg"
                  className="card-img-top"
                  alt="Fresh perfume bottle"
                  loading="lazy"
                />
              </div>
              <div className="card-body">
                <h5 className="card-title">Fresh</h5>
                <p className="card-text">
                  Light, clean, and energizing — perfect for daily wear.
                </p>
                <div className="product-meta">
                  <span className="product-quantity">30 ml</span>
                  <span className="product-price">RM 60</span>
                </div>
                <button type="button" className="btn-buy-now">
                  Buy Now
                </button>
              </div>
            </article>
          </div>

          {/* Card 4 */}
          <div className="col fade-on-scroll product-card">
            <article className="card premium-card">
              <div className="image-wrapper">
                <img
                  src="image/product_image/passion.jpg"
                  className="card-img-top"
                  alt="Passion perfume bottle"
                  loading="lazy"
                />
              </div>
              <div className="card-body">
                <h5 className="card-title">Passion</h5>
                <p className="card-text">
                  Warm and intense notes that spark emotion and desire.
                </p>
                <div className="product-meta">
                  <span className="product-quantity">30 ml</span>
                  <span className="product-price">RM 60</span>
                </div>
                <button type="button" className="btn-buy-now">
                  Buy Now
                </button>
              </div>
            </article>
          </div>

          {/* Card 5 */}
          <div className="col fade-on-scroll product-card">
            <article className="card premium-card">
              <div className="image-wrapper">
                <img
                  src="image/product_image/relax.jpg"
                  className="card-img-top"
                  alt="Relax perfume bottle"
                  loading="lazy"
                />
              </div>
              <div className="card-body">
                <h5 className="card-title">Relax</h5>
                <p className="card-text">
                  Soft, calming accords to help you unwind with elegance.
                </p>
                <div className="product-meta">
                  <span className="product-quantity">30 ml</span>
                  <span className="product-price">RM 60</span>
                </div>
                <button type="button" className="btn-buy-now">
                  Buy Now
                </button>
              </div>
            </article>
          </div>

          {/* Card 6 */}
          <div className="col fade-on-scroll product-card">
            <article className="card premium-card">
              <div className="image-wrapper">
                <img
                  src="image/product_image/steady.jpg"
                  className="card-img-top"
                  alt="Steady perfume bottle"
                  loading="lazy"
                />
              </div>
              <div className="card-body">
                <h5 className="card-title">Steady</h5>
                <p className="card-text">
                  A balanced, long-lasting fragrance for everyday confidence.
                </p>
                <div className="product-meta">
                  <span className="product-quantity">30 ml</span>
                  <span className="product-price">RM 60</span>
                </div>
                <button type="button" className="btn-buy-now">
                  Buy Now
                </button>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BestProducts;
