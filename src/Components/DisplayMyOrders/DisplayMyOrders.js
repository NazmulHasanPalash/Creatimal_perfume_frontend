// src/pages/DisplayMyOrders/DisplayMyOrders.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import './DisplayMyOrders.css';

const API_BASE = 'https://creatimal-charmon-perfume-backend.vercel.app';

/* ---------------- Helpers ---------------- */
function safeStr(v) {
  return v === null || v === undefined ? '' : String(v);
}

function normalizeEmail(v) {
  return safeStr(v).trim().toLowerCase();
}

function formatMoney(currency, v) {
  const n = Number(v);
  const c = safeStr(currency).trim() || 'RM';
  if (!Number.isFinite(n)) return `${c} 0`;
  return `${c} ${Math.round(n)}`;
}

function formatDateTime(v) {
  const s = safeStr(v).trim();
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString();
}

function getId(o, fallbackIndex) {
  const id = o?._id;
  if (typeof id === 'string') return id;

  // Extended JSON { $oid: "..." }
  if (id && typeof id === 'object') {
    if (typeof id.$oid === 'string') return id.$oid;
    if (typeof id.toString === 'function') return id.toString();
    try {
      return JSON.stringify(id);
    } catch {
      return `idx_${fallbackIndex}`;
    }
  }
  return `idx_${fallbackIndex}`;
}

function getImageSrc(order) {
  const raw =
    order?.productImage ||
    order?.imageUrl ||
    order?.imageURL ||
    order?.image ||
    order?.img ||
    order?.photo ||
    order?.thumbnail ||
    '';

  const s = safeStr(raw).trim();
  if (!s) return '';

  if (s.startsWith('data:image/')) return s;
  if (/^https?:\/\//i.test(s)) return s;

  if (s.startsWith('/')) return `${API_BASE}${s}`;
  return `${API_BASE}/${s}`;
}

function normalizeStatus(v) {
  const s = safeStr(v).trim().toLowerCase();
  if (!s) return 'unknown';

  if (s === 'pending' || s === 'confirmed' || s === 'completed' || s === 'cancelled') return s;

  if (s === 'order confirmed') return 'confirmed';
  if (s === 'order completed') return 'completed';
  if (s === 'order cancelled' || s === 'order canceled') return 'cancelled';

  return s.replace(/\s+/g, '-');
}

function displayStatusLabel(v) {
  const low = safeStr(v).trim().toLowerCase();
  if (!low) return 'Unknown';

  if (low === 'confirmed' || low === 'order confirmed') return 'Order confirmed';
  if (low === 'completed' || low === 'order completed') return 'Order completed';
  if (low === 'cancelled' || low === 'order cancelled' || low === 'order canceled')
    return 'Order cancelled';
  if (low === 'pending') return 'Pending';

  return safeStr(v).trim() || 'Unknown';
}

function getDeliveryFee(order) {
  // backend uses deliveryFee; keep fallbacks
  const raw =
    order?.deliveryFee ??
    order?.deliveryCharge ??
    order?.shippingFee ??
    order?.shippingCharge ??
    0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function getItemsTotal(order) {
  // backend uses itemsTotal, else compute from unitPrice * qty
  const items = Number(order?.itemsTotal);
  if (Number.isFinite(items)) return items;

  const unit = Number(order?.unitPrice);
  const qty = Number(order?.orderQuantity);
  if (Number.isFinite(unit) && Number.isFinite(qty)) return unit * qty;

  return 0;
}

function getDuitNowRef(order) {
  const raw =
    order?.duitNowRefNo ||
    order?.duitnowRefNo ||
    order?.duitNowReferenceNo ||
    order?.duitNowRef ||
    order?.duitnowRef ||
    '';
  return safeStr(raw).trim();
}

/* ---------------- Axios (token-based) ---------------- */
const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

export default function DisplayMyOrders() {
  const [authLoading, setAuthLoading] = useState(true);
  const [customerEmail, setCustomerEmail] = useState('');
  const [idToken, setIdToken] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);

  // filters
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchProductName, setSearchProductName] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  /* =========================
     Get Firebase user + token
     ========================= */
  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);
      setError('');

      try {
        if (!user) {
          setCustomerEmail('');
          setIdToken('');
          setOrders([]);
          setError('You are not logged in. Please login to view your orders.');
          return;
        }

        const userEmail = safeStr(user?.email).trim();
        if (!userEmail || !userEmail.includes('@')) {
          setCustomerEmail('');
          setIdToken('');
          setOrders([]);
          setError('Your account has no email. Please login again.');
          return;
        }

        const token = await user.getIdToken(true);

        setCustomerEmail(userEmail);
        setIdToken(token);

        // Convenience only (NOT security)
        localStorage.setItem('customerEmail', userEmail);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Auth token error:', e);
        setCustomerEmail('');
        setIdToken('');
        setOrders([]);
        setError('Failed to verify login session. Please logout and login again.');
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsub();
  }, []);

  /* =========================
     Load orders (secure)
     ========================= */
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const email = normalizeEmail(customerEmail);
      const token = safeStr(idToken).trim();

      if (!email || !token) {
        setOrders([]);
        setError('You are not logged in. Please login to view your orders.');
        return;
      }

      // Backend should read email from verified Firebase token.
      const params = { limit: 200 };
      const st = safeStr(statusFilter).trim();
      if (st && st !== 'all') params.status = st;

      const res = await api.get('/customer-orders', {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = Array.isArray(res?.data) ? res.data : [];

      // UI safety: filter again by email
      const mine = data.filter((o) => normalizeEmail(o?.customerEmail) === email);

      // latest first
      mine.sort((a, b) => {
        const ta = new Date(a?.createdAt || 0).getTime();
        const tb = new Date(b?.createdAt || 0).getTime();
        return tb - ta;
      });

      setOrders(mine);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Load my orders error:', err);
      setOrders([]);

      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load orders. Ensure backend is running.';

      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setError(
          `${msg} (Auth required) — Your backend must verify Firebase token and return only this user’s orders.`
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [customerEmail, idToken, statusFilter]);

  useEffect(() => {
    if (!authLoading) loadOrders();
  }, [authLoading, loadOrders]);

  const filteredOrders = useMemo(() => {
    const oid = safeStr(searchOrderId).trim().toLowerCase();
    const pn = safeStr(searchProductName).trim().toLowerCase();

    if (!oid && !pn) return orders;

    return orders.filter((o, idx) => {
      const id = safeStr(getId(o, idx)).trim().toLowerCase();
      const name = safeStr(o?.productName).trim().toLowerCase();

      const okId = oid ? id.includes(oid) : true;
      const okName = pn ? name.includes(pn) : true;

      return okId && okName;
    });
  }, [orders, searchOrderId, searchProductName]);

  const stats = useMemo(() => {
    const total = filteredOrders.length;

    const pending = filteredOrders.filter((o) => safeStr(o?.status).toLowerCase() === 'pending')
      .length;

    const confirmed = filteredOrders.filter((o) => {
      const s = safeStr(o?.status).toLowerCase();
      return s === 'confirmed' || s === 'order confirmed';
    }).length;

    const completed = filteredOrders.filter((o) => {
      const s = safeStr(o?.status).toLowerCase();
      return s === 'completed' || s === 'order completed';
    }).length;

    const cancelled = filteredOrders.filter((o) => {
      const s = safeStr(o?.status).toLowerCase();
      return s === 'cancelled' || s === 'order cancelled' || s === 'order canceled';
    }).length;

    return { total, pending, confirmed, completed, cancelled };
  }, [filteredOrders]);

  const emailForUI = safeStr(customerEmail).trim();
  const refreshDisabled = authLoading || loading || !emailForUI || !idToken;

  return (
    <div className="dmo-page">
      <div className="dmo-shell">
        <header className="dmo-header">
          <div className="dmo-titleWrap">
            <div className="dmo-kicker">Charmon</div>
            <h1 className="dmo-title">My Orders</h1>
            <p className="dmo-subtitle">
              {emailForUI ? (
                <>
                  Showing orders for <span className="dmo-pill">{emailForUI}</span>
                </>
              ) : (
                <>Please login to view your orders.</>
              )}
            </p>
          </div>

          <div className="dmo-stats" aria-label="Order stats">
            <div className="dmo-stat">
              <span className="dmo-statKey">Total</span>
              <span className="dmo-statVal">{stats.total}</span>
            </div>
            <div className="dmo-stat">
              <span className="dmo-statKey">Pending</span>
              <span className="dmo-statVal">{stats.pending}</span>
            </div>
            <div className="dmo-stat">
              <span className="dmo-statKey">Confirmed</span>
              <span className="dmo-statVal">{stats.confirmed}</span>
            </div>
            <div className="dmo-stat">
              <span className="dmo-statKey">Completed</span>
              <span className="dmo-statVal">{stats.completed}</span>
            </div>
            <div className="dmo-stat">
              <span className="dmo-statKey">Cancelled</span>
              <span className="dmo-statVal">{stats.cancelled}</span>
            </div>
          </div>
        </header>

        <section className="dmo-controls" aria-label="Filters">
          <div className="dmo-field">
            <label className="dmo-label">Search by Order ID</label>
            <input
              className="dmo-input"
              type="text"
              value={searchOrderId}
              onChange={(e) => setSearchOrderId(e.target.value)}
              placeholder="Type part of your order ID…"
              autoComplete="off"
              disabled={authLoading}
            />
          </div>

          <div className="dmo-field">
            <label className="dmo-label">Search by Product Name</label>
            <input
              className="dmo-input"
              type="text"
              value={searchProductName}
              onChange={(e) => setSearchProductName(e.target.value)}
              placeholder="e.g. Confident, Fresh…"
              autoComplete="off"
              disabled={authLoading}
            />
          </div>

          <div className="dmo-field">
            <label className="dmo-label">Status</label>
            <select
              className="dmo-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              disabled={authLoading}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="dmo-actions">
            <button
              type="button"
              className="dmo-btn dmo-btn-sm"
              onClick={loadOrders}
              disabled={refreshDisabled}
              title="Refresh orders"
            >
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </section>

        {error ? <div className="dmo-alert dmo-alert-danger">{error}</div> : null}

        {authLoading ? (
          <div className="dmo-loading">Checking your login…</div>
        ) : loading ? (
          <div className="dmo-loading">Loading your orders…</div>
        ) : !emailForUI ? (
          <div className="dmo-empty">
            <p className="dmo-emptyTitle">Not logged in</p>
            <p className="dmo-emptyText">Login first. Then come back to My Orders.</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="dmo-empty">
            <p className="dmo-emptyTitle">No orders found</p>
            <p className="dmo-emptyText">Try changing filters or tap Refresh.</p>
          </div>
        ) : (
          <section className="dmo-list" aria-label="My orders list">
            {filteredOrders.map((o, idx) => {
              const id = getId(o, idx);
              const img = getImageSrc(o);

              const statusRaw = displayStatusLabel(o?.status);
              const statusKey = normalizeStatus(statusRaw);

              const productName = safeStr(o?.productName) || 'Untitled';
              const createdAt = formatDateTime(o?.createdAt);
              const updatedAt = formatDateTime(o?.updatedAt);

              const currency = safeStr(o?.currency) || 'RM';

              const itemsTotal = getItemsTotal(o);
              const deliveryFee = getDeliveryFee(o);
              const total = Number.isFinite(Number(o?.totalPrice))
                ? Number(o?.totalPrice)
                : itemsTotal + deliveryFee;

              const duitNowRefNo = getDuitNowRef(o);

              return (
                <article className="dmo-item" key={safeStr(id)}>
                  <div className="dmo-itemGlow" />

                  <div className="dmo-left">
                    <div className="dmo-thumb" aria-label="Product image">
                      {img ? (
                        <img
                          className="dmo-thumbImg"
                          src={img}
                          alt={productName}
                          loading="lazy"
                        />
                      ) : (
                        <div className="dmo-thumbFallback">No Image</div>
                      )}
                    </div>
                  </div>

                  <div className="dmo-mid">
                    <div className="dmo-topRow">
                      <div className="dmo-titleBlock">
                        <h2 className="dmo-name">{productName}</h2>

                        <div className="dmo-subRow">
                          <span className={`dmo-badge dmo-badge-${statusKey}`}>{statusRaw}</span>

                          <span className="dmo-dot" aria-hidden="true" />
                          <span className="dmo-subText">
                            Order ID: <b className="dmo-monoSm">{safeStr(id)}</b>
                          </span>
                        </div>

                        <div className="dmo-metaRow">
                          <span className="dmo-meta">
                            Created: <b>{createdAt}</b>
                          </span>
                          <span className="dmo-meta">
                            Updated: <b>{updatedAt}</b>
                          </span>
                        </div>

                        {/* ✅ DuitNow Reference */}
                        <div className="dmo-metaRow">
                          <span className="dmo-meta dmo-metaWide">
                            DuitNow Ref: <b className="dmo-monoSm">{duitNowRefNo || '—'}</b>
                          </span>
                        </div>
                      </div>

                      <div className="dmo-rightCol">
                        <div className="dmo-priceBlock">
                          <div className="dmo-priceTop">
                            <span className="dmo-priceKey">Total</span>
                            <span className="dmo-priceVal">{formatMoney(currency, total)}</span>
                          </div>

                          {/* ✅ Premium breakdown */}
                          <div className="dmo-breakdown" aria-label="Price breakdown">
                            <div className="dmo-rowKV">
                              <span className="dmo-rowK">Items</span>
                              <span className="dmo-rowV">{formatMoney(currency, itemsTotal)}</span>
                            </div>
                            <div className="dmo-rowKV">
                              <span className="dmo-rowK">Delivery</span>
                              <span className="dmo-rowV">{formatMoney(currency, deliveryFee)}</span>
                            </div>
                          </div>

                          <div className="dmo-priceBottom">
                            <span className="dmo-miniKV">
                              Unit: <b>{formatMoney(currency, o?.unitPrice)}</b>
                            </span>
                            <span className="dmo-miniKV">
                              Qty: <b>{Number(o?.orderQuantity) || 0}</b>
                            </span>
                            <span className="dmo-miniKV">
                              Perfume: <b>{Number(o?.perfumeQuantityMl) || 0} ml</b>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="dmo-details">
                      <div className="dmo-detail">
                        <span className="dmo-detailKey">Email</span>
                        <span className="dmo-detailVal dmo-ellipsis">
                          {safeStr(o?.customerEmail) || '—'}
                        </span>
                      </div>

                      <div className="dmo-detail">
                        <span className="dmo-detailKey">Phone</span>
                        <span className="dmo-detailVal">{safeStr(o?.customerPhone) || '—'}</span>
                      </div>

                      <div className="dmo-detail dmo-detailWrap">
                        <span className="dmo-detailKey">Delivery</span>
                        <span className="dmo-detailVal">{safeStr(o?.deliveryAddress) || '—'}</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <footer className="dmo-footer">
          <div className="dmo-footerCard">
            <div className="dmo-footerTitle">Need help?</div>
            <div className="dmo-footerText">
              If your order status hasn’t updated, please allow some processing time or contact
              support.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
