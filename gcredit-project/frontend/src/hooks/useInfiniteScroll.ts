/**
 * useInfiniteScroll — IntersectionObserver hook for infinite scroll
 * Story 15.8: Wallet cursor-based infinite scroll
 *
 * Returns a ref to be attached to a sentinel element at the bottom of the list.
 * When the sentinel enters the viewport, fetchNextPage() is called.
 */

import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  /** Whether more pages are available */
  hasNextPage: boolean;
  /** Whether a next page fetch is currently in progress */
  isFetchingNextPage: boolean;
  /** Function to trigger loading the next page */
  fetchNextPage: () => void;
  /** IntersectionObserver rootMargin (default: '200px' for pre-fetching) */
  rootMargin?: string;
  /** Scroll container element to observe within (default: viewport) */
  root?: Element | null;
}

export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  rootMargin = '200px',
  root,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersect, {
      root: root ?? null,
      rootMargin,
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect, rootMargin, root]);

  return sentinelRef;
}
