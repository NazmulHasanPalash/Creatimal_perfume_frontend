// src/Router/PrivateRouter.js  (React Router v5)
import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import useAuth from '../Hooks/useAuth';

const PrivateRouter = ({ children, ...rest }) => {
  const { user, isLoading } = useAuth();

  return (
    <Route
      {...rest}
      render={({ location }) => {
        // ✅ Loading spinner while Firebase restores session
        if (isLoading) {
          return (
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          );
        }

        // ✅ Safe check (user can be null/undefined)
        const email = user?.email;

        return email ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: '/login',
              state: { from: location },
            }}
          />
        );
      }}
    />
  );
};

export default PrivateRouter;
