// SubAboutSection.jsx
// @flow strict

import React, { useEffect } from 'react';
import './SubAboutSection.css';

function SubAboutSection() {
  useEffect(() => {
    // Safety for environments without window/document (SSR, etc.)
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const elements = document.querySelectorAll('.subabout-fade-on-scroll');

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
      {
        threshold: 0.2, // 20% visible
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="subabout-section subabout-fade-on-scroll">
      <div className="subabout-card shadow-sm">
        <div className="row g-0 align-items-center">
          <div className="col-md-6 subabout-fade-on-scroll subabout-text-col">
            <div className="subabout-card-body">
              <h5 className="subabout-kicker">About Charmon</h5>
              <h3 className="subabout-title">Charmon Perfume</h3>
              <p className="subabout-description">
                Charmon Perfumes is a brand specializing in premium fragrance
                creation and sales. Our unique scent compositions and
                high-quality ingredients deliver an extraordinary olfactory
                experience. Every bottle embodies creativity, elegance, and
                confidence, perfect for daily wear or special occasions.
              </p>
            </div>
          </div>

          <div className="col-md-6 subabout-fade-on-scroll subabout-image-col">
            <div className="subabout-image-wrapper">
              <img
                src="image/perfume/p-13.png"
                className="img-fluid subabout-image"
                alt="Charmon perfume bottle"
              />
              <div className="subabout-image-glow" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SubAboutSection;
