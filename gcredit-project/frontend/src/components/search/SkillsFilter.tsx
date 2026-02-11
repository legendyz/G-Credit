/**
 * SkillsFilter Component - Story 8.2 (AC4)
 *
 * Multi-select dropdown for filtering by skills:
 * - Checkbox-based selection
 * - Search within skills list
 * - Selected count badge
 * - Clear selection
 *
 * WCAG Compliance:
 * - Proper listbox semantics
 * - Keyboard navigation
 * - Focus management
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

export interface Skill {
  id: string;
  name: string;
  categoryName?: string;
}

export interface SkillsFilterProps {
  /** Available skills to select from */
  skills: Skill[];
  /** Currently selected skill IDs */
  selectedSkills: string[];
  /** Callback when selection changes */
  onChange: (selectedSkills: string[]) => void;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Label for the filter */
  label?: string;
  /** Whether to show search within list */
  searchable?: boolean;
  /** Whether to group skills by category */
  groupByCategory?: boolean;
  /** Whether to show clear button */
  showClearButton?: boolean;
  /** Whether loading skills */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether component is disabled */
  disabled?: boolean;
}

export function SkillsFilter({
  skills,
  selectedSkills,
  onChange,
  placeholder = 'Select skills...',
  label,
  searchable = false,
  groupByCategory = false,
  showClearButton = false,
  isLoading = false,
  className = '',
  disabled = false,
}: SkillsFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter skills by search term
  const filteredSkills = skills.filter((skill) =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group skills by category if available
  const groupedSkills = filteredSkills.reduce(
    (groups, skill) => {
      const category = skill.categoryName || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(skill);
      return groups;
    },
    {} as Record<string, Skill[]>
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Toggle skill selection
  const toggleSkill = useCallback(
    (skillId: string) => {
      if (selectedSkills.includes(skillId)) {
        onChange(selectedSkills.filter((id) => id !== skillId));
      } else {
        onChange([...selectedSkills, skillId]);
      }
    },
    [selectedSkills, onChange]
  );

  // Clear all selections
  const clearAll = useCallback(() => {
    onChange([]);
    setIsOpen(false);
  }, [onChange]);

  // Get display text
  const displayText =
    selectedSkills.length === 0
      ? placeholder
      : `${selectedSkills.length} skill${selectedSkills.length !== 1 ? 's' : ''} selected`;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}

      {/* Container with optional external clear button */}
      <div className="flex items-center gap-2">
        {/* Trigger Button */}
        <button
          type="button"
          role="combobox"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            flex-1 h-11 px-3
            flex items-center justify-between
            bg-white dark:bg-gray-800
            border rounded-lg
          text-sm text-left
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-300 dark:border-gray-600'}
        `}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls="skills-listbox"
        >
          <span
            className={
              selectedSkills.length === 0 ? 'text-gray-400' : 'text-gray-900 dark:text-white'
            }
          >
            {displayText}
          </span>
          <div className="flex items-center gap-1">
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {/* Inline clear button - outside combobox to avoid nested button */}
        {selectedSkills.length > 0 && !disabled && !showClearButton && (
          <button
            type="button"
            onClick={clearAll}
            className="h-11 px-2 text-gray-400 hover:text-gray-600 
                       dark:hover:text-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* External clear button */}
        {showClearButton && selectedSkills.length > 0 && !disabled && (
          <button
            type="button"
            onClick={clearAll}
            className="h-11 px-3 text-sm text-gray-500 hover:text-gray-700 
                       dark:text-gray-400 dark:hover:text-gray-200
                       focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
            aria-label="Clear skill selection"
          >
            Clear
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="
            absolute z-20 mt-1 w-full
            bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            rounded-lg shadow-lg
            max-h-72 overflow-hidden
          "
          role="listbox"
          id="skills-listbox"
          aria-multiselectable="true"
        >
          {/* Search input - only show if searchable */}
          {searchable && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search skills..."
                  className="
                    w-full h-9 pl-9 pr-3
                    text-sm
                    bg-gray-50 dark:bg-gray-900
                    border border-gray-200 dark:border-gray-700
                    rounded-md
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                  "
                />
              </div>
            </div>
          )}

          {/* Skills list */}
          <div className="overflow-y-auto max-h-52">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading skills...</div>
            ) : filteredSkills.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No skills found</div>
            ) : (
              Object.entries(groupedSkills).map(([category, categorySkills]) => (
                <div key={category}>
                  {/* Category header - only show if groupByCategory and multiple categories */}
                  {groupByCategory && Object.keys(groupedSkills).length > 1 && (
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                      {category}
                    </div>
                  )}
                  {/* Skills in category */}
                  {categorySkills.map((skill) => {
                    const isSelected = selectedSkills.includes(skill.id);
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => toggleSkill(skill.id)}
                        className={`
                          w-full px-3 py-2
                          flex items-center gap-2
                          text-sm text-left
                          hover:bg-gray-100 dark:hover:bg-gray-700
                          focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700
                          ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                        `}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div
                          className={`
                            w-4 h-4 flex items-center justify-center
                            border rounded
                            ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-gray-300 dark:border-gray-600'
                            }
                          `}
                        >
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="text-gray-900 dark:text-white">{skill.name}</span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer with selection count */}
          {selectedSkills.length > 0 && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-xs text-gray-500">{selectedSkills.length} selected</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SkillsFilter;
