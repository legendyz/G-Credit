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
import { Lock, AlertTriangle } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);

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

    // In create mode, show confirmation dialog first
    if (mode === 'create') {
      setShowCreateConfirm(true);
      return;
    }

    doSubmit();
  };

  const doSubmit = () => {
    if (!isValid) return;
    setShowCreateConfirm(false);

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
  // When achievements exist, entire milestone is frozen (ADR-013)
  const isFullyLocked = mode === 'edit' && achievementCount > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {mode === 'create'
              ? 'Create Milestone'
              : isFullyLocked
                ? 'View Milestone'
                : 'Edit Milestone'}
          </SheetTitle>
          <SheetDescription>
            {mode === 'create'
              ? 'Configure a new achievement milestone'
              : isFullyLocked
                ? 'This milestone has achievements and cannot be modified'
                : 'Update milestone settings'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          {/* Create mode: irreversibility warning */}
          {mode === 'create' && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Once users achieve this milestone,{' '}
                <strong>all fields will be permanently locked</strong> and it can only be
                deactivated — not deleted or modified. Please review carefully before creating.
              </span>
            </div>
          )}

          {/* Info banner: fully locked when achievements exist */}
          {isFullyLocked && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-800">
              <Lock className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                This milestone has been achieved by{' '}
                <strong>
                  {achievementCount} user{achievementCount === 1 ? '' : 's'}
                </strong>
                . All fields are locked to preserve achievement integrity. You can only
                activate/deactivate it via the toggle switch.
              </span>
            </div>
          )}

          {/* Icon Picker */}
          <div>
            <Label>Icon</Label>
            <div
              className={`flex flex-wrap gap-2 mt-1 ${isFullyLocked ? 'pointer-events-none opacity-60' : ''}`}
            >
              {MILESTONE_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  disabled={isFullyLocked}
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
              disabled={isFullyLocked}
            />
          </div>

          {/* Metric Radio */}
          <div>
            <Label className="flex items-center gap-1.5">
              Metric
              {isFullyLocked && <Lock className="h-3 w-3 text-neutral-400" />}
            </Label>
            <div className="flex gap-3 mt-1">
              <label
                className={`flex-1 flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  metric === 'badge_count' ? 'border-brand-600 bg-brand-50' : 'border-neutral-200'
                } ${isFullyLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="metric"
                  value="badge_count"
                  checked={metric === 'badge_count'}
                  onChange={() => setMetric('badge_count')}
                  disabled={isFullyLocked}
                  className="sr-only"
                />
                <span className="text-sm font-medium">Badge Count</span>
              </label>
              <label
                className={`flex-1 flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  metric === 'category_count'
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-neutral-200'
                } ${isFullyLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="metric"
                  value="category_count"
                  checked={metric === 'category_count'}
                  onChange={() => setMetric('category_count')}
                  disabled={isFullyLocked}
                  className="sr-only"
                />
                <span className="text-sm font-medium">Category Coverage</span>
              </label>
            </div>
          </div>

          {/* Scope Radio (hidden for category_count) */}
          {metric === 'badge_count' && (
            <div>
              <Label className="flex items-center gap-1.5">
                Scope
                {isFullyLocked && <Lock className="h-3 w-3 text-neutral-400" />}
              </Label>
              <div className="flex gap-3 mt-1">
                <label
                  className={`flex-1 flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    scope === 'global' ? 'border-brand-600 bg-brand-50' : 'border-neutral-200'
                  } ${isFullyLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="scope"
                    value="global"
                    checked={scope === 'global'}
                    onChange={() => setScope('global')}
                    disabled={isFullyLocked}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">Global (all badges)</span>
                </label>
                <label
                  className={`flex-1 flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    scope === 'category' ? 'border-brand-600 bg-brand-50' : 'border-neutral-200'
                  } ${isFullyLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="scope"
                    value="category"
                    checked={scope === 'category'}
                    onChange={() => setScope('category')}
                    disabled={isFullyLocked}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">Specific Category</span>
                </label>
              </div>
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
                disabled={isFullyLocked}
                className="mt-1 w-full rounded-md border border-neutral-300 bg-background px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
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

              <label className="flex items-center gap-2 mt-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={includeSubCategories}
                  onChange={(e) => setIncludeSubCategories(e.target.checked)}
                  disabled={isFullyLocked}
                  className="rounded"
                />
                Count badges from sub-categories too
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
              disabled={isFullyLocked}
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
              disabled={isFullyLocked}
            />
            {!isFullyLocked && descriptionManual && autoDesc && description !== autoDesc && (
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
          {mode === 'edit' && achievementCount > 0 && !isFullyLocked && (
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
              {isFullyLocked ? 'Close' : 'Cancel'}
            </Button>
            {!isFullyLocked && (
              <Button className="flex-1" disabled={!isValid || isLoading} onClick={handleSubmit}>
                {isLoading ? 'Saving...' : mode === 'create' ? 'Create Milestone' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>

        {/* Create confirmation dialog */}
        <ConfirmDialog
          open={showCreateConfirm}
          onOpenChange={setShowCreateConfirm}
          title="Create Milestone?"
          description="Once users achieve this milestone, all fields will be permanently locked and it cannot be deleted — only deactivated. Are you sure you want to create it?"
          confirmLabel="Yes, Create Milestone"
          cancelLabel="Review Again"
          onConfirm={doSubmit}
          loading={isLoading}
        />
      </SheetContent>
    </Sheet>
  );
}

export default MilestoneFormSheet;
