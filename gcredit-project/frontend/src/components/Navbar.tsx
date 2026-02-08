/**
 * Navbar Component - Story 0.2a: Login & Navigation System
 * Story 8.3: WCAG 2.1 AA Accessibility
 * Story 8.5: Responsive Design - Touch-friendly targets
 * 
 * Navigation header with user info and logout functionality.
 * Desktop navigation (hidden on mobile <768px where MobileNav is used).
 */

import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  
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
      className="bg-white shadow-sm border-b border-gray-200"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Story 8.5: Touch-friendly size */}
          <Link to="/" className="flex items-center min-h-[44px]" aria-label="G-Credit Home">
            <span className="text-xl font-bold text-blue-600">G-Credit</span>
          </Link>
          
          {/* Navigation Links - Story 8.5: Touch-friendly padding */}
          <div className="hidden md:flex items-center space-x-1" role="menubar">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 active:bg-gray-100
                         px-4 py-3 text-sm font-medium transition-colors rounded-lg min-h-[44px]
                         flex items-center"
              role="menuitem"
            >
              My Wallet
            </Link>
            
            {/* Admin Links */}
            {user?.role && ['ADMIN', 'ISSUER'].includes(user.role) && (
              <>
                <Link 
                  to="/admin/badges" 
                  className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 active:bg-gray-100
                             px-4 py-3 text-sm font-medium transition-colors rounded-lg min-h-[44px]
                             flex items-center"
                  role="menuitem"
                >
                  Badge Management
                </Link>
                <Link 
                  to="/admin/bulk-issuance" 
                  className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 active:bg-gray-100
                             px-4 py-3 text-sm font-medium transition-colors rounded-lg min-h-[44px]
                             flex items-center"
                  role="menuitem"
                >
                  Bulk Issuance
                </Link>
                <Link 
                  to="/admin/analytics" 
                  className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 active:bg-gray-100
                             px-4 py-3 text-sm font-medium transition-colors rounded-lg min-h-[44px]
                             flex items-center"
                  role="menuitem"
                >
                  Analytics
                </Link>
              </>
            )}
          </div>
          
          {/* User Menu - Story 8.5: Touch-friendly elements */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* User Info */}
            <div className="hidden sm:flex items-center space-x-2" aria-label={`Signed in as ${user?.firstName} ${user?.lastName}`}>
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center" aria-hidden="true">
                <span className="text-blue-600 text-sm font-medium">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="text-sm hidden lg:block">
                <p className="font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role?.toLowerCase()}
                </p>
              </div>
            </div>
            
            {/* Logout Button - Story 8.5: 44×44px touch target */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center min-w-[44px] min-h-[44px]
                         text-gray-600 hover:text-red-600 hover:bg-red-50 active:bg-red-100
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
