import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/apiFetch';

interface EvidenceFile {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

interface EvidenceSectionProps {
  badgeId: string;
}

const EvidenceSection: React.FC<EvidenceSectionProps> = ({ badgeId }) => {
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const response = await apiFetch(`/badges/${badgeId}/evidence`);

        if (!response.ok) {
          throw new Error('Failed to fetch evidence files');
        }

        const data = await response.json();
        setEvidenceFiles(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchEvidence();
  }, [badgeId]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '📷';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    return '📎';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = async (fileId: string) => {
    try {
      const response = await apiFetch(`/badges/${badgeId}/evidence/${fileId}/download`);

      if (!response.ok) {
        throw new Error('Failed to generate download link');
      }

      const { url } = await response.json();

      // Open in new tab to trigger download
      window.open(url, '_blank');
    } catch {
      toast.error('Download failed', {
        description: 'Unable to download file. Please try again.',
      });
    }
  };

  const handlePreview = async (fileId: string, mimeType: string) => {
    // Only preview images and PDFs
    if (!mimeType.startsWith('image/') && !mimeType.includes('pdf')) {
      toast.info('Preview not available', {
        description: 'This file type cannot be previewed in the browser.',
      });
      return;
    }

    try {
      const response = await apiFetch(`/badges/${badgeId}/evidence/${fileId}/preview`);

      if (!response.ok) {
        throw new Error('Failed to generate preview link');
      }

      const { url } = await response.json();

      // Open in new tab for preview
      window.open(url, '_blank');
    } catch {
      toast.error('Preview failed', {
        description: 'Unable to preview file. Please try again.',
      });
    }
  };

  if (loading) {
    return (
      <div className="py-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // AC 3.13: Hide section if no evidence files
  if (evidenceFiles.length === 0) {
    return null;
  }

  if (error) {
    return (
      <div className="py-4">
        <p className="text-sm text-red-600">Error loading evidence files: {error}</p>
      </div>
    );
  }

  return (
    <section className="px-6 py-6 border-b">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Evidence Files ({evidenceFiles.length})
      </h3>

      <div className="space-y-3">
        {evidenceFiles.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <span className="text-2xl flex-shrink-0">{getFileIcon(file.mimeType)}</span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.originalName}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.fileSize)} · {new Date(file.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {/* AC 3.10: Preview button for images and PDFs */}
              {(file.mimeType.startsWith('image/') || file.mimeType.includes('pdf')) && (
                <button
                  onClick={() => handlePreview(file.id, file.mimeType)}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                  aria-label={`Preview ${file.originalName}`}
                >
                  Preview
                </button>
              )}

              {/* AC 3.9: Download with SAS token */}
              <button
                onClick={() => handleDownload(file.id)}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                aria-label={`Download ${file.originalName}`}
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* AC 3.1: Note about 5 file limit */}
      {evidenceFiles.length >= 5 && (
        <p className="mt-3 text-xs text-gray-500 italic">Maximum of 5 evidence files reached</p>
      )}
    </section>
  );
};

export default EvidenceSection;
