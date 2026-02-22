/**
 * Evidence API Client — Story 12.6
 * Functions for uploading, adding URL-type evidence, listing, preview, and download.
 */

import { apiFetch } from './apiFetch';
import { API_BASE_URL } from './apiConfig';

export interface EvidenceItem {
  id: string;
  type: 'FILE' | 'URL';
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  uploadedAt: string;
}

export interface EvidenceFileResponse {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  blobUrl: string;
  uploadedAt: string;
  type?: 'FILE' | 'URL';
  sourceUrl?: string;
}

/**
 * Map backend EvidenceFileResponse to frontend EvidenceItem
 */
export function toEvidenceItem(ef: EvidenceFileResponse): EvidenceItem {
  const isUrl = ef.type === 'URL';
  return {
    id: ef.id,
    type: isUrl ? 'URL' : 'FILE',
    name: isUrl ? ef.originalName || truncateUrl(ef.sourceUrl ?? '') : ef.originalName,
    url: isUrl ? (ef.sourceUrl ?? '') : ef.blobUrl,
    size: isUrl ? undefined : ef.fileSize,
    mimeType: isUrl ? undefined : ef.mimeType,
    uploadedAt:
      typeof ef.uploadedAt === 'string' ? ef.uploadedAt : new Date(ef.uploadedAt).toISOString(),
  };
}

/**
 * Upload file evidence with progress tracking.
 * Uses XMLHttpRequest for upload progress (Fetch API does not support it).
 */
export function uploadEvidenceFile(
  badgeId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<EvidenceFileResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as EvidenceFileResponse);
        } catch {
          reject(new Error('Invalid response from server'));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText) as { message?: string };
          reject(new Error(err.message || `Upload failed: ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed — network error')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

    const baseUrl = API_BASE_URL;
    xhr.open('POST', `${baseUrl}/badges/${badgeId}/evidence`);
    xhr.withCredentials = true;
    xhr.send(formData);
  });
}

/**
 * Add URL-type evidence to a badge
 */
export async function addUrlEvidence(
  badgeId: string,
  sourceUrl: string
): Promise<EvidenceFileResponse> {
  const response = await apiFetch(`/badges/${badgeId}/evidence/url`, {
    method: 'POST',
    body: JSON.stringify({ sourceUrl }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to add URL evidence' }));
    throw new Error((err as { message?: string }).message || `HTTP ${response.status}`);
  }
  return response.json() as Promise<EvidenceFileResponse>;
}

/**
 * List all evidence for a badge
 */
export async function listEvidence(badgeId: string): Promise<EvidenceItem[]> {
  const response = await apiFetch(`/badges/${badgeId}/evidence`);
  if (!response.ok) {
    throw new Error('Failed to fetch evidence');
  }
  const data = (await response.json()) as EvidenceFileResponse[];
  return data.map(toEvidenceItem);
}

/**
 * Get SAS URL for preview
 */
export async function getEvidencePreviewUrl(
  badgeId: string,
  fileId: string
): Promise<{ url: string; expiresAt: string; isImage: boolean }> {
  const response = await apiFetch(`/badges/${badgeId}/evidence/${fileId}/preview`);
  if (!response.ok) {
    throw new Error('Failed to generate preview link');
  }
  return response.json() as Promise<{ url: string; expiresAt: string; isImage: boolean }>;
}

/**
 * Get SAS URL for download
 */
export async function getEvidenceDownloadUrl(
  badgeId: string,
  fileId: string
): Promise<{ url: string; expiresAt: string }> {
  const response = await apiFetch(`/badges/${badgeId}/evidence/${fileId}/download`);
  if (!response.ok) {
    throw new Error('Failed to generate download link');
  }
  return response.json() as Promise<{ url: string; expiresAt: string }>;
}

// ─── Helpers ────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(mimeType?: string): string {
  if (!mimeType) return '📎';
  if (mimeType.startsWith('image/')) return '📷';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('docx')) return '📝';
  return '📎';
}

export function truncateUrl(url: string, maxLen = 45): string {
  if (url.length <= maxLen) return url;
  return url.slice(0, maxLen - 3) + '…';
}

/** Allowed MIME types for file evidence */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/** Allowed file extensions (for accept attribute) */
export const ALLOWED_EXTENSIONS = '.pdf,.png,.jpg,.jpeg,.docx';

/** Max file size in bytes (10 MB) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Max total evidence items per badge */
export const MAX_EVIDENCE_ITEMS = 5;

/**
 * Validate a file for evidence upload
 * Returns error message string, or null if valid
 */
export function validateEvidenceFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File "${file.name}" exceeds 10MB limit`;
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `File "${file.name}" — only PDF, PNG, JPG, DOCX files are supported`;
  }
  return null;
}
