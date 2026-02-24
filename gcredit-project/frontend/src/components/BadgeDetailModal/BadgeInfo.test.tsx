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

  // Story 12.2: Category color support
  describe('category color skills', () => {
    it('renders object-form skills with category color classes', () => {
      render(
        <BadgeInfo
          description="Test"
          skills={[
            { name: 'React', categoryColor: 'emerald' },
            { name: 'Node.js', categoryColor: 'blue' },
          ]}
          criteria={null}
        />
      );
      const reactChip = screen.getByText('React');
      expect(reactChip.className).toContain('bg-emerald-100');
      expect(reactChip.className).toContain('text-emerald-800');

      const nodeChip = screen.getByText('Node.js');
      expect(nodeChip.className).toContain('bg-blue-100');
      expect(nodeChip.className).toContain('text-blue-800');
    });

    it('renders plain string skills with fallback blue styling', () => {
      render(<BadgeInfo description="Test" skills={['JavaScript']} criteria={null} />);
      const chip = screen.getByText('JavaScript');
      expect(chip.className).toContain('bg-blue-600');
      expect(chip.className).toContain('text-white');
    });

    // Story 12.8: Muted styling for "Unknown Skill"
    it('renders "Unknown Skill" with muted italic styling', () => {
      render(<BadgeInfo description="Test" skills={['Unknown Skill']} criteria={null} />);
      const pill = screen.getByText('Unknown Skill');
      expect(pill.className).toContain('text-muted-foreground');
      expect(pill.className).toContain('italic');
      expect(pill.className).toContain('bg-muted');
      expect(pill.className).not.toContain('bg-blue-600');
    });

    it('renders "Unknown Skill" object with muted italic styling', () => {
      render(
        <BadgeInfo
          description="Test"
          skills={[{ name: 'Unknown Skill', categoryColor: null }]}
          criteria={null}
        />
      );
      const pill = screen.getByText('Unknown Skill');
      expect(pill.className).toContain('text-muted-foreground');
      expect(pill.className).toContain('italic');
      expect(pill.className).not.toContain('bg-blue-600');
    });
  });
});
