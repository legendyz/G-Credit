/**
 * Badge Template List Page
 * Story 10.8 BUG-003: Badge Template CRUD UI
 *
 * Admin/Issuer page for managing badge templates.
 * Supports search, status filtering, and CRUD operations.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageTemplate } from '@/components/layout/PageTemplate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getAllTemplates,
  updateTemplate,
  deleteTemplate,
  type BadgeTemplate,
  type TemplateStatus,
} from '@/lib/badgeTemplatesApi';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  LayoutGrid,
  Archive,
  CheckCircle2,
  FileText,
} from 'lucide-react';

type StatusFilter = 'ALL' | TemplateStatus;

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Archived', value: 'ARCHIVED' },
];

function TemplateStatusBadge({ status }: { status: TemplateStatus }) {
  const config: Record<
    TemplateStatus,
    { icon: typeof CheckCircle2; label: string; className: string }
  > = {
    DRAFT: {
      icon: FileText,
      label: 'Draft',
      className: 'bg-warning-light text-warning',
    },
    ACTIVE: {
      icon: CheckCircle2,
      label: 'Active',
      className: 'bg-success-light text-success',
    },
    ARCHIVED: {
      icon: Archive,
      label: 'Archived',
      className: 'bg-neutral-100 text-neutral-600',
    },
  };
  const { icon: Icon, label, className } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-brand-50 text-brand-700 px-2.5 py-0.5 text-xs font-medium capitalize">
      {category}
    </span>
  );
}

export function BadgeTemplateListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const {
    data: templates = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['badge-templates-all'],
    queryFn: getAllTemplates,
  });

  const filteredTemplates = useMemo(() => {
    let result = templates;

    if (statusFilter !== 'ALL') {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (searchTerm.trim().length >= 2) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          t.category?.toLowerCase().includes(term) ||
          t.description?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [templates, statusFilter, searchTerm]);

  const handleStatusChange = async (template: BadgeTemplate, newStatus: TemplateStatus) => {
    setActionLoading(template.id);
    try {
      await updateTemplate(template.id, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['badge-templates-all'] });
      toast.success(
        `Template "${template.name}" ${newStatus === 'ACTIVE' ? 'activated' : newStatus === 'ARCHIVED' ? 'archived' : 'set to draft'}`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update template status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (template: BadgeTemplate) => {
    if (!confirm(`Delete template "${template.name}"? This cannot be undone.`)) return;
    setActionLoading(template.id);
    try {
      await deleteTemplate(template.id);
      queryClient.invalidateQueries({ queryKey: ['badge-templates-all'] });
      toast.success(`Template "${template.name}" deleted`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete template');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  // Loading state
  if (isLoading) {
    return (
      <PageTemplate title="Badge Templates" description="Manage badge templates">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="shadow-elevation-1">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-40 w-full rounded-md" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageTemplate>
    );
  }

  // Error state
  if (isError) {
    return (
      <PageTemplate title="Badge Templates" description="Manage badge templates">
        <Card className="shadow-elevation-1">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-12 w-12 text-error mb-4" />
            <h3 className="text-h3 font-semibold text-neutral-900 mb-2">
              Failed to Load Templates
            </h3>
            <p className="text-body text-neutral-600 mb-4">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['badge-templates-all'] })}
              className="min-h-[44px]"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Badge Templates"
      description="Create and manage badge templates for your organization"
      actions={
        <Button
          onClick={() => navigate('/admin/templates/new')}
          className="bg-brand-600 hover:bg-brand-700 text-white min-h-[44px] px-4"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      }
    >
      {/* Search & Filter */}
      <Card className="shadow-elevation-1">
        <CardContent className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="search"
              placeholder="Search templates by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 min-h-[44px]"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg min-h-[44px] transition-colors
                  ${
                    statusFilter === tab.value
                      ? 'bg-brand-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
              >
                {tab.label}
                {tab.value !== 'ALL' && (
                  <span className="ml-1.5 text-xs">
                    ({templates.filter((t) => t.status === tab.value).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      {(searchTerm || statusFilter !== 'ALL') && (
        <p className="text-sm text-neutral-500">
          Showing {filteredTemplates.length} of {templates.length} templates
        </p>
      )}

      {/* Empty state */}
      {filteredTemplates.length === 0 ? (
        <Card className="shadow-elevation-1">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <LayoutGrid className="h-12 w-12 text-neutral-300 mb-4" />
            <h3 className="text-h3 font-semibold text-neutral-900 mb-2">
              {templates.length === 0 ? 'No Templates Yet' : 'No Matching Templates'}
            </h3>
            <p className="text-body text-neutral-600 mb-4">
              {templates.length === 0
                ? 'Create your first badge template to get started.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
            {templates.length === 0 && (
              <Button
                onClick={() => navigate('/admin/templates/new')}
                className="bg-brand-600 hover:bg-brand-700 text-white min-h-[44px]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Template Cards Grid */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="shadow-elevation-1 hover:shadow-elevation-2 transition-shadow group"
            >
              {/* Image */}
              {template.imageUrl ? (
                <div className="h-40 overflow-hidden rounded-t-xl bg-neutral-100">
                  <img
                    src={template.imageUrl}
                    alt={template.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-40 rounded-t-xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
                  <LayoutGrid className="h-12 w-12 text-brand-300" />
                </div>
              )}

              <CardContent className="p-4 space-y-3">
                {/* Header: name + status */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-h4 font-semibold text-neutral-900 line-clamp-1">
                    {template.name}
                  </h3>
                  <TemplateStatusBadge status={template.status} />
                </div>

                {/* Category + date */}
                <div className="flex items-center gap-2 flex-wrap">
                  <CategoryBadge category={template.category} />
                  <span className="text-xs text-neutral-500">{formatDate(template.createdAt)}</span>
                </div>

                {/* Description */}
                {template.description && (
                  <p className="text-body-sm text-neutral-600 line-clamp-2">
                    {template.description}
                  </p>
                )}

                {/* Validity */}
                {template.validityPeriod && (
                  <p className="text-xs text-neutral-500">
                    Valid for {template.validityPeriod} days
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/templates/${template.id}/edit`)}
                    className="min-h-[44px] flex-1"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>

                  {/* Status change button */}
                  {template.status === 'DRAFT' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(template, 'ACTIVE')}
                      disabled={actionLoading === template.id}
                      className="bg-success hover:bg-success-bright text-white min-h-[44px] flex-1"
                    >
                      {actionLoading === template.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                          Activate
                        </>
                      )}
                    </Button>
                  )}
                  {template.status === 'ACTIVE' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(template, 'ARCHIVED')}
                      disabled={actionLoading === template.id}
                      className="min-h-[44px] flex-1"
                    >
                      {actionLoading === template.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Archive className="h-3.5 w-3.5 mr-1.5" />
                          Archive
                        </>
                      )}
                    </Button>
                  )}
                  {template.status === 'ARCHIVED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(template, 'ACTIVE')}
                      disabled={actionLoading === template.id}
                      className="min-h-[44px] flex-1"
                    >
                      {actionLoading === template.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                          Reactivate
                        </>
                      )}
                    </Button>
                  )}

                  {/* Delete */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template)}
                    disabled={actionLoading === template.id}
                    className="min-h-[44px] text-error hover:bg-error-light"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageTemplate>
  );
}

export default BadgeTemplateListPage;
