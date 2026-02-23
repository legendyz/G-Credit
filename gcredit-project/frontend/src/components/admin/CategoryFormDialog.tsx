import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSkillCategoryFlat } from '@/hooks/useSkillCategories';
import type {
  SkillCategory,
  CreateSkillCategoryInput,
  UpdateSkillCategoryInput,
} from '@/hooks/useSkillCategories';

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  category?: SkillCategory;
  parentId?: string;
  onSubmit: (data: CreateSkillCategoryInput | UpdateSkillCategoryInput) => void;
  loading?: boolean;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  mode,
  category,
  parentId,
  onSubmit,
  loading = false,
}: CategoryFormDialogProps) {
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [nameError, setNameError] = useState('');

  const { data: flatCategories } = useSkillCategoryFlat();

  // Filter parent options: only show level 1 and level 2 (max level 3)
  // Then sort into tree-walk order (parent followed by its children)
  const parentOptions = (() => {
    const eligible = (flatCategories || []).filter((c) => c.level < 3 && c.id !== category?.id);
    const l1 = eligible
      .filter((c) => c.level === 1)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const childrenByParent = new Map<string, typeof eligible>();
    for (const c of eligible) {
      if (c.level === 2 && c.parentId) {
        const arr = childrenByParent.get(c.parentId) || [];
        arr.push(c);
        childrenByParent.set(c.parentId, arr);
      }
    }
    const result: typeof eligible = [];
    for (const parent of l1) {
      result.push(parent);
      const children = childrenByParent.get(parent.id) || [];
      children.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      result.push(...children);
    }
    return result;
  })();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && category) {
        setName(category.name);
        setNameEn(category.nameEn || '');
        setDescription(category.description || '');
        setSelectedParentId(category.parentId || '');
      } else {
        setName('');
        setNameEn('');
        setDescription('');
        setSelectedParentId(parentId || '');
      }
      setNameError('');
    }
  }, [open, mode, category, parentId]);

  const handleSubmit = () => {
    // Validate
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }
    if (name.length > 100) {
      setNameError('Name must be 100 characters or less');
      return;
    }
    setNameError('');

    if (mode === 'create') {
      const effectiveParentId =
        selectedParentId && selectedParentId !== '__none__' ? selectedParentId : undefined;
      const data: CreateSkillCategoryInput = {
        name: name.trim(),
        ...(nameEn.trim() && { nameEn: nameEn.trim() }),
        ...(description.trim() && { description: description.trim() }),
        ...(effectiveParentId && { parentId: effectiveParentId }),
      };
      onSubmit(data);
    } else {
      const data: UpdateSkillCategoryInput = {
        name: name.trim(),
        ...(nameEn.trim() && { nameEn: nameEn.trim() }),
        ...(description.trim() ? { description: description.trim() } : {}),
      };
      onSubmit(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Category' : 'Edit Category'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new skill category.'
              : 'Edit the skill category details.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning: editing a category with associated skills */}
          {mode === 'edit' &&
            (() => {
              const skillCount = category?._count?.skills ?? category?.skills?.length ?? 0;
              return skillCount > 0 ? (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    This category has <strong>{skillCount}</strong> associated skill
                    {skillCount === 1 ? '' : 's'}. Changes to the category name will apply to all of
                    them.
                  </span>
                </div>
              ) : null;
            })()}

          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="category-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
              placeholder="e.g., Frontend Development"
              maxLength={100}
              disabled={loading}
            />
            {nameError && <p className="text-sm text-destructive">{nameError}</p>}
          </div>

          {/* Name (English) field */}
          <div className="space-y-2">
            <Label htmlFor="category-name-en">Name (English)</Label>
            <Input
              id="category-name-en"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g., Frontend Development"
              maxLength={100}
              disabled={loading}
            />
          </div>

          {/* Description field */}
          <div className="space-y-2">
            <Label htmlFor="category-description">Description</Label>
            <Input
              id="category-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this category"
              disabled={loading}
            />
          </div>

          {/* Parent Category selector (create mode only) */}
          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="category-parent">Parent Category</Label>
              <Select
                value={selectedParentId}
                onValueChange={setSelectedParentId}
                disabled={loading}
              >
                <SelectTrigger id="category-parent">
                  <SelectValue placeholder="No parent (Top-level category)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No parent (Top-level category)</SelectItem>
                  {parentOptions.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span style={{ paddingLeft: `${(cat.level - 1) * 20}px` }}>
                        {cat.level > 1 && <span className="text-muted-foreground mr-1">└</span>}
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
