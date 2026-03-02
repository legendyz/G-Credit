import type { ReactNode } from 'react';

interface PageTemplateProps {
  /** Page heading (h1) */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Optional action buttons (top-right) */
  actions?: ReactNode;
  /** Page content */
  children: ReactNode;
  /** Additional class for content area */
  className?: string;
  /** Make header sticky at top (for scrollable content pages) */
  stickyHeader?: boolean;
}

export function PageTemplate({
  title,
  description,
  actions,
  children,
  className = '',
  stickyHeader = false,
}: PageTemplateProps) {
  if (stickyHeader) {
    return (
      <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden">
        {/* Page Header - Fixed at top */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-4 md:px-8 md:py-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-h2 font-semibold text-neutral-900">{title}</h1>
              {description && <p className="mt-1 text-body text-neutral-600">{description}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>

        {/* Page Content - fills remaining viewport, no page scroll */}
        <div className={`flex-1 min-h-0 px-4 py-4 md:px-8 ${className}`}>{children}</div>
      </div>
    );
  }

  // Default: non-sticky header
  return (
    <div className={`px-4 py-6 md:px-8 md:py-8 space-y-6 ${className}`}>
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h2 font-semibold text-neutral-900">{title}</h1>
          {description && <p className="mt-1 text-body text-neutral-600">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
