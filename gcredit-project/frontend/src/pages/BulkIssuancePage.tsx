/**
 * BulkIssuancePage - Story 8.1: CSV Template & Validation
 *
 * Main page for bulk badge issuance workflow:
 * - Step 1: Download CSV template with field documentation
 * - Step 2: Upload CSV file for validation and preview
 *
 * Route: /admin/bulk-issuance
 * RBAC: ISSUER, ADMIN only
 */

import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TemplateSelector } from '../components/BulkIssuance/TemplateSelector';
import { API_BASE_URL } from '../lib/apiConfig';
import { PageTemplate } from '../components/layout/PageTemplate';

/** Max file size: 100KB */
const MAX_FILE_SIZE = 102_400;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return {
    Authorization: `Bearer ${token}`,
  };
}

export function BulkIssuancePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    totalRows: number;
    validRows: number;
    errorRows: number;
    sessionId: string;
  } | null>(null);

  /**
   * Download CSV template from backend
   */
  const handleDownloadTemplate = useCallback(async () => {
    setIsDownloading(true);
    try {
      const templateUrl = selectedTemplateId
        ? `${API_BASE_URL}/bulk-issuance/template?templateId=${encodeURIComponent(selectedTemplateId)}`
        : `${API_BASE_URL}/bulk-issuance/template`;
      const response = await fetch(templateUrl, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'bulk-badge-issuance-template.csv';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+?)"?$/);
        if (match) filename = match[1];
      }

      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('CSV template downloaded successfully');
    } catch {
      toast.error('Failed to download template. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }, [selectedTemplateId]);

  /**
   * Validate file before upload
   */
  const validateFile = useCallback((file: File): boolean => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      toast.error('Please select a CSV or TXT file (.csv, .txt)');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File exceeds 100KB limit. Maximum 20 badges per upload.');
      return false;
    }
    return true;
  }, []);

  /**
   * Upload CSV file for validation
   */
  const handleUpload = useCallback(
    async (file: File) => {
      if (!validateFile(file)) return;

      setIsUploading(true);
      setUploadResult(null);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/bulk-issuance/upload`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        toast.success(`CSV uploaded: ${data.validRows} valid, ${data.errorRows} errors`);

        if (data.errorRows === 0) {
          // No errors — auto-navigate to preview
          navigate(`/admin/bulk-issuance/preview/${data.sessionId}`);
        } else {
          // Errors found — show validation summary
          setUploadResult({
            totalRows: data.totalRows,
            validRows: data.validRows,
            errorRows: data.errorRows,
            sessionId: data.sessionId,
          });
        }
      } catch (error: unknown) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to upload CSV. Please try again.'
        );
      } finally {
        setIsUploading(false);
      }
    },
    [navigate, validateFile]
  );

  /**
   * Handle file input change — select file but don't auto-upload
   */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileSelected(true);
      setUploadResult(null);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, []);

  /**
   * Handle drag events for drop zone
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileSelected(true);
      setUploadResult(null);
    }
  }, []);

  return (
    <PageTemplate
      title="Bulk Badge Issuance"
      description="Issue multiple badges at once using a CSV file"
    >
      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span className="flex items-center gap-1.5 font-medium text-brand-600">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-bold">
            1
          </span>
          Download
        </span>
        <span className="text-neutral-300">→</span>
        <span className="flex items-center gap-1.5 font-medium text-brand-600">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-bold">
            2
          </span>
          Upload
        </span>
        <span className="text-neutral-300">→</span>
        <span className="flex items-center gap-1.5 text-neutral-400">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-neutral-500 text-xs font-bold">
            3
          </span>
          Preview
        </span>
        <span className="text-neutral-300">→</span>
        <span className="flex items-center gap-1.5 text-neutral-400">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-neutral-500 text-xs font-bold">
            4
          </span>
          Confirm
        </span>
      </div>

      {/* Step 1: Download Template */}
      <div className="bg-white rounded-lg shadow-elevation-1 border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Step 1: Download Template</h3>

        {/* Template Selector (AC6 - P1) */}
        <div className="mb-4">
          <TemplateSelector
            onSelect={(templateId) => setSelectedTemplateId(templateId)}
            disabled={isDownloading}
          />
          <p className="mt-1 text-xs text-neutral-500">
            Optionally select a badge template to pre-fill the template ID in the CSV
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white 
                     rounded-lg hover:bg-brand-700 active:bg-brand-800 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors font-medium text-sm min-h-[44px]"
          aria-label="Download CSV Template"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {isDownloading ? 'Downloading...' : 'Download CSV Template'}
        </button>

        {/* Instructions */}
        <div className="mt-4 bg-brand-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-brand-800 mb-2">📋 Instructions:</h4>
          <ol className="list-decimal list-inside text-sm text-brand-700 space-y-1">
            <li>Download the CSV template above</li>
            <li>Open in Excel or Google Sheets</li>
            <li>Delete the example rows (marked EXAMPLE-DELETE)</li>
            <li>Fill in your badge issuance data</li>
            <li>Save as CSV and upload in Step 2 below</li>
          </ol>
          <div className="mt-3 space-y-1">
            <p className="text-sm text-brand-700">
              💡 <strong>Tip:</strong> Find badge template names in the Badge Catalog page
            </p>
            <p className="text-sm text-amber-700">
              ⚠️ Maximum 20 badges per upload (100KB file size limit)
            </p>
          </div>
        </div>
      </div>

      {/* Step 2: Upload CSV */}
      <div className="bg-white rounded-lg shadow-elevation-1 border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Step 2: Upload CSV</h3>

        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                      transition-all duration-200 min-h-[120px] flex flex-col items-center justify-center
                      ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                      ${
                        dragActive
                          ? 'border-brand-500 bg-brand-50 scale-[1.02] shadow-lg'
                          : fileSelected
                            ? 'border-success bg-success-light'
                            : 'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50'
                      }`}
          role="button"
          aria-label="Upload CSV file"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
          }}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <svg
                className="w-8 h-8 text-brand-500 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-sm text-neutral-600">Uploading and validating...</p>
            </div>
          ) : (
            <>
              <svg
                className="w-10 h-10 text-neutral-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm font-medium text-neutral-700">
                Drag & drop CSV file here, or click to browse
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Supported: .csv and .txt files up to 100KB (max 20 rows)
              </p>
            </>
          )}
        </div>

        {/* File Preview (UX-P1-4) */}
        {selectedFile && !isUploading && (
          <div className="mt-3 flex items-center gap-2 text-sm text-success bg-success-light rounded-lg px-3 py-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span data-testid="file-preview">
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
        )}

        {/* Upload Button — explicit action after file selection */}
        <button
          onClick={() => selectedFile && handleUpload(selectedFile)}
          disabled={!selectedFile || isUploading}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white 
                     rounded-lg hover:bg-green-700 active:bg-green-800 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors font-medium text-sm min-h-[44px]"
          aria-label="Upload CSV"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          {isUploading ? 'Uploading...' : 'Upload CSV'}
        </button>

        {/* Validation Summary — shown when upload has errors */}
        {uploadResult && (
          <div
            className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4"
            data-testid="validation-summary"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚠️</span>
              <h4 className="text-sm font-semibold text-amber-800">Validation Results</h4>
            </div>
            <p className="text-sm text-amber-700 mb-3">
              ✅ {uploadResult.validRows} of {uploadResult.totalRows} badges valid
              {' · '}❌ {uploadResult.errorRows} errors found
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/admin/bulk-issuance/preview/${uploadResult.sessionId}`)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-600 text-white rounded-md 
                           hover:bg-brand-700 text-sm font-medium transition-colors"
              >
                View Preview & Fix Errors →
              </button>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setFileSelected(false);
                  setUploadResult(null);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-neutral-300 
                           text-neutral-700 rounded-md hover:bg-neutral-50 text-sm font-medium transition-colors"
              >
                Upload New File
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
      </div>
    </PageTemplate>
  );
}

export default BulkIssuancePage;
