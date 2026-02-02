/**
 * SkipLink Component Tests (Story 8.3 - AC5)
 * WCAG 2.4.1 - Bypass Blocks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkipLink } from './SkipLink';

describe('SkipLink', () => {
  let mainContent: HTMLDivElement;

  beforeEach(() => {
    mainContent = document.createElement('div');
    mainContent.id = 'main-content';
    document.body.appendChild(mainContent);
  });

  afterEach(() => {
    document.body.removeChild(mainContent);
  });

  it('should render with default text', () => {
    render(<SkipLink />);
    
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });

  it('should render with custom text', () => {
    render(<SkipLink>Skip navigation</SkipLink>);
    
    expect(screen.getByText('Skip navigation')).toBeInTheDocument();
  });

  it('should have correct href attribute', () => {
    render(<SkipLink targetId="custom-target" />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '#custom-target');
  });

  it('should have skip-link class for styling', () => {
    render(<SkipLink />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveClass('skip-link');
  });

  it('should focus target element on click', () => {
    const focusSpy = vi.spyOn(mainContent, 'focus');
    const scrollSpy = vi.spyOn(mainContent, 'scrollIntoView');
    
    render(<SkipLink />);
    
    const link = screen.getByRole('link');
    fireEvent.click(link);

    expect(focusSpy).toHaveBeenCalled();
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('should focus target element on Enter key', () => {
    const focusSpy = vi.spyOn(mainContent, 'focus');
    
    render(<SkipLink />);
    
    const link = screen.getByRole('link');
    fireEvent.keyDown(link, { key: 'Enter' });

    expect(focusSpy).toHaveBeenCalled();
  });

  it('should focus target element on Space key', () => {
    const focusSpy = vi.spyOn(mainContent, 'focus');
    
    render(<SkipLink />);
    
    const link = screen.getByRole('link');
    fireEvent.keyDown(link, { key: ' ' });

    expect(focusSpy).toHaveBeenCalled();
  });

  it('should set tabindex on target element', () => {
    render(<SkipLink />);
    
    const link = screen.getByRole('link');
    fireEvent.click(link);

    expect(mainContent).toHaveAttribute('tabindex', '-1');
  });

  it('should handle missing target gracefully', () => {
    document.body.removeChild(mainContent);
    
    render(<SkipLink targetId="non-existent" />);
    
    const link = screen.getByRole('link');
    
    // Should not throw
    expect(() => fireEvent.click(link)).not.toThrow();
    
    // Re-add for cleanup
    document.body.appendChild(mainContent);
  });
});
