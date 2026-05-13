// src/Router/AdminRouter.js  (React Router DOM v5)
import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import useAuth from '../Hooks/useAuth';

/**
 * ✅ AdminRouter (RRD v5)
 * Rules:
 * 1) While Firebase auth is restoring -> show spinner
 * 2) If not logged in -> redirect to /login
 * 3) While admin check is running (only when logged in) -> show spinner
 * 4) If logged in but not admin -> redirect to /
 * 5) If admin -> allow
 *
 * ✅ Fixes:
 * - No "can't access email, user is null" (uses user?.email)
 * - No infinite loading due to isAdmin === null (we only wait while isAdminLoading is true)
 */
const AdminRouter = ({ children, ...rest }) => {
  const { user, isLoading, isAdmin, isAdminLoading } = useAuth();

  return (
    <Route
      {...rest}
      render={({ location }) => {
        // 1) Firebase session restore/loading
        if (isLoading) {
          return (
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          );
        }

        // 2) Not logged in
        const email = user?.email;
        if (!email) {
          return (
            <Redirect
              to={{
                pathname: '/login',
                state: { from: location },
              }}
            />
          );
        }

        // 3) Logged in, admin check running
        if (isAdminLoading) {
          return (
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          );
        }

        // 4) Logged in but not admin
        if (isAdmin !== true) {
          return (
            <Redirect
              to={{
                pathname: '/',
                state: { from: location },
              }}
            />
          );
        }

        // 5) Admin allowed
        return children;
      }}
    />
  );
};

export default AdminRouter;
