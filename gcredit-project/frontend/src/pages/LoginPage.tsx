/**
 * Login Page - Story 0.2a: Login & Navigation System
 * 
 * Minimal login page for UAT testing.
 * Features: email/password form, error handling, redirect on success.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/authStore';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  const { login, isLoading, error, isAuthenticated, clearError } = useAuthStore();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: string })?.from || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);
  
  // Clear error on unmount
  useEffect(() => {
    return () => clearError();
  }, [clearError]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter both email and password');
      return;
    }
    
    try {
      await login(email, password);
      toast.success('Login successful', {
        description: 'Welcome back!',
      });
      
      // Navigate to intended destination or home
      const from = (location.state as { from?: string })?.from || '/';
      navigate(from, { replace: true });
    } catch (err) {
      toast.error('Login failed', {
        description: err instanceof Error ? err.message : 'Please check your credentials',
      });
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">G-Credit</h1>
          <p className="text-gray-600 mt-2">Badge Management System</p>
        </div>
        
        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign In</h2>
          
          {/* Error Alert */}
          {error && (
            <div 
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
              role="alert"
            >
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                         placeholder-gray-400 focus:outline-none focus:ring-2 
                         focus:ring-blue-500 focus:border-blue-500
                         disabled:bg-gray-100 disabled:cursor-not-allowed"
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>
            
            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                         placeholder-gray-400 focus:outline-none focus:ring-2 
                         focus:ring-blue-500 focus:border-blue-500
                         disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm 
                       text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                       disabled:bg-blue-400 disabled:cursor-not-allowed
                       transition-colors duration-200"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg 
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          {/* Help Text */}
          <p className="mt-6 text-center text-xs text-gray-500">
            Contact your administrator if you need access
          </p>
        </div>
        
        {/* Footer */}
        <p className="mt-4 text-center text-xs text-gray-500">
          © 2026 G-Credit. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
