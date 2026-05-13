// src/pages/Blog/Blog.jsx
import React, { useMemo } from 'react';
import './Blog.css';

const Blog = () => {
  // ✅ Put image here: public/image/perfume/p-4.png
  const heroImg = '/image/perfume/p-4.png';

  const year = new Date().getFullYear();
  const readingTime = useMemo(() => '4 min read', []);

  return (
    <main className="cp-blogPage">
      <header className="cp-hero">
        <div className="cp-shell">
          <div className="cp-heroGrid">
            <div className="cp-heroText">
              <div className="cp-kicker">Charmon Journal</div>
              <h1 className="cp-title">Charmon Perfume: Quiet Luxury, Crafted in Every Note</h1>
              <p className="cp-subtitle">
                A modern fragrance story built around clean ingredients, balanced composition, and a premium
                everyday signature.
              </p>

              <div className="cp-meta">
                <span className="cp-pill">{readingTime}</span>
                <span className="cp-dot" aria-hidden="true" />
                <span className="cp-metaText">Updated {year}</span>
              </div>
            </div>

            <div className="cp-heroMedia" aria-label="Charmon perfume hero image">
              <div className="cp-mediaCard">
                <img className="cp-heroImg" src={heroImg} alt="Charmon perfume bottle" loading="lazy" />
                <div className="cp-mediaGlow" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="cp-content">
        <div className="cp-shell">
          <article className="cp-article">
            <p className="cp-lede">
              Charmon is designed for people who prefer elegance over noise. Instead of overpowering sweetness
              or heavy smoke, the profile focuses on a smooth, confident trail—clean at the opening, warm in the
              heart, and softly addictive on the dry-down.
            </p>

            <div className="cp-divider" role="separator" />

            <h2 className="cp-h2">What makes Charmon feel premium?</h2>
            <p className="cp-p">
              A premium scent isn’t only about strength—it’s about balance. Charmon is built with a clear
              structure so each layer arrives with intention. The opening feels bright and polished, the heart
              becomes creamy and comforting, and the base settles into a refined skin-scent that lasts.
            </p>

            <div className="cp-cards">
              <div className="cp-card">
                <div className="cp-cardTitle">The First Impression</div>
                <p className="cp-cardText">
                  A crisp, clean opening that feels freshly tailored—perfect for daytime confidence and
                  professional settings.
                </p>
              </div>

              <div className="cp-card">
                <div className="cp-cardTitle">The Heart</div>
                <p className="cp-cardText">
                  A smooth, slightly warm middle that stays elegant—never too sharp, never too sweet.
                </p>
              </div>

              <div className="cp-card">
                <div className="cp-cardTitle">The Dry-Down</div>
                <p className="cp-cardText">
                  A soft, lingering base that feels expensive up close. The kind of scent people notice when
                  they’re near—not across the room.
                </p>
              </div>
            </div>

            <h2 className="cp-h2">How to wear Charmon</h2>
            <p className="cp-p">
              If you want a signature that fits any occasion, apply lightly and let the scent do the work. For
              best performance, moisturize skin first (unscented lotion), then spray once or twice on pulse
              points.
            </p>

            <ul className="cp-list">
              <li>
                <b>Office / Class:</b> 1–2 sprays (neck or inner elbow). Clean, controlled projection.
              </li>
              <li>
                <b>Date night:</b> 2–3 sprays (neck + chest). Warmer trail, more presence.
              </li>
              <li>
                <b>Hot weather:</b> 1–2 sprays max. Less is more to keep it airy and premium.
              </li>
            </ul>

           

            <footer className="cp-footer">
              <div className="cp-footerLeft">
                <div className="cp-footerTitle">Charmon Perfume</div>
                <div className="cp-footerSub">Premium • Minimal • Crafted</div>
              </div>
              <div className="cp-footerRight">
                <span className="cp-footerPill">Quiet luxury</span>
                <span className="cp-footerPill">Everyday signature</span>
              </div>
            </footer>
          </article>
        </div>
      </section>
    </main>
  );
};

export default Blog;
