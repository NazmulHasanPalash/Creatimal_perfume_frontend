// src/pages/BuyProducts/BuyProducts.js
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useHistory, useParams } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import './BuyProducts.css';

const API_BASE = 'http://localhost:5000';

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

/**
 * ✅ Treat product quantity as ML for display
 */
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

/**
 * ✅ Phone validation: minimum 11 digits (digits only)
 * Allows user to type spaces/+/- but we validate digits count.
 */
function countDigits(s) {
  return safeStr(s).replace(/\D/g, '').length;
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
    return s ? decodeURIComponent(s) : '';
  }, [rawId]);

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [product, setProduct] = useState(null);

  // Email from Firebase Auth ONLY (disabled input)
  const [email, setEmail] = useState('');

  // Customer fields
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Order quantity (pieces) — min 1, no max limit
  const [quantity, setQuantity] = useState(1);

  /* =========================
     Get email from Auth
     ========================= */
  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, (user) => {
      const userEmail = safeStr(user?.email).trim();
      if (userEmail && userEmail.includes('@')) {
        setEmail(userEmail);
        setError('');
      } else {
        setEmail('');
        setError('You are not logged in. Please login first.');
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
      }

      try {
        const res = await api.get(`/products/${encodeURIComponent(productId)}`);
        const p = res?.data || null;

        if (!mounted) return;

        setProduct(p);
        setQuantity((prev) => clampIntMin(prev || 1, 1));
      } catch (e) {
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

  const perfumeQuantityMl = useMemo(() => getMlNumber(product), [product]);
  const availableMlText = useMemo(() => getAvailableMlText(product), [product]);

  const unitPrice = useMemo(() => {
    const p = Number(product?.price);
    return Number.isNaN(p) ? 0 : p;
  }, [product]);

  const totalPrice = useMemo(
    () => unitPrice * Number(quantity || 0),
    [unitPrice, quantity]
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
    const p = safeStr(phone).trim();
    const a = safeStr(address).trim();

    if (!e || !e.includes('@')) return 'You are not logged in. Please login first.';
    if (!product) return 'Product not loaded.';

    if (!p) return 'Phone number is required.';
    if (countDigits(p) < 11) return 'Phone number must be at least 11 digits.';

    if (!a || a.length < 8) return 'Delivery address is required.';
    if (!quantity || Number(quantity) < 1) return 'Quantity must be at least 1.';
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

    const payload = {
      productId: safeStr(productId).trim(),
      productName: safeStr(product?.name).trim(),
      productImage: safeStr(imgSrc).trim(),

      status: 'pending',

      perfumeQuantityMl: perfumeQuantityMl || 0,
      orderQuantity: Number(quantity),

      customerEmail: safeStr(email).trim(),
      customerPhone: safeStr(phone).trim(),
      deliveryAddress: safeStr(address).trim(),

      unitPrice,
      totalPrice,
      currency: 'RM',
    };

    setSubmitLoading(true);
    try {
      await api.post('/customer-orders', payload);

      setInfo('✅ Order placed successfully! (Status: pending)');
      setPhone('');
      setAddress('');
      setQuantity(1);
    } catch (err) {
      console.error('Order submit error:', err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to place order. Ensure POST /customer-orders exists.'
      );
    } finally {
      setSubmitLoading(false);
    }
  }

  const canSubmit = !(submitLoading || loading || !product || !email);

  return (
    <div className="bp-page">
      <div className="bp-shell">
        <div className="bp-topbar">
          <button type="button" className="bp-back" onClick={() => history.goBack()}>
            ← Back
          </button>

          <div className="bp-chip" aria-label="Checkout secured">
            <span className="bp-chip-dot" />
            Secure Checkout
          </div>
        </div>

        <header className="bp-header">
          <div className="bp-titleWrap">
            <h1 className="bp-title">Buy Product</h1>
            <p className="bp-subtitle">Premium checkout • Fast • Simple</p>
          </div>
        </header>

        {error ? <div className="bp-alert bp-alert-danger">{error}</div> : null}
        {info ? <div className="bp-alert bp-alert-success">{info}</div> : null}

        {loading ? (
          <div className="bp-loading">Loading product...</div>
        ) : !product ? (
          <div className="bp-empty">
            <p className="bp-empty-title">Product not found</p>
            <p className="bp-empty-text">
              Check route <b>/buyProduct/:id</b> and backend <b>GET /products/:id</b>.
            </p>
          </div>
        ) : (
          <div className="bp-grid">
            {/* Product Card */}
            <section className="bp-card" aria-label="Product summary">
              <div className="bp-card-glow" />
              <div className="bp-product">
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

                <div className="bp-productInfo">
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

                    <div className="bp-metaRow bp-metaRowTotal">
                      <span className="bp-metaKey">Total</span>
                      <span className="bp-metaVal bp-total">{formatRM(totalPrice)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Form */}
            <section className="bp-formCard" aria-label="Order form">
              <div className="bp-formHeader">
                <h3 className="bp-formTitle">Order Details</h3>
                <p className="bp-formHint">Enter your info and confirm your order.</p>
              </div>

              <form onSubmit={handleSubmit} className="bp-form" noValidate>
                <div className="bp-field">
                  <label className="bp-label">Email (From Login)</label>
                  <input
                    className="bp-input"
                    type="email"
                    value={email}
                    disabled
                    placeholder="Login email will appear here"
                  />
                  <div className="bp-help">This email comes from Firebase Auth.</div>
                </div>

                <div className="bp-field">
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

                <div className="bp-row">
                  <div className="bp-field bp-field-grow">
                    <label className="bp-label">Order Quantity (pieces)</label>

                    <div className="bp-qtyWrap" role="group" aria-label="Quantity controls">
                      <button
                        type="button"
                        className="bp-qtyBtn"
                        onClick={decQty}
                        aria-label="Decrease quantity"
                      >
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

                      <button
                        type="button"
                        className="bp-qtyBtn"
                        onClick={incQty}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div className="bp-help">No maximum limit. Minimum is 1.</div>
                  </div>

                  <div className="bp-field">
                    <label className="bp-label">Total Price</label>
                    <div className="bp-totalBox" aria-label="Total price">
                      {formatRM(totalPrice)}
                    </div>
                    <div className="bp-help">Auto-calculated.</div>
                  </div>
                </div>

                <button type="submit" className="bp-submit" disabled={!canSubmit}>
                  {submitLoading ? 'Placing Order...' : 'Confirm Order'}
                </button>

                <div className="bp-legal">
                  By confirming, you agree to delivery & return policy.
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
