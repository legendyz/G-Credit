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
  requiredRoles?: Array<'ADMIN' | 'ISSUER' | 'EMPLOYEE'>;
  requireManager?: boolean;
}

export function ProtectedRoute({ children, requiredRoles, requireManager }: ProtectedRouteProps) {
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

  // Check role authorization if required (ADR-017 dual-dimension)
  if (requiredRoles && requiredRoles.length > 0 && user) {
    const hasRole = requiredRoles.includes(user.role);
    const isManager = requireManager && (user.isManager ?? false);
    const isAdmin = user.role === 'ADMIN';
    if (!hasRole && !isManager && !isAdmin) {
      // User doesn't have required role - redirect to 403 page
      return <Navigate to="/access-denied" replace />;
    }
  }

  return <>{children}</>;
}

export default ProtectedRoute;
