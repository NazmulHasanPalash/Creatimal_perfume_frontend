// DisplayProducts.js
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import './DisplayProducts.css';

// If Bootstrap is not imported globally in index.js/App.js, uncomment:
// import 'bootstrap/dist/css/bootstrap.min.css';

const API_BASE = 'http://localhost:5000';

/* ---------------- Helpers ---------------- */
function safeStr(v) {
  return v === null || v === undefined ? '' : String(v);
}

function getId(p) {
  const id = p?._id;

  // Normal: string
  if (typeof id === 'string') return id;

  // Extended JSON: { $oid: "..." }
  if (id && typeof id === 'object') {
    if (typeof id.$oid === 'string') return id.$oid;
    if (typeof id.toString === 'function') return id.toString();
    try {
      return JSON.stringify(id);
    } catch {
      return `${Date.now()}_${Math.random()}`;
    }
  }

  return `${Date.now()}_${Math.random()}`;
}

function getImageSrc(p) {
  const raw =
    p?.imageUrl ||
    p?.imageURL ||
    p?.image ||
    p?.img ||
    p?.photo ||
    p?.thumbnail ||
    '';

  const s = safeStr(raw).trim();

  if (s.startsWith('data:image/')) return s;
  if (/^https?:\/\//i.test(s)) return s;

  return '';
}

function formatPrice(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return 'RM 0';
  return `RM ${Math.round(n)}`;
}

/**
 * ✅ Quantity display in ML (preferred)
 * Tries multiple possible field names for ml; falls back to product.quantity.
 */
function getQuantityMlDisplay(p) {
  const rawMl =
    p?.availableMl ??
    p?.availableML ??
    p?.volumeMl ??
    p?.volumeML ??
    p?.sizeMl ??
    p?.sizeML ??
    p?.ml ??
    p?.ML ??
    '';

  const ml = Number(rawMl);

  if (!Number.isNaN(ml) && ml > 0) {
    return `${Math.round(ml)} ml`;
  }

  // fallback to quantity if ml not found
  const q = safeStr(p?.quantity).trim();
  return q ? `${q} ml` : '—';
}

/* ---------------- Axios ---------------- */
const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

export default function DisplayProducts() {
  const history = useHistory();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Search
  const [search, setSearch] = useState('');

  // Selection
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [deleting, setDeleting] = useState(false);

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
        e?.response?.data?.message ||
          e?.message ||
          'Failed to load products. Check backend is running.'
      );
      setProducts([]);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = safeStr(search).trim().toLowerCase();
    if (!q) return products;

    return products.filter((p) => {
      const name = safeStr(p?.name).toLowerCase();
      const desc = safeStr(p?.description).toLowerCase();

      // include ml fields into search
      const qtyMl = safeStr(
        p?.availableMl ??
          p?.availableML ??
          p?.volumeMl ??
          p?.volumeML ??
          p?.sizeMl ??
          p?.sizeML ??
          p?.ml ??
          p?.ML ??
          p?.quantity ??
          ''
      ).toLowerCase();

      const price = safeStr(p?.price).toLowerCase();

      return (
        name.includes(q) ||
        desc.includes(q) ||
        qtyMl.includes(q) ||
        price.includes(q)
      );
    });
  }, [products, search]);

  const count = useMemo(() => filteredProducts.length, [filteredProducts]);

  // Selection helpers
  const isSelected = (id) => selectedIds.has(id);

  function toggleSelected(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function selectAllFiltered() {
    setSelectedIds(() => {
      const next = new Set();
      filteredProducts.forEach((p) => next.add(getId(p)));
      return next;
    });
  }

  async function deleteSelected() {
    const ids = Array.from(selectedIds || []);
    if (ids.length === 0) return;

    setError('');
    setInfo('');

    const ok = window.confirm(`Delete ${ids.length} selected product(s)?`);
    if (!ok) return;

    setDeleting(true);
    try {
      for (const id of ids) {
        // eslint-disable-next-line no-await-in-loop
        await api.delete(`/products/${id}`);
      }

      setProducts((prev) => prev.filter((p) => !selectedIds.has(getId(p))));
      setSelectedIds(new Set());
      setInfo(`✅ Deleted ${ids.length} product(s).`);
    } catch (e) {
      console.error('Delete selected error:', e);
      setError(
        e?.response?.data?.message ||
          e?.message ||
          'Failed to delete selected products.'
      );
    } finally {
      setDeleting(false);
    }
  }

  function goToBuyProduct(productId) {
    // ✅ Redirect to BuyProduct page with product id
    history.push(`/buyProduct/${encodeURIComponent(productId)}`);
  }

  return (
    <section className="best-products-section" id="products">
      <div className="container-inner">
        {/* Titles */}
        <h1 className="category-title">Best Products</h1>
        <h2 className="fregnance-title">Best Sellers Products</h2>
        <p className="description-style">
          The stylish and organized perfume products crafted for every mood and
          moment.
        </p>

        {/* Toolbar */}
        <div className="dp-toolbar">
          <div className="dp-search">
            <input
              className="form-control dp-search-input"
              type="text"
              value={search}
              placeholder="Search by name, description, quantity (ml), price..."
              onChange={(e) => setSearch(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="dp-actions">
            <span className="dp-count-pill">{count} items</span>

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

        {/* Selection Bar */}
        <div className="dp-selectbar">
          <div className="dp-select-left">
            <span className="dp-selected-pill">
              Selected: {selectedIds.size}
            </span>

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

        {/* Alerts */}
        {error ? (
          <div className="alert alert-danger mx-auto dp-alert" role="alert">
            {error}
          </div>
        ) : null}

        {info ? (
          <div className="alert alert-success mx-auto dp-alert" role="alert">
            {info}
          </div>
        ) : null}

        {/* Content */}
        {loading ? (
          <p className="text-muted">Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-muted">
            No products found{search.trim() ? ' for your search.' : '.'}
          </p>
        ) : (
          <div className="row row-cols-1 row-cols-md-3 g-5 w-100 mx-auto cards-grid">
            {filteredProducts.map((p) => {
              const id = getId(p);
              const imgSrc = getImageSrc(p);
              const qtyMlText = getQuantityMlDisplay(p);

              return (
                <div key={id} className="col product-card">
                  <article className="card premium-card h-100">
                    <div className="image-wrapper">
                      {/* Checkbox */}
                      <label className="dp-check" title="Select">
                        <input
                          type="checkbox"
                          checked={isSelected(id)}
                          onChange={() => toggleSelected(id)}
                        />
                        <span className="dp-check-ui" />
                      </label>

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
                      <h5 className="card-title">
                        {safeStr(p?.name) || 'Untitled'}
                      </h5>
                      <p className="card-text">{safeStr(p?.description)}</p>

                      <div className="product-meta mt-auto">
                        {/* ✅ quantity in ML */}
                        <span className="product-quantity">{qtyMlText}</span>
                        <span className="product-price">
                          {formatPrice(p?.price)}
                        </span>
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
