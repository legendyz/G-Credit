/**
 * TemplateSelector Tests — Story 16.2: Empty state coverage
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TemplateSelector } from './TemplateSelector';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock badgeTemplatesApi
const mockGetActiveTemplates = vi.fn();
vi.mock('../../lib/badgeTemplatesApi', () => ({
  getActiveTemplates: (...args: unknown[]) => mockGetActiveTemplates(...args),
}));

describe('TemplateSelector', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input', async () => {
    mockGetActiveTemplates.mockResolvedValue([
      { id: 'tpl-1', name: 'Cloud Expert', description: 'Cloud cert' },
    ]);

    render(<TemplateSelector onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(mockGetActiveTemplates).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  // Story 16.2: T7 — Empty state when ISSUER has no templates
  it('shows empty state message when no templates are available', async () => {
    mockGetActiveTemplates.mockResolvedValue([]);

    render(<TemplateSelector onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(
        screen.getByText(/No templates available\. Create a template first\./i)
      ).toBeInTheDocument();
    });
  });

  it('does not show empty state while loading', () => {
    // Never resolve — simulates loading state
    mockGetActiveTemplates.mockReturnValue(new Promise(() => {}));

    render(<TemplateSelector onSelect={mockOnSelect} />);

    expect(screen.queryByText(/No templates available/i)).not.toBeInTheDocument();
  });

  it('does not show empty state when templates exist', async () => {
    mockGetActiveTemplates.mockResolvedValue([{ id: 'tpl-1', name: 'Cloud Expert' }]);

    render(<TemplateSelector onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(mockGetActiveTemplates).toHaveBeenCalled();
    });

    expect(screen.queryByText(/No templates available/i)).not.toBeInTheDocument();
  });
});
