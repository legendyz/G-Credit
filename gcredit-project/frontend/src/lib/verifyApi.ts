/**
 * Verify API Client
 * Story 13.7: API Client Cleanup
 *
 * Covers: GET /verify/:verificationId
 */

import { apiFetch } from './apiFetch';

/**
 * GET /verify/:verificationId — returns raw Response for status-specific handling.
 *
 * The caller (VerifyBadgePage) needs direct access to response status codes
 * (404, 410) for distinct error states, so we return the raw Response.
 */
export async function verifyBadge(verificationId: string): Promise<Response> {
  return apiFetch(`/verify/${verificationId}`);
}
