/**
 * BulkResultPage — Post-bulk-issuance evidence attachment flow
 * Story 12.6 Tasks 7–10
 *
 * Groups issued badges by template, provides:
 * - Shared evidence upload per template group (fan-out to all badges)
 * - Individual per-badge evidence attachment
 * - Skip flow with confirmation when partial evidence exists
 */

import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import EvidenceAttachmentPanel from '@/components/evidence/EvidenceAttachmentPanel';
import type { PendingFile } from '@/components/evidence/EvidenceAttachmentPanel';
import EvidenceList from '@/components/evidence/EvidenceList';
import { uploadEvidenceFile, addUrlEvidence, MAX_EVIDENCE_ITEMS } from '@/lib/evidenceApi';
import type { EvidenceItem } from '@/lib/evidenceApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BadgeResult {
  row: number;
  recipientEmail: string;
  badgeName: string;
  status: 'success' | 'failed';
  error?: string;
  badgeId?: string;
  emailError?: string;
}

interface BulkResultPageProps {
  success: number;
  failed: number;
  results: BadgeResult[];
  sessionId?: string;
  onDone: () => void;
  onRetryFailed?: () => void;
}

interface TemplateGroup {
  templateName: string;
  badges: BadgeResult[];
  failedBadges: BadgeResult[];
}

// Per-group state for evidence attachment
interface GroupEvidenceState {
  sharedPendingFiles: PendingFile[];
  sharedPendingUrls: string[];
  sharedAttached: EvidenceItem[]; // successfully attached shared evidence
  uploadProgress: Record<string, number>;
  isApplying: boolean;
  appliedCount: number; // how many badges have received shared evidence
}

// Per-badge state for individual evidence
interface BadgeEvidenceState {
  expanded: boolean;
  pendingFiles: PendingFile[];
  pendingUrls: string[];
  attached: EvidenceItem[];
  uploadProgress: Record<string, number>;
  isUploading: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupByTemplate(results: BadgeResult[]): TemplateGroup[] {
  const groups = new Map<string, TemplateGroup>();
  for (const result of results) {
    let group = groups.get(result.badgeName);
    if (!group) {
      group = {
        templateName: result.badgeName,
        badges: [],
        failedBadges: [],
      };
      groups.set(result.badgeName, group);
    }
    if (result.status === 'success' && result.badgeId) {
      group.badges.push(result);
    } else if (result.status === 'failed') {
      group.failedBadges.push(result);
    }
  }
  return [...groups.values()];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BulkResultPage({
  success,
  failed,
  results,
  onDone,
  onRetryFailed,
}: BulkResultPageProps) {
  const groups = useMemo(() => groupByTemplate(results), [results]);

  // Expansion state per group (first group expanded by default)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(groups.length > 0 ? [groups[0].templateName] : [])
  );

  // Evidence state per group
  const [groupEvidence, setGroupEvidence] = useState<Record<string, GroupEvidenceState>>({});

  // Evidence state per badge
  const [badgeEvidence, setBadgeEvidence] = useState<Record<string, BadgeEvidenceState>>({});

  // Skip confirmation dialog
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  // Overall completion state
  const [isCompleting, setIsCompleting] = useState(false);

  // ---------------------------------------------------------------------------
  // Helpers: get or init state
  // ---------------------------------------------------------------------------

  const getGroupState = useCallback(
    (name: string): GroupEvidenceState =>
      groupEvidence[name] || {
        sharedPendingFiles: [],
        sharedPendingUrls: [],
        sharedAttached: [],
        uploadProgress: {},
        isApplying: false,
        appliedCount: 0,
      },
    [groupEvidence]
  );

  const getBadgeState = useCallback(
    (badgeId: string): BadgeEvidenceState =>
      badgeEvidence[badgeId] || {
        expanded: false,
        pendingFiles: [],
        pendingUrls: [],
        attached: [],
        uploadProgress: {},
        isUploading: false,
      },
    [badgeEvidence]
  );

  const updateGroupState = useCallback(
    (name: string, patch: Partial<GroupEvidenceState>) => {
      setGroupEvidence((prev) => ({
        ...prev,
        [name]: { ...getGroupState(name), ...patch },
      }));
    },
    [getGroupState]
  );

  const updateBadgeState = useCallback(
    (badgeId: string, patch: Partial<BadgeEvidenceState>) => {
      setBadgeEvidence((prev) => ({
        ...prev,
        [badgeId]: { ...getBadgeState(badgeId), ...patch },
      }));
    },
    [getBadgeState]
  );

  // ---------------------------------------------------------------------------
  // Evidence counts
  // ---------------------------------------------------------------------------

  /** Count of attached evidence for a specific badge (shared + individual). */
  const getBadgeEvidenceCount = useCallback(
    (badgeId: string, templateName: string): number => {
      const gs = getGroupState(templateName);
      const bs = getBadgeState(badgeId);
      return gs.sharedAttached.length + bs.attached.length;
    },
    [getGroupState, getBadgeState]
  );

  /** Remaining evidence slots for a specific badge. */
  const getRemainingSlots = useCallback(
    (badgeId: string, templateName: string): number => {
      return MAX_EVIDENCE_ITEMS - getBadgeEvidenceCount(badgeId, templateName);
    },
    [getBadgeEvidenceCount]
  );

  /** Whether ANY evidence has been attached across all groups/badges. */
  const hasAnyEvidence = useMemo(() => {
    for (const gs of Object.values(groupEvidence)) {
      if (gs.sharedAttached.length > 0) return true;
    }
    for (const bs of Object.values(badgeEvidence)) {
      if (bs.attached.length > 0) return true;
    }
    return false;
  }, [groupEvidence, badgeEvidence]);

  // ---------------------------------------------------------------------------
  // Group toggle
  // ---------------------------------------------------------------------------

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // Shared evidence actions (per group)
  // ---------------------------------------------------------------------------

  const handleSharedAddFiles = (templateName: string, files: File[]) => {
    const gs = getGroupState(templateName);
    const pending: PendingFile[] = files.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      progress: 0,
      status: 'pending' as const,
    }));
    updateGroupState(templateName, {
      sharedPendingFiles: [...gs.sharedPendingFiles, ...pending],
    });
  };

  const handleSharedAddUrl = (templateName: string, url: string) => {
    const gs = getGroupState(templateName);
    updateGroupState(templateName, {
      sharedPendingUrls: [...gs.sharedPendingUrls, url],
    });
  };

  const handleSharedRemoveFile = (templateName: string, id: string) => {
    const gs = getGroupState(templateName);
    updateGroupState(templateName, {
      sharedPendingFiles: gs.sharedPendingFiles.filter((f) => f.id !== id),
    });
  };

  const handleSharedRemoveUrl = (templateName: string, index: number) => {
    const gs = getGroupState(templateName);
    updateGroupState(templateName, {
      sharedPendingUrls: gs.sharedPendingUrls.filter((_, i) => i !== index),
    });
  };

  /**
   * Fan-out: apply shared evidence to all badges in a template group.
   * Uploads files + URLs to each badge sequentially with progress.
   */
  const applySharedEvidence = async (group: TemplateGroup) => {
    const gs = getGroupState(group.templateName);
    if (gs.sharedPendingFiles.length === 0 && gs.sharedPendingUrls.length === 0) {
      toast.warning('No shared evidence to apply');
      return;
    }

    updateGroupState(group.templateName, { isApplying: true, appliedCount: 0 });

    const successBadges = group.badges.filter((b) => b.badgeId);
    let processed = 0;
    const newAttachedItems: EvidenceItem[] = [];

    for (const badge of successBadges) {
      try {
        // Check remaining slots for this badge
        const remaining = getRemainingSlots(badge.badgeId!, group.templateName);
        const filesToUpload = gs.sharedPendingFiles.slice(0, remaining);
        const urlsToAdd = gs.sharedPendingUrls.slice(0, remaining - filesToUpload.length);

        for (const pf of filesToUpload) {
          const result = await uploadEvidenceFile(badge.badgeId!, pf.file, (pct) => {
            updateGroupState(group.templateName, {
              uploadProgress: {
                ...getGroupState(group.templateName).uploadProgress,
                [`${badge.badgeId}-${pf.id}`]: pct,
              },
            });
          });

          // Collect one representative item for the shared attached list
          if (processed === 0) {
            newAttachedItems.push({
              id: result.id,
              type: 'FILE',
              name: result.originalName,
              url: result.blobUrl,
              size: result.fileSize,
              mimeType: result.mimeType,
              uploadedAt: result.uploadedAt || new Date().toISOString(),
            });
          }
        }

        for (const url of urlsToAdd) {
          const result = await addUrlEvidence(badge.badgeId!, url);
          if (processed === 0) {
            newAttachedItems.push({
              id: result.id,
              type: 'URL',
              name: url,
              url: result.sourceUrl || url,
              uploadedAt: result.uploadedAt || new Date().toISOString(),
            });
          }
        }

        processed++;
        updateGroupState(group.templateName, { appliedCount: processed });
      } catch (err) {
        // Error logged via toast below
        toast.error(
          `Failed for ${badge.recipientEmail}: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }

    // Update group state: clear pending, add to attached
    updateGroupState(group.templateName, {
      isApplying: false,
      sharedPendingFiles: [],
      sharedPendingUrls: [],
      uploadProgress: {},
      sharedAttached: [...gs.sharedAttached, ...newAttachedItems],
    });

    toast.success(`Evidence applied to ${processed}/${successBadges.length} badges`);
  };

  // ---------------------------------------------------------------------------
  // Individual badge evidence actions
  // ---------------------------------------------------------------------------

  const toggleBadgeEvidence = (badgeId: string) => {
    const bs = getBadgeState(badgeId);
    updateBadgeState(badgeId, { expanded: !bs.expanded });
  };

  const handleBadgeAddFiles = (badgeId: string, files: File[]) => {
    const bs = getBadgeState(badgeId);
    const pending: PendingFile[] = files.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      progress: 0,
      status: 'pending' as const,
    }));
    updateBadgeState(badgeId, {
      pendingFiles: [...bs.pendingFiles, ...pending],
    });
  };

  const handleBadgeAddUrl = (badgeId: string, url: string) => {
    const bs = getBadgeState(badgeId);
    updateBadgeState(badgeId, {
      pendingUrls: [...bs.pendingUrls, url],
    });
  };

  const handleBadgeRemoveFile = (badgeId: string, id: string) => {
    const bs = getBadgeState(badgeId);
    updateBadgeState(badgeId, {
      pendingFiles: bs.pendingFiles.filter((f) => f.id !== id),
    });
  };

  const handleBadgeRemoveUrl = (badgeId: string, index: number) => {
    const bs = getBadgeState(badgeId);
    updateBadgeState(badgeId, {
      pendingUrls: bs.pendingUrls.filter((_, i) => i !== index),
    });
  };

  const uploadBadgeEvidence = async (badgeId: string, templateName: string) => {
    const bs = getBadgeState(badgeId);
    if (bs.pendingFiles.length === 0 && bs.pendingUrls.length === 0) return;

    updateBadgeState(badgeId, { isUploading: true });
    const remaining = getRemainingSlots(badgeId, templateName);
    const newItems: EvidenceItem[] = [];

    try {
      const filesToUpload = bs.pendingFiles.slice(0, remaining);
      const urlsToAdd = bs.pendingUrls.slice(0, remaining - filesToUpload.length);

      for (const pf of filesToUpload) {
        const result = await uploadEvidenceFile(badgeId, pf.file, (pct) => {
          updateBadgeState(badgeId, {
            uploadProgress: {
              ...getBadgeState(badgeId).uploadProgress,
              [pf.id]: pct,
            },
          });
        });
        newItems.push({
          id: result.id,
          type: 'FILE',
          name: result.originalName,
          url: result.blobUrl,
          size: result.fileSize,
          mimeType: result.mimeType,
          uploadedAt: result.uploadedAt || new Date().toISOString(),
        });
      }

      for (const url of urlsToAdd) {
        const result = await addUrlEvidence(badgeId, url);
        newItems.push({
          id: result.id,
          type: 'URL',
          name: url,
          url: result.sourceUrl || url,
          uploadedAt: result.uploadedAt || new Date().toISOString(),
        });
      }

      updateBadgeState(badgeId, {
        isUploading: false,
        pendingFiles: [],
        pendingUrls: [],
        uploadProgress: {},
        attached: [...bs.attached, ...newItems],
      });
      toast.success('Evidence attached');
    } catch (err) {
      updateBadgeState(badgeId, { isUploading: false });
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  // ---------------------------------------------------------------------------
  // Skip / Done flow
  // ---------------------------------------------------------------------------

  const handleSkip = () => {
    if (hasAnyEvidence) {
      setShowSkipConfirm(true);
    } else {
      onDone();
    }
  };

  const handleDone = async () => {
    setIsCompleting(true);

    // Upload any remaining pending evidence per badge
    for (const group of groups) {
      const gs = getGroupState(group.templateName);
      if (gs.sharedPendingFiles.length > 0 || gs.sharedPendingUrls.length > 0) {
        await applySharedEvidence(group);
      }
    }

    for (const badge of results.filter((r) => r.badgeId)) {
      const bs = getBadgeState(badge.badgeId!);
      if (bs.pendingFiles.length > 0 || bs.pendingUrls.length > 0) {
        const group = groups.find((g) => g.badges.some((b) => b.badgeId === badge.badgeId));
        if (group) {
          await uploadBadgeEvidence(badge.badgeId!, group.templateName);
        }
      }
    }

    setIsCompleting(false);
    onDone();
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900">Bulk Issuance Complete</h1>
        <div className="flex items-center justify-center gap-4 text-sm">
          {success > 0 && (
            <span className="inline-flex items-center gap-1 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              {success} issued
            </span>
          )}
          {failed > 0 && (
            <span className="inline-flex items-center gap-1 text-red-600">
              <XCircle className="h-4 w-4" />
              {failed} failed
            </span>
          )}
        </div>
        {success > 0 && (
          <p className="text-sm text-neutral-500">
            Attach evidence to issued badges below, or skip to finish.
          </p>
        )}
      </div>

      {/* Failed badges summary (if any) */}
      {failed > 0 && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {failed} badge{failed !== 1 ? 's' : ''} failed to issue
              </span>
            </div>
            {onRetryFailed && (
              <Button size="sm" variant="outline" onClick={onRetryFailed}>
                Retry Failed
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Template Groups */}
      {groups.map((group) => {
        const isExpanded = expandedGroups.has(group.templateName);
        const gs = getGroupState(group.templateName);

        return (
          <Card key={group.templateName} className="overflow-hidden">
            {/* Group Header */}
            <button
              className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition-colors"
              onClick={() => toggleGroup(group.templateName)}
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-neutral-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-neutral-500" />
                )}
                <span className="font-medium text-neutral-900">{group.templateName}</span>
                <span className="text-sm text-neutral-500">
                  ({group.badges.length} badge
                  {group.badges.length !== 1 ? 's' : ''})
                </span>
              </div>
              {gs.sharedAttached.length > 0 && (
                <span className="text-xs text-green-600">
                  {gs.sharedAttached.length} shared evidence attached
                </span>
              )}
            </button>

            {isExpanded && (
              <div className="p-4 space-y-4">
                {/* Shared Evidence Section */}
                <div className="border border-dashed border-neutral-300 rounded-lg p-4 bg-neutral-50/50">
                  <h3 className="text-sm font-medium text-neutral-700 mb-3">
                    Shared Evidence{' '}
                    <span className="text-neutral-400 font-normal">
                      (applies to all {group.badges.length} badges)
                    </span>
                  </h3>

                  {gs.sharedAttached.length > 0 && (
                    <div className="mb-3">
                      <EvidenceList items={gs.sharedAttached} editable={false} />
                    </div>
                  )}

                  <EvidenceAttachmentPanel
                    pendingFiles={gs.sharedPendingFiles}
                    pendingUrls={gs.sharedPendingUrls}
                    onAddFiles={(files) => handleSharedAddFiles(group.templateName, files)}
                    onAddUrl={(url) => handleSharedAddUrl(group.templateName, url)}
                    onRemoveFile={(id) => handleSharedRemoveFile(group.templateName, id)}
                    onRemoveUrl={(index) => handleSharedRemoveUrl(group.templateName, index)}
                    existingCount={gs.sharedAttached.length}
                    uploadProgress={gs.uploadProgress}
                    disabled={gs.isApplying}
                  />

                  {(gs.sharedPendingFiles.length > 0 || gs.sharedPendingUrls.length > 0) && (
                    <div className="mt-3 flex items-center gap-3">
                      <Button
                        size="sm"
                        onClick={() => applySharedEvidence(group)}
                        disabled={gs.isApplying}
                      >
                        {gs.isApplying ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                            Applying to {gs.appliedCount}/{group.badges.length}...
                          </>
                        ) : (
                          `Apply to all ${group.badges.length} badges`
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Individual Badge Rows */}
                <div className="divide-y divide-neutral-100">
                  {group.badges.map((badge) => {
                    const bs = getBadgeState(badge.badgeId!);
                    const attachedCount = getBadgeEvidenceCount(badge.badgeId!, group.templateName);
                    const remaining = getRemainingSlots(badge.badgeId!, group.templateName);

                    return (
                      <div key={badge.badgeId} className="py-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-neutral-700">{badge.recipientEmail}</span>
                            {badge.emailError && (
                              <span className="text-xs text-amber-600">(email not sent)</span>
                            )}
                            {attachedCount > 0 && (
                              <span className="text-xs text-neutral-400">
                                {attachedCount}/{MAX_EVIDENCE_ITEMS} evidence
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleBadgeEvidence(badge.badgeId!)}
                            disabled={remaining <= 0}
                            className="text-xs"
                          >
                            {bs.expanded
                              ? 'Hide'
                              : remaining > 0
                                ? '+ Individual Evidence'
                                : 'Full'}
                          </Button>
                        </div>

                        {bs.expanded && (
                          <div className="mt-2 ml-6 pl-4 border-l-2 border-neutral-200">
                            {bs.attached.length > 0 && (
                              <div className="mb-2">
                                <EvidenceList
                                  items={bs.attached}
                                  editable={false}
                                  badgeId={badge.badgeId}
                                />
                              </div>
                            )}

                            <EvidenceAttachmentPanel
                              pendingFiles={bs.pendingFiles}
                              pendingUrls={bs.pendingUrls}
                              onAddFiles={(files) => handleBadgeAddFiles(badge.badgeId!, files)}
                              onAddUrl={(url) => handleBadgeAddUrl(badge.badgeId!, url)}
                              onRemoveFile={(id) => handleBadgeRemoveFile(badge.badgeId!, id)}
                              onRemoveUrl={(index) => handleBadgeRemoveUrl(badge.badgeId!, index)}
                              existingCount={attachedCount}
                              uploadProgress={bs.uploadProgress}
                              disabled={bs.isUploading}
                            />

                            {(bs.pendingFiles.length > 0 || bs.pendingUrls.length > 0) && (
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    uploadBadgeEvidence(badge.badgeId!, group.templateName)
                                  }
                                  disabled={bs.isUploading}
                                >
                                  {bs.isUploading ? (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                      Uploading...
                                    </>
                                  ) : (
                                    'Attach Evidence'
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Failed badges in this group */}
                {group.failedBadges.length > 0 && (
                  <div className="border-t border-neutral-200 pt-3 mt-3">
                    <p className="text-xs text-neutral-500 mb-1">Failed in this group:</p>
                    {group.failedBadges.map((badge) => (
                      <div key={badge.row} className="flex items-center gap-2 py-1">
                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                        <span className="text-xs text-neutral-500">{badge.recipientEmail}</span>
                        {badge.error && (
                          <span className="text-xs text-red-400">— {badge.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button variant="ghost" onClick={handleSkip} disabled={isCompleting}>
          Skip — No Evidence
        </Button>
        <Button onClick={handleDone} disabled={isCompleting}>
          {isCompleting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Completing...
            </>
          ) : (
            'Done'
          )}
        </Button>
      </div>

      {/* Skip Confirmation Dialog */}
      {showSkipConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-w-md w-full mx-4 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Skip remaining evidence?</h3>
            <p className="text-sm text-neutral-600">
              Some evidence has already been attached. Any pending (unsaved) evidence will be
              discarded.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSkipConfirm(false)}>
                Cancel
              </Button>
              <Button onClick={onDone}>Skip &amp; Finish</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
