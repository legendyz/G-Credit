import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminPageShell } from './AdminPageShell';

// Mock PageTemplate to simplify testing
vi.mock('@/components/layout/PageTemplate', () => ({
  PageTemplate: ({
    title,
    description,
    actions,
    children,
  }: {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div data-testid="page-template">
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {actions && <div data-testid="actions">{actions}</div>}
      <div data-testid="content">{children}</div>
    </div>
  ),
}));

describe('AdminPageShell', () => {
  it('renders loading state with spinner', () => {
    render(
      <AdminPageShell title="Test Page" isLoading>
        <div>Content</div>
      </AdminPageShell>
    );

    expect(screen.getByText('Test Page')).toBeInTheDocument();
    // Spinner has animate-spin class
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders error state with message and retry button', () => {
    const onRetry = vi.fn();
    render(
      <AdminPageShell
        title="Test Page"
        isError
        error={new Error('Network error')}
        onRetry={onRetry}
      >
        <div>Content</div>
      </AdminPageShell>
    );

    expect(screen.getByText('Test Page')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders error state with default message when no error provided', () => {
    render(
      <AdminPageShell title="Test Page" isError>
        <div>Content</div>
      </AdminPageShell>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders error state without retry button when onRetry not provided', () => {
    render(
      <AdminPageShell title="Test Page" isError error={new Error('Oops')}>
        <div>Content</div>
      </AdminPageShell>
    );

    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('renders empty state with custom title/description and CTA', () => {
    render(
      <AdminPageShell
        title="Test Page"
        isEmpty
        emptyTitle="No categories"
        emptyDescription="Create one now"
        emptyAction={<button>Create</button>}
      >
        <div>Content</div>
      </AdminPageShell>
    );

    expect(screen.getByText('Test Page')).toBeInTheDocument();
    expect(screen.getByText('No categories')).toBeInTheDocument();
    expect(screen.getByText('Create one now')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders empty state with default title/description', () => {
    render(
      <AdminPageShell title="Test Page" isEmpty>
        <div>Content</div>
      </AdminPageShell>
    );

    expect(screen.getByText('No data found')).toBeInTheDocument();
    expect(screen.getByText('Get started by creating your first item.')).toBeInTheDocument();
  });

  it('renders children in normal state', () => {
    render(
      <AdminPageShell title="Test Page">
        <div>Normal Content</div>
      </AdminPageShell>
    );

    expect(screen.getByText('Test Page')).toBeInTheDocument();
    expect(screen.getByText('Normal Content')).toBeInTheDocument();
  });

  it('passes title, description, actions to PageTemplate', () => {
    render(
      <AdminPageShell
        title="My Title"
        description="My Description"
        actions={<button>Action</button>}
      >
        <div>Content</div>
      </AdminPageShell>
    );

    expect(screen.getByText('My Title')).toBeInTheDocument();
    expect(screen.getByText('My Description')).toBeInTheDocument();
    expect(screen.getByTestId('actions')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });
});
