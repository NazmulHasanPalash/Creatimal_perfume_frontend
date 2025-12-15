// src/page/Login/Login.js
// React Router v5 version (uses useHistory)

import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  linkWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth';

// ✅ Import from your singleton initializer (src/firebase.init.js)
import { auth, googleProvider } from '../../Components/Firebase/firebase.init';

import './Login.css';
import { useHistory, useLocation } from 'react-router-dom';

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false); // guard against double clicks

  // For linking Google -> password account flow
  const [pendingGoogleCred, setPendingGoogleCred] = useState(null); // AuthCredential | null
  const [emailToLink, setEmailToLink] = useState(''); // email captured from Google error

  const location = useLocation();
  const history = useHistory();
  const redirectUri =
    (location.state &&
      (location.state.from?.pathname || location.state.from)) ||
    '/home';

  // ---------- Google Login (with linking if email already exists) ----------
  const handleGoogleLogin = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      setError('');
      await signInWithPopup(auth, googleProvider);
      toast.success('Google Sign-In Successful 🎉');
      history.push(redirectUri);
    } catch (err) {
      // If the email is already in use by a password user, ask the user to login with password once, then link Google.
      if (err?.code === 'auth/account-exists-with-different-credential') {
        const emailFromErr = err?.customData?.email || '';
        const cred = GoogleAuthProvider.credentialFromError(err);

        setPendingGoogleCred(cred || null);
        setEmail(emailFromErr);
        setEmailToLink(emailFromErr);
        setIsLogin(true); // switch to login view

        const msg =
          'This email already has a password account. Please sign in with email & password to link Google.';
        setError(msg);
        toast.info(msg);
        return;
      }

      const msg = err?.message || 'Google sign-in failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Register / Login ----------
  const handleRegistration = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // basic checks only for signup
    if (!isLogin) {
      if (password.length < 8) {
        const msg = 'Password must be at least 8 characters long.';
        setError(msg);
        toast.error(msg);
        return;
      }
      if (!/(?=.*[A-Z])/.test(password)) {
        const msg = 'Password must contain 1 uppercase letter.';
        setError(msg);
        toast.error(msg);
        return;
      }
    }

    try {
      setSubmitting(true);
      setError('');
      if (isLogin) {
        await processLogin(email, password);
      } else {
        await registerNewUser(email, password);
      }
    } catch (err) {
      const msg = err?.message || 'Authentication failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const processLogin = async (emailArg, passwordArg) => {
    await signInWithEmailAndPassword(auth, emailArg, passwordArg);
    setError('');

    // If we came from a Google popup that said "account exists", link now
    if (
      pendingGoogleCred &&
      auth.currentUser &&
      emailToLink &&
      emailToLink.toLowerCase() === String(emailArg).toLowerCase()
    ) {
      try {
        await linkWithCredential(auth.currentUser, pendingGoogleCred);
        toast.success('Google has been linked to your account ✅');
      } catch (linkErr) {
        toast.error(
          linkErr?.code === 'auth/credential-already-in-use'
            ? 'That Google account is already linked to another user.'
            : linkErr?.message || 'Failed to link Google'
        );
      } finally {
        setPendingGoogleCred(null);
        setEmailToLink('');
      }
    }

    toast.success('Login Successful 🎉');
    history.push(redirectUri);
  };

  const registerNewUser = async (emailArg, passwordArg) => {
    await createUserWithEmailAndPassword(auth, emailArg, passwordArg);
    setError('');
    await setUserName();
    await verifyEmail();
    toast.success('Registration Successful 🎉 Please verify your email.');
    setIsLogin(true);
    history.push('/login'); // go to login after sign-up
  };

  const setUserName = async () => {
    const displayName = name.trim();
    if (auth.currentUser && displayName) {
      await updateProfile(auth.currentUser, { displayName });
    }
  };

  const verifyEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  // ---------- Reset Password ----------
  const handleResetPassword = async () => {
    if (submitting) return;
    if (!email) {
      toast.info('Please enter your email.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await sendPasswordResetEmail(auth, email);
      toast.info('Password reset email sent! Check your inbox.');
    } catch (err) {
      const msg = err?.message || 'Failed to send reset email';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-100">
      <div className="card w-100 mx-auto">
        <div className="row g-0 align-items-center">
          {/* Form Section */}
          <div className="col-md-7">
            <div className="card-body w-100 mx-auto">
              <div className="registration-style mx-auto p-5">
                <form onSubmit={handleRegistration} className="w-100">
                  <h3 className="text-dark text-start">
                    {isLogin ? 'Sign In' : 'Sign Up'}
                  </h3>
                  <h6 className="text-body-secondary my-4 text-start">
                    Simplify your workflow in minutes.
                  </h6>

                  {/* Name Field (Sign Up only) */}
                  {!isLogin && (
                    <div className="mb-3">
                      <label htmlFor="inputName" className="form-label">
                        Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="form-control w-75"
                        id="inputName"
                        placeholder="Your Name"
                        autoComplete="name"
                        disabled={submitting}
                      />
                    </div>
                  )}

                  {/* Email */}
                  <div className="mb-3">
                    <label htmlFor="inputEmail3" className="form-label">
                      Email
                    </label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      className="form-control w-75"
                      id="inputEmail3"
                      required
                      placeholder="name@address.com"
                      autoComplete="email"
                      disabled={submitting}
                    />
                  </div>

                  {/* Password */}
                  <div className="mb-3">
                    <label htmlFor="inputPassword3" className="form-label">
                      Password
                    </label>
                    <div className="input-group w-75">
                      <span className="input-group-text">
                        <i className="fas fa-lock" />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="form-control"
                        id="inputPassword3"
                        required
                        placeholder="Enter your password"
                        autoComplete={
                          isLogin ? 'current-password' : 'new-password'
                        }
                        disabled={submitting}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                        disabled={submitting}
                      >
                        <i
                          className={
                            showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'
                          }
                        />
                      </button>
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="mb-3">
                    {isLogin ? (
                      <p>
                        Don’t have an account yet?{' '}
                        <button
                          type="button"
                          className="btn btn-link p-0 align-baseline"
                          onClick={() => setIsLogin(false)}
                          disabled={submitting}
                        >
                          Sign up
                        </button>
                      </p>
                    ) : (
                      <p>
                        Already have an account?{' '}
                        <button
                          type="button"
                          className="btn btn-link p-0 align-baseline"
                          onClick={() => setIsLogin(true)}
                          disabled={submitting}
                        >
                          Sign in
                        </button>
                      </p>
                    )}
                  </div>

                  {/* Error */}
                  {error && <div className="mb-3 text-danger">{error}</div>}

                  {/* Buttons */}
                  <button
                    type="submit"
                    className="btn btn-style btn-primary p-2 w-75 my-3"
                    disabled={submitting}
                  >
                    {submitting
                      ? 'Please wait…'
                      : isLogin
                      ? 'Sign In'
                      : 'Sign Up'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="btn btn-danger btn-style p-2 w-75"
                    disabled={submitting}
                  >
                    Reset Password
                  </button>
                </form>
              </div>

              {/* Google Login */}
              <div className="text-center">
                <h3 className="mt-5 mx-auto">
                  Google Account{' '}
                  <button
                    type="button"
                    className="btn btn-link align-baseline p-0"
                    onClick={handleGoogleLogin}
                    disabled={submitting}
                  >
                    Sign In
                  </button>
                </h3>
              </div>
            </div>
          </div>

          {/* Image Section */}
          <div className="col-md-5 items-center">
            <img
              src="image\perfume\p-1.png"
              className="img-fluid rounded-start"
              alt="cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default Login;