/**
 * SkillsFilter Component Tests - Story 8.2
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkillsFilter, type Skill } from './SkillsFilter';

const mockSkills: Skill[] = [
  { id: 'skill-1', name: 'Leadership', categoryName: 'Soft Skills' },
  { id: 'skill-2', name: 'Project Management', categoryName: 'Soft Skills' },
  { id: 'skill-3', name: 'JavaScript', categoryName: 'Technical' },
  { id: 'skill-4', name: 'TypeScript', categoryName: 'Technical' },
  { id: 'skill-5', name: 'Communication', categoryName: 'Soft Skills' },
];

describe('SkillsFilter', () => {
  it('renders dropdown button with placeholder', () => {
    render(<SkillsFilter skills={mockSkills} selectedSkills={[]} onChange={vi.fn()} />);

    expect(screen.getByRole('combobox')).toHaveTextContent(/select skills/i);
  });

  it('opens dropdown when button is clicked', async () => {
    const user = userEvent.setup();

    render(<SkillsFilter skills={mockSkills} selectedSkills={[]} onChange={vi.fn()} />);

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('displays all skills in dropdown', async () => {
    const user = userEvent.setup();

    render(<SkillsFilter skills={mockSkills} selectedSkills={[]} onChange={vi.fn()} />);

    await user.click(screen.getByRole('combobox'));

    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByText('Leadership')).toBeInTheDocument();
    expect(within(listbox).getByText('JavaScript')).toBeInTheDocument();
  });

  it('groups skills by category when groupByCategory is true', async () => {
    const user = userEvent.setup();

    render(
      <SkillsFilter skills={mockSkills} selectedSkills={[]} onChange={vi.fn()} groupByCategory />
    );

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByText('Soft Skills')).toBeInTheDocument();
    expect(screen.getByText('Technical')).toBeInTheDocument();
  });

  it('calls onChange when skill is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<SkillsFilter skills={mockSkills} selectedSkills={[]} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Leadership'));

    expect(onChange).toHaveBeenCalledWith(['skill-1']);
  });

  it('adds to selection when another skill is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<SkillsFilter skills={mockSkills} selectedSkills={['skill-1']} onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('JavaScript'));

    expect(onChange).toHaveBeenCalledWith(['skill-1', 'skill-3']);
  });

  it('removes from selection when selected skill is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SkillsFilter
        skills={mockSkills}
        selectedSkills={['skill-1', 'skill-3']}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Leadership'));

    expect(onChange).toHaveBeenCalledWith(['skill-3']);
  });

  it('shows selection count in button when skills selected', () => {
    render(
      <SkillsFilter
        skills={mockSkills}
        selectedSkills={['skill-1', 'skill-3']}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole('combobox')).toHaveTextContent(/2 skills? selected/i);
  });

  it('filters skills by search input', async () => {
    const user = userEvent.setup();

    render(<SkillsFilter skills={mockSkills} selectedSkills={[]} onChange={vi.fn()} searchable />);

    await user.click(screen.getByRole('combobox'));

    const searchInput = screen.getByPlaceholderText(/search skills/i);
    await user.type(searchInput, 'java');

    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.queryByText('Leadership')).not.toBeInTheDocument();
  });

  it('shows "No skills found" when search has no matches', async () => {
    const user = userEvent.setup();

    render(<SkillsFilter skills={mockSkills} selectedSkills={[]} onChange={vi.fn()} searchable />);

    await user.click(screen.getByRole('combobox'));

    const searchInput = screen.getByPlaceholderText(/search skills/i);
    await user.type(searchInput, 'xyz');

    expect(screen.getByText(/no skills found/i)).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <div data-testid="outside">Outside</div>
        <SkillsFilter skills={mockSkills} selectedSkills={[]} onChange={vi.fn()} />
      </div>
    );

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.click(screen.getByTestId('outside'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('has proper ARIA attributes', async () => {
    const user = userEvent.setup();

    render(
      <SkillsFilter
        skills={mockSkills}
        selectedSkills={['skill-1']}
        onChange={vi.fn()}
        label="Filter by skills"
      />
    );

    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(combobox).toHaveAttribute('aria-haspopup', 'listbox');

    await user.click(combobox);

    expect(combobox).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows selected skills as checkmarks in dropdown', async () => {
    const user = userEvent.setup();

    render(<SkillsFilter skills={mockSkills} selectedSkills={['skill-1']} onChange={vi.fn()} />);

    await user.click(screen.getByRole('combobox'));

    const leadershipOption = screen.getByRole('option', { name: /leadership/i });
    expect(leadershipOption).toHaveAttribute('aria-selected', 'true');
  });

  it('clears all selections when external clear button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SkillsFilter
        skills={mockSkills}
        selectedSkills={['skill-1', 'skill-3']}
        onChange={onChange}
        showClearButton
      />
    );

    // The external clear button has specific aria-label
    const clearButton = screen.getByRole('button', { name: /clear skill selection/i });
    await user.click(clearButton);

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
