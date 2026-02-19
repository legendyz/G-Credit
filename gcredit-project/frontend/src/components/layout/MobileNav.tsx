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

  const handleLogout = async () => {
    await logout();
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
    { to: '/', label: 'Dashboard', roles: ['ADMIN', 'ISSUER', 'MANAGER', 'EMPLOYEE'] },
    { to: '/wallet', label: 'My Wallet', roles: ['ADMIN', 'ISSUER', 'MANAGER', 'EMPLOYEE'] },
    { to: '/admin/templates', label: 'Badge Templates', roles: ['ADMIN', 'ISSUER'] },
    { to: '/admin/badges', label: 'Badge Management', roles: ['ADMIN', 'ISSUER', 'MANAGER'] },
    { to: '/admin/bulk-issuance', label: 'Bulk Issuance', roles: ['ADMIN', 'ISSUER'] },
    { to: '/admin/analytics', label: 'Analytics', roles: ['ADMIN', 'ISSUER'] },
    { to: '/admin/users', label: 'Users', roles: ['ADMIN'] },
    { to: '/admin/skills/categories', label: 'Skill Categories', roles: ['ADMIN'] },
    { to: '/profile', label: 'Profile', roles: ['ADMIN', 'ISSUER', 'MANAGER', 'EMPLOYEE'] },
  ];

  const accessibleLinks = navLinks.filter((link) => user?.role && link.roles.includes(user.role));

  return (
    <nav
      className={`bg-white shadow-elevation-1 border-b border-neutral-200 md:hidden ${className}`}
      aria-label="Mobile navigation"
    >
      <div className="flex justify-between items-center h-14 px-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center min-h-[44px] min-w-[44px]"
          aria-label="G-Credit Home"
        >
          <span className="text-lg font-bold text-brand-600">G-Credit</span>
        </Link>

        {/* Hamburger Menu Button - 44×44px touch target */}
        <button
          ref={menuButtonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-11 h-11 text-neutral-700 
                     hover:bg-neutral-100 active:bg-neutral-200 rounded-lg
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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

      {/* Slide-out Drawer - Story 8.5: aria-hidden when closed for assistive tech */}
      <div
        ref={drawerRef}
        id="mobile-nav-drawer"
        role={isOpen ? 'dialog' : undefined}
        aria-modal={isOpen ? true : undefined}
        aria-hidden={!isOpen}
        aria-label={isOpen ? 'Navigation menu' : undefined}
        className={`
          fixed top-0 right-0 h-full w-72 max-w-[80vw]
          bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}
        `}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <span className="text-lg font-semibold text-neutral-900">Menu</span>
          <button
            onClick={() => {
              setIsOpen(false);
              menuButtonRef.current?.focus();
            }}
            className="flex items-center justify-center w-11 h-11 text-neutral-500
                       hover:bg-neutral-100 active:bg-neutral-200 rounded-lg
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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
        <div className="p-4 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center flex-shrink-0"
              aria-hidden="true"
            >
              <span className="text-brand-600 text-sm font-medium">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-neutral-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-neutral-500 capitalize">{user?.role?.toLowerCase()}</p>
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
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500
                      ${
                        isActive
                          ? 'text-brand-600 bg-brand-50'
                          : 'text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200'
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200 bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full min-h-[44px] px-4 py-3
                       text-base font-medium text-error bg-error-light
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
