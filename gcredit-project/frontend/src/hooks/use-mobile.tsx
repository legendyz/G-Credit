import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}

/**
 * Detects tablet viewport (768px ≤ width < 1024px).
 * Used by SidebarProvider to auto-collapse sidebar on tablet.
 */
export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const checkTablet = () => {
      const w = window.innerWidth;
      setIsTablet(w >= MOBILE_BREAKPOINT && w < TABLET_BREAKPOINT);
    };
    const mqlMin = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px)`);
    const mqlMax = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT - 1}px)`);
    mqlMin.addEventListener('change', checkTablet);
    mqlMax.addEventListener('change', checkTablet);
    checkTablet();
    return () => {
      mqlMin.removeEventListener('change', checkTablet);
      mqlMax.removeEventListener('change', checkTablet);
    };
  }, []);

  return !!isTablet;
}
