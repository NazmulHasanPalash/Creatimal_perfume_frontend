// src/pages/AddProducts/AddProducts.js  (React Router DOM v5 - FULL FIXED)
import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useHistory } from 'react-router-dom';
import './AddProducts.css';

const API_BASE = 'https://creatimal-charmon-perfume-backend.vercel.app';

/* ---------- helpers ---------- */
function safeStr(v) {
  return v === null || v === undefined ? '' : String(v);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided.'));
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

// axios instance
const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

export default function AddProducts() {
  const history = useHistory();

  // auth state
  const [authReady, setAuthReady] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const tokenRef = useRef('');

  // form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // ui state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /* =========================
     Firebase token (Admin must be logged in)
     ========================= */
  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          tokenRef.current = '';
          setUserEmail('');
          setAuthReady(true);
          setError('You are not logged in. Please login as admin.');
          return;
        }

        const token = await user.getIdToken();
        tokenRef.current = safeStr(token).trim();
        setUserEmail(safeStr(user.email).trim());
        setAuthReady(true);

        if (!tokenRef.current) {
          setError('Login token missing. Please logout and login again.');
        } else {
          setError('');
        }
      } catch (e) {
        console.error('Auth token error:', e);
        tokenRef.current = '';
        setUserEmail('');
        setAuthReady(true);
        setError('Failed to get login token. Please login again.');
      }
    });

    return () => unsub();
  }, []);

  function getAuthHeadersOrThrow() {
    const token = safeStr(tokenRef.current).trim();
    if (!token) throw new Error('Missing Authorization token. Please login as admin.');
    return { Authorization: `Bearer ${token}` };
  }

  const canSubmit = useMemo(() => {
    return (
      authReady &&
      !!safeStr(tokenRef.current).trim() &&
      name.trim() &&
      description.trim() &&
      safeStr(price).trim() &&
      safeStr(quantity).trim() &&
      !!imageFile &&
      !submitting
    );
  }, [authReady, name, description, price, quantity, imageFile, submitting]);

  function resetForm({ keepMessages = false } = {}) {
    setName('');
    setPrice('');
    setQuantity('');
    setDescription('');
    setImageFile(null);
    setImagePreview('');

    if (!keepMessages) {
      setError('');
      setSuccess('');
    }

    const fileInput = document.getElementById('product-image-input');
    if (fileInput) fileInput.value = '';
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setSuccess('');
    setError('');

    if (!file) {
      setImagePreview('');
      return;
    }

    // warning (not blocking)
    if (file.size > 512000) {
      setError('Image is large. Use smaller image (recommended ≤ 500KB).');
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setImagePreview(dataUrl);
    } catch (err) {
      console.error(err);
      setError('Failed to preview image. Try another image.');
      setImagePreview('');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    setError('');
    setSuccess('');

    try {
      const headers = getAuthHeadersOrThrow();
      const priceNum = Number(price);

      if (!name.trim()) return setError('Product name is required.');
      if (!description.trim()) return setError('Description is required.');
      if (!safeStr(quantity).trim()) return setError('Quantity is required (e.g., 30 ml).');
      if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
        return setError('Price must be a number greater than 0.');
      }
      if (!imageFile) return setError('Please choose a product image.');

      setSubmitting(true);

      const imageUrl = await fileToDataUrl(imageFile);

      const payload = {
        name: name.trim(),
        description: description.trim(),
        quantity: safeStr(quantity).trim(),
        price: priceNum,
        imageUrl,
      };

      await api.post('/products', payload, { headers });

      // ✅ show message + reset inputs (keep success)
      setSuccess('✅ Product added successfully!');
      resetForm({ keepMessages: true });

      // ✅ redirect to "/products" (HashRouter or BrowserRouter both OK)
      // If you want a small delay so user sees success, keep setTimeout.
      setTimeout(() => {
        history.push('/products');
      }, 300);
    } catch (err) {
      console.error('submit error:', err);

      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to add product.';

      if (String(msg).toLowerCase().includes('admin')) {
        setError('Access denied. Admin only.');
      } else if (String(msg).toLowerCase().includes('authorization')) {
        setError('You are not logged in. Please login as admin.');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="add-products-page">
      <div className="add-products-shell">
        <header className="add-products-header">
          <h2 className="add-products-title">Add Products</h2>

          <div className="add-products-hint">
            {authReady
              ? userEmail
                ? `Logged in: ${userEmail}`
                : 'Not logged in'
              : 'Checking login…'}
          </div>
        </header>

        {error ? <div className="alert alert-error">{error}</div> : null}
        {success ? <div className="alert alert-success">{success}</div> : null}

        <form className="add-products-form" onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label" htmlFor="p-name">
                Product Name
              </label>
              <input
                id="p-name"
                className="form-input"
                type="text"
                value={name}
                placeholder="e.g., Confident"
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="p-price">
                Price (RM)
              </label>
              <input
                id="p-price"
                className="form-input"
                type="number"
                value={price}
                placeholder="e.g., 60"
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="p-qty">
                Quantity
              </label>
              <input
                id="p-qty"
                className="form-input"
                type="text"
                value={quantity}
                placeholder="e.g., 30 ml"
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="product-image-input">
                Product Image
              </label>
              <input
                id="product-image-input"
                className="form-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required
              />

              {imagePreview ? (
                <div className="image-preview-box">
                  <img className="image-preview" src={imagePreview} alt="Preview" />
                </div>
              ) : null}
            </div>

            <div className="form-field form-field-full">
              <label className="form-label" htmlFor="p-desc">
                Description
              </label>
              <textarea
                id="p-desc"
                className="form-textarea"
                value={description}
                placeholder="Write a premium product description..."
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-primary" type="submit" disabled={!canSubmit}>
              {submitting ? 'Adding...' : 'Add Product'}
            </button>

            <button
              className="btn-secondary"
              type="button"
              onClick={() => resetForm()}
              disabled={submitting}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
