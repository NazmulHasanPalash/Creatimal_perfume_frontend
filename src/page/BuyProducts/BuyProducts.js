// src/pages/BuyProducts/BuyProducts.js
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useHistory, useParams } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import './BuyProducts.css';

const API_BASE = String(process.env.REACT_APP_API_BASE || 'https://creatimal-charmon-perfume-backend.vercel.app')
  .trim()
  .replace(/\/+$/, '');

// ✅ Default delivery fee
const DELIVERY_FEE_RM = 7;

/* ---------------- Helpers ---------------- */
function safeStr(v) {
  return v === null || v === undefined ? '' : String(v);
}

function formatRM(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return 'RM 0';
  return `RM ${Math.round(n)}`;
}

function clampIntMin(v, min) {
  const n = Number(v);
  if (Number.isNaN(n)) return min;
  const t = Math.floor(n);
  return Math.max(min, t);
}

function getImageSrc(product) {
  const raw =
    product?.imageUrl ||
    product?.imageURL ||
    product?.image ||
    product?.img ||
    product?.photo ||
    product?.thumbnail ||
    '';

  const s = safeStr(raw).trim();
  if (!s) return '';

  if (s.startsWith('data:image/')) return s;
  if (/^https?:\/\//i.test(s)) return s;

  if (s.startsWith('/')) return `${API_BASE}${s}`;
  return `${API_BASE}/${s}`;
}

/** ✅ Treat product quantity as ML for display */
function getMlNumber(product) {
  const raw =
    product?.availableMl ??
    product?.availableML ??
    product?.ml ??
    product?.ML ??
    product?.volumeMl ??
    product?.volumeML ??
    product?.sizeMl ??
    product?.sizeML ??
    product?.quantity ??
    '';

  const n = Number(raw);
  if (Number.isNaN(n) || n <= 0) return 0;
  return Math.floor(n);
}

function getAvailableMlText(product) {
  const ml = getMlNumber(product);
  return ml > 0 ? `${ml} ml` : '—';
}

/** ✅ Phone validation: minimum 11 digits */
function countDigits(s) {
  return safeStr(s).replace(/\D/g, '').length;
}

/** ✅ DuitNow Reference No. normalization */
function normalizeDuitNowRef(v) {
  const s = safeStr(v).trim().toUpperCase();
  const cleaned = s.replace(/[^A-Z0-9/-]/g, '');
  return cleaned.slice(0, 40);
}

/* ---------------- Axios ---------------- */
const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

export default function BuyProducts() {
  const history = useHistory();
  const params = useParams();

  const rawId = params?.id ?? params?.productId ?? '';

  const productId = useMemo(() => {
    const s = safeStr(rawId).trim();
    if (!s) return '';
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  }, [rawId]);

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [product, setProduct] = useState(null);

  // Auth
  const [email, setEmail] = useState('');
  const [idToken, setIdToken] = useState('');

  // Customer fields
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [duitNowRef, setDuitNowRef] = useState('');

  // Quantity (pieces)
  const [quantity, setQuantity] = useState(1);

  /**
   * ✅ QR image MUST be here:
   * public/image/creatima_payment/doitnow_qr.jpeg
   */
  const duitNowQrSrc = useMemo(() => {
    const base = safeStr(process.env.PUBLIC_URL).trim() || '';
    return `${base}/image/creatima_payment/doitnow_qr.jpeg`;
  }, []);

  const [qrOk, setQrOk] = useState(true);

  /* =========================
     Get email + token from Auth
     ========================= */
  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, async (u) => {
      setError('');
      setInfo('');

      try {
        const userEmail = safeStr(u?.email).trim();

        if (u && userEmail && userEmail.includes('@')) {
          setEmail(userEmail);

          const token = await u.getIdToken(true);
          setIdToken(safeStr(token).trim());

          localStorage.setItem('customerEmail', userEmail);
        } else {
          setEmail('');
          setIdToken('');
          setError('You are not logged in. Please login first.');
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Auth/token error:', e);
        setEmail('');
        setIdToken('');
        setError('Failed to verify login. Please logout and login again.');
      }
    });

    return () => unsub();
  }, []);

  /* =========================
     Load product from DB
     ========================= */
  useEffect(() => {
    let mounted = true;

    async function loadProduct() {
      if (!productId) {
        if (mounted) {
          setError('Missing product id in URL.');
          setProduct(null);
        }
        return;
      }

      if (mounted) {
        setLoading(true);
        setInfo('');
        setError('');
      }

      try {
        const res = await api.get(`/products/${encodeURIComponent(productId)}`);
        const p = res?.data || null;

        if (!mounted) return;

        setProduct(p);
        setQuantity((prev) => clampIntMin(prev || 1, 1));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('BuyProducts load error:', e);
        if (!mounted) return;

        setProduct(null);
        setError(
          e?.response?.data?.message ||
          e?.message ||
          'Failed to load product from database. Ensure GET /products/:id exists.'
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      mounted = false;
    };
  }, [productId]);

  const imgSrc = useMemo(() => getImageSrc(product), [product]);
  const availableMlText = useMemo(() => getAvailableMlText(product), [product]);
  const perfumeQuantityMl = useMemo(() => getMlNumber(product), [product]);

  const unitPrice = useMemo(() => {
    const p = Number(product?.price);
    return Number.isNaN(p) ? 0 : p;
  }, [product]);

  const itemsTotal = useMemo(
    () => unitPrice * Number(quantity || 0),
    [unitPrice, quantity]
  );

  const deliveryFee = DELIVERY_FEE_RM;

  const grandTotal = useMemo(
    () => itemsTotal + deliveryFee,
    [itemsTotal, deliveryFee]
  );

  function onQtyChange(v) {
    setQuantity(clampIntMin(v, 1));
  }
  function decQty() {
    setQuantity((q) => clampIntMin((q || 1) - 1, 1));
  }
  function incQty() {
    setQuantity((q) => clampIntMin((q || 1) + 1, 1));
  }

  function validate() {
    const e = safeStr(email).trim();
    const t = safeStr(idToken).trim();
    const p = safeStr(phone).trim();
    const a = safeStr(address).trim();
    const ref = normalizeDuitNowRef(duitNowRef);

    if (!e || !e.includes('@')) return 'You are not logged in. Please login first.';
    if (!t) return 'Session token missing. Please logout and login again.';
    if (!product) return 'Product not loaded.';

    if (!p) return 'Phone number is required.';
    if (countDigits(p) < 11) return 'Phone number must be at least 11 digits.';

    if (!a || a.length < 8) return 'Delivery address is required.';
    if (!quantity || Number(quantity) < 1) return 'Quantity must be at least 1.';

    if (!ref) return 'DuitNow Reference No. is required.';
    if (ref.length < 6) return 'DuitNow Reference No. looks too short. Please check again.';

    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError('');
    setInfo('');

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    const ref = normalizeDuitNowRef(duitNowRef);

    const payload = {
      productId: safeStr(productId).trim(),
      productName: safeStr(product?.name).trim(),
      productImage: safeStr(imgSrc).trim(),

      status: 'pending',
      perfumeQuantityMl: perfumeQuantityMl || 0,
      orderQuantity: Number(quantity),

      customerPhone: safeStr(phone).trim(),
      deliveryAddress: safeStr(address).trim(),

      duitNowRefNo: ref,

      unitPrice,
      itemsTotal,
      deliveryFee,
      totalPrice: grandTotal,
      currency: 'RM',
    };

    setSubmitLoading(true);
    try {
      const token = safeStr(idToken).trim();

      const res = await api.post('/customer-orders', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      localStorage.setItem('customerEmail', safeStr(email).trim());
      setInfo('✅ Order placed successfully! Redirecting to My Orders…');

      setPhone('');
      setAddress('');
      setDuitNowRef('');
      setQuantity(1);

      const createdOrderId = safeStr(
        res?.data?.insertedId || res?.data?._id || ''
      ).trim();

      window.setTimeout(() => {
        history.push('/myOrders', { from: 'buy', createdOrderId });
      }, 700);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Order submit error:', err);

      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to place order. Make sure backend POST /customer-orders uses requireAuth and token is valid.'
      );
    } finally {
      setSubmitLoading(false);
    }
  }

  const canSubmit = !(
    submitLoading ||
    loading ||
    !product ||
    !safeStr(email).trim() ||
    !safeStr(idToken).trim()
  );

  return (
    <div className="bp-page">
      <div className="bp-shell">
        <header className="bp-header">
          <h1 className="bp-title">Checkout</h1>
          <p className="bp-subtitle">Premium • Minimal • Responsive</p>
        </header>

        {error ? <div className="bp-alert bp-alert-danger">{error}</div> : null}
        {info ? <div className="bp-alert bp-alert-success">{info}</div> : null}

        {loading ? (
          <div className="bp-loading">Loading product…</div>
        ) : !product ? (
          <div className="bp-empty">
            <p className="bp-empty-title">Product not found</p>
            <p className="bp-empty-text">
              Check route <b>/buyProduct/:id</b> and backend <b>GET /products/:id</b>.
            </p>
            <button type="button" className="bp-backBtn" onClick={() => history.goBack()}>
              ← Back
            </button>
          </div>
        ) : (
          <div className="bp-grid">
            {/* LEFT: Summary */}
            <section className="bp-card" aria-label="Product summary">
              <div className="bp-cardTop">
                <button type="button" className="bp-backBtn" onClick={() => history.goBack()}>
                  ← Back
                </button>

                <div className="bp-badgeRow">
                  <span className="bp-badge">Premium</span>
                  <span className="bp-badge bp-badge-soft">Authentic</span>
                </div>
              </div>

              <div className="bp-summary">
                <div className="bp-imageWrap">
                  {imgSrc ? (
                    <img
                      className="bp-image"
                      src={imgSrc}
                      alt={safeStr(product?.name) || 'Product'}
                      loading="lazy"
                    />
                  ) : (
                    <div className="bp-imageFallback">No Image</div>
                  )}
                </div>

                <div className="bp-summaryInfo">
                  <h2 className="bp-productName">{safeStr(product?.name) || 'Untitled'}</h2>
                  <p className="bp-productDesc">{safeStr(product?.description)}</p>

                  <div className="bp-meta">
                    <div className="bp-metaRow">
                      <span className="bp-metaKey">Price / piece</span>
                      <span className="bp-metaVal">{formatRM(unitPrice)}</span>
                    </div>

                    <div className="bp-metaRow">
                      <span className="bp-metaKey">Quantity (ml)</span>
                      <span className="bp-metaVal">{availableMlText}</span>
                    </div>

                    <div className="bp-divider" />

                    <div className="bp-metaRow">
                      <span className="bp-metaKey">Items Total</span>
                      <span className="bp-metaVal">{formatRM(itemsTotal)}</span>
                    </div>

                    <div className="bp-metaRow">
                      <span className="bp-metaKey">Delivery</span>
                      <span className="bp-metaVal">{formatRM(deliveryFee)}</span>
                    </div>

                    <div className="bp-divider" />

                    <div className="bp-metaRow bp-metaRowTotal">
                      <span className="bp-metaKey">Grand Total</span>
                      <span className="bp-metaVal bp-total">{formatRM(grandTotal)}</span>
                    </div>
                  </div>

                  {/* Payment */}

                  <div className="bp-payText">
                    <div className="bp-payTitle">Pay with DuitNow</div>

                  </div>

                  <div className="bp-qr" aria-label="DuitNow QR">
                    <img
                      className="bp-qrImg"
                      src={duitNowQrSrc}
                      alt="DuitNow QR"
                      loading="lazy"
                      onError={() => setQrOk(false)}
                    />
                    <div className="bp-qrCap">DuitNow QR</div>
                  </div>
                  <div className="bp-pay">
                    <div className="bp-payText">


                      {!qrOk ? (
                        <div className="bp-qrWarn">
                          QR image not found. Put the file in:
                          <b> public/image/creatima_payment/doitnow_qr.jpeg</b>
                        </div>
                      ) : null}
                    </div>

                    {/* ✅ QR Actions */}
                    <div className="bp-qrActions">
                      <button
                        type="button"
                        className="bp-qrBtn"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = duitNowQrSrc;
                          link.download = 'duitnow-qr.jpeg';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        Download QR
                      </button>

                      <button
                        type="button"
                        className="bp-qrBtn bp-qrBtnSecondary"
                        onClick={async () => {
                          try {
                            if (navigator.share) {
                              await navigator.share({
                                title: 'DuitNow QR',
                                text: 'Scan this QR to pay via DuitNow',
                                url: duitNowQrSrc,
                              });
                            } else {
                              await navigator.clipboard.writeText(duitNowQrSrc);
                              alert('QR link copied to clipboard');
                            }
                          } catch (err) {
                            console.error('Share failed:', err);
                          }
                        }}
                      >
                        Share QR
                      </button>
                    </div>
                  </div>

                  <div className="bp-note">
                    <span className="bp-noteDot" />
                    <span className="bp-noteText">
                      DuitNow Reference No. is <b>mandatory</b> to verify payment.
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* RIGHT: Form */}
            <section className="bp-formCard" aria-label="Order form">
              <div className="bp-formHeader">
                <h3 className="bp-formTitle">Order Details</h3>
                <p className="bp-formHint">
                  Fill in your delivery info and add your <b>DuitNow Reference No.</b> (required).
                </p>
              </div>

              <form onSubmit={handleSubmit} className="bp-form" noValidate>
                <div className="bp-field">
                  <label className="bp-label">Email (From Login)</label>
                  <input className="bp-input" type="email" value={email} disabled />
                  <div className="bp-help">Email is pulled from Firebase Auth.</div>
                </div>

                <div className="bp-row">
                  <div className="bp-field bp-field-grow">
                    <label className="bp-label">Phone Number</label>
                    <input
                      className="bp-input"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 01234567890"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                    <div className="bp-help">Minimum 11 digits.</div>
                  </div>

                  <div className="bp-field bp-field-grow">
                    <label className="bp-label">DuitNow Reference No. (Required)</label>
                    <input
                      className="bp-input"
                      type="text"
                      value={duitNowRef}
                      onChange={(e) => setDuitNowRef(normalizeDuitNowRef(e.target.value))}
                      placeholder="e.g. DN12345ABC"
                      autoComplete="off"
                      maxLength={40}
                      required
                    />
                    <div className="bp-help">Allowed: A–Z, 0–9, “-”, “/”.</div>
                  </div>
                </div>

                <div className="bp-field">
                  <label className="bp-label">Delivery Address</label>
                  <textarea
                    className="bp-textarea"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House/Unit, Street, City, Postcode, State"
                    rows={4}
                  />
                </div>

                <div className="bp-field">
                  <label className="bp-label">Order Quantity (pieces)</label>

                  <div className="bp-qtyWrap" role="group" aria-label="Quantity controls">
                    <button type="button" className="bp-qtyBtn" onClick={decQty} aria-label="Decrease">
                      −
                    </button>

                    <input
                      className="bp-qtyInput"
                      type="number"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(e) => onQtyChange(e.target.value)}
                      aria-label="Quantity"
                    />

                    <button type="button" className="bp-qtyBtn" onClick={incQty} aria-label="Increase">
                      +
                    </button>
                  </div>

                  <div className="bp-help">Minimum is 1.</div>
                </div>

                <div className="bp-totalStrip" aria-label="Total summary">
                  <div className="bp-totalStripRow">
                    <span>Items</span>
                    <b>{formatRM(itemsTotal)}</b>
                  </div>
                  <div className="bp-totalStripRow">
                    <span>Delivery</span>
                    <b>{formatRM(deliveryFee)}</b>
                  </div>
                  <div className="bp-totalStripDivider" />
                  <div className="bp-totalStripRow bp-totalStripGrand">
                    <span>Grand Total</span>
                    <b>{formatRM(grandTotal)}</b>
                  </div>
                  <div className="bp-totalStripHint">Includes RM {DELIVERY_FEE_RM} delivery.</div>
                </div>

                <button type="submit" className="bp-submit" disabled={!canSubmit}>
                  {submitLoading ? 'Placing Order…' : 'Confirm Order'}
                </button>

                <div className="bp-legal">By confirming, you agree to delivery & return policy.</div>
              </form>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
