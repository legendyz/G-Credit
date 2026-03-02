/**
 * Badge Template List Page
 * Story 10.8 BUG-003: Badge Template CRUD UI
 * Story 15.7: Server-side pagination with URL state sync
 *
 * Admin/Issuer page for managing badge templates.
 * Supports search, status filtering, pagination, and CRUD operations.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCurrentUser } from '@/stores/authStore';
import { PageTemplate } from '@/components/layout/PageTemplate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  getTemplatesPaginated,
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
  Lock,
  User as UserIcon,
  Eye,
  Award,
  ChevronLeft,
  ChevronRight,
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
  const currentUser = useCurrentUser();
  const isIssuer = currentUser?.role === 'ISSUER';
  const [searchParams, setSearchParams] = useSearchParams();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BadgeTemplate | null>(null);

  // Read URL state
  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || 10;
  const statusFilter: StatusFilter = (searchParams.get('status') as StatusFilter) || 'ALL';
  const searchTerm = searchParams.get('search') || '';

  // Local search input state for debounce
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Sync localSearch when URL param changes externally (e.g. back/forward)
  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  // Debounced search — update URL 300ms after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        updateParams({ search: localSearch || undefined, page: '1' });
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  // URL update helper
  const updateParams = (updates: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams, { replace: true });
  };

  // Server-side paginated query
  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['badge-templates', { page, pageSize, status: statusFilter, search: searchTerm }],
    queryFn: () =>
      getTemplatesPaginated({
        page,
        limit: pageSize,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchTerm || undefined,
      }),
    placeholderData: (previousData) => previousData,
  });

  const templates = response?.data ?? [];
  const meta = response?.meta;

  // ISSUER: own templates first (client-side sort within page)
  const sortedTemplates =
    isIssuer && currentUser
      ? [...templates].sort((a, b) => {
          const uid = currentUser.id;
          const aOwn = a.createdBy === uid ? 0 : 1;
          const bOwn = b.createdBy === uid ? 0 : 1;
          return aOwn - bOwn;
        })
      : templates;

  // Status filter change — reset to page 1
  const handleStatusFilterChange = (newStatus: StatusFilter) => {
    updateParams({
      status: newStatus === 'ALL' ? undefined : newStatus,
      page: '1',
    });
  };

  const handleTemplateStatusChange = async (template: BadgeTemplate, newStatus: TemplateStatus) => {
    setActionLoading(template.id);
    try {
      await updateTemplate(template.id, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['badge-templates'] });
      toast.success(
        `Template "${template.name}" ${newStatus === 'ACTIVE' ? 'activated' : newStatus === 'ARCHIVED' ? 'archived' : 'set to draft'}`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update template status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRequest = (template: BadgeTemplate) => {
    setDeleteTarget(template);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const template = deleteTarget;
    setDeleteTarget(null);
    setActionLoading(template.id);
    try {
      await deleteTemplate(template.id);
      queryClient.invalidateQueries({ queryKey: ['badge-templates'] });
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

  const formatUserName = (
    user?: { firstName?: string; lastName?: string; email: string } | null
  ) => {
    if (!user) return null;
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
    return name || user.email;
  };

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
              onClick={() => queryClient.invalidateQueries({ queryKey: ['badge-templates'] })}
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
              placeholder="Search templates by name or badge type..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10 min-h-[44px]"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleStatusFilterChange(tab.value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg min-h-[44px] transition-colors
                  ${
                    statusFilter === tab.value
                      ? 'bg-brand-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results count + Page size selector */}
      <div className="flex items-center justify-between">
        {meta && (
          <p className="text-sm text-neutral-500">
            Showing {meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1}–
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} templates
          </p>
        )}
        <Select
          value={String(pageSize)}
          onValueChange={(v) => updateParams({ pageSize: v, page: '1' })}
        >
          <SelectTrigger className="w-[110px] min-h-[36px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 / page</SelectItem>
            <SelectItem value="20">20 / page</SelectItem>
            <SelectItem value="50">50 / page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading overlay for page transitions */}
      <div className="relative">
        {isFetching && !isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        )}

        {/* Empty state */}
        {sortedTemplates.length === 0 ? (
          <Card className="shadow-elevation-1">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <LayoutGrid className="h-12 w-12 text-neutral-300 mb-4" />
              <h3 className="text-h3 font-semibold text-neutral-900 mb-2">
                {!searchTerm && statusFilter === 'ALL'
                  ? 'No Templates Yet'
                  : 'No Matching Templates'}
              </h3>
              <p className="text-body text-neutral-600 mb-4">
                {!searchTerm && statusFilter === 'ALL'
                  ? 'Create your first badge template to get started.'
                  : 'Try adjusting your search or filter criteria.'}
              </p>
              {!searchTerm && statusFilter === 'ALL' && (
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
            {sortedTemplates.map((template) => {
              const isOwner = !isIssuer || template.createdBy === currentUser?.id;
              const canModify = !isIssuer || isOwner;
              return (
                <Card
                  key={template.id}
                  className={`shadow-elevation-1 hover:shadow-elevation-2 transition-shadow group flex flex-col ${!canModify ? 'opacity-80' : ''}`}
                >
                  {/* Image */}
                  {template.imageUrl ? (
                    <div className="h-40 overflow-hidden rounded-t-xl bg-neutral-100 flex-shrink-0">
                      <img
                        src={template.imageUrl}
                        alt={template.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-40 rounded-t-xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center flex-shrink-0">
                      <LayoutGrid className="h-12 w-12 text-brand-300" />
                    </div>
                  )}

                  <CardContent className="p-4 flex flex-col flex-1">
                    {/* Header: name + status */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-h4 font-semibold text-neutral-900 line-clamp-1">
                        {template.name}
                      </h3>
                      <TemplateStatusBadge status={template.status} />
                    </div>

                    {/* Category + date + ownership */}
                    <div className="flex items-center gap-2 flex-wrap mt-3">
                      <CategoryBadge category={template.category} />
                      <span className="text-xs text-neutral-500">
                        {formatDate(template.createdAt)}
                      </span>
                      {isIssuer &&
                        (isOwner ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-600 px-2 py-0.5 text-xs font-medium">
                            <UserIcon className="h-3 w-3" />
                            Mine
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 text-neutral-500 px-2 py-0.5 text-xs font-medium">
                            <Lock className="h-3 w-3" />
                            Read-only
                          </span>
                        ))}
                    </div>

                    {/* Description */}
                    <p className="text-body-sm text-neutral-600 line-clamp-2 mt-3 min-h-[2.5rem]">
                      {template.description || '\u00A0'}
                    </p>

                    {/* Creator / Last Modified By */}
                    <div className="text-xs text-neutral-500 mt-2 space-y-0.5">
                      {template.creator && (
                        <p title={template.creator.email}>
                          Created by: {formatUserName(template.creator)}
                        </p>
                      )}
                      {template.updater && (
                        <p title={template.updater.email}>
                          Modified by: {formatUserName(template.updater)}
                        </p>
                      )}
                    </div>

                    {/* Validity */}
                    <p className="text-xs text-neutral-500 mt-2 min-h-[1rem]">
                      {template.validityPeriod
                        ? `Valid for ${template.validityPeriod} days`
                        : '\u00A0'}
                    </p>

                    {/* Bottom section — pushed to card bottom via mt-auto */}
                    <div className="mt-auto">
                      {/* Badge Stats — always rendered for vertical alignment */}
                      <div className="flex items-center gap-1.5 text-xs mt-1 min-h-[1.25rem]">
                        {template.badgeStats && template.badgeStats.total > 0 ? (
                          <>
                            <Award className="h-3.5 w-3.5 text-brand-500 flex-shrink-0" />
                            <span className="font-semibold text-neutral-700">
                              {template.badgeStats.total} issued
                            </span>
                            {template.badgeStats.pending > 0 && (
                              <span className="text-amber-600 font-semibold">
                                · {template.badgeStats.pending} pending
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-neutral-400">No badges issued</span>
                        )}
                      </div>

                      {/* Actions - always at bottom */}
                      <div className="flex items-center gap-2 pt-2 mt-2 border-t border-neutral-100">
                        {canModify ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/templates/${template.id}/edit`)}
                            className="min-h-[44px] flex-1"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1.5" />
                            Edit
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/admin/templates/${template.id}/edit?readonly=true`)
                            }
                            className="min-h-[44px] flex-1"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            View
                          </Button>
                        )}

                        {/* Status change button */}
                        {template.status === 'DRAFT' && (
                          <Button
                            size="sm"
                            onClick={() => handleTemplateStatusChange(template, 'ACTIVE')}
                            disabled={!canModify || actionLoading === template.id}
                            title={
                              !canModify ? 'You can only modify templates you created' : undefined
                            }
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
                            onClick={() => handleTemplateStatusChange(template, 'ARCHIVED')}
                            disabled={!canModify || actionLoading === template.id}
                            title={
                              !canModify ? 'You can only modify templates you created' : undefined
                            }
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
                            size="sm"
                            onClick={() => handleTemplateStatusChange(template, 'ACTIVE')}
                            disabled={!canModify || actionLoading === template.id}
                            title={
                              !canModify ? 'You can only modify templates you created' : undefined
                            }
                            className="min-h-[44px] flex-1 bg-brand-600 hover:bg-brand-700 text-white"
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
                        {(() => {
                          const hasBadges = template.badgeStats && template.badgeStats.total > 0;
                          const isDisabled =
                            !canModify || actionLoading === template.id || hasBadges;
                          const tooltip = !canModify
                            ? 'You can only delete templates you created'
                            : hasBadges
                              ? `Cannot delete: ${template.badgeStats!.total} badge(s) issued. Use Archive instead.`
                              : undefined;
                          return (
                            <div title={tooltip} className="flex">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteRequest(template)}
                                disabled={!!isDisabled}
                                className={`min-h-[44px] ${hasBadges ? 'text-neutral-400 cursor-not-allowed' : 'text-error hover:bg-error-light'}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPreviousPage}
              onClick={() => updateParams({ page: String(page - 1) })}
              className="min-h-[36px]"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === meta.totalPages)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center gap-1">
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-neutral-400">…</span>}
                  <Button
                    variant={p === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateParams({ page: String(p) })}
                    className="min-h-[36px] min-w-[36px]"
                  >
                    {p}
                  </Button>
                </span>
              ))}
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNextPage}
              onClick={() => updateParams({ page: String(page + 1) })}
              className="min-h-[36px]"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Template"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        loading={actionLoading === deleteTarget?.id}
      />
    </PageTemplate>
  );
}

export default BadgeTemplateListPage;
