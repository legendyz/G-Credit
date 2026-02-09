/**
 * Navbar Component - Story 0.2a: Login & Navigation System
 * Story 8.3: WCAG 2.1 AA Accessibility
 * Story 8.5: Responsive Design - Touch-friendly targets
 *
 * Navigation header with user info and logout functionality.
 * Desktop navigation (hidden on mobile <768px where MobileNav is used).
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isActive = (path: string) => pathname === path;

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav
      className="bg-white shadow-elevation-1 border-b border-neutral-200"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Story 8.5: Touch-friendly size */}
          <Link to="/" className="flex items-center min-h-[44px]" aria-label="G-Credit Home">
            <span className="text-xl font-bold text-brand-600">G-Credit</span>
          </Link>

          {/* Navigation Links - Story 8.5: Touch-friendly padding */}
          <ul className="hidden md:flex items-center space-x-1">
            <li>
              <Link
                to="/"
                className={`px-4 py-3 text-sm font-medium transition-colors rounded-lg min-h-[44px]
                           flex items-center ${
                             isActive('/')
                               ? 'text-brand-600 bg-brand-50'
                               : 'text-neutral-700 hover:text-brand-600 hover:bg-neutral-100 active:bg-neutral-200'
                           }`}
                aria-current={isActive('/') ? 'page' : undefined}
              >
                My Wallet
              </Link>
            </li>

            {/* Admin Links */}
            {user?.role && ['ADMIN', 'ISSUER'].includes(user.role) && (
              <>
                <li>
                  <Link
                    to="/admin/badges"
                    className={`px-4 py-3 text-sm font-medium transition-colors rounded-lg min-h-[44px]
                               flex items-center ${
                                 isActive('/admin/badges')
                                   ? 'text-brand-600 bg-brand-50'
                                   : 'text-neutral-700 hover:text-brand-600 hover:bg-neutral-100 active:bg-neutral-200'
                               }`}
                    aria-current={isActive('/admin/badges') ? 'page' : undefined}
                  >
                    Badge Management
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/bulk-issuance"
                    className={`px-4 py-3 text-sm font-medium transition-colors rounded-lg min-h-[44px]
                               flex items-center ${
                                 isActive('/admin/bulk-issuance')
                                   ? 'text-brand-600 bg-brand-50'
                                   : 'text-neutral-700 hover:text-brand-600 hover:bg-neutral-100 active:bg-neutral-200'
                               }`}
                    aria-current={isActive('/admin/bulk-issuance') ? 'page' : undefined}
                  >
                    Bulk Issuance
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/analytics"
                    className={`px-4 py-3 text-sm font-medium transition-colors rounded-lg min-h-[44px]
                               flex items-center ${
                                 isActive('/admin/analytics')
                                   ? 'text-brand-600 bg-brand-50'
                                   : 'text-neutral-700 hover:text-brand-600 hover:bg-neutral-100 active:bg-neutral-200'
                               }`}
                    aria-current={isActive('/admin/analytics') ? 'page' : undefined}
                  >
                    Analytics
                  </Link>
                </li>
              </>
            )}
          </ul>

          {/* User Menu - Story 8.5: Touch-friendly elements */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* User Info */}
            <div
              className="hidden sm:flex items-center space-x-2"
              aria-label={`Signed in as ${user?.firstName} ${user?.lastName}`}
            >
              <div
                className="w-9 h-9 bg-brand-50 rounded-full flex items-center justify-center"
                aria-hidden="true"
              >
                <span className="text-brand-600 text-sm font-medium">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
              </div>
              <div className="text-sm hidden lg:block">
                <p className="font-medium text-neutral-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-neutral-500 capitalize">{user?.role?.toLowerCase()}</p>
              </div>
            </div>

            {/* Logout Button - Story 8.5: 44×44px touch target */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center min-w-[44px] min-h-[44px]
                         text-neutral-600 hover:text-error hover:bg-error-light active:bg-error-light
                         px-3 py-2 text-sm font-medium transition-colors rounded-lg"
              aria-label="Sign out"
            >
              <span className="hidden sm:inline">Sign Out</span>
              <svg
                className="sm:hidden w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
