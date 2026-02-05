/**
 * FilterChips Component Tests - Story 8.2
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterChips, type FilterChip } from './FilterChips';

const mockChips: FilterChip[] = [
  { id: 'status', label: 'Status: Active', value: 'active' },
  { id: 'skills', label: 'Skill: Leadership', value: 'leadership' },
  { id: 'dateRange', label: 'Date: Jan 1 - Jan 31', value: '2025-01-01,2025-01-31' },
];

describe('FilterChips', () => {
  it('renders all filter chips', () => {
    render(<FilterChips chips={mockChips} onRemove={vi.fn()} />);
    
    expect(screen.getByText('Status: Active')).toBeInTheDocument();
    expect(screen.getByText('Skill: Leadership')).toBeInTheDocument();
    expect(screen.getByText('Date: Jan 1 - Jan 31')).toBeInTheDocument();
  });

  it('calls onRemove with chip id when remove button is clicked', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    
    render(<FilterChips chips={mockChips} onRemove={onRemove} />);
    
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[0]);
    
    expect(onRemove).toHaveBeenCalledWith('status');
  });

  it('shows "Clear all" button when 2 or more chips exist', () => {
    render(<FilterChips chips={mockChips} onRemove={vi.fn()} onClearAll={vi.fn()} />);
    
    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
  });

  it('hides "Clear all" button when less than 2 chips exist', () => {
    const singleChip = [mockChips[0]];
    render(<FilterChips chips={singleChip} onRemove={vi.fn()} onClearAll={vi.fn()} />);
    
    expect(screen.queryByRole('button', { name: /clear all/i })).not.toBeInTheDocument();
  });

  it('calls onClearAll when "Clear all" button is clicked', async () => {
    const user = userEvent.setup();
    const onClearAll = vi.fn();
    
    render(<FilterChips chips={mockChips} onRemove={vi.fn()} onClearAll={onClearAll} />);
    
    const clearAllButton = screen.getByRole('button', { name: /clear all/i });
    await user.click(clearAllButton);
    
    expect(onClearAll).toHaveBeenCalled();
  });

  it('renders nothing when no chips provided', () => {
    const { container } = render(<FilterChips chips={[]} onRemove={vi.fn()} />);
    
    expect(container).toBeEmptyDOMElement();
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(<FilterChips chips={mockChips} onRemove={vi.fn()} />);
    
    const chipContainer = screen.getByRole('list', { name: /active filters/i });
    expect(chipContainer).toBeInTheDocument();
    
    const chipItems = screen.getAllByRole('listitem');
    expect(chipItems).toHaveLength(3);
  });

  it('each chip remove button has accessible name', () => {
    render(<FilterChips chips={mockChips} onRemove={vi.fn()} />);
    
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    expect(removeButtons[0]).toHaveAttribute('aria-label', expect.stringContaining('Status'));
  });

  it('shows filter count when showCount is true', () => {
    render(<FilterChips chips={mockChips} onRemove={vi.fn()} showCount />);
    
    expect(screen.getByText(/3 filters/i)).toBeInTheDocument();
  });
});
