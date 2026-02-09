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
}

export function PageTemplate({
  title,
  description,
  actions,
  children,
  className = '',
}: PageTemplateProps) {
  return (
    <div className={`px-4 py-6 md:px-8 md:py-8 space-y-6 ${className}`}>
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h2 text-neutral-900">{title}</h1>
          {description && <p className="mt-1 text-body text-neutral-600">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
