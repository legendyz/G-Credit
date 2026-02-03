/**
 * MobileNav Component - Story 8.5: Responsive Design (AC1)
 *
 * Mobile navigation with hamburger menu and slide-out drawer.
 * Implements touch-friendly 44×44px targets per Apple HIG and WCAG AAA.
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'sonner';

interface MobileNavProps {
  /** Additional CSS classes */
  className?: string;
}

export function MobileNav({ className = '' }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Focus trap within drawer
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;

    const drawer = drawerRef.current;
    const focusableElements = drawer.querySelectorAll<HTMLElement>(
      'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element when drawer opens
    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    drawer.addEventListener('keydown', handleTabKey);
    return () => drawer.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
    setIsOpen(false);
  };

  const handleBackdropClick = () => {
    setIsOpen(false);
    menuButtonRef.current?.focus();
  };

  if (!isAuthenticated) return null;

  const navLinks = [
    { to: '/', label: 'My Wallet', roles: ['ADMIN', 'ISSUER', 'MANAGER', 'EMPLOYEE'] },
    { to: '/admin/badges', label: 'Badge Management', roles: ['ADMIN', 'ISSUER'] },
    { to: '/admin/analytics', label: 'Analytics', roles: ['ADMIN', 'ISSUER'] },
  ];

  const accessibleLinks = navLinks.filter(
    (link) => user?.role && link.roles.includes(user.role)
  );

  return (
    <nav
      className={`bg-white shadow-sm border-b border-gray-200 md:hidden ${className}`}
      aria-label="Mobile navigation"
    >
      <div className="flex justify-between items-center h-14 px-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center min-h-[44px] min-w-[44px]"
          aria-label="G-Credit Home"
        >
          <span className="text-lg font-bold text-blue-600">G-Credit</span>
        </Link>

        {/* Hamburger Menu Button - 44×44px touch target */}
        <button
          ref={menuButtonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-11 h-11 text-gray-700 
                     hover:bg-gray-100 active:bg-gray-200 rounded-lg
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-expanded={isOpen}
          aria-controls="mobile-nav-drawer"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          {isOpen ? (
            // X icon
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            // Hamburger icon
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Drawer */}
      <div
        ref={drawerRef}
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`
          fixed top-0 right-0 h-full w-72 max-w-[80vw]
          bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <span className="text-lg font-semibold text-gray-900">Menu</span>
          <button
            onClick={() => {
              setIsOpen(false);
              menuButtonRef.current?.focus();
            }}
            className="flex items-center justify-center w-11 h-11 text-gray-500
                       hover:bg-gray-100 active:bg-gray-200 rounded-lg
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"
              aria-hidden="true"
            >
              <span className="text-blue-600 text-sm font-medium">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-gray-500 capitalize">
                {user?.role?.toLowerCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links - 44px minimum height */}
        <nav className="py-2" aria-label="Main menu">
          <ul role="menu" className="space-y-1">
            {accessibleLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <li key={link.to} role="none">
                  <Link
                    to={link.to}
                    role="menuitem"
                    className={`
                      flex items-center min-h-[44px] px-4 py-3
                      text-base font-medium transition-colors
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500
                      ${
                        isActive
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                      }
                    `}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button - at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full min-h-[44px] px-4 py-3
                       text-base font-medium text-red-600 bg-red-50
                       hover:bg-red-100 active:bg-red-200 rounded-lg
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}

export default MobileNav;
