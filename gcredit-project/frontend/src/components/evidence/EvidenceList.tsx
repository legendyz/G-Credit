import React, { useCallback } from 'react';
import { toast } from 'sonner';
import { ExternalLink, Download, Eye, X } from 'lucide-react';
import {
  type EvidenceItem,
  formatFileSize,
  getFileIcon,
  truncateUrl,
  getEvidencePreviewUrl,
  getEvidenceDownloadUrl,
} from '@/lib/evidenceApi';

export type { EvidenceItem } from '@/lib/evidenceApi';

interface EvidenceListProps {
  items: EvidenceItem[];
  editable?: boolean;
  badgeId?: string;
  onRemove?: (id: string) => void;
}

/**
 * Shared evidence list component — renders FILE and URL evidence uniformly.
 * Used across BadgeDetailModal, VerifyBadgePage, IssueBadgePage, and BulkResultPage.
 *
 * - FILE item: icon │ name │ size │ [Preview] [Download]
 * - URL item:  🔗   │ url  │      │ [Open ↗]
 * - Editable mode shows ✕ remove button per item
 * - Returns null when items is empty (hide section entirely)
 */
const EvidenceList: React.FC<EvidenceListProps> = ({
  items,
  editable = false,
  badgeId,
  onRemove,
}) => {
  const handlePreview = useCallback(
    async (item: EvidenceItem) => {
      if (item.type === 'URL') {
        window.open(item.url, '_blank', 'noopener,noreferrer');
        return;
      }
      if (!badgeId) return;

      const canPreview = item.mimeType?.startsWith('image/') || item.mimeType?.includes('pdf');
      if (!canPreview) {
        toast.info('Preview not available', {
          description: 'This file type cannot be previewed in the browser.',
        });
        return;
      }

      try {
        const { url } = await getEvidencePreviewUrl(badgeId, item.id);
        window.open(url, '_blank');
      } catch {
        toast.error('Preview failed', {
          description: 'Unable to preview file. Please try again.',
        });
      }
    },
    [badgeId]
  );

  const handleDownload = useCallback(
    async (item: EvidenceItem) => {
      if (!badgeId) return;
      try {
        const { url } = await getEvidenceDownloadUrl(badgeId, item.id);
        window.open(url, '_blank');
      } catch {
        toast.error('Download failed', {
          description: 'Unable to download file. Please try again.',
        });
      }
    },
    [badgeId]
  );

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors group"
        >
          {/* Left: icon + name + meta */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-lg flex-shrink-0">
              {item.type === 'URL' ? '🔗' : getFileIcon(item.mimeType)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">
                {item.type === 'URL' ? truncateUrl(item.url) : item.name}
              </p>
              {item.type === 'FILE' && item.size != null && (
                <p className="text-xs text-neutral-500">
                  {formatFileSize(item.size)}
                  {item.uploadedAt && ` · ${new Date(item.uploadedAt).toLocaleDateString()}`}
                </p>
              )}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1 ml-3 flex-shrink-0">
            {item.type === 'URL' ? (
              <button
                onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded transition-colors cursor-pointer"
                aria-label={`Open ${item.name}`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open
              </button>
            ) : (
              <>
                {(item.mimeType?.startsWith('image/') || item.mimeType?.includes('pdf')) && (
                  <button
                    onClick={() => handlePreview(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded transition-colors cursor-pointer"
                    aria-label={`Preview ${item.name}`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>
                )}
                <button
                  onClick={() => handleDownload(item)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded transition-colors cursor-pointer"
                  aria-label={`Download ${item.name}`}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              </>
            )}

            {editable && onRemove && (
              <button
                onClick={() => onRemove(item.id)}
                className="ml-1 p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                aria-label={`Remove ${item.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EvidenceList;
