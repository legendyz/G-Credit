/**
 * Protected Route Component - Story 0.2a: Login & Navigation System
 *
 * Wraps routes that require authentication.
 * Redirects to login if not authenticated.
 * Validates token expiry on first load and attempts refresh if needed.
 */

import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: Array<'ADMIN' | 'ISSUER' | 'MANAGER' | 'EMPLOYEE'>;
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, sessionValidated, validateSession } = useAuthStore();
  const location = useLocation();

  // Validate session once on app startup (checks token expiry, tries refresh)
  useEffect(() => {
    if (!sessionValidated) {
      validateSession();
    }
  }, [sessionValidated, validateSession]);

  // Show loading while validating session
  if (!sessionValidated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    // Redirect to login, preserving the attempted URL (including query string)
    const fullPath = location.pathname + location.search;
    return <Navigate to="/login" state={{ from: fullPath }} replace />;
  }

  // Check role authorization if required
  if (requiredRoles && requiredRoles.length > 0 && user) {
    if (!requiredRoles.includes(user.role)) {
      // User doesn't have required role - redirect to home
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

export default ProtectedRoute;
