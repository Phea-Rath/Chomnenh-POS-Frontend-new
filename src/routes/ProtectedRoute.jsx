import React from 'react';
import { Navigate } from 'react-router';
import { getToken } from '@/utils/tokenStore';

/**
 * Route guard that redirects unauthenticated users to login page.
 * Token is read from in-memory tokenStore (XSS-safe) — NOT localStorage.
 * Falls back to userId for page-refresh edge cases.
 */
export function ProtectedRoute({ children }) {
  const token = getToken();
  const userId = localStorage.getItem('userId');

  if (!token && !userId) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
