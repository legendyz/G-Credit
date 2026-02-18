import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BadgeInfo from './BadgeInfo';

describe('BadgeInfo', () => {
  const defaultProps = {
    description: 'A test badge description',
    skills: ['TypeScript', 'React'],
    criteria: null as Record<string, unknown> | string | null,
  };

  it('renders description and skills', () => {
    render(<BadgeInfo {...defaultProps} />);
    expect(screen.getByText('A test badge description')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  // Story 11.24 AC-C2: Multi-format criteria support
  describe('criteria rendering', () => {
    it('renders requirements array as bullet list', () => {
      render(
        <BadgeInfo
          {...defaultProps}
          criteria={{ requirements: ['Pass exam', 'Complete project'] }}
        />
      );
      expect(screen.getByText('Earning Criteria')).toBeInTheDocument();
      expect(screen.getByText('Pass exam')).toBeInTheDocument();
      expect(screen.getByText('Complete project')).toBeInTheDocument();
    });

    it('renders { description } format as paragraph', () => {
      render(
        <BadgeInfo
          {...defaultProps}
          criteria={{ type: 'manual', description: 'Complete the course successfully' }}
        />
      );
      expect(screen.getByText('Earning Criteria')).toBeInTheDocument();
      expect(screen.getByText('Complete the course successfully')).toBeInTheDocument();
    });

    it('renders { description } without type field', () => {
      render(<BadgeInfo {...defaultProps} criteria={{ description: 'Finish all modules' }} />);
      expect(screen.getByText('Finish all modules')).toBeInTheDocument();
    });

    it('renders plain string criteria as paragraph', () => {
      render(<BadgeInfo {...defaultProps} criteria="Must score 80% or above" />);
      expect(screen.getByText('Earning Criteria')).toBeInTheDocument();
      expect(screen.getByText('Must score 80% or above')).toBeInTheDocument();
    });

    it('renders nothing for null criteria', () => {
      render(<BadgeInfo {...defaultProps} criteria={null} />);
      expect(screen.queryByText('Earning Criteria')).not.toBeInTheDocument();
    });

    it('renders nothing for empty object criteria', () => {
      render(<BadgeInfo {...defaultProps} criteria={{}} />);
      expect(screen.queryByText('Earning Criteria')).not.toBeInTheDocument();
    });
  });
});
