import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Loader2, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import FileUploadZone from './FileUploadZone';
import EvidenceList from './EvidenceList';
import { type EvidenceItem, MAX_EVIDENCE_ITEMS, formatFileSize } from '@/lib/evidenceApi';

/** A pending file that hasn't been uploaded yet */
export interface PendingFile {
  id: string; // temp id
  file: File;
  progress: number; // 0–100
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

/** Converts pending items to EvidenceItem[] for display */
function pendingToDisplayItems(pendingFiles: PendingFile[], pendingUrls: string[]): EvidenceItem[] {
  const fileItems: EvidenceItem[] = pendingFiles.map((pf) => ({
    id: pf.id,
    type: 'FILE' as const,
    name: pf.file.name,
    url: '',
    size: pf.file.size,
    mimeType: pf.file.type,
    uploadedAt: new Date().toISOString(),
  }));

  const urlItems: EvidenceItem[] = pendingUrls.map((url, i) => ({
    id: `pending-url-${i}`,
    type: 'URL' as const,
    name: url,
    url,
    uploadedAt: new Date().toISOString(),
  }));

  return [...fileItems, ...urlItems];
}

interface EvidenceAttachmentPanelProps {
  pendingFiles: PendingFile[];
  pendingUrls: string[];
  onAddFiles: (files: File[]) => void;
  onAddUrl: (url: string) => void;
  onRemoveFile: (id: string) => void;
  onRemoveUrl: (index: number) => void;
  /** Already-committed evidence count (for combined limit) */
  existingCount?: number;
  /** Show file upload progress per file */
  uploadProgress?: Record<string, number>;
  disabled?: boolean;
}

/**
 * Combined panel: FileUploadZone + URL input + pending evidence list.
 * Reused in IssueBadgePage and BulkResultPage.
 */
const EvidenceAttachmentPanel: React.FC<EvidenceAttachmentPanelProps> = ({
  pendingFiles,
  pendingUrls,
  onAddFiles,
  onAddUrl,
  onRemoveFile,
  onRemoveUrl,
  existingCount = 0,
  uploadProgress,
  disabled = false,
}) => {
  const [urlInput, setUrlInput] = useState('');

  const totalCount = existingCount + pendingFiles.length + pendingUrls.length;
  const remaining = MAX_EVIDENCE_ITEMS - totalCount;

  const handleAddUrl = useCallback(() => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    try {
      const parsed = new URL(trimmed);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        toast.error('Only http and https URLs are accepted');
        return;
      }
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }
    if (totalCount >= MAX_EVIDENCE_ITEMS) {
      toast.warning(`Maximum ${MAX_EVIDENCE_ITEMS} evidence items reached`);
      return;
    }
    onAddUrl(trimmed);
    setUrlInput('');
  }, [urlInput, totalCount, onAddUrl]);

  const handleUrlKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddUrl();
      }
    },
    [handleAddUrl]
  );

  const handleRemove = useCallback(
    (id: string) => {
      // Check if it's a pending URL
      if (id.startsWith('pending-url-')) {
        const idx = parseInt(id.replace('pending-url-', ''), 10);
        onRemoveUrl(idx);
      } else {
        onRemoveFile(id);
      }
    },
    [onRemoveFile, onRemoveUrl]
  );

  const displayItems = pendingToDisplayItems(pendingFiles, pendingUrls);

  return (
    <div className="space-y-3">
      {/* File upload zone */}
      <FileUploadZone
        onFilesSelected={onAddFiles}
        disabled={disabled || remaining <= 0}
        currentCount={totalCount}
      />

      {/* OR divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-neutral-200" />
        <span className="text-xs text-neutral-400 font-medium">OR</span>
        <div className="flex-1 border-t border-neutral-200" />
      </div>

      {/* URL input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
            🔗
          </span>
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleUrlKeyDown}
            placeholder="https://example.com/evidence"
            className="pl-8 min-h-[40px]"
            disabled={disabled || remaining <= 0}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddUrl}
          disabled={disabled || remaining <= 0 || !urlInput.trim()}
          className="min-h-[40px]"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Pending evidence list */}
      {displayItems.length > 0 && (
        <div>
          <p className="text-xs font-medium text-neutral-600 mb-2">
            📋 Attached Evidence ({totalCount}/{MAX_EVIDENCE_ITEMS}):
          </p>

          {/* Files with upload progress */}
          {pendingFiles.map((pf) => (
            <div
              key={pf.id}
              className="flex items-center justify-between p-2.5 mb-1.5 bg-neutral-50 rounded-lg"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {pf.status === 'uploading' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-brand-600 flex-shrink-0" />
                ) : pf.status === 'done' ? (
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                  <span className="text-sm flex-shrink-0">📄</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-900 truncate">{pf.file.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">{formatFileSize(pf.file.size)}</span>
                    {pf.status === 'uploading' && (
                      <span className="text-xs text-brand-600 font-medium">
                        {uploadProgress?.[pf.id] ?? pf.progress}%
                      </span>
                    )}
                    {pf.status === 'error' && (
                      <span className="text-xs text-red-600">{pf.error || 'Failed'}</span>
                    )}
                  </div>
                  {pf.status === 'uploading' && (
                    <div className="mt-1 h-1 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-600 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress?.[pf.id] ?? pf.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
              {(pf.status === 'pending' || pf.status === 'error') && !disabled && (
                <button
                  onClick={() => onRemoveFile(pf.id)}
                  className="ml-2 p-1 text-neutral-400 hover:text-red-500 rounded cursor-pointer"
                  aria-label={`Remove ${pf.file.name}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {/* URLs (show as normal EvidenceList items) */}
          {pendingUrls.length > 0 && (
            <EvidenceList
              items={pendingUrls.map((url, i) => ({
                id: `pending-url-${i}`,
                type: 'URL' as const,
                name: url,
                url,
                uploadedAt: new Date().toISOString(),
              }))}
              editable={!disabled}
              onRemove={handleRemove}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default EvidenceAttachmentPanel;
