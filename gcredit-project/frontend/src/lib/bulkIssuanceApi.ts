/**
 * Bulk Issuance API Client
 * Story 13.7: API Client Cleanup
 *
 * Covers: CSV template download, upload, preview, error-report, confirm
 */

import { apiFetch, apiFetchJson } from './apiFetch';

export interface BulkUploadResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  sessionId: string;
}

export interface SessionError {
  rowNumber: number;
  badgeTemplateId: string;
  recipientEmail: string;
  message: string;
}

export interface PreviewRow {
  rowNumber: number;
  badgeTemplateId: string;
  recipientEmail: string;
  isValid: boolean;
  error?: string;
  badgeName?: string;
  recipientName?: string;
}

export interface TemplateBreakdown {
  templateId: string;
  templateName: string;
  count: number;
}

export interface EnrichedPreviewData {
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

export interface BulkConfirmResult {
  processed: number;
  failed: number;
  results: Array<{
    row: number;
    recipientEmail: string;
    badgeName: string;
    status: 'success' | 'failed';
    error?: string;
    badgeId?: string;
    emailError?: string;
  }>;
}

/** GET /bulk-issuance/template — returns CSV blob for download */
export async function downloadTemplate(templateId?: string): Promise<Response> {
  const url = templateId
    ? `/bulk-issuance/template?templateId=${encodeURIComponent(templateId)}`
    : '/bulk-issuance/template';
  const response = await apiFetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }
  return response;
}

/** POST /bulk-issuance/upload — FormData with CSV file */
export async function uploadBulkIssuance(formData: FormData): Promise<BulkUploadResult> {
  return apiFetchJson<BulkUploadResult>('/bulk-issuance/upload', {
    method: 'POST',
    body: formData,
  });
}

/** GET /bulk-issuance/preview/:sessionId */
export async function getBulkPreview(sessionId: string): Promise<EnrichedPreviewData> {
  const response = await apiFetch(`/bulk-issuance/preview/${sessionId}`);
  // Preserve original status-specific error handling in callers
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('You do not have permission to access this session');
    }
    if (response.status === 404) {
      throw new Error('Session not found or has expired');
    }
    throw new Error('Failed to load preview data');
  }
  return response.json();
}

/** GET /bulk-issuance/error-report/:sessionId — returns blob */
export async function downloadErrorReport(sessionId: string): Promise<Blob> {
  const response = await apiFetch(`/bulk-issuance/error-report/${sessionId}`);
  if (!response.ok) throw new Error('Failed to download error report');
  return response.blob();
}

/** POST /bulk-issuance/confirm/:sessionId */
export async function confirmBulkIssuance(
  sessionId: string,
  signal?: AbortSignal
): Promise<BulkConfirmResult> {
  return apiFetchJson<BulkConfirmResult>(`/bulk-issuance/confirm/${sessionId}`, {
    method: 'POST',
    signal,
  });
}
