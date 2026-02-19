import { type ReactNode } from 'react';
import { Loader2, AlertCircle, FolderOpen } from 'lucide-react';
import { PageTemplate } from '@/components/layout/PageTemplate';
import { Button } from '@/components/ui/button';

interface AdminPageShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  // State management
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  onRetry?: () => void;
}

export function AdminPageShell({
  title,
  description,
  actions,
  children,
  className,
  isLoading,
  isError,
  error,
  isEmpty,
  emptyTitle = 'No data found',
  emptyDescription = 'Get started by creating your first item.',
  emptyAction,
  onRetry,
}: AdminPageShellProps) {
  // Loading state: centered spinner
  if (isLoading) {
    return (
      <PageTemplate title={title} description={description} className={className}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageTemplate>
    );
  }

  // Error state: alert with retry
  if (isError) {
    return (
      <PageTemplate title={title} description={description} className={className}>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-body text-neutral-600">{error?.message || 'Something went wrong'}</p>
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Try Again
            </Button>
          )}
        </div>
      </PageTemplate>
    );
  }

  // Empty state: icon + CTA
  if (isEmpty) {
    return (
      <PageTemplate title={title} description={description} className={className}>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <FolderOpen className="h-10 w-10 text-neutral-400" />
          <div className="text-center">
            <p className="text-body font-medium text-neutral-700">{emptyTitle}</p>
            <p className="mt-1 text-sm text-neutral-500">{emptyDescription}</p>
          </div>
          {emptyAction}
        </div>
      </PageTemplate>
    );
  }

  // Normal content
  return (
    <PageTemplate title={title} description={description} actions={actions} className={className}>
      {children}
    </PageTemplate>
  );
}
