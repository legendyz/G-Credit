/**
 * BadgeImage Component - Story 8.5: Responsive Design (AC5)
 *
 * Responsive image component with:
 * - Lazy loading (loading="lazy")
 * - Responsive srcset for different screen densities
 * - Skeleton placeholder during load
 * - Responsive sizes based on viewport
 */

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface BadgeImageProps {
  /** Badge image URL */
  src: string | undefined;
  /** Alt text for accessibility */
  alt: string;
  /** Additional CSS classes */
  className?: string;
  /** Size variant - controls base dimensions */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show skeleton while loading */
  showSkeleton?: boolean;
  /** Optional click handler */
  onClick?: () => void;
}

/**
 * Size configurations for badge images
 * Responsive: mobile (1x), tablet (1.5x), desktop (2x)
 */
const SIZE_CONFIG = {
  sm: {
    base: 'w-16 h-16', // 64px
    mobile: 64,
    desktop: 128,
  },
  md: {
    base: 'w-24 h-24 md:w-32 md:h-32', // 96px mobile, 128px desktop
    mobile: 96,
    desktop: 192,
  },
  lg: {
    base: 'w-32 h-32 md:w-40 md:h-40', // 128px mobile, 160px desktop
    mobile: 128,
    desktop: 256,
  },
  xl: {
    base: 'w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56', // 160px → 192px → 224px
    mobile: 160,
    desktop: 320,
  },
} as const;

/**
 * Generate srcset for responsive images
 * Assumes image server supports width parameter (e.g., ?w=400)
 */
function generateSrcSet(src: string, mobileSize: number, desktopSize: number): string {
  // If src already has query params, append with &, otherwise use ?
  const separator = src.includes('?') ? '&' : '?';
  
  return [
    `${src}${separator}w=${mobileSize} ${mobileSize}w`,
    `${src}${separator}w=${Math.round(mobileSize * 1.5)} ${Math.round(mobileSize * 1.5)}w`,
    `${src}${separator}w=${desktopSize} ${desktopSize}w`,
  ].join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
function generateSizes(mobileSize: number, desktopSize: number): string {
  return `(max-width: 767px) ${mobileSize}px, ${desktopSize}px`;
}

export function BadgeImage({
  src,
  alt,
  className = '',
  size = 'md',
  showSkeleton = true,
  onClick,
}: BadgeImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const config = SIZE_CONFIG[size];
  const imageSrc = src || '/placeholder-badge.png';

  // Use srcset only for external images that support sizing
  const useSrcSet = src && (src.includes('cloudinary') || src.includes('imgix') || src.includes('imagekit'));

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className={`relative ${config.base} ${className}`}>
      {/* Skeleton placeholder (Story 8.5 AC5) */}
      {showSkeleton && isLoading && !hasError && (
        <Skeleton className={`absolute inset-0 rounded-lg ${config.base}`} />
      )}

      {/* Badge image with lazy loading */}
      <img
        src={hasError ? '/placeholder-badge.png' : imageSrc}
        srcSet={useSrcSet && !hasError ? generateSrcSet(imageSrc, config.mobile, config.desktop) : undefined}
        sizes={useSrcSet && !hasError ? generateSizes(config.mobile, config.desktop) : undefined}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        className={`
          ${config.base}
          object-contain
          transition-opacity duration-200
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
        `}
      />

      {/* Error state fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

export default BadgeImage;
