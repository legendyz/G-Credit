/**
 * MilestoneFormSheet — Story 12.4 (Tasks 8 & 9)
 *
 * Unified create/edit milestone form in a Sheet.
 * - Create: all fields editable
 * - Edit: metric/scope locked after creation
 */
import { useState, useEffect, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSkillCategoryTree } from '@/hooks/useSkillCategories';
import type {
  MilestoneConfig,
  CreateMilestoneInput,
  UpdateMilestoneInput,
  MilestoneTrigger,
} from '@/lib/milestonesApi';

// Curated icon list
const MILESTONE_ICONS = [
  '🏆',
  '🏅',
  '🌟',
  '⭐',
  '💪',
  '🎯',
  '🔥',
  '💎',
  '🌍',
  '🗣️',
  '💻',
  '📚',
  '🎨',
  '✨',
  '🚀',
  '👑',
  '🌱',
  '💡',
  '🎓',
];

type Metric = 'badge_count' | 'category_count';
type Scope = 'global' | 'category';

interface MilestoneFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  milestone?: MilestoneConfig;
  onSubmitCreate?: (input: CreateMilestoneInput) => void;
  onSubmitUpdate?: (id: string, input: UpdateMilestoneInput) => void;
  isLoading?: boolean;
}

function getAutoDescription(
  metric: Metric,
  scope: Scope,
  threshold: number,
  categoryName?: string
): string {
  if (metric === 'badge_count' && scope === 'global') {
    return `Earn ${threshold} badges`;
  }
  if (metric === 'badge_count' && scope === 'category') {
    return `Earn ${threshold} badges in ${categoryName || 'selected category'}`;
  }
  if (metric === 'category_count') {
    return `Earn badges across ${threshold} different categories`;
  }
  return '';
}

export function MilestoneFormSheet({
  open,
  onOpenChange,
  mode,
  milestone,
  onSubmitCreate,
  onSubmitUpdate,
  isLoading,
}: MilestoneFormSheetProps) {
  const { data: categories } = useSkillCategoryTree();

  // Form state
  const [icon, setIcon] = useState('🏆');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionManual, setDescriptionManual] = useState(false);
  const [metric, setMetric] = useState<Metric>('badge_count');
  const [scope, setScope] = useState<Scope>('global');
  const [threshold, setThreshold] = useState(5);
  const [categoryId, setCategoryId] = useState('');
  const [includeSubCategories, setIncludeSubCategories] = useState(true);

  // Reset form when opening / milestone changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && milestone) {
        setIcon(milestone.icon);
        setTitle(milestone.title);
        setDescription(milestone.description);
        setDescriptionManual(true);
        setMetric(milestone.trigger.metric);
        setScope(milestone.trigger.scope);
        setThreshold(milestone.trigger.threshold);
        setCategoryId(milestone.trigger.categoryId || '');
        setIncludeSubCategories(milestone.trigger.includeSubCategories ?? true);
      } else {
        setIcon('🏆');
        setTitle('');
        setDescription('');
        setDescriptionManual(false);
        setMetric('badge_count');
        setScope('global');
        setThreshold(5);
        setCategoryId('');
        setIncludeSubCategories(true);
      }
    }
  }, [open, mode, milestone]);

  // Find category name for auto-description
  const categoryName = useMemo(() => {
    if (!categoryId || !categories) return '';
    const findCat = (cats: typeof categories): string => {
      for (const cat of cats) {
        if (cat.id === categoryId) return cat.name;
        if (cat.children?.length) {
          const found = findCat(cat.children);
          if (found) return found;
        }
      }
      return '';
    };
    return findCat(categories);
  }, [categoryId, categories]);

  // Auto-generate description
  const autoDesc = useMemo(
    () => getAutoDescription(metric, scope, threshold, categoryName),
    [metric, scope, threshold, categoryName]
  );

  // Sync auto-description when not manually overridden
  useEffect(() => {
    if (!descriptionManual && autoDesc) {
      setDescription(autoDesc);
    }
  }, [autoDesc, descriptionManual]);

  // When metric changes to category_count, force scope to global
  useEffect(() => {
    if (metric === 'category_count') {
      setScope('global');
      setCategoryId('');
    }
  }, [metric]);

  // Flatten categories for select
  const flatCategories = useMemo(() => {
    if (!categories) return [];
    const flat: Array<{ id: string; name: string; level: number }> = [];
    const walk = (cats: typeof categories, level: number) => {
      for (const cat of cats) {
        flat.push({ id: cat.id, name: cat.name, level });
        if (cat.children?.length) walk(cat.children, level + 1);
      }
    };
    walk(categories, 0);
    return flat;
  }, [categories]);

  // Derive type from metric
  const milestoneType = metric === 'badge_count' ? 'BADGE_COUNT' : 'CATEGORY_COUNT';

  // Validation
  const isValid =
    icon.trim() &&
    title.trim() &&
    description.trim() &&
    threshold >= 1 &&
    (scope !== 'category' || categoryId);

  const handleSubmit = () => {
    if (!isValid) return;

    const trigger: MilestoneTrigger = {
      metric,
      scope,
      threshold,
      ...(scope === 'category' && {
        categoryId,
        includeSubCategories,
      }),
    };

    if (mode === 'create') {
      onSubmitCreate?.({
        type: milestoneType as 'BADGE_COUNT' | 'CATEGORY_COUNT',
        title,
        description,
        trigger,
        icon,
      });
    } else if (milestone) {
      onSubmitUpdate?.(milestone.id, {
        title,
        description,
        trigger,
        icon,
      });
    }
  };

  const achievementCount = milestone?._count?.achievements ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{mode === 'create' ? 'Create Milestone' : 'Edit Milestone'}</SheetTitle>
          <SheetDescription>
            {mode === 'create'
              ? 'Configure a new achievement milestone'
              : 'Update milestone settings'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          {/* Icon Picker */}
          <div>
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {MILESTONE_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`text-2xl w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-colors ${
                    icon === emoji
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="milestone-title">Title</Label>
            <Input
              id="milestone-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Badge Collector"
              maxLength={200}
            />
          </div>

          {/* Metric Radio */}
          <div>
            <Label>Metric</Label>
            <div className="flex gap-3 mt-1">
              <label
                className={`flex-1 flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  metric === 'badge_count' ? 'border-brand-600 bg-brand-50' : 'border-neutral-200'
                } ${mode === 'edit' ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="metric"
                  value="badge_count"
                  checked={metric === 'badge_count'}
                  onChange={() => setMetric('badge_count')}
                  disabled={mode === 'edit'}
                  className="sr-only"
                />
                <span className="text-sm font-medium">Badge Count</span>
              </label>
              <label
                className={`flex-1 flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  metric === 'category_count'
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-neutral-200'
                } ${mode === 'edit' ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="metric"
                  value="category_count"
                  checked={metric === 'category_count'}
                  onChange={() => setMetric('category_count')}
                  disabled={mode === 'edit'}
                  className="sr-only"
                />
                <span className="text-sm font-medium">Category Coverage</span>
              </label>
            </div>
            {mode === 'edit' && (
              <p className="text-xs text-neutral-500 mt-1">Cannot change metric after creation</p>
            )}
          </div>

          {/* Scope Radio (hidden for category_count) */}
          {metric === 'badge_count' && (
            <div>
              <Label>Scope</Label>
              <div className="flex gap-3 mt-1">
                <label
                  className={`flex-1 flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    scope === 'global' ? 'border-brand-600 bg-brand-50' : 'border-neutral-200'
                  } ${mode === 'edit' ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="scope"
                    value="global"
                    checked={scope === 'global'}
                    onChange={() => setScope('global')}
                    disabled={mode === 'edit'}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">Global (all badges)</span>
                </label>
                <label
                  className={`flex-1 flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    scope === 'category' ? 'border-brand-600 bg-brand-50' : 'border-neutral-200'
                  } ${mode === 'edit' ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="scope"
                    value="category"
                    checked={scope === 'category'}
                    onChange={() => setScope('category')}
                    disabled={mode === 'edit'}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">Specific Category</span>
                </label>
              </div>
              {mode === 'edit' && (
                <p className="text-xs text-neutral-500 mt-1">Cannot change scope after creation</p>
              )}
            </div>
          )}

          {/* Category Picker (when scope=category) */}
          {scope === 'category' && (
            <div>
              <Label htmlFor="milestone-category">Category</Label>
              <select
                id="milestone-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 bg-background px-3 py-2 text-sm"
              >
                <option value="">Select category...</option>
                {flatCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {'\u00A0\u00A0\u00A0\u00A0'.repeat(cat.level)}
                    {cat.level > 0 ? '└ ' : ''}
                    {cat.name}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 mt-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeSubCategories}
                  onChange={(e) => setIncludeSubCategories(e.target.checked)}
                  className="rounded"
                />
                Include sub-categories
              </label>
            </div>
          )}

          {/* Threshold */}
          <div>
            <Label htmlFor="milestone-threshold">Threshold</Label>
            <Input
              id="milestone-threshold"
              type="number"
              min={1}
              value={threshold}
              onChange={(e) => setThreshold(Math.max(1, Number(e.target.value)))}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="milestone-description">Description</Label>
            <Textarea
              id="milestone-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setDescriptionManual(true);
              }}
              placeholder="Auto-generated from metric settings..."
              rows={2}
            />
            {descriptionManual && autoDesc && description !== autoDesc && (
              <button
                type="button"
                onClick={() => {
                  setDescription(autoDesc);
                  setDescriptionManual(false);
                }}
                className="text-xs text-brand-600 hover:underline mt-1"
              >
                Reset to auto-generated
              </button>
            )}
          </div>

          {/* Edit mode: achievement info */}
          {mode === 'edit' && achievementCount > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
              This milestone has been achieved by {achievementCount} user
              {achievementCount === 1 ? '' : 's'}
            </div>
          )}

          {/* Live Preview Card */}
          <div>
            <Label>Preview</Label>
            <div className="mt-1 rounded-lg border border-neutral-200 p-4 bg-neutral-50">
              <div className="flex items-start justify-between">
                <span className="text-3xl">{icon}</span>
              </div>
              <p className="font-semibold mt-2">{title || 'Milestone Title'}</p>
              <p className="text-sm text-neutral-600 mt-1">
                {description || 'Description will appear here'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                  {metric === 'badge_count' ? 'BADGE_COUNT' : 'CATEGORY_COUNT'}
                </span>
                <span className="text-xs text-neutral-500">·</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                  {scope === 'global' ? 'Global' : 'Category'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-2">Threshold: {threshold}</p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={!isValid || isLoading} onClick={handleSubmit}>
              {isLoading ? 'Saving...' : mode === 'create' ? 'Create Milestone' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default MilestoneFormSheet;
