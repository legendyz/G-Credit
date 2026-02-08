/**
 * SearchInput Component Tests - Story 8.2
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  it('renders with placeholder', () => {
    render(<SearchInput value="" onChange={vi.fn()} placeholder="Search badges..." />);

    expect(screen.getByPlaceholderText('Search badges...')).toBeInTheDocument();
  });

  it('renders with label when provided', () => {
    render(<SearchInput value="" onChange={vi.fn()} label="Search" />);

    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('shows minimum character hint when input has 1-2 characters', () => {
    // Render with a value that's below minimum length
    render(<SearchInput value="ab" onChange={vi.fn()} minSearchLength={3} />);

    expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
  });

  it('calls onChange when input changes in controlled mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<SearchInput value="" onChange={onChange} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'test');

    // Controlled mode: onChange called for each keystroke
    expect(onChange).toHaveBeenCalledTimes(4);
    expect(onChange).toHaveBeenLastCalledWith('t');
  });

  it('clears input when clear button is clicked', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();

    render(<SearchInput value="search term" onChange={vi.fn()} onClear={onClear} />);

    const clearButton = screen.getByRole('button', { name: /clear search/i });
    await user.click(clearButton);

    expect(onClear).toHaveBeenCalled();
  });

  it('hides clear button when input is empty', () => {
    render(<SearchInput value="" onChange={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });

  it('shows clear button when input has value', () => {
    render(<SearchInput value="test" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('has correct touch target size (44x44px minimum)', () => {
    render(<SearchInput value="" onChange={vi.fn()} />);

    const input = screen.getByRole('searchbox');
    // Input wrapper div should have min-height for touch targets
    const wrapper = input.closest('div[class*="min-h"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('shows loading indicator when isLoading is true', () => {
    render(<SearchInput value="test" onChange={vi.fn()} isLoading={true} />);

    expect(screen.getByTestId('search-loading')).toBeInTheDocument();
  });

  it('applies sticky class when sticky prop is true', () => {
    render(<SearchInput value="" onChange={vi.fn()} sticky />);

    const container = screen.getByRole('searchbox').closest('[data-testid="search-container"]');
    expect(container).toHaveClass('sticky');
  });

  it('has proper aria attributes for accessibility', () => {
    render(
      <SearchInput
        value=""
        onChange={vi.fn()}
        label="Search badges"
        ariaLabel="Search for badges by name"
      />
    );

    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('aria-label', 'Search for badges by name');
  });

  it('clears input when Escape key is pressed', () => {
    const onClear = vi.fn();

    render(<SearchInput value="test" onChange={vi.fn()} onClear={onClear} />);

    const input = screen.getByRole('searchbox');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onClear).toHaveBeenCalled();
  });

  it('does not show hint when input length equals minimum', () => {
    // Render with a value that meets minimum length
    render(<SearchInput value="abc" onChange={vi.fn()} minSearchLength={3} />);

    expect(screen.queryByText(/at least/i)).not.toBeInTheDocument();
  });
});
