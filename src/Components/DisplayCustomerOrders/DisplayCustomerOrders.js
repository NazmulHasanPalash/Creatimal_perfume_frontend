// src/pages/DisplayCustomerOrders/DisplayCustomerOrders.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import './DisplayCustomerOrders.css';

const API_BASE = String(process.env.REACT_APP_API_BASE || 'https://creatimal-charmon-perfume-backend.vercel.app')
  .trim()
  .replace(/\/+$/, '');

/* ---------------- Helpers ---------------- */
function safeStr(v) {
  return v === null || v === undefined ? '' : String(v);
}

function formatRM(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return 'RM 0';
  return `RM ${Math.round(n)}`;
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
  if (s === 'pending' || s === 'completed' || s === 'cancelled') return s;
  if (s === 'order confirmed' || s === 'confirmed') return 'confirmed';
  if (s === 'order completed') return 'completed';
  if (s === 'order cancelled' || s === 'order canceled') return 'cancelled';
  return s.replace(/\s+/g, '-');
}

function displayStatusLabel(v) {
  const s = safeStr(v).trim();
  if (!s) return 'unknown';
  const low = s.toLowerCase();

  if (low === 'confirmed' || low === 'order confirmed') return 'Order confirmed';
  if (low === 'completed' || low === 'order completed') return 'Order completed';
  if (low === 'cancelled' || low === 'order cancelled' || low === 'order canceled')
    return 'Order cancelled';

  return s;
}

function pickRefNo(order) {
  return (
    safeStr(order?.duitNowRefNo) ||
    safeStr(order?.duitnowRefNo) ||
    safeStr(order?.duitNowRef) ||
    safeStr(order?.duitnowRef) ||
    safeStr(order?.duitNowReferenceNo) ||
    safeStr(order?.duitnowReferenceNo) ||
    ''
  ).trim();
}

function pickItemsTotal(order) {
  const v =
    order?.itemsTotal ??
    order?.items_total ??
    order?.subTotal ??
    order?.subtotal ??
    null;

  const n = Number(v);
  if (!Number.isNaN(n) && n >= 0) return n;

  // fallback compute: unitPrice * orderQuantity
  const unit = Number(order?.unitPrice);
  const qty = Number(order?.orderQuantity);
  if (!Number.isNaN(unit) && !Number.isNaN(qty) && unit >= 0 && qty >= 0) {
    return unit * qty;
  }
  return 0;
}

function pickDeliveryFee(order) {
  const v = order?.deliveryFee ?? order?.delivery_fee ?? order?.shippingFee ?? null;
  const n = Number(v);
  if (!Number.isNaN(n) && n >= 0) return n;
  return 0;
}

function pickGrandTotal(order) {
  const v = order?.totalPrice ?? order?.grandTotal ?? order?.total ?? null;
  const n = Number(v);
  if (!Number.isNaN(n) && n >= 0) return n;

  // fallback compute:
  return pickItemsTotal(order) + pickDeliveryFee(order);
}

/* ---------------- Axios ---------------- */
const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

export default function DisplayCustomerOrders() {
  const [authReady, setAuthReady] = useState(false);
  const tokenRef = useRef(''); // store latest token safely (no rerender)

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);

  // filters
  const [searchEmail, setSearchEmail] = useState('');
  const [searchOrderId, setSearchOrderId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // per-row update loading (id:action)
  const [updatingKey, setUpdatingKey] = useState('');

  // select + delete
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [deleteLoading, setDeleteLoading] = useState(false);

  // small toast for copy
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return undefined;
    const t = window.setTimeout(() => setToast(''), 1200);
    return () => window.clearTimeout(t);
  }, [toast]);

  /* =========================
     Firebase Auth token
     ========================= */
  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          tokenRef.current = '';
          setAuthReady(true);
          setError('You are not logged in. Please login first.');
          return;
        }

        const token = await user.getIdToken();
        tokenRef.current = safeStr(token).trim();

        setAuthReady(true);
        if (!tokenRef.current) {
          setError('Login token missing. Please logout and login again.');
        } else {
          setError('');
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Auth token error:', e);
        tokenRef.current = '';
        setAuthReady(true);
        setError('Failed to get login token. Please login again.');
      }
    });

    return () => unsub();
  }, []);

  function getAuthHeadersOrThrow() {
    const token = safeStr(tokenRef.current).trim();
    if (!token) throw new Error('Missing Authorization token. Please login.');
    return { Authorization: `Bearer ${token}` };
  }

  async function loadOrders() {
    setLoading(true);
    setError('');

    try {
      const headers = getAuthHeadersOrThrow();

      const params = {};
      const e = safeStr(searchEmail).trim();
      if (e) params.email = e;

      const st = safeStr(statusFilter).trim();
      if (st && st !== 'all') params.status = st;

      params.limit = 500;

      const res = await api.get('/customer-orders', { params, headers });
      const data = Array.isArray(res?.data) ? res.data : [];

      // latest first
      data.sort((a, b) => {
        const ta = new Date(a?.createdAt || 0).getTime();
        const tb = new Date(b?.createdAt || 0).getTime();
        return tb - ta;
      });

      setOrders(data);

      // keep only selections that still exist
      const allowed = new Set(data.map((o, idx) => getId(o, idx)));
      setSelectedIds((prev) => {
        const next = new Set();
        prev.forEach((id) => {
          if (allowed.has(id)) next.add(id);
        });
        return next;
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Load orders error:', err);
      setOrders([]);
      setSelectedIds(new Set());

      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load orders. Ensure server is running.';

      if (String(msg).toLowerCase().includes('bearer')) {
        setError('You are not logged in. Please login first.');
      } else if (String(msg).toLowerCase().includes('admin')) {
        setError('Access denied. Admin only.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // ✅ load only after authReady
  useEffect(() => {
    if (authReady) loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady]);

  const filteredOrders = useMemo(() => {
    const oid = safeStr(searchOrderId).trim().toLowerCase();
    if (!oid) return orders;

    return orders.filter((o, idx) => {
      const id = safeStr(getId(o, idx)).trim().toLowerCase();
      return id.includes(oid);
    });
  }, [orders, searchOrderId]);

  const stats = useMemo(() => {
    const total = filteredOrders.length;

    const pending = filteredOrders.filter(
      (o) => safeStr(o?.status).toLowerCase() === 'pending'
    ).length;

    const completed = filteredOrders.filter((o) => {
      const s = safeStr(o?.status).toLowerCase();
      return s === 'completed' || s === 'order completed';
    }).length;

    const cancelled = filteredOrders.filter((o) => {
      const s = safeStr(o?.status).toLowerCase();
      return s === 'cancelled' || s === 'order cancelled' || s === 'order canceled';
    }).length;

    const confirmed = filteredOrders.filter((o) => {
      const s = safeStr(o?.status).toLowerCase();
      return s === 'confirmed' || s === 'order confirmed';
    }).length;

    return { total, pending, confirmed, completed, cancelled };
  }, [filteredOrders]);

  async function updateStatus(order, fallbackIdx, target) {
    const id = getId(order, fallbackIdx);
    if (!id) return;

    setError('');
    setUpdatingKey(`${id}:${target}`);

    const prevStatus = order?.status;

    // optimistic label
    const optimisticLabel =
      target === 'confirmed'
        ? 'Order confirmed'
        : target === 'completed'
          ? 'Order completed'
          : target === 'cancelled'
            ? 'Order cancelled'
            : target;

    setOrders((prev) =>
      prev.map((x, i) => (getId(x, i) === id ? { ...x, status: optimisticLabel } : x))
    );

    try {
      const headers = getAuthHeadersOrThrow();

      await api.put(
        `/customer-orders/${encodeURIComponent(id)}`,
        { status: target },
        { headers }
      );

      await loadOrders();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Update status error:', err);

      // rollback
      setOrders((prev) =>
        prev.map((x, i) => (getId(x, i) === id ? { ...x, status: prevStatus } : x))
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to update order status.'
      );
    } finally {
      setUpdatingKey('');
    }
  }

  function confirmOrder(order, idx) {
    const statusLow = safeStr(order?.status).trim().toLowerCase();
    if (statusLow !== 'pending') return;
    updateStatus(order, idx, 'confirmed');
  }

  function completeOrder(order, idx) {
    const statusLow = safeStr(order?.status).trim().toLowerCase();
    if (statusLow !== 'confirmed' && statusLow !== 'order confirmed') return;
    updateStatus(order, idx, 'completed');
  }

  function cancelOrder(order, idx) {
    const statusLow = safeStr(order?.status).trim().toLowerCase();
    if (statusLow === 'completed' || statusLow === 'order completed') return;
    if (
      statusLow === 'cancelled' ||
      statusLow === 'order cancelled' ||
      statusLow === 'order canceled'
    )
      return;
    updateStatus(order, idx, 'cancelled');
  }

  function isSelected(id) {
    return selectedIds.has(id);
  }

  function toggleSelectOne(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredOrders.forEach((o, idx) => next.add(getId(o, idx)));
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function deleteSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    // eslint-disable-next-line no-alert
    const ok = window.confirm(`Delete ${ids.length} selected order(s)? This cannot be undone.`);
    if (!ok) return;

    setDeleteLoading(true);
    setError('');

    try {
      const headers = getAuthHeadersOrThrow();

      await Promise.all(
        ids.map((id) =>
          api.delete(`/customer-orders/${encodeURIComponent(id)}`, { headers })
        )
      );

      await loadOrders();
      clearSelection();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Delete orders error:', err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to delete selected orders.'
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  async function copyToClipboard(text) {
    const s = safeStr(text).trim();
    if (!s) return;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(s);
      } else {
        const ta = document.createElement('textarea');
        ta.value = s;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setToast('Copied');
    } catch {
      setToast('Copy failed');
    }
  }

  const selectedCount = selectedIds.size;

  return (
    <div className="dco-page">
      <div className="dco-shell">
        <header className="dco-header">
          <div className="dco-titleWrap">
            <h1 className="dco-title">Customer Orders</h1>
            <p className="dco-subtitle">Admin view • Premium • Minimal</p>
          </div>

          <div className="dco-stats" aria-label="Order stats">
            <div className="dco-stat">
              <span className="dco-statKey">Total</span>
              <span className="dco-statVal">{stats.total}</span>
            </div>
            <div className="dco-stat">
              <span className="dco-statKey">Pending</span>
              <span className="dco-statVal">{stats.pending}</span>
            </div>
            <div className="dco-stat">
              <span className="dco-statKey">Confirmed</span>
              <span className="dco-statVal">{stats.confirmed}</span>
            </div>
            <div className="dco-stat">
              <span className="dco-statKey">Completed</span>
              <span className="dco-statVal">{stats.completed}</span>
            </div>
            <div className="dco-stat">
              <span className="dco-statKey">Cancelled</span>
              <span className="dco-statVal">{stats.cancelled}</span>
            </div>
          </div>
        </header>

        <section className="dco-controls" aria-label="Filters">
          <div className="dco-field">
            <label className="dco-label">Filter by Email</label>
            <input
              className="dco-input"
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="e.g. nazmul.hasan.palash2000@gmail.com"
              autoComplete="email"
            />
          </div>

          <div className="dco-field">
            <label className="dco-label">Filter by Order ID</label>
            <input
              className="dco-input"
              type="text"
              value={searchOrderId}
              onChange={(e) => setSearchOrderId(e.target.value)}
              placeholder="Type part of Order ID…"
              autoComplete="off"
            />
          </div>

          <div className="dco-field">
            <label className="dco-label">Status</label>
            <select
              className="dco-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <button
            type="button"
            className="dco-btn"
            onClick={loadOrders}
            disabled={loading || deleteLoading || !authReady}
            title={!authReady ? 'Waiting for login…' : 'Refresh'}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </section>

        <section className="dco-bulkbar" aria-label="Bulk actions">
          <div className="dco-bulkLeft">
            <button
              type="button"
              className="dco-miniBtn"
              onClick={selectAllVisible}
              disabled={filteredOrders.length === 0 || deleteLoading || loading}
            >
              Select all
            </button>
            <button
              type="button"
              className="dco-miniBtn"
              onClick={clearSelection}
              disabled={selectedCount === 0 || deleteLoading}
            >
              Clear
            </button>
            <span className="dco-bulkCount">
              Selected: <b>{selectedCount}</b>
            </span>
          </div>

          <button
            type="button"
            className="dco-dangerBtn"
            onClick={deleteSelected}
            disabled={selectedCount === 0 || deleteLoading || loading}
          >
            {deleteLoading ? 'Deleting…' : 'Delete selected'}
          </button>
        </section>

        {error ? <div className="dco-alert dco-alert-danger">{error}</div> : null}

        {!authReady ? (
          <div className="dco-loading">Checking login…</div>
        ) : loading ? (
          <div className="dco-loading">Loading orders…</div>
        ) : filteredOrders.length === 0 ? (
          <div className="dco-empty">
            <p className="dco-emptyTitle">No orders found</p>
            <p className="dco-emptyText">Try removing filters or click Refresh.</p>
          </div>
        ) : (
          <section className="dco-list" aria-label="Orders list">
            {filteredOrders.map((o, idx) => {
              const id = getId(o, idx);
              const img = getImageSrc(o);

              const statusRaw = displayStatusLabel(o?.status);
              const statusKey = normalizeStatus(statusRaw);

              const productName = safeStr(o?.productName) || 'Untitled';
              const createdAt = formatDateTime(o?.createdAt);
              const updatedAt = formatDateTime(o?.updatedAt);

              const statusLow = safeStr(o?.status).trim().toLowerCase();

              const canConfirm = statusLow === 'pending';
              const canComplete = statusLow === 'confirmed' || statusLow === 'order confirmed';
              const canCancel =
                statusLow !== 'completed' &&
                statusLow !== 'order completed' &&
                statusLow !== 'cancelled' &&
                statusLow !== 'order cancelled' &&
                statusLow !== 'order canceled';

              const isConfirming = updatingKey === `${id}:confirmed`;
              const isCompleting = updatingKey === `${id}:completed`;
              const isCancelling = updatingKey === `${id}:cancelled`;

              const isBusy = deleteLoading || isConfirming || isCompleting || isCancelling;

              const refNo = pickRefNo(o);
              const itemsTotal = pickItemsTotal(o);
              const deliveryFee = pickDeliveryFee(o);
              const grandTotal = pickGrandTotal(o);

              return (
                <article className="dco-item" key={id}>
                  <div className="dco-itemGlow" />

                  <div className="dco-left">
                    <label className="dco-selectWrap" title="Select order">
                      <input
                        className="dco-checkbox"
                        type="checkbox"
                        checked={isSelected(id)}
                        onChange={() => toggleSelectOne(id)}
                        aria-label={`Select order ${id}`}
                      />
                      <span className="dco-checkUi" aria-hidden="true" />
                    </label>

                    <div className="dco-thumb" aria-label="Product image">
                      {img ? (
                        <img className="dco-thumbImg" src={img} alt={productName} loading="lazy" />
                      ) : (
                        <div className="dco-thumbFallback">No Image</div>
                      )}
                    </div>
                  </div>

                  <div className="dco-mid">
                    <div className="dco-topRow">
                      <div className="dco-titleBlock">
                        <h2 className="dco-name">{productName}</h2>

                        <div className="dco-subRow">
                          <span className={`dco-badge dco-badge-${statusKey}`}>{statusRaw}</span>

                          <span className="dco-dot" aria-hidden="true" />
                          <span className="dco-subText">
                            Created: <b>{createdAt}</b>
                          </span>

                          <span className="dco-dot" aria-hidden="true" />
                          <span className="dco-subText">
                            Updated: <b>{updatedAt}</b>
                          </span>

                          <span className="dco-dot" aria-hidden="true" />
                          <span className="dco-subText">
                            Order ID: <b className="dco-monoSm">{safeStr(id)}</b>
                          </span>
                        </div>

                        {/* ✅ DuitNow Reference No. */}
                        <div className="dco-refRow" aria-label="DuitNow Reference Number">
                          <span className="dco-refKey">DuitNow Ref No.</span>
                          <span className="dco-refVal dco-mono">
                            {refNo || '—'}
                          </span>
                          <button
                            type="button"
                            className="dco-copyBtn"
                            onClick={() => copyToClipboard(refNo)}
                            disabled={!refNo}
                            title={refNo ? 'Copy ref no' : 'No ref number'}
                          >
                            Copy
                          </button>
                        </div>
                      </div>

                      <div className="dco-rightCol">
                        {/* ✅ Price breakdown */}
                        <div className="dco-priceBlock">
                          <div className="dco-priceTop">
                            <span className="dco-priceKey">Grand Total</span>
                            <span className="dco-priceVal">{formatRM(grandTotal)}</span>
                          </div>

                          <div className="dco-breakdown">
                            <div className="dco-breakRow">
                              <span>Items</span>
                              <b>{formatRM(itemsTotal)}</b>
                            </div>
                            <div className="dco-breakRow">
                              <span>Delivery</span>
                              <b>{formatRM(deliveryFee)}</b>
                            </div>
                          </div>

                          <div className="dco-priceBottom">
                            <span className="dco-miniKV">
                              Unit: <b>{formatRM(o?.unitPrice)}</b>
                            </span>
                            <span className="dco-miniKV">
                              Qty: <b>{Number(o?.orderQuantity) || 0}</b>
                            </span>
                            <span className="dco-miniKV">
                              Currency: <b>{safeStr(o?.currency) || 'RM'}</b>
                            </span>
                          </div>
                        </div>

                        <div className="dco-actions" aria-label="Order actions">
                          <button
                            type="button"
                            className="dco-actionBtn dco-confirmBtn"
                            onClick={() => confirmOrder(o, idx)}
                            disabled={!canConfirm || isBusy}
                            title={canConfirm ? 'Confirm this order' : 'Only pending orders can be confirmed'}
                          >
                            {isConfirming ? 'Confirming…' : 'Confirm'}
                          </button>

                          <button
                            type="button"
                            className="dco-actionBtn dco-completeBtn"
                            onClick={() => completeOrder(o, idx)}
                            disabled={!canComplete || isBusy}
                            title={canComplete ? 'Mark as completed' : 'Only confirmed orders can be completed'}
                          >
                            {isCompleting ? 'Updating…' : 'Complete'}
                          </button>

                          <button
                            type="button"
                            className="dco-actionBtn dco-cancelBtn"
                            onClick={() => cancelOrder(o, idx)}
                            disabled={!canCancel || isBusy}
                            title={canCancel ? 'Cancel this order' : 'Cannot cancel this order'}
                          >
                            {isCancelling ? 'Cancelling…' : 'Cancel'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="dco-kpis">
                      <div className="dco-kpi">
                        <span className="dco-kpiKey">Perfume</span>
                        <span className="dco-kpiVal">{Number(o?.perfumeQuantityMl) || 0} ml</span>
                      </div>
                      <div className="dco-kpi">
                        <span className="dco-kpiKey">Pieces</span>
                        <span className="dco-kpiVal">{Number(o?.orderQuantity) || 0}</span>
                      </div>
                      <div className="dco-kpi dco-kpiWide">
                        <span className="dco-kpiKey">Customer</span>
                        <span className="dco-kpiVal dco-ellipsis">
                          {safeStr(o?.customerEmail) || safeStr(o?.email) || '—'}
                        </span>
                      </div>
                    </div>

                    <div className="dco-details">
                      <div className="dco-detail">
                        <span className="dco-detailKey">Phone</span>
                        <span className="dco-detailVal">{safeStr(o?.customerPhone) || '—'}</span>
                      </div>

                      <div className="dco-detail dco-detailWrap">
                        <span className="dco-detailKey">Address</span>
                        <span className="dco-detailVal">{safeStr(o?.deliveryAddress) || '—'}</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {toast ? <div className="dco-toast">{toast}</div> : null}
      </div>
    </div>
  );
}
