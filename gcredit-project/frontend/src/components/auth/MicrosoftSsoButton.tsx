/**
 * Microsoft SSO Button - Story 13.4: Login Page Dual Entry
 *
 * Follows Microsoft identity branding guidelines:
 * https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-branding-in-apps
 *
 * Light theme: white background (#FFFFFF), dark text (#2F2F2F), 1px #8C8C8C border
 * // TODO: dark mode variant
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

const MicrosoftLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="21"
    height="21"
    viewBox="0 0 21 21"
    aria-hidden="true"
  >
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

const LoadingSpinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-[#2F2F2F]"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

interface MicrosoftSsoButtonProps {
  className?: string;
  disabled?: boolean;
}

export function MicrosoftSsoButton({ className, disabled }: MicrosoftSsoButtonProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleClick = () => {
    if (isRedirecting || disabled) return;
    setIsRedirecting(true);
    window.location.href = '/api/auth/sso/login';
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isRedirecting || disabled}
      aria-label="Sign in with Microsoft"
      className={cn(
        'flex items-center justify-center gap-3 w-full px-6 py-3',
        'bg-white text-[#2F2F2F] border border-[#8C8C8C] rounded-md',
        'text-sm font-semibold',
        'hover:bg-neutral-50 active:bg-neutral-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-200',
        className
      )}
    >
      {isRedirecting ? (
        <>
          <LoadingSpinner />
          <span>Redirecting…</span>
        </>
      ) : (
        <>
          <MicrosoftLogo />
          <span>Sign in with Microsoft</span>
        </>
      )}
    </button>
  );
}
