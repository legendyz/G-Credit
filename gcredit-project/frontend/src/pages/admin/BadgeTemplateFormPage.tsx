/**
 * Badge Template Form Page (Create / Edit)
 * Story 10.8 BUG-003: Badge Template CRUD UI
 *
 * Dual-mode form: create (no :id param) or edit (with :id param).
 * Uses multipart/form-data for image upload support.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageTemplate } from '@/components/layout/PageTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  createTemplate,
  updateTemplate,
  getTemplateById,
  type TemplateCategory,
  type TemplateStatus,
} from '@/lib/badgeTemplatesApi';
import { useSkills } from '@/hooks/useSkills';
import { LayoutGrid, Save, Loader2, Upload, X, AlertCircle } from 'lucide-react';

const CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: 'achievement', label: 'Achievement' },
  { value: 'skill', label: 'Skill' },
  { value: 'certification', label: 'Certification' },
  { value: 'participation', label: 'Participation' },
];

const STATUSES: { value: TemplateStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB (matches backend BlobStorageService limit)
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

export function BadgeTemplateFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TemplateCategory | ''>('');
  const [validityPeriod, setValidityPeriod] = useState('');
  const [status, setStatus] = useState<TemplateStatus>('DRAFT');
  const [criteriaText, setCriteriaText] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Skills data
  const { data: availableSkills = [] } = useSkills();

  // Preserve original criteria shape from backend (edit mode)
  const [originalCriteria, setOriginalCriteria] = useState<Record<string, unknown> | null>(null);

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch template data in edit mode
  useEffect(() => {
    if (!id) return;
    const fetchTemplate = async () => {
      try {
        const template = await getTemplateById(id);
        setName(template.name);
        setDescription(template.description || '');
        setCategory(template.category);
        setValidityPeriod(template.validityPeriod ? template.validityPeriod.toString() : '');
        setStatus(template.status);
        setExistingImageUrl(template.imageUrl || null);

        // Preserve original criteria shape (type, conditions, logicOperator)
        if (template.issuanceCriteria) {
          const criteria = template.issuanceCriteria as Record<string, unknown>;
          setOriginalCriteria(criteria);
          if (typeof criteria.description === 'string') {
            setCriteriaText(criteria.description);
          } else if (Array.isArray(criteria.requirements)) {
            // Legacy format fallback
            setCriteriaText((criteria.requirements as string[]).join('\n'));
          }
        }

        // Populate selected skills
        if (template.skillIds && Array.isArray(template.skillIds)) {
          setSelectedSkills(template.skillIds);
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load template');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplate();
  }, [id]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Only JPG and PNG images are accepted');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast.error('Template name is required');
      return;
    }
    if (!category) {
      toast.error('Please select a category');
      return;
    }
    if (validityPeriod && (Number(validityPeriod) < 1 || Number(validityPeriod) > 3650)) {
      toast.error('Validity period must be between 1 and 3650 days');
      return;
    }

    // Build issuance criteria – ensure valid DTO structure
    // Legacy seed data may have { requirements: [...] } without type — always normalize
    const issuanceCriteria = (() => {
      if (isEditMode && originalCriteria) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { requirements, ...cleanCriteria } = originalCriteria as Record<string, unknown> & {
          requirements?: unknown;
        };
        return {
          type: 'manual' as const,
          ...cleanCriteria,
          description: criteriaText.trim() || undefined,
        };
      }
      return { type: 'manual' as const, description: criteriaText.trim() || undefined };
    })();

    setIsSubmitting(true);
    try {
      if (isEditMode && id) {
        await updateTemplate(
          id,
          {
            name: name.trim(),
            description: description.trim() || undefined,
            category: category as TemplateCategory,
            skillIds: selectedSkills,
            issuanceCriteria,
            validityPeriod: validityPeriod ? Number(validityPeriod) : undefined,
            status,
          },
          imageFile || undefined
        );
        toast.success('Template updated successfully');
      } else {
        await createTemplate(
          {
            name: name.trim(),
            description: description.trim() || undefined,
            category: category as TemplateCategory,
            skillIds: selectedSkills,
            issuanceCriteria,
            validityPeriod: validityPeriod ? Number(validityPeriod) : undefined,
          },
          imageFile || undefined
        );
        toast.success('Template created successfully');
      }
      navigate('/admin/templates');
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : `Failed to ${isEditMode ? 'update' : 'create'} template`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state (edit mode)
  if (isLoading) {
    return (
      <PageTemplate
        title={isEditMode ? 'Edit Template' : 'Create Template'}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate('/admin/templates')}
            className="min-h-[44px]"
          >
            Back to Templates
          </Button>
        }
      >
        <Card className="max-w-2xl shadow-elevation-1">
          <CardContent className="p-6 space-y-6">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-1/3" />
          </CardContent>
        </Card>
      </PageTemplate>
    );
  }

  // Load error state
  if (loadError) {
    return (
      <PageTemplate
        title="Edit Template"
        actions={
          <Button
            variant="outline"
            onClick={() => navigate('/admin/templates')}
            className="min-h-[44px]"
          >
            Back to Templates
          </Button>
        }
      >
        <Card className="max-w-2xl shadow-elevation-1">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-12 w-12 text-error mb-4" />
            <h3 className="text-h3 font-semibold text-neutral-900 mb-2">Failed to Load</h3>
            <p className="text-body text-neutral-600">{loadError}</p>
          </CardContent>
        </Card>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title={isEditMode ? 'Edit Template' : 'Create Template'}
      description={isEditMode ? 'Update badge template details' : 'Create a new badge template'}
      actions={
        <Button
          variant="outline"
          onClick={() => navigate('/admin/templates')}
          className="min-h-[44px]"
        >
          Back to Templates
        </Button>
      }
    >
      <Card className="max-w-2xl shadow-elevation-1 border border-neutral-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-h3 font-semibold text-neutral-900">
            <LayoutGrid className="h-5 w-5 text-brand-600" />
            Template Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-body font-medium text-neutral-700">
                Name <span className="text-error">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cloud Expert Certification"
                className="min-h-[44px] focus:ring-brand-500"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-body font-medium text-neutral-700">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this badge recognizes..."
                rows={3}
                className="focus:ring-brand-500"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-body font-medium text-neutral-700">
                Category <span className="text-error">*</span>
              </Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TemplateCategory)}>
                <SelectTrigger id="category" className="min-h-[44px] focus:ring-brand-500">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Issuance Criteria */}
            <div className="space-y-2">
              <Label htmlFor="criteria" className="text-body font-medium text-neutral-700">
                Issuance Criteria
              </Label>
              <Textarea
                id="criteria"
                value={criteriaText}
                onChange={(e) => setCriteriaText(e.target.value)}
                placeholder="Enter one requirement per line..."
                rows={4}
                className="focus:ring-brand-500"
              />
              <p className="text-xs text-neutral-500">One requirement per line</p>
            </div>

            {/* Skills Selection */}
            <div className="space-y-2">
              <Label className="text-body font-medium text-neutral-700">Related Skills</Label>
              {availableSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-3 border border-neutral-200 rounded-md bg-neutral-50 max-h-48 overflow-y-auto">
                  {availableSkills.map((skill) => {
                    const isSelected = selectedSkills.includes(skill.id);
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() =>
                          setSelectedSkills((prev) =>
                            isSelected
                              ? prev.filter((sid) => sid !== skill.id)
                              : [...prev, skill.id]
                          )
                        }
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-brand-600 text-white'
                            : 'bg-white text-neutral-700 border border-neutral-300 hover:border-brand-400'
                        }`}
                      >
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">No skills available</p>
              )}
              {selectedSkills.length > 0 && (
                <p className="text-xs text-neutral-500">
                  {selectedSkills.length} skill{selectedSkills.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Validity Period */}
            <div className="space-y-2">
              <Label htmlFor="validityPeriod" className="text-body font-medium text-neutral-700">
                Validity Period (days) <span className="text-neutral-500">(optional)</span>
              </Label>
              <Input
                id="validityPeriod"
                type="number"
                min={1}
                max={3650}
                value={validityPeriod}
                onChange={(e) => setValidityPeriod(e.target.value)}
                placeholder="e.g. 365 (leave empty for no expiry)"
                className="min-h-[44px] focus:ring-brand-500"
              />
            </div>

            {/* Status (edit mode only) */}
            {isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="status" className="text-body font-medium text-neutral-700">
                  Status
                </Label>
                <Select value={status} onValueChange={(v) => setStatus(v as TemplateStatus)}>
                  <SelectTrigger id="status" className="min-h-[44px] focus:ring-brand-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-body font-medium text-neutral-700">
                Badge Image{' '}
                <span className="text-neutral-500">
                  (optional, JPG/PNG, max 2MB, 128×128 ~ 2048×2048 px)
                </span>
              </Label>

              {/* Current/Preview Image */}
              {(imagePreview || existingImageUrl) && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200">
                  <img
                    src={imagePreview || existingImageUrl || ''}
                    alt="Badge preview"
                    className="w-full h-full object-cover"
                  />
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-1 right-1 w-6 h-6 bg-neutral-900/60 rounded-full flex items-center justify-center hover:bg-neutral-900/80"
                      aria-label="Remove image"
                    >
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>
                  )}
                </div>
              )}

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[44px]"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {imagePreview || existingImageUrl ? 'Change Image' : 'Upload Image'}
                </Button>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/templates')}
                className="min-h-[44px] px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-600 hover:bg-brand-700 text-white min-h-[44px] px-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Save Changes' : 'Create Template'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageTemplate>
  );
}

export default BadgeTemplateFormPage;
