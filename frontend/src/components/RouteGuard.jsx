import React from 'react';
import { Navigate } from 'react-router-dom';
import { getUser, isAuthenticated, getRoleDefaultRoute } from '../lib/auth';

export default function RouteGuard({ allowedRoles = [], children }) {
  const loggedIn = isAuthenticated();
  const user = getUser();

  if (!loggedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const targetRoute = getRoleDefaultRoute(user.role);
    return <Navigate to={targetRoute} replace />;
  }

  return children;
}

export function PublicOnlyGuard({ children }) {
  const loggedIn = isAuthenticated();
  const user = getUser();

  if (loggedIn && user) {
    const targetRoute = getRoleDefaultRoute(user.role);
    return <Navigate to={targetRoute} replace />;
  }

  return children;
}
