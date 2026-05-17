// src/pages/BuyProducts/BuyProducts.js

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useHistory, useParams } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import './BuyProducts.css';

const API_BASE = String(
  process.env.REACT_APP_API_BASE ||
  'https://creatimal-charmon-perfume-backend.vercel.app'
)
  .trim()
  .replace(/\/+$/, '');

const DELIVERY_FEE_RM = 7;

/* =========================
   Helpers
========================= */

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

function countDigits(s) {
  return safeStr(s).replace(/\D/g, '').length;
}

function normalizeDuitNowRef(v) {
  const s = safeStr(v).trim().toUpperCase();

  const cleaned = s.replace(/[^A-Z0-9/-]/g, '');

  return cleaned.slice(0, 40);
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

/* =========================
   Axios
========================= */

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

  /* =========================
     States
  ========================= */

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [product, setProduct] = useState(null);

  const [email, setEmail] = useState('');
  const [idToken, setIdToken] = useState('');

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [duitNowRef, setDuitNowRef] = useState('');

  const [quantity, setQuantity] = useState(1);

  const [selectedQr, setSelectedQr] = useState(null);

  /* =========================
     QR Images
  ========================= */

  const paymentMethods = useMemo(() => {
    const base = safeStr(process.env.PUBLIC_URL).trim() || '';

    return [
      {
        id: 'tng',
        title: "Touch 'n Go eWallet",
        image: `${base}/image/creatima_payment/tng_qr.jpeg`,
        badge: 'Verified Merchant',
      },
      {
        id: 'maybank',
        title: 'Maybank QRPay',
        image: `${base}/image/creatima_payment/maybank_qr.jpeg`,
        badge: 'Secure Payment',
      },
    ];
  }, []);

  /* =========================
     Auth
  ========================= */

  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, async (u) => {
      setError('');
      setInfo('');

      try {
        const userEmail = safeStr(u?.email).trim();

        if (u && userEmail.includes('@')) {
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
        console.error(e);

        setEmail('');
        setIdToken('');

        setError('Failed to verify login.');
      }
    });

    return () => unsub();
  }, []);

  /* =========================
     Load Product
  ========================= */

  useEffect(() => {
    let mounted = true;

    async function loadProduct() {
      if (!productId) {
        setError('Missing product id in URL.');
        return;
      }

      setLoading(true);

      try {
        const res = await api.get(
          `/products/${encodeURIComponent(productId)}`
        );

        if (!mounted) return;

        setProduct(res?.data || null);
      } catch (e) {
        console.error(e);

        if (!mounted) return;

        setError(
          e?.response?.data?.message ||
          e?.message ||
          'Failed to load product.'
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      mounted = false;
    };
  }, [productId]);

  /* =========================
     Computed
  ========================= */

  const imgSrc = useMemo(() => getImageSrc(product), [product]);

  const availableMlText = useMemo(
    () => getAvailableMlText(product),
    [product]
  );

  const perfumeQuantityMl = useMemo(
    () => getMlNumber(product),
    [product]
  );

  const unitPrice = useMemo(() => {
    const p = Number(product?.price);

    return Number.isNaN(p) ? 0 : p;
  }, [product]);

  const itemsTotal = useMemo(() => {
    return unitPrice * Number(quantity || 0);
  }, [unitPrice, quantity]);

  const grandTotal = useMemo(() => {
    return itemsTotal + DELIVERY_FEE_RM;
  }, [itemsTotal]);

  /* =========================
     Quantity
  ========================= */

  function onQtyChange(v) {
    setQuantity(clampIntMin(v, 1));
  }

  function decQty() {
    setQuantity((q) => clampIntMin((q || 1) - 1, 1));
  }

  function incQty() {
    setQuantity((q) => clampIntMin((q || 1) + 1, 1));
  }

  /* =========================
     QR Functions
  ========================= */

  function downloadQr(image, fileName) {
    const link = document.createElement('a');

    link.href = image;
    link.download = fileName;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  }

  async function shareQr(title, image) {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: `Scan this QR to pay via ${title}`,
          url: image,
        });
      } else {
        await navigator.clipboard.writeText(image);

        alert('QR link copied to clipboard');
      }
    } catch (e) {
      console.error(e);
    }
  }

  /* =========================
     Validation
  ========================= */

  function validate() {
    const e = safeStr(email).trim();

    const t = safeStr(idToken).trim();

    const p = safeStr(phone).trim();

    const a = safeStr(address).trim();

    const ref = normalizeDuitNowRef(duitNowRef);

    if (!e.includes('@')) {
      return 'You are not logged in.';
    }

    if (!t) {
      return 'Session token missing.';
    }

    if (!product) {
      return 'Product not loaded.';
    }

    if (!p) {
      return 'Phone number is required.';
    }

    if (countDigits(p) < 10) {
      return 'Phone number must be at least 10 digits.';
    }

    if (!a || a.length < 8) {
      return 'Delivery address is required.';
    }

    if (!ref) {
      return 'DuitNow Reference No. is required.';
    }

    if (ref.length < 6) {
      return 'Reference No. looks too short.';
    }

    return '';
  }

  /* =========================
     Submit
  ========================= */

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

      perfumeQuantityMl,
      orderQuantity: Number(quantity),

      customerPhone: safeStr(phone).trim(),

      deliveryAddress: safeStr(address).trim(),

      duitNowRefNo: normalizeDuitNowRef(duitNowRef),

      unitPrice,

      itemsTotal,

      deliveryFee: DELIVERY_FEE_RM,

      totalPrice: grandTotal,

      currency: 'RM',
    };

    setSubmitLoading(true);

    try {
      const token = safeStr(idToken).trim();

      const res = await api.post('/customer-orders', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const createdOrderId = safeStr(
        res?.data?.insertedId || res?.data?._id || ''
      ).trim();

      setInfo('✅ Order placed successfully!');

      setPhone('');
      setAddress('');
      setDuitNowRef('');
      setQuantity(1);

      window.setTimeout(() => {
        history.push('/myOrders', {
          from: 'buy',
          createdOrderId,
        });
      }, 800);
    } catch (e) {
      console.error(e);

      setError(
        e?.response?.data?.message ||
        e?.message ||
        'Failed to place order.'
      );
    } finally {
      setSubmitLoading(false);
    }
  }

  const canSubmit = !(
    loading ||
    submitLoading ||
    !product ||
    !safeStr(email).trim() ||
    !safeStr(idToken).trim()
  );

  /* =========================
     UI
  ========================= */

  return (
    <div className="bp-page">
      <div className="bp-shell">
        <header className="bp-header">
          <h1 className="bp-title">Checkout</h1>

          <p className="bp-subtitle">
            Premium • Minimal • Responsive
          </p>
        </header>

        {error ? (
          <div className="bp-alert bp-alert-danger">
            {error}
          </div>
        ) : null}

        {info ? (
          <div className="bp-alert bp-alert-success">
            {info}
          </div>
        ) : null}

        {loading ? (
          <div className="bp-loading">
            Loading product...
          </div>
        ) : !product ? (
          <div className="bp-empty">
            Product not found
          </div>
        ) : (
          <div className="bp-grid">
            {/* LEFT */}
            <section className="bp-card">
              <div className="bp-cardTop">
                <button
                  type="button"
                  className="bp-backBtn"
                  onClick={() => history.goBack()}
                >
                  ← Back
                </button>

                <div className="bp-badgeRow">
                  <span className="bp-badge">
                    Premium
                  </span>

                  <span className="bp-badge bp-badge-soft">
                    Authentic
                  </span>
                </div>
              </div>

              <div className="bp-summary">
                <div className="bp-imageWrap">
                  {imgSrc ? (
                    <img
                      className="bp-image"
                      src={imgSrc}
                      alt={safeStr(product?.name)}
                    />
                  ) : (
                    <div className="bp-imageFallback">
                      No Image
                    </div>
                  )}
                </div>

                <div className="bp-summaryInfo">
                  <h2 className="bp-productName">
                    {safeStr(product?.name)}
                  </h2>

                  <p className="bp-productDesc">
                    {safeStr(product?.description)}
                  </p>

                  <div className="bp-meta">
                    <div className="bp-metaRow">
                      <span>Price / piece</span>
                      <b>{formatRM(unitPrice)}</b>
                    </div>

                    <div className="bp-metaRow">
                      <span>Quantity (ml)</span>
                      <b>{availableMlText}</b>
                    </div>

                    <div className="bp-divider" />

                    <div className="bp-metaRow">
                      <span>Items Total</span>
                      <b>{formatRM(itemsTotal)}</b>
                    </div>

                    <div className="bp-metaRow">
                      <span>Delivery</span>
                      <b>
                        {formatRM(DELIVERY_FEE_RM)}
                      </b>
                    </div>

                    <div className="bp-divider" />

                    <div className="bp-metaRow bp-metaRowTotal">
                      <span>Grand Total</span>

                      <b className="bp-total">
                        {formatRM(grandTotal)}
                      </b>
                    </div>
                  </div>

                  {/* PAYMENT */}
                  <div className="bp-paymentSection">
                    <div className="bp-payTitle">
                      Choose Payment Method
                    </div>

                    <div className="bp-paymentGrid">
                      {paymentMethods.map((item) => (
                        <div
                          className="bp-paymentCard"
                          key={item.id}
                        >
                          <div className="bp-paymentHeader">
                            <h5>{item.title}</h5>

                            <span className="bp-paymentBadge">
                              {item.badge}
                            </span>
                          </div>

                          <div
                            className="bp-qr"
                            onClick={() =>
                              setSelectedQr(item)
                            }
                          >
                            <img
                              className="bp-qrImg"
                              src={item.image}
                              alt={item.title}
                              loading="lazy"
                            />
                          </div>

                          <div className="bp-qrCap">
                            Tap to Zoom
                          </div>

                          <div className="bp-qrActions">
                            <button
                              type="button"
                              className="bp-qrBtn"
                              onClick={() =>
                                downloadQr(
                                  item.image,
                                  `${item.id}-qr.jpeg`
                                )
                              }
                            >
                              Download
                            </button>

                            <button
                              type="button"
                              className="bp-qrBtn bp-qrBtnSecondary"
                              onClick={() =>
                                shareQr(
                                  item.title,
                                  item.image
                                )
                              }
                            >
                              Share
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bp-note">
                      <span className="bp-noteDot" />

                      <span className="bp-noteText">
                        DuitNow Reference No. is
                        mandatory to verify payment.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* RIGHT */}
            <section className="bp-formCard">
              <div className="bp-formHeader">
                <h3 className="bp-formTitle">
                  Order Details
                </h3>

                <p className="bp-formHint">
                  Fill your delivery information.
                </p>
              </div>

              <form
                className="bp-form"
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="bp-field">
                  <label className="bp-label">
                    Email
                  </label>

                  <input
                    className="bp-input"
                    type="email"
                    value={email}
                    disabled
                  />
                </div>

                <div className="bp-row">
                  <div className="bp-field bp-field-grow">
                    <label className="bp-label">
                      Phone Number
                    </label>

                    <input
                      className="bp-input"
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value)
                      }
                      placeholder="01234567890"
                    />
                  </div>

                  <div className="bp-field bp-field-grow">
                    <label className="bp-label">
                      DuitNow Reference No.
                    </label>

                    <input
                      className="bp-input"
                      type="text"
                      value={duitNowRef}
                      onChange={(e) =>
                        setDuitNowRef(
                          normalizeDuitNowRef(
                            e.target.value
                          )
                        )
                      }
                      placeholder="DN12345ABC"
                    />
                  </div>
                </div>

                <div className="bp-field">
                  <label className="bp-label">
                    Delivery Address
                  </label>

                  <textarea
                    className="bp-textarea"
                    rows={4}
                    value={address}
                    onChange={(e) =>
                      setAddress(e.target.value)
                    }
                  />
                </div>

                <div className="bp-field">
                  <label className="bp-label">
                    Quantity
                  </label>

                  <div className="bp-qtyWrap">
                    <button
                      type="button"
                      className="bp-qtyBtn"
                      onClick={decQty}
                    >
                      −
                    </button>

                    <input
                      className="bp-qtyInput"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) =>
                        onQtyChange(e.target.value)
                      }
                    />

                    <button
                      type="button"
                      className="bp-qtyBtn"
                      onClick={incQty}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="bp-totalStrip">
                  <div className="bp-totalStripRow">
                    <span>Items</span>

                    <b>{formatRM(itemsTotal)}</b>
                  </div>

                  <div className="bp-totalStripRow">
                    <span>Delivery</span>

                    <b>
                      {formatRM(DELIVERY_FEE_RM)}
                    </b>
                  </div>

                  <div className="bp-totalStripDivider" />

                  <div className="bp-totalStripRow bp-totalStripGrand">
                    <span>Grand Total</span>

                    <b>{formatRM(grandTotal)}</b>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bp-submit"
                  disabled={!canSubmit}
                >
                  {submitLoading
                    ? 'Placing Order...'
                    : 'Confirm Order'}
                </button>

                <div className="bp-legal">
                  By confirming, you agree to
                  delivery policy.
                </div>
              </form>
            </section>
          </div>
        )}

        {/* QR MODAL */}
        {selectedQr ? (
          <div
            className="bp-modal"
            onClick={() => setSelectedQr(null)}
          >
            <div
              className="bp-modalContent"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="bp-modalClose"
                onClick={() => setSelectedQr(null)}
              >
                ×
              </button>

              <h3 className="bp-modalTitle">
                {selectedQr.title}
              </h3>

              <img
                className="bp-modalImg"
                src={selectedQr.image}
                alt={selectedQr.title}
              />

              <div className="bp-modalActions">
                <button
                  type="button"
                  className="bp-qrBtn"
                  onClick={() =>
                    downloadQr(
                      selectedQr.image,
                      `${selectedQr.id}-qr.jpeg`
                    )
                  }
                >
                  Download
                </button>

                <button
                  type="button"
                  className="bp-qrBtn bp-qrBtnSecondary"
                  onClick={() =>
                    shareQr(
                      selectedQr.title,
                      selectedQr.image
                    )
                  }
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}