// src/pages/DisplayProducts/DisplayProducts.js  (with Category Filter Buttons + Animations)
import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import './DisplayProducts.css';

const API_BASE = 'https://creatimal-charmon-perfume-backend.vercel.app';

/* ---------------- Category filter config ---------------- */
const FILTER_TABS = [
  { value: 'all', label: 'All' },
  { value: 'gift-ideas', label: 'Gift Ideas' },
  { value: 'vibrant', label: 'Vibrant' },
  { value: 'party-his', label: 'Party - His' },
  { value: 'party-her', label: 'Party - Her' },
  { value: 'oem-odm', label: 'OEM / ODM' },
];

/* ---------------- Helpers ---------------- */
function safeStr(v) {
  return v === null || v === undefined ? '' : String(v);
}

function getId(p) {
  const id = p?._id;
  if (typeof id === 'string') return id;
  if (id && typeof id === 'object') {
    if (typeof id.$oid === 'string') return id.$oid;
    if (typeof id.toString === 'function') return id.toString();
    try { return JSON.stringify(id); } catch { return `${Date.now()}_${Math.random()}`; }
  }
  return `${Date.now()}_${Math.random()}`;
}

function getImageSrc(p) {
  const raw =
    p?.imageUrl || p?.imageURL || p?.image ||
    p?.img || p?.photo || p?.thumbnail || '';
  const s = safeStr(raw).trim();
  if (!s) return '';
  if (s.startsWith('data:image/')) return s;
  if (/^https?:\/\//i.test(s)) return s;
  return '';
}

function formatPrice(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return 'RM 0';
  return `RM ${Math.round(n)}`;
}

function getQuantityMlDisplay(p) {
  const rawMl =
    p?.availableMl ?? p?.availableML ?? p?.volumeMl ?? p?.volumeML ??
    p?.sizeMl ?? p?.sizeML ?? p?.ml ?? p?.ML ?? '';
  const ml = Number(rawMl);
  if (!Number.isNaN(ml) && ml > 0) return `${Math.round(ml)} ml`;
  const q = safeStr(p?.quantity).trim();
  return q ? `${q}` : '—';
}

/* ---------------- Axios ---------------- */
const api = axios.create({ baseURL: API_BASE, timeout: 20000 });

export default function DisplayProducts() {
  const history = useHistory();

  // auth/admin
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecking, setAdminChecking] = useState(false);
  const tokenRef = useRef('');

  // products
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // filters
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // selection (admin)
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [deleting, setDeleting] = useState(false);

  /* ========================= Auth ========================= */
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        setAuthReady(false);
        setIsAdmin(false);
        tokenRef.current = '';

        if (!user) { setAuthReady(true); return; }

        const token = await user.getIdToken();
        tokenRef.current = safeStr(token).trim();
        setAuthReady(true);
        await checkIsAdmin();
      } catch (e) {
        console.error('Auth error:', e);
        tokenRef.current = '';
        setAuthReady(true);
        setIsAdmin(false);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getAuthHeadersOrThrow() {
    const token = safeStr(tokenRef.current).trim();
    if (!token) throw new Error('Missing Authorization token. Please login.');
    return { Authorization: `Bearer ${token}` };
  }

  async function checkIsAdmin() {
    const token = safeStr(tokenRef.current).trim();
    if (!token) { setIsAdmin(false); return false; }
    setAdminChecking(true);
    try {
      await api.get('/admins', { headers: getAuthHeadersOrThrow() });
      setIsAdmin(true);
      return true;
    } catch {
      setIsAdmin(false);
      return false;
    } finally {
      setAdminChecking(false);
    }
  }

  /* ========================= Fetch ========================= */
  async function fetchProducts() {
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await api.get('/products');
      const arr = Array.isArray(res.data) ? res.data : [];
      arr.sort((a, b) => {
        const da = new Date(a?.createdAt || 0).getTime();
        const db = new Date(b?.createdAt || 0).getTime();
        return db - da;
      });
      setProducts(arr);
      setSelectedIds(new Set());
    } catch (e) {
      console.error('DisplayProducts fetch error:', e);
      setError(
        e?.response?.data?.message || e?.message ||
        'Failed to load products. Check backend is running.'
      );
      setProducts([]);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchProducts(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ========================= Filtering ========================= */
  const filteredProducts = useMemo(() => {
    let list = products;

    // category filter — compare lowercase slug stored in DB against tab value
    if (activeCategory !== 'all') {
      list = list.filter(
        (p) => safeStr(p?.category).trim().toLowerCase() === activeCategory
      );
    }

    // text search
    const q = safeStr(search).trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const name = safeStr(p?.name).toLowerCase();
        const desc = safeStr(p?.description).toLowerCase();
        const cat = safeStr(p?.category).toLowerCase();
        const qty = safeStr(
          p?.availableMl ?? p?.availableML ?? p?.volumeMl ?? p?.volumeML ??
          p?.sizeMl ?? p?.sizeML ?? p?.ml ?? p?.ML ?? p?.quantity ?? ''
        ).toLowerCase();
        const price = safeStr(p?.price).toLowerCase();
        return (
          name.includes(q) || desc.includes(q) || cat.includes(q) ||
          qty.includes(q) || price.includes(q)
        );
      });
    }

    return list;
  }, [products, activeCategory, search]);

  /* Count per category tab (for badges) */
  const categoryCounts = useMemo(() => {
    const counts = { all: products.length };
    FILTER_TABS.forEach(({ value }) => {
      if (value === 'all') return;
      counts[value] = products.filter(
        (p) => safeStr(p?.category).trim().toLowerCase() === value
      ).length;
    });
    return counts;
  }, [products]);

  /* ========================= Admin helpers ========================= */
  const isSelected = (id) => selectedIds.has(id);

  function toggleSelected(id) {
    if (!isAdmin) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function clearSelection() { setSelectedIds(new Set()); }

  function selectAllFiltered() {
    if (!isAdmin) return;
    setSelectedIds(() => {
      const next = new Set();
      filteredProducts.forEach((p) => next.add(getId(p)));
      return next;
    });
  }

  async function deleteSelected() {
    if (!isAdmin) { setError('Access denied. Admin only.'); return; }
    const ids = Array.from(selectedIds || []);
    if (ids.length === 0) return;
    setError('');
    setInfo('');
    if (!window.confirm(`Delete ${ids.length} selected product(s)?`)) return;
    setDeleting(true);
    try {
      const headers = getAuthHeadersOrThrow();
      for (const id of ids) {
        // eslint-disable-next-line no-await-in-loop
        await api.delete(`/products/${encodeURIComponent(id)}`, { headers });
      }
      setProducts((prev) => prev.filter((p) => !selectedIds.has(getId(p))));
      setSelectedIds(new Set());
      setInfo(`✅ Deleted ${ids.length} product(s).`);
    } catch (e) {
      console.error('Delete selected error:', e);
      setError(
        e?.response?.data?.message || e?.message ||
        'Failed to delete selected products.'
      );
    } finally {
      setDeleting(false);
    }
  }

  function goToBuyProduct(productId) {
    history.push(`/buyProduct/${encodeURIComponent(productId)}`);
  }

  /* ========================= Render ========================= */
  return (
    <section className="best-products-section" id="products">
      <div className="container-inner">

        {/* Titles */}
        <h1 className="category-title">Best Products</h1>
        <h2 className="fregnance-title">Best Sellers Products</h2>
        <p className="description-style">
          The stylish and organized perfume products crafted for every mood and moment.
        </p>

        {/* ── Category Filter Tabs ── */}
        <div className="dp-filter-tabs">
          {FILTER_TABS.map(({ value, label }) => {
            const count = categoryCounts[value] ?? 0;
            const isActive = activeCategory === value;
            return (
              <button
                key={value}
                type="button"
                className={`dp-filter-btn${isActive ? ' dp-filter-btn--active' : ''}`}
                onClick={() => {
                  setActiveCategory(value);
                  setSelectedIds(new Set());
                }}
                disabled={loading}
              >
                {label}
                <span className={`dp-filter-badge${isActive ? ' dp-filter-badge--active' : ''}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="dp-toolbar">
          <div className="dp-search">
            <input
              className="form-control dp-search-input"
              type="text"
              value={search}
              placeholder="Search by name, description, quantity, price..."
              onChange={(e) => setSearch(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="dp-actions">
            <span className="dp-count-pill">{filteredProducts.length} items</span>
            <button
              type="button"
              className="btn btn-outline-dark btn-sm px-3 dp-refresh-btn"
              onClick={fetchProducts}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Admin status hint */}
        <div style={{ marginBottom: 10, fontSize: 13, opacity: 0.8 }}>
          {adminChecking
            ? 'Checking admin…'
            : authReady
              ? isAdmin
                ? 'Admin mode: delete enabled'
                : 'User mode'
              : 'Checking login…'}
        </div>

        {/* Selection Bar — admin only */}
        {isAdmin ? (
          <div className="dp-selectbar">
            <div className="dp-select-left">
              <span className="dp-selected-pill">Selected: {selectedIds.size}</span>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={selectAllFiltered}
                disabled={loading || filteredProducts.length === 0}
              >
                Select All
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={clearSelection}
                disabled={selectedIds.size === 0}
              >
                Clear
              </button>
            </div>
            <div className="dp-select-right">
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={deleteSelected}
                disabled={selectedIds.size === 0 || deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Selected'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Alerts */}
        {error ? (
          <div className="alert alert-danger mx-auto dp-alert" role="alert">{error}</div>
        ) : null}
        {info ? (
          <div className="alert alert-success mx-auto dp-alert" role="alert">{info}</div>
        ) : null}

        {/* Product Grid */}
        {loading ? (
          <p className="text-muted">Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-muted">
            {search.trim()
              ? 'No products found for your search.'
              : activeCategory !== 'all'
                ? `No products in "${FILTER_TABS.find((t) => t.value === activeCategory)?.label}" yet.`
                : 'No products found.'}
          </p>
        ) : (
          <div className="row row-cols-1 row-cols-md-3 g-5 w-100 mx-auto cards-grid">
            {filteredProducts.map((p, index) => {
              const id = getId(p);
              const imgSrc = getImageSrc(p);
              const qtyMlText = getQuantityMlDisplay(p);
              const catLabel =
                FILTER_TABS.find(
                  (t) => t.value === safeStr(p?.category).trim().toLowerCase()
                )?.label || safeStr(p?.category) || '';

              return (
                <div
                  key={id}
                  className="col product-card"
                  style={{ '--dp-i': index }}
                >
                  <article className="card premium-card h-100">
                    <div className="image-wrapper">

                      {/* Checkbox — admin only */}
                      {isAdmin ? (
                        <label className="dp-check" title="Select">
                          <input
                            type="checkbox"
                            checked={isSelected(id)}
                            onChange={() => toggleSelected(id)}
                          />
                          <span className="dp-check-ui" />
                        </label>
                      ) : null}

                      {/* Category badge */}
                      {catLabel ? (
                        <span className="dp-category-badge">{catLabel}</span>
                      ) : null}

                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          className="card-img-top"
                          alt={safeStr(p?.name) || 'Product'}
                          loading="lazy"
                        />
                      ) : (
                        <div className="dp-image-fallback">No Image</div>
                      )}
                    </div>

                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{safeStr(p?.name) || 'Untitled'}</h5>
                      <p className="card-text">{safeStr(p?.description)}</p>

                      <div className="product-meta mt-auto">
                        <span className="product-quantity">{qtyMlText}</span>
                        <span className="product-price">{formatPrice(p?.price)}</span>
                      </div>

                      <div className="dp-card-actions">
                        <button
                          type="button"
                          className="btn-buy-now"
                          onClick={() => goToBuyProduct(id)}
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}