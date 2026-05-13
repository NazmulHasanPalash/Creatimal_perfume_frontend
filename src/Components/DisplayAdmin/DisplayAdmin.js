// src/pages/DisplayAdmin/DisplayAdmin.js

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import axios from 'axios';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import './DisplayAdmin.css';

/* =========================================================
   API
========================================================= */

const API_BASE = String(
  process.env.REACT_APP_API_BASE ||
    'https://creatimal-charmon-perfume-backend.vercel.app'
)
  .trim()
  .replace(/\/+$/, '');

const ADMINS_ENDPOINT = '/admins';

const DELETE_ADMIN_ENDPOINT = (key) =>
  `/admins/${encodeURIComponent(String(key || '').trim())}`;

/* =========================================================
   Helpers
========================================================= */

function safeStr(v) {
  return v === null || v === undefined ? '' : String(v);
}

function normalizeEmail(v) {
  return safeStr(v).trim().toLowerCase();
}

function isValidEmail(v) {
  const s = normalizeEmail(v);

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function formatDateTime(v) {
  const s = safeStr(v).trim();

  if (!s) return '—';

  const d = new Date(s);

  if (Number.isNaN(d.getTime())) {
    return s;
  }

  return d.toLocaleString('en-MY', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getId(a, idx) {
  const id = a?._id ?? a?.id ?? a?.uid;

  if (typeof id === 'string' && id.trim()) {
    return id.trim();
  }

  if (id && typeof id === 'object') {
    if (typeof id.$oid === 'string') {
      return id.$oid;
    }

    if (typeof id.toString === 'function') {
      return String(id.toString());
    }
  }

  const email =
    a?.email ||
    a?.adminEmail ||
    a?.userEmail;

  if (email) {
    return normalizeEmail(email);
  }

  return `idx_${idx}`;
}

function getRoleLabel(v) {
  const s = safeStr(v).trim().toLowerCase();

  return s || 'admin';
}

function clsx(...xs) {
  return xs.filter(Boolean).join(' ');
}

function getErrorMessage(err, fallback) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
}

/* =========================================================
   Axios
========================================================= */

const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

/* =========================================================
   Component
========================================================= */

export default function DisplayAdmin() {
  /* =========================================================
     Mounted Ref
  ========================================================= */

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* =========================================================
     Auth State
  ========================================================= */

  const [authLoading, setAuthLoading] = useState(true);

  const [myEmail, setMyEmail] = useState('');
  const [idToken, setIdToken] = useState('');

  /* =========================================================
     Data
  ========================================================= */

  const [loading, setLoading] = useState(false);

  const [admins, setAdmins] = useState([]);

  /* =========================================================
     UI State
  ========================================================= */

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  /* =========================================================
     Form State
  ========================================================= */

  const [newAdminEmail, setNewAdminEmail] =
    useState('');

  /* =========================================================
     Search
  ========================================================= */

  const [search, setSearch] = useState('');

  /* =========================================================
     Selection
  ========================================================= */

  const [selectedId, setSelectedId] =
    useState('');

  const [deleteBusyId, setDeleteBusyId] =
    useState('');

  /* =========================================================
     Memo
  ========================================================= */

  const myEmailNorm = useMemo(
    () => normalizeEmail(myEmail),
    [myEmail]
  );

  /* =========================================================
     Firebase Auth
  ========================================================= */

  useEffect(() => {
    const auth = getAuth();

    let alive = true;

    const unsub = onAuthStateChanged(
      auth,
      async (user) => {
        if (!alive) return;

        setAuthLoading(true);

        setError('');
        setInfo('');

        try {
          if (!user) {
            if (!alive) return;

            localStorage.removeItem(
              'adminEmail'
            );

            setMyEmail('');
            setIdToken('');
            setAdmins([]);
            setSelectedId('');

            setError(
              'You are not logged in. Please login as admin.'
            );

            return;
          }

          const email = safeStr(
            user?.email
          ).trim();

          if (!email || !email.includes('@')) {
            if (!alive) return;

            setMyEmail('');
            setIdToken('');
            setAdmins([]);
            setSelectedId('');

            setError(
              'Your account email is missing. Please login again.'
            );

            return;
          }

          const token =
            await user.getIdToken();

          if (!alive) return;

          setMyEmail(email);
          setIdToken(token);

          localStorage.setItem(
            'adminEmail',
            email
          );
        } catch (err) {
          console.error(
            'Admin auth error:',
            err
          );

          if (!alive) return;

          setMyEmail('');
          setIdToken('');
          setAdmins([]);
          setSelectedId('');

          setError(
            'Failed to verify session. Please logout and login again.'
          );
        } finally {
          if (!alive) return;

          setAuthLoading(false);
        }
      }
    );

    return () => {
      alive = false;
      unsub();
    };
  }, []);

  /* =========================================================
     Load Admins
  ========================================================= */

  const loadAdmins = useCallback(async () => {
    setLoading(true);

    setError('');
    setInfo('');

    try {
      if (!idToken) {
        setAdmins([]);
        setSelectedId('');

        setError('Login required.');

        return;
      }

      const res = await api.get(
        ADMINS_ENDPOINT,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      const data = Array.isArray(res?.data)
        ? [...res.data]
        : [];

      // newest first
      data.sort((a, b) => {
        const ta = new Date(
          a?.createdAt || 0
        ).getTime();

        const tb = new Date(
          b?.createdAt || 0
        ).getTime();

        return tb - ta;
      });

      if (!mountedRef.current) return;

      setAdmins(data);

      // preserve selected row
      setSelectedId((prev) => {
        const exists = data.some(
          (a, idx) =>
            getId(a, idx) === prev
        );

        return exists ? prev : '';
      });
    } catch (err) {
      console.error(
        'Load admins error:',
        err
      );

      if (!mountedRef.current) return;

      const msg = getErrorMessage(
        err,
        'Failed to load admins.'
      );

      if (
        err?.response?.status === 401 ||
        err?.response?.status === 403
      ) {
        setError(
          `${msg} (Access denied)`
        );
      } else {
        setError(msg);
      }

      setAdmins([]);
      setSelectedId('');
    } finally {
      if (!mountedRef.current) return;

      setLoading(false);
    }
  }, [idToken]);

  useEffect(() => {
    if (!authLoading && idToken) {
      loadAdmins();
    }
  }, [authLoading, idToken, loadAdmins]);

  /* =========================================================
     Add Admin
  ========================================================= */

  const addAdmin = useCallback(
    async (e) => {
      e.preventDefault();

      setError('');
      setInfo('');

      if (!idToken) {
        setError('Login required.');
        return;
      }

      const email =
        normalizeEmail(newAdminEmail);

      if (!isValidEmail(email)) {
        setError(
          'Please enter a valid email address.'
        );

        return;
      }

      if (email === myEmailNorm) {
        setError(
          'You are already an admin.'
        );

        return;
      }

      try {
        setLoading(true);

        await api.post(
          ADMINS_ENDPOINT,
          {
            email,
            role: 'admin',
          },
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        if (!mountedRef.current) return;

        setInfo(
          `✅ Admin added: ${email}`
        );

        setNewAdminEmail('');

        await loadAdmins();
      } catch (err) {
        console.error(
          'Add admin error:',
          err
        );

        if (!mountedRef.current) return;

        const msg = getErrorMessage(
          err,
          'Failed to add admin.'
        );

        setError(msg);
      } finally {
        if (!mountedRef.current) return;

        setLoading(false);
      }
    },
    [
      idToken,
      newAdminEmail,
      myEmailNorm,
      loadAdmins,
    ]
  );

  /* =========================================================
     Toggle Select
  ========================================================= */

  const toggleSelect = useCallback((id) => {
    const sid = safeStr(id).trim();

    if (!sid) return;

    setSelectedId((prev) =>
      prev === sid ? '' : sid
    );
  }, []);

  /* =========================================================
     Delete Admin
  ========================================================= */

  const deleteSelectedAdmin =
    useCallback(async () => {
      setError('');
      setInfo('');

      if (!idToken) {
        setError('Login required.');
        return;
      }

      const id = safeStr(
        selectedId
      ).trim();

      if (!id) {
        setError(
          'Please select an admin.'
        );

        return;
      }

      const row =
        admins.find(
          (a, idx) =>
            getId(a, idx) === id
        ) || null;

      const selectedEmail =
        normalizeEmail(
          row?.email ||
            row?.adminEmail ||
            row?.userEmail
        );

      if (
        selectedEmail &&
        selectedEmail === myEmailNorm
      ) {
        setError(
          'You cannot delete yourself.'
        );

        return;
      }

      const ok = window.confirm(
        `Delete this admin?\n\n${
          selectedEmail ||
          'Selected admin'
        }\n\nThis action cannot be undone.`
      );

      if (!ok) return;

      try {
        setDeleteBusyId(id);

        const deleteKey =
          selectedEmail || id;

        await api.delete(
          DELETE_ADMIN_ENDPOINT(
            deleteKey
          ),
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        if (!mountedRef.current) return;

        setInfo(
          `🗑️ Admin deleted: ${
            selectedEmail || deleteKey
          }`
        );

        setSelectedId('');

        await loadAdmins();
      } catch (err) {
        console.error(
          'Delete admin error:',
          err
        );

        if (!mountedRef.current) return;

        const msg = getErrorMessage(
          err,
          'Failed to delete admin.'
        );

        setError(msg);
      } finally {
        if (!mountedRef.current) return;

        setDeleteBusyId('');
      }
    }, [
      admins,
      idToken,
      selectedId,
      myEmailNorm,
      loadAdmins,
    ]);

  /* =========================================================
     Filtered Admins
  ========================================================= */

  const filteredAdmins = useMemo(() => {
    const q = safeStr(search)
      .trim()
      .toLowerCase();

    if (!q) return admins;

    return admins.filter((a) => {
      const email = normalizeEmail(
        a?.email ||
          a?.adminEmail ||
          a?.userEmail
      );

      const role = safeStr(a?.role)
        .trim()
        .toLowerCase();

      return (
        email.includes(q) ||
        role.includes(q)
      );
    });
  }, [admins, search]);

  /* =========================================================
     Stats
  ========================================================= */

  const stats = useMemo(() => {
    return {
      total: filteredAdmins.length,
      adminCount:
        filteredAdmins.filter(
          (a) =>
            getRoleLabel(a?.role) ===
            'admin'
        ).length,
    };
  }, [filteredAdmins]);

  /* =========================================================
     Selected Row
  ========================================================= */

  const selectedRow = useMemo(() => {
    if (!selectedId) return null;

    return (
      admins.find(
        (a, idx) =>
          getId(a, idx) === selectedId
      ) || null
    );
  }, [admins, selectedId]);

  const selectedEmail = useMemo(() => {
    return normalizeEmail(
      selectedRow?.email ||
        selectedRow?.adminEmail ||
        selectedRow?.userEmail
    );
  }, [selectedRow]);

  /* =========================================================
     UI Flags
  ========================================================= */

  const canRefresh =
    !authLoading &&
    !!idToken &&
    !loading &&
    !deleteBusyId;

  const canSubmit =
    !authLoading &&
    !!idToken &&
    !loading &&
    !deleteBusyId;

  const deleteDisabled =
    authLoading ||
    !idToken ||
    !selectedId ||
    !!deleteBusyId ||
    selectedEmail === myEmailNorm;

  /* =========================================================
     Render
  ========================================================= */

  return (
    <div className="da-page">
      <div className="da-shell">

        {/* Header */}

        <header className="da-header">

          <div className="da-titleWrap">

            <div className="da-kicker">
              Admin Panel
            </div>

            <h1 className="da-title">
              Manage Admins
            </h1>

            <p className="da-subtitle">
              {myEmail ? (
                <>
                  Logged in as{' '}
                  <span className="da-pill">
                    {myEmail}
                  </span>
                </>
              ) : (
                'Please login as admin.'
              )}
            </p>
          </div>

          <div className="da-stats">

            <div className="da-stat">
              <span className="da-statKey">
                Admins
              </span>

              <span className="da-statVal">
                {stats.adminCount}
              </span>
            </div>

            <div className="da-stat">
              <span className="da-statKey">
                Shown
              </span>

              <span className="da-statVal">
                {stats.total}
              </span>
            </div>

            <button
              type="button"
              className="da-btn da-btn-sm"
              onClick={loadAdmins}
              disabled={!canRefresh}
            >
              {loading
                ? 'Loading...'
                : 'Refresh'}
            </button>
          </div>
        </header>

        {/* Alerts */}

        {error && (
          <div className="da-alert da-alert-danger">
            {error}
          </div>
        )}

        {info && (
          <div className="da-alert da-alert-success">
            {info}
          </div>
        )}

        {/* Main Grid */}

        <section className="da-grid">

          {/* Add Admin */}

          <div className="da-card">

            <div className="da-cardHeader">

              <h2 className="da-cardTitle">
                Add New Admin
              </h2>

              <p className="da-cardHint">
                Enter the email address
                to assign admin access.
              </p>
            </div>

            <form
              className="da-form"
              onSubmit={addAdmin}
              noValidate
            >

              <div className="da-field">

                <label className="da-label">
                  User Email
                </label>

                <input
                  className="da-input"
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) =>
                    setNewAdminEmail(
                      e.target.value
                    )
                  }
                  placeholder="user@example.com"
                  autoComplete="email"
                  disabled={
                    authLoading ||
                    !idToken ||
                    loading ||
                    !!deleteBusyId
                  }
                />

                <div className="da-help">
                  Admin permission
                  required.
                </div>
              </div>

              <button
                type="submit"
                className="da-btn da-btn-primary"
                disabled={!canSubmit}
              >
                {loading
                  ? 'Saving...'
                  : 'Add Admin'}
              </button>
            </form>

            <div className="da-divider" />

            <div className="da-selectedCard">

              <div className="da-selectedLabel">
                Selected Admin
              </div>

              <div className="da-selectedValue">
                {selectedEmail ? (
                  <>
                    <span
                      className="da-dot"
                      aria-hidden="true"
                    />

                    <span className="da-ellipsis">
                      {selectedEmail}
                    </span>
                  </>
                ) : (
                  <span className="da-dim">
                    None
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Table */}

          <div className="da-card">

            <div className="da-cardHeader da-cardHeaderRow">

              <div>
                <h2 className="da-cardTitle">
                  Admins
                </h2>

                <p className="da-cardHint">
                  Click a row to select
                  or unselect.
                </p>
              </div>

              <div className="da-toolsRight">

                <div className="da-searchWrap">
                  <input
                    className="da-input da-input-sm"
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search..."
                    autoComplete="off"
                    disabled={authLoading}
                  />
                </div>

                <button
                  type="button"
                  className="da-btn da-btn-danger"
                  onClick={
                    deleteSelectedAdmin
                  }
                  disabled={deleteDisabled}
                >
                  {deleteBusyId
                    ? 'Deleting...'
                    : 'Delete Selected'}
                </button>
              </div>
            </div>

            {authLoading ? (
              <div className="da-loading">
                Checking login...
              </div>
            ) : loading ? (
              <div className="da-loading">
                Loading admins...
              </div>
            ) : !idToken ? (
              <div className="da-empty">

                <div className="da-emptyTitle">
                  Not logged in
                </div>

                <div className="da-emptyText">
                  Login as admin to
                  continue.
                </div>
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="da-empty">

                <div className="da-emptyTitle">
                  No admins found
                </div>

                <div className="da-emptyText">
                  Try another search.
                </div>
              </div>
            ) : (

              <div className="da-tableWrap">

                <div
                  className="da-tableScroll"
                  role="region"
                  aria-label="Scrollable admin table"
                >

                  <table className="da-table">

                    <thead>
                      <tr>
                        <th>Select</th>
                        <th>#</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Created At</th>
                        <th>Updated At</th>
                        <th>Admin ID</th>
                      </tr>
                    </thead>

                    <tbody>

                      {filteredAdmins.map(
                        (a, idx) => {
                          const id = getId(
                            a,
                            idx
                          );

                          const email =
                            safeStr(
                              a?.email ||
                                a?.adminEmail ||
                                a?.userEmail
                            ) || '—';

                          const role =
                            getRoleLabel(
                              a?.role
                            );

                          const createdAt =
                            formatDateTime(
                              a?.createdAt
                            );

                          const updatedAt =
                            formatDateTime(
                              a?.updatedAt
                            );

                          const isSelected =
                            selectedId === id;

                          const emailNorm =
                            normalizeEmail(
                              email
                            );

                          const isMe =
                            emailNorm ===
                            myEmailNorm;

                          return (
                            <tr
                              key={id}
                              className={clsx(
                                isSelected &&
                                  'is-selected'
                              )}
                              onClick={() =>
                                toggleSelect(
                                  id
                                )
                              }
                            >

                              <td
                                onClick={(e) =>
                                  e.stopPropagation()
                                }
                              >

                                <input
                                  type="checkbox"
                                  checked={
                                    isSelected
                                  }
                                  onChange={() =>
                                    toggleSelect(
                                      id
                                    )
                                  }
                                  aria-label={`Select ${email}`}
                                />
                              </td>

                              <td className="da-mono">
                                {idx + 1}
                              </td>

                              <td>
                                <div className="da-emailCell">

                                  <span
                                    className="da-avatarMini"
                                    aria-hidden="true"
                                  >
                                    {emailNorm
                                      .slice(0, 1)
                                      .toUpperCase() ||
                                      'A'}
                                  </span>

                                  <span className="da-ellipsis">
                                    {email}
                                  </span>

                                  {isMe && (
                                    <span className="da-meTag">
                                      You
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td>
                                <span
                                  className={`da-badge da-badge-${role}`}
                                >
                                  {role}
                                </span>
                              </td>

                              <td className="da-dim">
                                {createdAt}
                              </td>

                              <td className="da-dim">
                                {updatedAt}
                              </td>

                              <td className="da-mono da-dim">
                                {id}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="da-tableNote">
                  Tip: Swipe sideways on
                  mobile to see more
                  columns.
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}