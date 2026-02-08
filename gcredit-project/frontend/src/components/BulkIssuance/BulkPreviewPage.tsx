import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BulkPreviewHeader from './BulkPreviewHeader';
import BulkPreviewTable from './BulkPreviewTable';
import ErrorCorrectionPanel from './ErrorCorrectionPanel';
import ConfirmationModal from './ConfirmationModal';
import EmptyPreviewState from './EmptyPreviewState';
import ProcessingComplete from './ProcessingComplete';
import ProcessingModal from './ProcessingModal';

interface PreviewRow {
  rowNumber: number;
  badgeTemplateId: string;
  recipientEmail: string;
  evidenceUrl?: string;
  isValid: boolean;
  error?: string;
  badgeName?: string;
  recipientName?: string;
}

interface SessionError {
  rowNumber: number;
  badgeTemplateId: string;
  recipientEmail: string;
  message: string;
}

interface TemplateBreakdown {
  templateId: string;
  templateName: string;
  count: number;
}

interface EnrichedPreviewData {
  sessionId: string;
  validRows: number;
  errorRows: number;
  totalRows: number;
  errors: SessionError[];
  status: string;
  createdAt: string;
  expiresAt: string;
  rows: PreviewRow[];
  summary?: {
    byTemplate: TemplateBreakdown[];
  };
}

/**
 * Bulk Preview Page Component (UX-P0-3)
 *
 * Displays validation results after CSV upload and provides:
 * - Summary statistics with template breakdown (AC1)
 * - Data table with search/filter/pagination (AC2)
 * - Error details with download + re-upload workflow (AC3, UX-P0-3)
 * - Proper confirmation modal (AC4)
 * - Smart countdown timer (AC5, UX-P1-3)
 * - Empty state component (AC6)
 */
export default function BulkPreviewPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();

  const [previewData, setPreviewData] = useState<EnrichedPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingResults, setProcessingResults] = useState<{
    success: number;
    failed: number;
    results: Array<{
      row: number;
      recipientEmail: string;
      badgeName: string;
      status: 'success' | 'failed';
      error?: string;
    }>;
  } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchPreviewData();
    }
  }, [sessionId]);

  // Auto-redirect after session expires (AC5)
  useEffect(() => {
    if (!sessionExpired) return;
    const timer = setTimeout(() => {
      navigate('/admin/bulk-issuance');
    }, 5000);
    return () => clearTimeout(timer);
  }, [sessionExpired, navigate]);

  const fetchPreviewData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/bulk-issuance/preview/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        },
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have permission to access this session');
        }
        if (response.status === 404) {
          throw new Error('Session not found or has expired');
        }
        throw new Error('Failed to load preview data');
      }

      const data: EnrichedPreviewData = await response.json();
      setPreviewData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadErrorReport = async () => {
    try {
      const response = await fetch(
        `/api/bulk-issuance/error-report/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to download error report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `errors-${sessionId?.substring(0, 8)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const handleConfirmClick = () => {
    if (
      !previewData ||
      previewData.validRows === 0 ||
      previewData.errorRows > 0
    )
      return;
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    setShowConfirmModal(false);
    setIsProcessing(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(
        `/api/bulk-issuance/confirm/${sessionId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Bulk issuance failed');
      }

      const data: {
        processed: number;
        failed: number;
        results: Array<{
          row: number;
          recipientEmail: string;
          badgeName: string;
          status: 'success' | 'failed';
          error?: string;
        }>;
      } = await response.json();
      setProcessingResults({
        success: data.processed,
        failed: data.failed,
        results: data.results,
      });
      setProcessingComplete(true);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError(
          'Processing timed out after 30 seconds. Please check your badges and try again.',
        );
      } else {
        setError(
          err instanceof Error ? err.message : 'Issuance failed unexpectedly',
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReupload = () => {
    navigate('/admin/bulk-issuance');
  };

  const handleSessionExpired = () => {
    setSessionExpired(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading preview data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-medium mb-4">{error}</p>
          <button
            onClick={handleReupload}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  // Processing complete view
  if (processingComplete && processingResults) {
    return (
      <ProcessingComplete
        success={processingResults.success}
        failed={processingResults.failed}
        results={processingResults.results}
        sessionId={sessionId}
        onViewBadges={() => navigate('/admin/badges')}
        onRetryFailed={
          processingResults.failed > 0
            ? () => navigate('/admin/bulk-issuance')
            : undefined
        }
      />
    );
  }

  if (!previewData) {
    return null;
  }

  // Session expired modal
  if (sessionExpired) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">⏰</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Session Expired
          </h2>
          <p className="text-gray-600 mb-4">
            Your preview session has expired. Please upload your CSV file again.
            You will be redirected automatically in a few seconds.
          </p>
          <button
            onClick={handleReupload}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Re-upload CSV
          </button>
        </div>
      </div>
    );
  }

  // Empty state: zero valid rows with errors
  if (previewData.validRows === 0 && previewData.errorRows > 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <BulkPreviewHeader
          totalRows={previewData.totalRows}
          validRows={previewData.validRows}
          errorRows={previewData.errorRows}
          templateBreakdown={previewData.summary?.byTemplate?.map((t) => ({
            templateName: t.templateName,
            count: t.count,
          })) ?? []}
          expiresAt={previewData.expiresAt}
          onExpired={handleSessionExpired}
        />
        <ErrorCorrectionPanel
          errorCount={previewData.errorRows}
          validCount={previewData.validRows}
          errors={previewData.errors}
          onDownloadErrorReport={handleDownloadErrorReport}
          onReupload={handleReupload}
        />
        <EmptyPreviewState onReupload={handleReupload} />
      </div>
    );
  }

  // Empty state: zero valid rows, zero errors (edge case)
  if (previewData.validRows === 0) {
    return <EmptyPreviewState onReupload={handleReupload} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with summary stats and timer */}
      <BulkPreviewHeader
        totalRows={previewData.totalRows}
        validRows={previewData.validRows}
        errorRows={previewData.errorRows}
        templateBreakdown={previewData.summary?.byTemplate?.map((t) => ({
          templateName: t.templateName,
          count: t.count,
        })) ?? []}
        expiresAt={previewData.expiresAt}
        onExpired={handleSessionExpired}
      />

      {/* Error Correction Panel */}
      {previewData.errorRows > 0 && (
        <ErrorCorrectionPanel
          errorCount={previewData.errorRows}
          validCount={previewData.validRows}
          errors={previewData.errors}
          onDownloadErrorReport={handleDownloadErrorReport}
          onReupload={handleReupload}
        />
      )}

      {/* Data Table with search/filter/pagination */}
      <BulkPreviewTable
        rows={previewData.rows}
        validRows={previewData.validRows}
      />

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleReupload}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
        >
          ← Back to Upload
        </button>

        <button
          onClick={handleConfirmClick}
          disabled={
            previewData.validRows === 0 || previewData.errorRows > 0
          }
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            previewData.validRows > 0 && previewData.errorRows === 0
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Confirm Issuance ({previewData.validRows} badges) →
        </button>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        badgeCount={previewData.validRows}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* Processing Modal (pseudo-progress visual indicator) */}
      <ProcessingModal
        totalBadges={previewData.validRows}
        isProcessing={isProcessing}
        badgeRows={previewData.rows
          .filter((r) => r.isValid)
          .map((r) => ({
            badgeName: r.badgeName,
            recipientName: r.recipientName,
            recipientEmail: r.recipientEmail,
          }))}
      />
    </div>
  );
}
