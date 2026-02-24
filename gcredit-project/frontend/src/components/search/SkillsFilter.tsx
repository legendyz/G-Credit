/**
 * SkillsFilter Component - Story 8.2 (AC4)
 *
 * Multi-select dropdown for filtering by skills with collapsible category tree.
 * - L1 categories shown by default (collapsed), expand to L2 → L3 → skills
 * - Search auto-expands and shows flat matching results
 * - Color dots on L1 category headers
 * - Checkbox selection with count badge
 *
 * WCAG Compliance:
 * - Proper listbox semantics
 * - Keyboard navigation
 * - Focus management
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Check, X, Search } from 'lucide-react';
import { getCategoryColorClasses } from '@/lib/categoryColors';
import type { SkillCategory } from '@/hooks/useSkillCategories';

export interface Skill {
  id: string;
  name: string;
  categoryName?: string;
  categoryColor?: string | null;
  categoryId?: string;
  rootCategoryName?: string;
  rootCategoryColor?: string | null;
  subCategoryName?: string;
  l3CategoryName?: string;
  description?: string;
  level?: string;
  badgeCount?: number;
  templateNames?: string[];
}

interface L3Group {
  name: string;
  skills: Skill[];
}

interface SubGroup {
  name: string;
  l3Groups: L3Group[];
  directSkills: Skill[];
}

interface HierarchyGroup {
  rootName: string;
  rootColor?: string | null;
  subGroups: SubGroup[];
  directSkills: Skill[];
}

/** Count total skills in a SubGroup (direct + all L3 groups) */
function countSubGroupSkills(sub: SubGroup): number {
  return sub.directSkills.length + sub.l3Groups.reduce((n, g) => n + g.skills.length, 0);
}

/** Count total skills in a HierarchyGroup */
function countGroupSkills(group: HierarchyGroup): number {
  return (
    group.directSkills.length + group.subGroups.reduce((n, s) => n + countSubGroupSkills(s), 0)
  );
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
  /** Category tree from API — when provided, tree structure comes from this
   *  instead of being reconstructed from skill data */
  categoryTree?: SkillCategory[];
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
  categoryTree,
  showClearButton = false,
  isLoading = false,
  className = '',
  disabled = false,
}: SkillsFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isSearching = searchTerm.length > 0;

  // Filter skills by search term
  const filteredSkills = skills.filter((skill) =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group skills by category if available (flat — for non-hierarchical callers)
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

  // Build a map of categoryId → skills for quick lookup
  const skillsByCategoryId = ((): Map<string, Skill[]> => {
    const map = new Map<string, Skill[]>();
    for (const skill of filteredSkills) {
      const cid = skill.categoryId;
      if (!cid) continue;
      const arr = map.get(cid) ?? [];
      arr.push(skill);
      map.set(cid, arr);
    }
    return map;
  })();

  // Build hierarchy from category tree (authoritative source) or from skill data (fallback)
  const hierarchicalGroups = ((): HierarchyGroup[] | null => {
    if (!groupByCategory) return null;

    // When categoryTree is provided, build from the tree structure
    if (categoryTree && categoryTree.length > 0) {
      return categoryTree.map((l1) => {
        const l1Skills = skillsByCategoryId.get(l1.id) ?? [];
        const subGroups: SubGroup[] = (l1.children ?? []).map((l2) => {
          const l2Skills = skillsByCategoryId.get(l2.id) ?? [];
          const l3Groups: L3Group[] = (l2.children ?? []).map((l3) => ({
            name: l3.name,
            skills: skillsByCategoryId.get(l3.id) ?? [],
          }));
          return {
            name: l2.name,
            directSkills: l2Skills,
            l3Groups,
          };
        });
        return {
          rootName: l1.name,
          rootColor: l1.color,
          subGroups,
          directSkills: l1Skills,
        };
      });
    }

    // Fallback: reconstruct hierarchy from skill data
    const hasHierarchy = filteredSkills.some((s) => s.rootCategoryName);
    if (!hasHierarchy) return null;

    const groupMap = new Map<string, HierarchyGroup>();

    for (const skill of filteredSkills) {
      const rootName = skill.rootCategoryName || skill.categoryName || 'Other';
      const rootColor = skill.rootCategoryColor ?? skill.categoryColor;
      const subName = skill.subCategoryName;

      if (!groupMap.has(rootName)) {
        groupMap.set(rootName, {
          rootName,
          rootColor,
          subGroups: [],
          directSkills: [],
        });
      }

      const group = groupMap.get(rootName)!;

      if (subName) {
        let subGroup = group.subGroups.find((sg) => sg.name === subName);
        if (!subGroup) {
          subGroup = { name: subName, l3Groups: [], directSkills: [] };
          group.subGroups.push(subGroup);
        }
        const l3Name = skill.l3CategoryName;
        if (l3Name) {
          let l3Group = subGroup.l3Groups.find((g) => g.name === l3Name);
          if (!l3Group) {
            l3Group = { name: l3Name, skills: [] };
            subGroup.l3Groups.push(l3Group);
          }
          l3Group.skills.push(skill);
        } else {
          subGroup.directSkills.push(skill);
        }
      } else {
        group.directSkills.push(skill);
      }
    }

    return Array.from(groupMap.values());
  })();

  // Toggle expand/collapse for a tree node
  const toggleExpand = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const isExpanded = (key: string) => isSearching || expanded.has(key);

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

  // Render a single skill checkbox item
  const renderSkillItem = (skill: Skill, paddingClass: string) => {
    const isSelected = selectedSkills.includes(skill.id);
    return (
      <button
        key={skill.id}
        type="button"
        onClick={() => toggleSkill(skill.id)}
        className={`
          w-full ${paddingClass} pr-3 py-1.5
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
            border rounded shrink-0
            ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'}
          `}
        >
          {isSelected && <Check className="h-3 w-3 text-white" />}
        </div>
        <span className="text-gray-900 dark:text-white">{skill.name}</span>
      </button>
    );
  };

  // Render the collapsible tree for hierarchical data
  const renderHierarchicalTree = (groups: HierarchyGroup[]) => {
    return groups.map((group) => {
      const colorClasses = getCategoryColorClasses(group.rootColor);
      const l1Key = `l1:${group.rootName}`;
      const l1Open = isExpanded(l1Key);
      const skillCount = countGroupSkills(group);

      return (
        <div key={group.rootName}>
          {/* L1 category row — clickable to expand/collapse */}
          <button
            type="button"
            onClick={() => toggleExpand(l1Key)}
            className="w-full px-3 py-2 flex items-center gap-2 text-left
                       bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800
                       border-b border-gray-100 dark:border-gray-800
                       focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800"
          >
            {l1Open ? (
              <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
            )}
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${colorClasses.dot}`}
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex-1">
              {group.rootName}
            </span>
            <span className="text-xs text-gray-400 tabular-nums">{skillCount}</span>
          </button>

          {/* L1 expanded contents */}
          {l1Open && (
            <div>
              {/* Direct skills under L1 */}
              {group.directSkills.map((skill) => renderSkillItem(skill, 'pl-10'))}

              {/* L2 sub-categories */}
              {group.subGroups.map((sub) => {
                const l2Key = `l2:${group.rootName}/${sub.name}`;
                const l2Open = isExpanded(l2Key);
                const subCount = countSubGroupSkills(sub);

                return (
                  <div key={sub.name}>
                    {/* L2 row */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(l2Key)}
                      className="w-full pl-8 pr-3 py-1.5 flex items-center gap-1.5 text-left
                                 hover:bg-gray-50 dark:hover:bg-gray-800
                                 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800"
                    >
                      {l2Open ? (
                        <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      )}
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex-1">
                        {sub.name}
                      </span>
                      <span className="text-xs text-gray-400 tabular-nums">{subCount}</span>
                    </button>

                    {/* L2 expanded contents */}
                    {l2Open && (
                      <div>
                        {/* Direct skills under L2 */}
                        {sub.directSkills.map((skill) => renderSkillItem(skill, 'pl-14'))}

                        {/* L3 sub-sub-categories */}
                        {sub.l3Groups.map((l3) => {
                          const l3Key = `l3:${group.rootName}/${sub.name}/${l3.name}`;
                          const l3Open = isExpanded(l3Key);

                          return (
                            <div key={l3.name}>
                              {/* L3 row */}
                              <button
                                type="button"
                                onClick={() => toggleExpand(l3Key)}
                                className="w-full pl-12 pr-3 py-1 flex items-center gap-1.5 text-left
                                           hover:bg-gray-50 dark:hover:bg-gray-800
                                           focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800"
                              >
                                {l3Open ? (
                                  <ChevronDown className="h-3 w-3 text-gray-400 shrink-0" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />
                                )}
                                <span className="text-xs text-gray-500 dark:text-gray-500 flex-1">
                                  {l3.name}
                                </span>
                                <span className="text-xs text-gray-400 tabular-nums">
                                  {l3.skills.length}
                                </span>
                              </button>

                              {/* L3 expanded skills */}
                              {l3Open && l3.skills.map((skill) => renderSkillItem(skill, 'pl-16'))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    });
  };

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
            max-h-96 overflow-hidden
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
          <div className="overflow-y-auto max-h-80">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading skills...</div>
            ) : filteredSkills.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No skills found</div>
            ) : isSearching ? (
              /* Search mode: flat list with category breadcrumb */
              filteredSkills.map((skill) => {
                const breadcrumb = [
                  skill.rootCategoryName,
                  skill.subCategoryName,
                  skill.l3CategoryName,
                ]
                  .filter(Boolean)
                  .join(' › ');
                const isSelected = selectedSkills.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggleSkill(skill.id)}
                    className={`
                      w-full px-3 py-2 flex items-center gap-2 text-left
                      hover:bg-gray-100 dark:hover:bg-gray-700
                      focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700
                      ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                    `}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div
                      className={`
                        w-4 h-4 flex items-center justify-center border rounded shrink-0
                        ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'}
                      `}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm text-gray-900 dark:text-white truncate">
                        {skill.name}
                      </span>
                      {breadcrumb && (
                        <span className="text-xs text-gray-400 truncate">{breadcrumb}</span>
                      )}
                    </div>
                  </button>
                );
              })
            ) : hierarchicalGroups ? (
              /* Tree mode: collapsible category hierarchy */
              renderHierarchicalTree(hierarchicalGroups)
            ) : (
              /* Flat grouped display (fallback when hierarchy data not available) */
              Object.entries(groupedSkills).map(([category, categorySkills]) => {
                const firstSkill = categorySkills[0];
                const colorClasses = getCategoryColorClasses(firstSkill?.categoryColor);
                return (
                  <div key={category}>
                    {/* Category header with color dot */}
                    {groupByCategory && Object.keys(groupedSkills).length > 1 && (
                      <div className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${colorClasses.dot}`}
                          aria-hidden="true"
                        />
                        {category}
                      </div>
                    )}
                    {/* Skills in category */}
                    {categorySkills.map((skill) => renderSkillItem(skill, 'px-3'))}
                  </div>
                );
              })
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
