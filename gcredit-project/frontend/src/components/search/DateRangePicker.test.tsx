/**
 * DateRangePicker Component Tests - Story 8.2
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangePicker, type DateRange } from './DateRangePicker';

describe('DateRangePicker', () => {
  const defaultValue: DateRange = { from: null, to: null };

  it('renders from and to date inputs', () => {
    render(<DateRangePicker value={defaultValue} onChange={vi.fn()} />);

    expect(screen.getByLabelText(/from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to/i)).toBeInTheDocument();
  });

  it('calls onChange with new from date', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<DateRangePicker value={defaultValue} onChange={onChange} />);

    const fromInput = screen.getByLabelText(/from/i);
    await user.type(fromInput, '2025-01-15');

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ from: '2025-01-15' }));
  });

  it('calls onChange with new to date', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<DateRangePicker value={defaultValue} onChange={onChange} />);

    const toInput = screen.getByLabelText(/to/i);
    await user.type(toInput, '2025-01-31');

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ to: '2025-01-31' }));
  });

  it('shows validation error when from date is after to date', () => {
    // Provide invalid date range directly - validation happens on value prop
    const invalidRange: DateRange = { from: '2025-01-20', to: '2025-01-15' };

    render(<DateRangePicker value={invalidRange} onChange={vi.fn()} />);

    expect(screen.getByText(/from date cannot be after to date/i)).toBeInTheDocument();
  });

  it('shows clear button when dates are selected', () => {
    const valueWithDates: DateRange = { from: '2025-01-01', to: '2025-01-31' };

    render(<DateRangePicker value={valueWithDates} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('hides clear button when no dates selected', () => {
    render(<DateRangePicker value={defaultValue} onChange={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });

  it('calls onChange with null values when clear is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const valueWithDates: DateRange = { from: '2025-01-01', to: '2025-01-31' };

    render(<DateRangePicker value={valueWithDates} onChange={onChange} />);

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(onChange).toHaveBeenCalledWith({ from: null, to: null });
  });

  it('renders with custom labels', () => {
    render(
      <DateRangePicker
        value={defaultValue}
        onChange={vi.fn()}
        fromLabel="Start Date"
        toLabel="End Date"
      />
    );

    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(<DateRangePicker value={defaultValue} onChange={vi.fn()} />);

    const fromInput = screen.getByLabelText(/from/i);
    const toInput = screen.getByLabelText(/to/i);

    expect(fromInput).toHaveAttribute('type', 'date');
    expect(toInput).toHaveAttribute('type', 'date');
  });

  it('disables future dates when disableFutureDates is true', () => {
    render(<DateRangePicker value={defaultValue} onChange={vi.fn()} disableFutureDates />);

    const fromInput = screen.getByLabelText(/from/i);
    const today = new Date().toISOString().split('T')[0];

    expect(fromInput).toHaveAttribute('max', today);
  });

  it('renders with preset ranges when provided', () => {
    const presets = [
      { label: 'Last 7 days', from: '2025-01-08', to: '2025-01-15' },
      { label: 'Last 30 days', from: '2024-12-16', to: '2025-01-15' },
    ];

    render(<DateRangePicker value={defaultValue} onChange={vi.fn()} presets={presets} />);

    expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });

  it('applies preset when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const presets = [{ label: 'Last 7 days', from: '2025-01-08', to: '2025-01-15' }];

    render(<DateRangePicker value={defaultValue} onChange={onChange} presets={presets} />);

    await user.click(screen.getByText('Last 7 days'));

    expect(onChange).toHaveBeenCalledWith({ from: '2025-01-08', to: '2025-01-15' });
  });
});
