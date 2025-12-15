// AddProducts.js
import React, { useMemo, useState } from 'react';
import axios from 'axios';
import './AddProducts.css';

const API_BASE = 'http://localhost:5000';

// ---------- helpers ----------
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided.'));
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

function safeStr(v) {
  return v === null || v === undefined ? '' : String(v);
}

// axios instance
const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

const AddProducts = () => {
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

  const canSubmit = useMemo(() => {
    return (
      name.trim() &&
      description.trim() &&
      safeStr(price).trim() &&
      safeStr(quantity).trim() &&
      imageFile &&
      !submitting
    );
  }, [name, description, price, quantity, imageFile, submitting]);

  function resetForm() {
    setName('');
    setPrice('');
    setQuantity('');
    setDescription('');
    setImageFile(null);
    setImagePreview('');
    setError('');
    setSuccess('');

    const fileInput = document.getElementById('product-image-input');
    if (fileInput) fileInput.value = '';
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setError('');
    setSuccess('');

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
    setError('');
    setSuccess('');

    const priceNum = Number(price);

    if (!name.trim()) return setError('Product name is required.');
    if (!description.trim()) return setError('Description is required.');
    if (!safeStr(quantity).trim()) return setError('Quantity is required (e.g., 30 ml).');
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
      return setError('Price must be a number greater than 0.');
    }
    if (!imageFile) return setError('Please choose a product image.');

    setSubmitting(true);
    try {
      // convert image to base64
      const imageUrl = await fileToDataUrl(imageFile);

      const payload = {
        name: name.trim(),
        description: description.trim(),
        quantity: safeStr(quantity).trim(),
        price: priceNum,
        imageUrl,
      };

      await api.post('/products', payload);

      setSuccess('✅ Product added successfully!');
      resetForm();
    } catch (err) {
      console.error('submit error:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to add product.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="add-products-page">
      <div className="add-products-shell">
        <header className="add-products-header">
          <h2 className="add-products-title">Add Products</h2>
         
        </header>

        {error ? <div className="alert alert-error">{error}</div> : null}
        {success ? <div className="alert alert-success">{success}</div> : null}

        <form className="add-products-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label" htmlFor="p-name">Product Name</label>
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
              <label className="form-label" htmlFor="p-price">Price (RM)</label>
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
              <label className="form-label" htmlFor="p-qty">Quantity</label>
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
              <label className="form-label" htmlFor="product-image-input">Product Image</label>
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
              <label className="form-label" htmlFor="p-desc">Description</label>
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
              onClick={resetForm}
              disabled={submitting}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProducts;
