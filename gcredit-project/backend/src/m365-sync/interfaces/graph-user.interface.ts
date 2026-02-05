/**
 * Microsoft Graph User Interface
 *
 * Represents user data returned from Microsoft Graph API /users endpoint.
 *
 * @see Story 8.9: M365 Production Hardening
 * @see https://learn.microsoft.com/en-us/graph/api/user-list
 */
export interface GraphUser {
  /** Azure AD Object ID */
  id: string;
  /** User's display name */
  displayName: string;
  /** User's email address (may be null for service accounts) */
  mail: string | null;
  /** User Principal Name (UPN) - typically email format */
  userPrincipalName: string;
  /** Whether the account is enabled in Azure AD */
  accountEnabled: boolean;
  /** User's job title (optional) */
  jobTitle?: string;
  /** User's department (optional) */
  department?: string;
}

/**
 * Microsoft Graph Users Response
 *
 * Response format from GET /users endpoint with OData pagination.
 *
 * @see https://learn.microsoft.com/en-us/graph/paging
 */
export interface GraphUsersResponse {
  /** URL for next page of results (undefined when no more pages) */
  '@odata.nextLink'?: string;
  /** Array of user objects for current page */
  value: GraphUser[];
}

/**
 * Sync Result for a Single User
 *
 * Tracks the outcome of syncing an individual user.
 */
export interface UserSyncResult {
  email: string;
  success: boolean;
  action: 'created' | 'updated' | 'skipped' | 'failed';
  error?: string;
}

/**
 * Deactivation Result
 *
 * Tracks users deactivated during sync.
 */
export interface DeactivationResult {
  deactivated: number;
  errors: string[];
}
