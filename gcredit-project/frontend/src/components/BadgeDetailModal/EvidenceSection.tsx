import React, { useState, useEffect } from 'react';

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
    fetchEvidence();
  }, [badgeId]);

  const fetchEvidence = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3000/api/evidence/${badgeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

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
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3000/api/evidence/${badgeId}/${fileId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate download link');
      }

      const { sasUrl } = await response.json();
      
      // Open in new tab to trigger download
      window.open(sasUrl, '_blank');
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download file. Please try again.');
    }
  };

  const handlePreview = async (fileId: string, mimeType: string) => {
    // Only preview images and PDFs
    if (!mimeType.startsWith('image/') && !mimeType.includes('pdf')) {
      alert('Preview not available for this file type');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3000/api/evidence/${badgeId}/${fileId}/preview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview link');
      }

      const { sasUrl } = await response.json();
      
      // Open in new tab for preview
      window.open(sasUrl, '_blank');
    } catch (err) {
      console.error('Preview error:', err);
      alert('Failed to preview file. Please try again.');
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
    <div className="py-6 border-t">
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
              <span className="text-2xl flex-shrink-0">
                {getFileIcon(file.mimeType)}
              </span>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.originalName}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.fileSize)} • {new Date(file.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {/* AC 3.10: Preview button for images and PDFs */}
              {(file.mimeType.startsWith('image/') || file.mimeType.includes('pdf')) && (
                <button
                  onClick={() => handlePreview(file.id, file.mimeType)}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                  aria-label={`Preview ${file.originalName}`}
                >
                  Preview
                </button>
              )}

              {/* AC 3.9: Download with SAS token */}
              <button
                onClick={() => handleDownload(file.id)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
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
        <p className="mt-3 text-xs text-gray-500 italic">
          Maximum of 5 evidence files reached
        </p>
      )}
    </div>
  );
};

export default EvidenceSection;
