/**
 * Profile extracted from Azure AD id_token claims after SSO callback
 */
export interface AzureAdProfile {
  /** Azure AD Object ID (maps to User.azureId) */
  oid: string;
  /** User's email (from preferred_username or email claim) */
  email: string;
  /** User's display name */
  displayName: string;
}
