// src/pages/DisplayCustomerOrders/DisplayCustomerOrders.js
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './DisplayCustomerOrders.css';

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
  return s.replace(/\s+/g, '-');
}

function displayStatusLabel(v) {
  const s = safeStr(v).trim();
  if (!s) return 'unknown';
  if (s.toLowerCase() === 'confirmed') return 'Order confirmed';
  return s;
}

/* ---------------- Axios ---------------- */
const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

export default function DisplayCustomerOrders() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);

  // filters
  const [searchEmail, setSearchEmail] = useState('');
  const [searchOrderId, setSearchOrderId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // per-row update loading
  const [updatingId, setUpdatingId] = useState('');

  // select + delete
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function loadOrders() {
    setLoading(true);
    setError('');

    try {
      const params = {};
      const e = safeStr(searchEmail).trim();
      if (e) params.email = e;

      const st = safeStr(statusFilter).trim();
      if (st && st !== 'all') params.status = st;

      params.limit = 500;

      const res = await api.get('/customer-orders', { params });
      const data = Array.isArray(res?.data) ? res.data : [];

      data.sort((a, b) => {
        const ta = new Date(a?.createdAt || 0).getTime();
        const tb = new Date(b?.createdAt || 0).getTime();
        return tb - ta;
      });

      setOrders(data);

      // ✅ keep only selections that still exist
      const allowed = new Set(data.map((o, idx) => getId(o, idx)));
      setSelectedIds((prev) => {
        const next = new Set();
        prev.forEach((id) => {
          if (allowed.has(id)) next.add(id);
        });
        return next;
      });
    } catch (err) {
      console.error('Load orders error:', err);
      setOrders([]);
      setSelectedIds(new Set());
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to load orders. Ensure GET /customer-orders exists and server is running.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOrders = useMemo(() => {
    const oid = safeStr(searchOrderId).trim().toLowerCase();
    if (!oid) return orders;

    // filter by Order ID (match contains)
    return orders.filter((o, idx) => {
      const id = safeStr(getId(o, idx)).trim().toLowerCase();
      return id.includes(oid);
    });
  }, [orders, searchOrderId]);

  const stats = useMemo(() => {
    const total = filteredOrders.length;
    const pending = filteredOrders.filter((o) => safeStr(o?.status).toLowerCase() === 'pending').length;
    const completed = filteredOrders.filter((o) => safeStr(o?.status).toLowerCase() === 'completed').length;
    const cancelled = filteredOrders.filter((o) => safeStr(o?.status).toLowerCase() === 'cancelled').length;
    const confirmed = filteredOrders.filter((o) => {
      const s = safeStr(o?.status).toLowerCase();
      return s === 'confirmed' || s === 'order confirmed';
    }).length;
    return { total, pending, confirmed, completed, cancelled };
  }, [filteredOrders]);

  async function confirmOrder(order, fallbackIdx) {
    const id = getId(order, fallbackIdx);
    const current = safeStr(order?.status).trim().toLowerCase();

    if (!id) return;
    if (current !== 'pending') return;

    setError('');
    setUpdatingId(id);

    // optimistic UI update
    setOrders((prev) =>
      prev.map((x, i) => (getId(x, i) === id ? { ...x, status: 'Order confirmed' } : x))
    );

    try {
      // ✅ Expected backend endpoint:
      // PATCH /customer-orders/:id  body: { status: "Order confirmed" }
      await api.patch(`/customer-orders/${encodeURIComponent(id)}`, {
        status: 'Order confirmed',
      });

      await loadOrders();
    } catch (err) {
      console.error('Confirm order error:', err);

      // rollback UI if failed
      setOrders((prev) => prev.map((x, i) => (getId(x, i) === id ? { ...x, status: order?.status } : x)));

      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to confirm order. Ensure PATCH /customer-orders/:id exists on backend.'
      );
    } finally {
      setUpdatingId('');
    }
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
      filteredOrders.forEach((o, idx) => {
        next.add(getId(o, idx));
      });
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function deleteSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    // simple confirm
    // eslint-disable-next-line no-alert
    const ok = window.confirm(`Delete ${ids.length} selected order(s)? This cannot be undone.`);
    if (!ok) return;

    setDeleteLoading(true);
    setError('');

    try {
      // ✅ Expected backend endpoint:
      // DELETE /customer-orders/:id
      await Promise.all(
        ids.map((id) => api.delete(`/customer-orders/${encodeURIComponent(id)}`))
      );

      await loadOrders();
      clearSelection();
    } catch (err) {
      console.error('Delete orders error:', err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to delete selected orders. Ensure DELETE /customer-orders/:id exists on backend.'
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  const selectedCount = selectedIds.size;

  return (
    <div className="dco-page">
      <div className="dco-shell">
        <header className="dco-header">
          <div className="dco-titleWrap">
            <h1 className="dco-title">Customer Orders</h1>
            <p className="dco-subtitle">List view • premium minimal • responsive • latest first</p>
          </div>

          <div className="dco-stats">
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

        <section className="dco-controls">
          <div className="dco-field">
            <label className="dco-label">Filter by Email (optional)</label>
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
            <label className="dco-label">Filter by Order ID (contains)</label>
            <input
              className="dco-input"
              type="text"
              value={searchOrderId}
              onChange={(e) => setSearchOrderId(e.target.value)}
              placeholder="e.g. 675f... or idx_"
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
              <option value="order confirmed">Order confirmed</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <button
            type="button"
            className="dco-btn"
            onClick={loadOrders}
            disabled={loading}
            aria-label="Refresh orders"
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
              Select all (visible)
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
            aria-label="Delete selected orders"
          >
            {deleteLoading ? 'Deleting…' : 'Delete selected'}
          </button>
        </section>

        {error ? <div className="dco-alert dco-alert-danger">{error}</div> : null}

        {loading ? (
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

              const isPending = safeStr(o?.status).trim().toLowerCase() === 'pending';
              const isUpdating = updatingId === id;

              return (
                <article className="dco-item" key={id}>
                  <div className="dco-itemGlow" />

                  <div className="dco-left">
                    <label className="dco-selectWrap" title="Select this order">
                      <input
                        className="dco-checkbox"
                        type="checkbox"
                        checked={isSelected(id)}
                        onChange={() => toggleSelectOne(id)}
                        aria-label={`Select order ${id}`}
                      />
                      <span className="dco-checkUi" aria-hidden="true" />
                    </label>

                    <div className="dco-thumb">
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
                          <span className="dco-subText dco-monoSm">{safeStr(id)}</span>
                        </div>
                      </div>

                      <div className="dco-rightCol">
                        <div className="dco-priceBlock">
                          <div className="dco-priceTop">
                            <span className="dco-priceKey">Total</span>
                            <span className="dco-priceVal">{formatRM(o?.totalPrice)}</span>
                          </div>
                          <div className="dco-priceBottom">
                            <span className="dco-miniKV">
                              Unit: <b>{formatRM(o?.unitPrice)}</b>
                            </span>
                            <span className="dco-miniKV">
                              Currency: <b>{safeStr(o?.currency) || 'RM'}</b>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="dco-confirmBtn"
                          onClick={() => confirmOrder(o, idx)}
                          disabled={!isPending || isUpdating || deleteLoading}
                          aria-label="Confirm order"
                          title={isPending ? 'Confirm this order' : 'Only pending orders can be confirmed'}
                        >
                          {isUpdating ? 'Confirming…' : 'Order confirmed'}
                        </button>
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
                          {safeStr(o?.customerEmail) || '—'}
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
      </div>
    </div>
  );
}
