/**
 * SkillManagementPage — Story 12.2 (Tasks 4, 6)
 *
 * Split layout: CategoryTree (left) + Skills data table (right)
 * with inline add, edit dialog, delete guard, search, pagination.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { CategoryTree } from '@/components/admin/CategoryTree';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSkillCategoryTree, useSkillCategoryFlat } from '@/hooks/useSkillCategories';
import type { SkillCategory } from '@/hooks/useSkillCategories';
import { useSkills } from '@/hooks/useSkills';
import type { Skill } from '@/components/search/SkillsFilter';
import { useCreateSkill, useUpdateSkill, useDeleteSkill } from '@/hooks/useSkillMutations';
import { getCategoryColorClasses } from '@/lib/categoryColors';
import { sortCategoriesTreeWalk } from '@/lib/categoryTreeSort';

const PAGE_SIZE = 10;
const SKILL_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;

export default function SkillManagementPage() {
  // --- Category tree state ---
  const {
    data: categoryTree = [],
    isLoading: treeLoading,
    isError: treeError,
  } = useSkillCategoryTree();
  const { data: rawFlatCategories = [] } = useSkillCategoryFlat();
  const flatCategories = sortCategoriesTreeWalk(rawFlatCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();

  // --- Skills data ---
  const {
    data: allSkills = [],
    isLoading: skillsLoading,
    isError: skillsError,
  } = useSkills({ categoryId: selectedCategoryId });

  // --- Search ---
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- Filtered + paginated skills ---
  const filteredSkills = useMemo(() => {
    if (!debouncedSearch) return allSkills;
    const q = debouncedSearch.toLowerCase();
    return allSkills.filter((s) => s.name.toLowerCase().includes(q));
  }, [allSkills, debouncedSearch]);

  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => setCurrentPage(1), [selectedCategoryId, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredSkills.length / PAGE_SIZE));
  const paginatedSkills = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSkills.slice(start, start + PAGE_SIZE);
  }, [filteredSkills, currentPage]);

  // --- Inline add ---
  const [isAddingInline, setIsAddingInline] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLevel, setNewLevel] = useState<string>('');
  const [inlineError, setInlineError] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const createSkill = useCreateSkill();

  useEffect(() => {
    if (isAddingInline && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isAddingInline]);

  const handleStartAdd = () => {
    setIsAddingInline(true);
    setNewName('');
    setNewDescription('');
    setNewLevel('');
    setInlineError('');
  };

  const handleCancelAdd = () => {
    setIsAddingInline(false);
    setInlineError('');
  };

  const handleSubmitAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setInlineError('Name is required');
      return;
    }
    if (trimmed.length > 100) {
      setInlineError('Name must be 100 characters or less');
      return;
    }
    if (!selectedCategoryId) {
      setInlineError('Select a category first');
      return;
    }
    setInlineError('');
    createSkill.mutate(
      {
        name: trimmed,
        ...(newDescription.trim() && { description: newDescription.trim() }),
        categoryId: selectedCategoryId,
        ...(newLevel && { level: newLevel }),
      },
      { onSuccess: () => handleCancelAdd() }
    );
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancelAdd();
    } else if (e.key === 'Enter') {
      handleSubmitAdd();
    }
  };

  // Tab-to-submit on last focusable field in inline row
  const handleLastFieldKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancelAdd();
    } else if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      handleSubmitAdd();
    }
  };

  // --- Edit dialog ---
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLevel, setEditLevel] = useState<string>('');
  const [editCategoryId, setEditCategoryId] = useState<string>('');
  const [editError, setEditError] = useState('');

  const updateSkill = useUpdateSkill();

  useEffect(() => {
    if (editingSkill) {
      setEditName(editingSkill.name);
      setEditDescription(editingSkill.description || '');
      setEditLevel(editingSkill.level || '');
      setEditCategoryId(editingSkill.categoryId || '');
      setEditError('');
    }
  }, [editingSkill]);

  const handleSubmitEdit = () => {
    if (!editingSkill) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError('Name is required');
      return;
    }
    if (trimmed.length > 100) {
      setEditError('Name must be 100 characters or less');
      return;
    }
    setEditError('');
    updateSkill.mutate(
      {
        id: editingSkill.id,
        name: trimmed,
        ...(editDescription.trim() ? { description: editDescription.trim() } : {}),
        ...(editLevel ? { level: editLevel } : {}),
        ...(editCategoryId && editCategoryId !== editingSkill.categoryId
          ? { categoryId: editCategoryId }
          : {}),
      },
      { onSuccess: () => setEditingSkill(null) }
    );
  };

  // --- Delete guard ---
  const [deletingSkill, setDeletingSkill] = useState<Skill | null>(null);
  const deleteSkill = useDeleteSkill();

  const handleConfirmDelete = () => {
    if (!deletingSkill) return;
    deleteSkill.mutate(deletingSkill.id, {
      onSuccess: () => setDeletingSkill(null),
      onError: () => setDeletingSkill(null),
    });
  };

  // --- Category select handler ---
  const handleCategorySelect = useCallback((cat: SkillCategory) => {
    setSelectedCategoryId((prev) => (prev === cat.id ? undefined : cat.id));
  }, []);

  // --- Responsive: mobile dropdown for categories ---
  const handleMobileCategoryChange = (value: string) => {
    setSelectedCategoryId(value === '__all__' ? undefined : value);
  };

  // Find the selected category name for display
  const selectedCategoryName = useMemo(() => {
    if (!selectedCategoryId) return null;
    const find = (cats: SkillCategory[]): string | null => {
      for (const c of cats) {
        if (c.id === selectedCategoryId) return c.name;
        if (c.children) {
          const found = find(c.children);
          if (found) return found;
        }
      }
      return null;
    };
    return find(categoryTree);
  }, [selectedCategoryId, categoryTree]);

  const isLoading = treeLoading || skillsLoading;
  const isError = treeError || skillsError;

  return (
    <AdminPageShell
      title="Skill Management"
      description="Manage skills within categories"
      isLoading={isLoading}
      isError={isError}
      onRetry={() => window.location.reload()}
      isEmpty={!isLoading && !isError && categoryTree.length === 0}
      emptyTitle="No skill categories found"
      emptyDescription="Create skill categories first before managing skills."
      actions={
        <Button onClick={handleStartAdd} disabled={!selectedCategoryId || isAddingInline}>
          <Plus className="mr-2 h-4 w-4" />
          Add Skill
        </Button>
      }
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left panel: Category Tree (desktop only) */}
        <aside className="hidden lg:block w-80 shrink-0">
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">Categories</h3>
            <button
              className={`w-full text-left text-sm px-3 py-2 rounded-md mb-2 transition-colors ${
                !selectedCategoryId
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
              onClick={() => setSelectedCategoryId(undefined)}
            >
              All Categories
            </button>
            <CategoryTree
              categories={categoryTree}
              editable={false}
              selectedId={selectedCategoryId}
              onSelect={handleCategorySelect}
            />
          </div>
        </aside>

        {/* Mobile category dropdown */}
        <div className="lg:hidden">
          <Label htmlFor="category-select" className="text-sm font-medium text-neutral-700">
            Category
          </Label>
          <Select
            value={selectedCategoryId || '__all__'}
            onValueChange={handleMobileCategoryChange}
          >
            <SelectTrigger id="category-select" className="mt-1">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Categories</SelectItem>
              {flatCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span style={{ paddingLeft: `${(cat.level - 1) * 16}px` }}>
                    {cat.level > 1 && <span className="text-muted-foreground mr-1">└</span>}
                    {cat.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right panel: Skills table */}
        <div className="flex-1 min-w-0">
          {/* Search bar */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-8"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <span className="text-sm text-neutral-500 whitespace-nowrap">
              {filteredSkills.length} skill{filteredSkills.length !== 1 ? 's' : ''}
              {selectedCategoryName && ` in ${selectedCategoryName}`}
            </span>
          </div>

          {/* Data table */}
          <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[22%]" />
                  <col className="w-[16%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[16%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider hidden md:table-cell">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider hidden sm:table-cell">
                      Level
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider hidden sm:table-cell">
                      Badge Templates
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {/* Inline add row */}
                  {isAddingInline && (
                    <tr className="bg-blue-50/50">
                      <td className="px-4 py-2">
                        <Input
                          ref={nameInputRef}
                          placeholder="Skill name"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onKeyDown={handleInlineKeyDown}
                          className="h-8 text-sm"
                          aria-label="New skill name"
                        />
                        {inlineError && <p className="text-xs text-red-600 mt-1">{inlineError}</p>}
                      </td>
                      <td className="px-4 py-2 hidden md:table-cell">
                        <Input
                          placeholder="Description"
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          onKeyDown={handleInlineKeyDown}
                          className="h-8 text-sm"
                          aria-label="New skill description"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-xs text-neutral-500">
                          {selectedCategoryName || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2 hidden sm:table-cell">
                        <Select value={newLevel} onValueChange={setNewLevel}>
                          <SelectTrigger className="h-8 text-xs" onKeyDown={handleLastFieldKeyDown}>
                            <SelectValue placeholder="Level" />
                          </SelectTrigger>
                          <SelectContent>
                            {SKILL_LEVELS.map((lvl) => (
                              <SelectItem key={lvl} value={lvl} className="text-xs">
                                {lvl}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-2 text-center hidden sm:table-cell">
                        <span className="text-xs text-neutral-400">—</span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleSubmitAdd}
                            disabled={createSkill.isPending}
                            className="h-7 text-xs"
                          >
                            {createSkill.isPending ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelAdd}
                            disabled={createSkill.isPending}
                            className="h-7 text-xs text-neutral-500"
                          >
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Skill rows */}
                  {paginatedSkills.map((skill) => {
                    const colorClasses = getCategoryColorClasses(skill.categoryColor);
                    return (
                      <tr key={skill.id} className="group hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-neutral-900 truncate">
                          {skill.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-600 truncate hidden md:table-cell">
                          {skill.description || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses.bg} ${colorClasses.text}`}
                          >
                            {skill.categoryName || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-600 hidden sm:table-cell">
                          {skill.level || '—'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-neutral-600 hidden sm:table-cell">
                          {(skill.badgeCount ?? 0) > 0 ? (
                            <span className="relative group/tmpl cursor-help">
                              <span className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-700 border border-brand-200">
                                {skill.badgeCount}
                              </span>
                              <span className="invisible group-hover/tmpl:visible absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-2 rounded-lg bg-neutral-800 text-white text-xs shadow-lg whitespace-pre-line">
                                <span className="font-semibold">Used by:</span>
                                {skill.templateNames?.map((name) => (
                                  <span key={name} className="block mt-0.5">
                                    • {name}
                                  </span>
                                ))}
                                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-800" />
                              </span>
                            </span>
                          ) : (
                            <span className="text-neutral-400">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingSkill(skill)}
                              className="h-7 w-7 p-0"
                              aria-label={`Edit ${skill.name}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {(skill.badgeCount ?? 0) > 0 ? (
                              <span
                                title={`Cannot delete: used by ${skill.badgeCount} badge template(s)`}
                              >
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled
                                  className="h-7 w-7 p-0 text-neutral-300 cursor-not-allowed"
                                  aria-label={`Delete ${skill.name}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeletingSkill(skill)}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                aria-label={`Delete ${skill.name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Empty state */}
                  {!isAddingInline && paginatedSkills.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <p className="text-sm text-neutral-500">
                          {debouncedSearch
                            ? `No skills match "${debouncedSearch}"`
                            : selectedCategoryId
                              ? 'No skills in this category. Click "Add Skill" to create one.'
                              : 'No skills found. Select a category and add skills.'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredSkills.length > PAGE_SIZE && (
              <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-3">
                <div className="text-sm text-neutral-600">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1} to{' '}
                  {Math.min(currentPage * PAGE_SIZE, filteredSkills.length)} of{' '}
                  {filteredSkills.length} skills
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={currentPage <= 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-neutral-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage >= totalPages}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Skill Dialog */}
      <Dialog open={!!editingSkill} onOpenChange={(open) => !open && setEditingSkill(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
            <DialogDescription>Update the skill details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={100}
                className="mt-1"
              />
              {editError && <p className="text-xs text-red-600 mt-1">{editError}</p>}
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-level">Level</Label>
              <Select value={editLevel} onValueChange={setEditLevel}>
                <SelectTrigger id="edit-level" className="mt-1">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map((lvl) => (
                    <SelectItem key={lvl} value={lvl}>
                      {lvl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                <SelectTrigger id="edit-category" className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {flatCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span style={{ paddingLeft: `${(cat.level - 1) * 16}px` }}>
                        {cat.level > 1 && <span className="text-muted-foreground mr-1">└</span>}
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingSkill(null)}
              disabled={updateSkill.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitEdit} disabled={updateSkill.isPending}>
              {updateSkill.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deletingSkill}
        onOpenChange={(open) => !open && setDeletingSkill(null)}
        title={`Delete "${deletingSkill?.name}"?`}
        description="This skill will be permanently removed."
        variant="danger"
        confirmLabel="Delete"
        loading={deleteSkill.isPending}
        onConfirm={handleConfirmDelete}
      />
    </AdminPageShell>
  );
}
