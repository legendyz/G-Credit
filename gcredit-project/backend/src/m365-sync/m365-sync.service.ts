import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Client } from '@microsoft/microsoft-graph-client';
import { PrismaService } from '../common/prisma.service';
import { GraphTokenProviderService } from '../microsoft-graph/services/graph-token-provider.service';
import {
  GraphUser,
  GraphUsersResponse,
  DeactivationResult,
} from './interfaces/graph-user.interface';
import { SyncResultDto, SyncLogDto, IntegrationStatusDto } from './dto';
import { SyncType } from './dto/trigger-sync.dto';
import { UserRole } from '@prisma/client';

/**
 * M365 Sync Service
 *
 * Implements production-grade Microsoft 365 user synchronization:
 * - AC1: Pagination for 1000+ users
 * - AC2: Retry with exponential backoff (ADR-008)
 * - AC3: Audit logging via M365SyncLog table
 * - AC4: User deactivation sync (preserves roleSetManually)
 * - AC5: Per-user error recovery
 *
 * @see Story 8.9: M365 Production Hardening
 * @see ADR-008: Microsoft Graph Integration Strategy
 */
@Injectable()
export class M365SyncService {
  private readonly logger = new Logger(M365SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly graphTokenProvider: GraphTokenProviderService,
  ) {}

  /**
   * AC1: Fetch all users from Azure AD with pagination
   *
   * Uses Microsoft Graph API /users endpoint with $top parameter.
   * Follows @odata.nextLink until all pages are retrieved.
   *
   * @returns Promise<GraphUser[]> All users from Azure AD
   * @throws Error if Graph API is not available or request fails
   */
  async getAllAzureUsers(): Promise<GraphUser[]> {
    const allUsers: GraphUser[] = [];
    const selectFields =
      'id,displayName,mail,userPrincipalName,accountEnabled,jobTitle,department';
    const pageSize = 999; // Graph API max per page

    let url = `/users?$select=${selectFields}&$top=${pageSize}`;

    do {
      const response = await this.fetchWithRetry<GraphUsersResponse>(url);
      allUsers.push(...response.value);

      // Extract relative path from nextLink (Graph SDK uses relative paths)
      if (response['@odata.nextLink']) {
        url = response['@odata.nextLink'].replace(
          'https://graph.microsoft.com/v1.0',
          '',
        );
      } else {
        url = '';
      }

      this.logger.log(`Fetched ${allUsers.length} users, hasMore: ${!!url}`);
    } while (url);

    return allUsers;
  }

  /**
   * AC2: Fetch with exponential backoff retry (ADR-008 compliant)
   *
   * Retry strategy:
   * - Max retries: 3
   * - Initial delay: 1000ms
   * - Backoff multiplier: 2x (1s → 2s → 4s)
   * - Retryable errors: 429 (rate limit), 5xx (server errors)
   *
   * @param url Graph API endpoint URL
   * @param maxRetries Maximum retry attempts (default: 3)
   * @param baseDelayMs Initial delay in milliseconds (default: 1000)
   * @returns Promise<T> API response
   * @throws Error after exhausting retries or on non-retryable error
   */
  async fetchWithRetry<T>(
    url: string,
    maxRetries: number = 3,
    baseDelayMs: number = 1000,
  ): Promise<T> {
    const authProvider = this.graphTokenProvider.getAuthProvider();
    if (!authProvider) {
      throw new Error(
        'Graph API not configured - Azure AD credentials missing',
      );
    }

    const client = Client.initWithMiddleware({ authProvider });
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Graph SDK uses relative paths (without https://graph.microsoft.com/v1.0)
        let relativePath = url;
        if (relativePath.startsWith('https://graph.microsoft.com/v1.0')) {
          relativePath = relativePath.replace(
            'https://graph.microsoft.com/v1.0',
            '',
          );
        }
        if (!relativePath.startsWith('/')) {
          relativePath = `/${relativePath}`;
        }
        return (await client.api(relativePath).get()) as T;
      } catch (error) {
        lastError = error as Error;
        const isRetryable = this.isRetryableError(error);

        if (!isRetryable || attempt === maxRetries) {
          // 404 is expected for some endpoints (e.g., user has no manager)
          const statusCode = (error as { statusCode?: number })?.statusCode;
          if (statusCode !== 404) {
            this.logger.error(
              `Graph API error (attempt ${attempt + 1}/${maxRetries + 1}): ${(error as Error).message}`,
            );
          }
          throw error;
        }

        const delayMs = baseDelayMs * Math.pow(2, attempt);
        this.logger.warn(
          `Retry ${attempt + 1}/${maxRetries} after ${delayMs}ms: ${(error as Error).message}`,
        );

        await this.delay(delayMs);
      }
    }

    throw lastError;
  }

  /**
   * Check if error is retryable
   *
   * AC2: Handle network errors and HTTP errors
   * - 429: Rate limiting
   * - 5xx: Server errors
   * - Network errors: ECONNRESET, ETIMEDOUT, ENOTFOUND, ECONNREFUSED
   *
   * @param error Error to check
   * @returns true if error is retryable
   */
  isRetryableError(error: unknown): boolean {
    // Check for network errors (AC2 fix)
    const errorCode = (error as { code?: string })?.code;
    const networkErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'EAI_AGAIN',
      'EPIPE',
    ];
    if (errorCode && networkErrors.includes(errorCode)) {
      return true;
    }

    // Check for HTTP status codes
    const statusCode =
      (error as { statusCode?: number })?.statusCode ||
      (error as { code?: number })?.code;
    if (typeof statusCode !== 'number') return false;
    return statusCode === 429 || (statusCode >= 500 && statusCode < 600);
  }

  /**
   * Delay helper for exponential backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Story 12.3a AC #24, #25, #30: Check user's Security Group memberships to determine role.
   * Returns the highest-priority role based on group membership.
   * Priority: Security Group (ADMIN/ISSUER) > roleSetManually > directReports > EMPLOYEE
   *
   * @param azureId Azure AD user ID
   * @returns UserRole if Security Group match found, null otherwise
   */
  async getUserRoleFromGroups(azureId: string): Promise<UserRole | null> {
    try {
      const url = `https://graph.microsoft.com/v1.0/users/${azureId}/memberOf`;
      const response = await this.fetchWithRetry<{
        value: Array<{ id: string; '@odata.type': string }>;
      }>(url);

      const groupIds = response.value
        .filter((m) => m['@odata.type'] === '#microsoft.graph.group')
        .map((m) => m.id);

      const adminGroupId = process.env.AZURE_ADMIN_GROUP_ID;
      const issuerGroupId = process.env.AZURE_ISSUER_GROUP_ID;

      if (adminGroupId && groupIds.includes(adminGroupId))
        return UserRole.ADMIN;
      if (issuerGroupId && groupIds.includes(issuerGroupId))
        return UserRole.ISSUER;

      return null; // No Security Group match — fall through to directReports/default
    } catch (error) {
      this.logger.warn(
        `Failed to check group membership for azureId ${azureId}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Batch-fetch all members of a Security Group by group ID.
   * Returns a Set of Azure AD user IDs for O(1) membership checks.
   *
   * @param groupId Azure AD Security Group object ID
   * @returns Set of member azureIds
   */
  private async getGroupMembers(groupId: string): Promise<Set<string>> {
    const members = new Set<string>();
    try {
      const url = `https://graph.microsoft.com/v1.0/groups/${groupId}/members?$select=id`;
      const response = await this.fetchWithRetry<{
        value: Array<{ id: string }>;
      }>(url);

      for (const member of response.value) {
        members.add(member.id);
      }

      this.logger.log(`Fetched ${members.size} members from group ${groupId}`);
    } catch (error) {
      this.logger.warn(
        `Failed to fetch group members for ${groupId}: ${(error as Error).message}`,
      );
    }
    return members;
  }

  /**
   * Story 12.3a AC #23: Link manager relationships using Graph API /manager endpoint.
   * Must run AFTER all users are created/updated (Pass 1).
   *
   * @param syncedAzureIds List of Azure IDs that were synced
   * @returns linked count and error count
   */
  private async linkManagerRelationships(
    syncedAzureIds: string[],
  ): Promise<{ linked: number; errors: number }> {
    let linked = 0;
    let errors = 0;

    for (const azureId of syncedAzureIds) {
      try {
        const url = `https://graph.microsoft.com/v1.0/users/${azureId}/manager`;
        const managerData = await this.fetchWithRetry<{ id: string }>(url);

        const localUser = await this.prisma.user.findUnique({
          where: { azureId },
        });
        if (!localUser) continue;

        if (managerData?.id) {
          const localManager = await this.prisma.user.findUnique({
            where: { azureId: managerData.id },
          });

          // Manager exists in Graph and locally → link
          if (localManager) {
            if (localUser.managerId !== localManager.id) {
              await this.prisma.user.update({
                where: { id: localUser.id },
                data: { managerId: localManager.id },
              });
              linked++;
            }
          } else {
            // Manager exists in Graph but not locally → clear stale link
            if (localUser.managerId) {
              await this.prisma.user.update({
                where: { id: localUser.id },
                data: { managerId: null },
              });
              linked++;
            }
          }
        } else {
          // Graph returned no manager data → clear stale link
          if (localUser.managerId) {
            await this.prisma.user.update({
              where: { id: localUser.id },
              data: { managerId: null },
            });
            linked++;
          }
        }
      } catch (error) {
        if ((error as { statusCode?: number })?.statusCode === 404) {
          // 404 = no manager assigned → clear stale managerId
          const localUser = await this.prisma.user.findUnique({
            where: { azureId },
            select: { id: true, managerId: true },
          });
          if (localUser?.managerId) {
            await this.prisma.user.update({
              where: { id: localUser.id },
              data: { managerId: null },
            });
            linked++;
          }
        } else {
          errors++;
          this.logger.warn(`Failed to resolve manager for azureId ${azureId}`);
        }
      }
    }

    return { linked, errors };
  }

  /**
   * Story 12.3a: Determine role for a synced user based on priority logic (AC #30).
   * Priority: Security Group (ADMIN/ISSUER) > roleSetManually > directReports > EMPLOYEE
   *
   * @param azureId Azure AD ID
   * @param existingUser Existing local user (if any)
   * @param hasDirectReports Whether user has direct reports
   * @returns Resolved UserRole
   */
  private async resolveUserRole(
    azureId: string,
    existingUser: {
      role: UserRole;
      roleSetManually: boolean;
      azureId: string | null;
    } | null,
    hasDirectReports: boolean,
  ): Promise<UserRole> {
    // AC #26: Skip role update for locally-created users (azureId = null)
    if (existingUser && !existingUser.azureId) {
      return existingUser.role;
    }

    // Priority 1: Security Group membership
    const groupRole = await this.getUserRoleFromGroups(azureId);
    if (groupRole) return groupRole;

    // Priority 2: roleSetManually = true → keep existing role
    if (existingUser?.roleSetManually) return existingUser.role;

    // Priority 3: directReports > 0 → MANAGER
    if (hasDirectReports) return UserRole.MANAGER;

    // Priority 4: Default → EMPLOYEE
    return UserRole.EMPLOYEE;
  }

  /**
   * Story 12.3a AC #31: Shared helper for single-user sync from Graph API.
   * Used by both login-time mini-sync and full/group-only sync.
   *
   * Fires 3 Graph API calls in parallel for performance (~200-300ms total).
   *
   * @param user Local user with id, azureId, lastSyncAt
   * @returns { rejected: boolean, reason?: string }
   */
  async syncUserFromGraph(user: {
    id: string;
    azureId: string;
    lastSyncAt: Date | null;
  }): Promise<{
    rejected: boolean;
    reason?: string;
  }> {
    const DEGRADATION_WINDOW_HOURS = 24;

    try {
      // Fire 3 Graph API calls in parallel (AC #31g — ~200-300ms)
      const [profileResult, memberOfResult, managerResult] =
        await Promise.allSettled([
          this.fetchWithRetry<GraphUser>(
            `https://graph.microsoft.com/v1.0/users/${user.azureId}?$select=accountEnabled,displayName,department`,
          ),
          this.fetchWithRetry<{
            value: Array<{ id: string; '@odata.type': string }>;
          }>(`https://graph.microsoft.com/v1.0/users/${user.azureId}/memberOf`),
          this.fetchWithRetry<{ id: string }>(
            `https://graph.microsoft.com/v1.0/users/${user.azureId}/manager`,
          ).catch((err) => {
            // 404 = no manager (normal)
            if ((err as { statusCode?: number })?.statusCode === 404)
              return null;
            throw err;
          }),
        ]);

      // a. Check accountEnabled
      if (profileResult.status === 'fulfilled') {
        const profile = profileResult.value;
        if (!profile.accountEnabled) {
          return { rejected: true, reason: 'M365 account disabled' };
        }

        // b. Update profile fields
        const updateData: Record<string, unknown> = {
          firstName: profile.displayName?.split(' ')[0] || undefined,
          lastName:
            profile.displayName?.split(' ').slice(1).join(' ') || undefined,
          department: profile.department || undefined,
          lastSyncAt: new Date(),
        };

        // c. Determine role from Security Group
        let newRole: UserRole | undefined;
        if (memberOfResult.status === 'fulfilled') {
          const groupIds = memberOfResult.value.value
            .filter((m) => m['@odata.type'] === '#microsoft.graph.group')
            .map((m) => m.id);

          const adminGroupId = process.env.AZURE_ADMIN_GROUP_ID;
          const issuerGroupId = process.env.AZURE_ISSUER_GROUP_ID;

          if (adminGroupId && groupIds.includes(adminGroupId)) {
            newRole = UserRole.ADMIN;
          } else if (issuerGroupId && groupIds.includes(issuerGroupId)) {
            newRole = UserRole.ISSUER;
          }
        }

        // d. Update managerId (clear stale link when manager absent/unresolved)
        if (managerResult.status === 'fulfilled') {
          if (managerResult.value) {
            const managerAzureId = (managerResult.value as { id: string }).id;
            const localManager = await this.prisma.user.findUnique({
              where: { azureId: managerAzureId },
              select: { id: true },
            });
            // Link to local manager, or clear if manager not in local DB
            updateData.managerId = localManager?.id ?? null;
          } else {
            // Manager call returned null (404 caught) → no manager
            updateData.managerId = null;
          }
        }

        // Apply role if determined
        if (newRole) {
          updateData.role = newRole;
        }

        // e. Update user record
        await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });

        return { rejected: false };
      }

      // Profile fetch failed — enter degradation mode
      throw new Error('Profile fetch failed');
    } catch (_error) {
      // f. Graceful fallback — degradation window (AC #35)
      if (user.lastSyncAt) {
        const hoursSinceSync =
          (Date.now() - user.lastSyncAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceSync <= DEGRADATION_WINDOW_HOURS) {
          this.logger.warn(
            `Graph API unavailable for user ${user.id}, using cached data (last sync ${hoursSinceSync.toFixed(1)}h ago)`,
          );
          return { rejected: false };
        }
      }

      // lastSyncAt > 24h OR no lastSyncAt → reject
      this.logger.error(
        `Graph API unavailable for user ${user.id}, cached data expired — rejecting login`,
      );
      return {
        rejected: true,
        reason: 'Graph API unavailable and cached data expired',
      };
    }
  }

  /**
   * AC4: Sync user deactivations
   *
   * Identifies users that should be deactivated:
   * 1. Users in local DB that no longer exist in Azure AD
   * 2. Users with Azure accounts that are disabled (accountEnabled: false)
   *
   * Preserves roleSetManually flag - does not modify role.
   *
   * @param azureUsers Users from Azure AD
   * @param syncLogId ID of current sync log for audit trail
   * @returns DeactivationResult with count and any errors
   */
  async syncUserDeactivations(
    azureUsers: GraphUser[],
    _syncLogId: string,
  ): Promise<DeactivationResult> {
    // Build maps for efficient lookups
    const azureUserById = new Map(azureUsers.map((u) => [u.id, u]));
    const disabledAzureIds = new Set(
      azureUsers.filter((u) => !u.accountEnabled).map((u) => u.id),
    );
    const errors: string[] = [];
    let deactivatedCount = 0;

    // Get all active local users with Azure IDs — AC #38: no PII in select
    const activeLocalUsers = await this.prisma.user.findMany({
      where: { isActive: true, azureId: { not: null } },
      select: {
        id: true,
        azureId: true,
        roleSetManually: true,
      },
    });

    for (const localUser of activeLocalUsers) {
      // Skip users without Azure ID (locally created)
      if (!localUser.azureId) continue;

      // Determine if user should be deactivated and why
      let deactivationReason: string | null = null;

      if (!azureUserById.has(localUser.azureId)) {
        // Case 1: User no longer exists in Azure AD
        deactivationReason = 'User not found in Azure AD during M365 sync';
      } else if (disabledAzureIds.has(localUser.azureId)) {
        // Case 2: User exists but is disabled in Azure AD (AC4 fix)
        deactivationReason = 'User account is disabled in Azure AD';
      }

      if (deactivationReason) {
        try {
          await this.prisma.user.update({
            where: { id: localUser.id },
            data: {
              isActive: false,
              lastSyncAt: new Date(),
              // Preserve roleSetManually - do not modify role
            },
          });

          // Create audit log entry
          await this.prisma.userAuditLog.create({
            data: {
              userId: localUser.id,
              action: 'DEACTIVATED',
              changes: {
                isActive: { old: true, new: false },
                reason: deactivationReason,
              },
              source: 'M365_SYNC',
              actorId: null, // System action
            },
          });

          deactivatedCount++;
          this.logger.log(
            `Deactivated user: ${localUser.id} (${deactivationReason})`,
          );
        } catch (error) {
          errors.push(
            `Failed to deactivate user:${localUser.id}: ${(error as Error).message}`,
          );
          this.logger.error(
            `Failed to deactivate user:${localUser.id}`,
            (error as Error).stack,
          );
        }
      }
    }

    return { deactivated: deactivatedCount, errors };
  }

  /**
   * AC5: Sync a single user with error recovery
   * Story 12.3a: Enhanced with Security Group role mapping (AC #24, #26, #30)
   *
   * @param azureUser User data from Azure AD
   * @returns Object with success status, action taken, and any error
   */
  async syncSingleUser(azureUser: GraphUser): Promise<{
    success: boolean;
    action: 'created' | 'updated' | 'skipped';
    error?: string;
  }> {
    try {
      // Skip disabled accounts
      if (!azureUser.accountEnabled) {
        return { success: true, action: 'skipped' };
      }

      // Use email or UPN as identifier
      const email = azureUser.mail || azureUser.userPrincipalName;
      if (!email) {
        return {
          success: false,
          action: 'skipped',
          error: 'No email or UPN available',
        };
      }

      // Check if user exists by Azure ID or email
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ azureId: azureUser.id }, { email: email.toLowerCase() }],
        },
        select: {
          id: true,
          role: true,
          roleSetManually: true,
          azureId: true,
        },
      });

      const userData = {
        email: email.toLowerCase(),
        azureId: azureUser.id,
        firstName: azureUser.displayName?.split(' ')[0] || '',
        lastName: azureUser.displayName?.split(' ').slice(1).join(' ') || '',
        department: azureUser.department || null,
        lastSyncAt: new Date(),
      };

      // Story 12.3a: Resolve role via Security Group/priority logic
      // hasDirectReports determined later in Pass 2 (linkManagerRelationships)
      const resolvedRole = await this.resolveUserRole(
        azureUser.id,
        existingUser,
        false, // directReports checked in Pass 2
      );

      if (existingUser) {
        // Update existing user — AC #38: no PII in logs
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { ...userData, role: resolvedRole },
        });

        return { success: true, action: 'updated' };
      } else {
        // Create new user
        // DEC-011-13: SSO-only — M365 users cannot use password login
        await this.prisma.user.create({
          data: {
            ...userData,
            passwordHash: '', // Empty hash → password login blocked (Story 13.1 guard)
            isActive: true,
            role: resolvedRole,
          },
        });

        this.logger.log(
          `[M365-SYNC] Created M365 user with SSO-only access (no temp password)`,
        );

        return { success: true, action: 'created' };
      }
    } catch (error) {
      return {
        success: false,
        action: 'skipped',
        error: (error as Error).message,
      };
    }
  }

  /**
   * AC1-AC5 + Story 12.3a: Main sync flow
   *
   * Orchestrates the complete sync process:
   * 1. Create sync log entry (AC3)
   * 2. Fetch all users with pagination (AC1) and retry (AC2)
   * 3. Sync each user with error recovery (AC5)
   * 4. Link manager relationships (Story 12.3a AC #23) — Pass 2
   * 5. Update roles for users with directReports (Story 12.3a AC #30)
   * 6. Sync deactivations (AC4)
   * 7. Update sync log with results (AC3)
   *
   * @param syncType 'FULL', 'INCREMENTAL', or 'GROUPS_ONLY'
   * @param syncedBy Who triggered the sync
   * @returns SyncResultDto
   */
  async runSync(
    syncType: SyncType = 'FULL',
    syncedBy?: string,
  ): Promise<SyncResultDto> {
    // Story 12.3a AC #27: Route to GROUPS_ONLY sync if requested
    if (syncType === 'GROUPS_ONLY') {
      return this.runGroupsOnlySync(syncedBy);
    }

    const startTime = Date.now();
    const startedAt = new Date();
    const errors: string[] = [];
    let syncedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    let deactivatedCount = 0;
    let totalUsers = 0;

    // AC3: Create sync log entry with syncedBy
    const syncLog = await this.prisma.m365SyncLog.create({
      data: {
        syncDate: startedAt,
        syncType,
        status: 'IN_PROGRESS',
        userCount: 0,
        syncedCount: 0,
        createdCount: 0,
        updatedCount: 0,
        failedCount: 0,
        syncedBy: syncedBy || 'SYSTEM',
        metadata: { retryAttempts: 0, pagesProcessed: 0 },
      },
    });

    try {
      // AC1: Fetch all users with pagination — AC #38: log counts only, no PII
      this.logger.log(`Starting ${syncType} M365 sync...`);
      const azureUsers = await this.getAllAzureUsers();
      totalUsers = azureUsers.length;
      this.logger.log(`Fetched ${totalUsers} users from Azure AD`);

      // Pass 1: Sync each user with error recovery (AC5 + AC #24 role mapping)
      const syncedAzureIds: string[] = [];
      for (const azureUser of azureUsers) {
        const result = await this.syncSingleUser(azureUser);

        if (result.success) {
          syncedCount++;
          if (result.action === 'created') createdCount++;
          if (result.action === 'updated') updatedCount++;
          if (azureUser.id) syncedAzureIds.push(azureUser.id);
        } else if (result.error) {
          errors.push(`user:${azureUser.id || 'unknown'}: ${result.error}`);
        }
      }

      // Pass 2: Link manager relationships (Story 12.3a AC #23)
      const managerResult = await this.linkManagerRelationships(syncedAzureIds);
      this.logger.log(
        `Manager linkage: ${managerResult.linked} linked, ${managerResult.errors} errors`,
      );

      // Pass 2b: Update roles for users with directReports (Story 12.3a AC #30)
      await this.updateDirectReportsRoles(syncedAzureIds);

      // AC4: Sync deactivations
      const deactivationResult = await this.syncUserDeactivations(
        azureUsers,
        syncLog.id,
      );
      deactivatedCount = deactivationResult.deactivated;
      errors.push(...deactivationResult.errors);

      // AC3: Update sync log with results — AC #38: no PII in logs
      const durationMs = Date.now() - startTime;
      const status =
        errors.length === 0
          ? 'SUCCESS'
          : syncedCount > 0
            ? 'PARTIAL_SUCCESS'
            : 'FAILURE';

      await this.prisma.m365SyncLog.update({
        where: { id: syncLog.id },
        data: {
          status,
          userCount: totalUsers,
          syncedCount,
          createdCount,
          updatedCount,
          failedCount: errors.length, // AC3: Track failed users
          durationMs,
          errorMessage:
            errors.length > 0 ? errors.slice(0, 10).join('; ') : null,
          metadata: {
            retryAttempts: 0,
            pagesProcessed: Math.ceil(totalUsers / 999),
            deactivatedCount,
            managersLinked: managerResult.linked,
          },
        },
      });

      this.logger.log(
        `Sync complete: ${createdCount} created, ${updatedCount} updated, ${deactivatedCount} deactivated, ${managerResult.linked} managers linked, ${errors.length} failed`,
      );

      // Status enum now aligned - PARTIAL_SUCCESS used in both DB and DTO
      return {
        syncId: syncLog.id,
        status: status === 'FAILURE' ? 'FAILED' : status,
        totalUsers,
        syncedUsers: syncedCount,
        createdUsers: createdCount,
        updatedUsers: updatedCount,
        deactivatedUsers: deactivatedCount,
        failedUsers: errors.length,
        errors,
        durationMs,
        startedAt,
        completedAt: new Date(),
      };
    } catch (error) {
      // Complete failure
      const durationMs = Date.now() - startTime;
      await this.prisma.m365SyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILURE',
          errorMessage: (error as Error).message,
          durationMs,
        },
      });

      this.logger.error(`Sync failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Story 12.3a AC #27, #28, #29: Group-only sync mode.
   * Re-check Security Group membership + manager for existing M365 users.
   * Does NOT import new users from Graph API. Only updates roles + managerId.
   *
   * @param syncedBy Who triggered the sync
   * @returns SyncResultDto
   */
  private async runGroupsOnlySync(syncedBy?: string): Promise<SyncResultDto> {
    const startTime = Date.now();
    const startedAt = new Date();
    const errors: string[] = [];
    let roleChanges = 0;
    let managerChanges = 0;

    const syncLog = await this.prisma.m365SyncLog.create({
      data: {
        syncDate: startedAt,
        syncType: 'GROUPS_ONLY',
        status: 'IN_PROGRESS',
        userCount: 0,
        syncedCount: 0,
        createdCount: 0,
        updatedCount: 0,
        failedCount: 0,
        syncedBy: syncedBy || 'SYSTEM',
        metadata: {},
      },
    });

    try {
      // Batch-fetch Security Group members (2 API calls instead of N)
      const adminGroupId = process.env.AZURE_ADMIN_GROUP_ID;
      const issuerGroupId = process.env.AZURE_ISSUER_GROUP_ID;

      const adminMembers = adminGroupId
        ? await this.getGroupMembers(adminGroupId)
        : new Set<string>();
      const issuerMembers = issuerGroupId
        ? await this.getGroupMembers(issuerGroupId)
        : new Set<string>();

      this.logger.log(
        `Security Groups loaded: Admin=${adminMembers.size}, Issuer=${issuerMembers.size}`,
      );

      // Get all M365 users from local DB (azureId != null, isActive = true)
      const m365Users = await this.prisma.user.findMany({
        where: { azureId: { not: null }, isActive: true },
        select: {
          id: true,
          azureId: true,
          role: true,
          managerId: true,
        },
      });

      this.logger.log(
        `GROUPS_ONLY sync: processing ${m365Users.length} M365 users`,
      );

      for (const user of m365Users) {
        if (!user.azureId) continue;

        try {
          // Determine role from batch group membership (O(1) lookup)
          let newRole: UserRole;
          if (adminMembers.has(user.azureId)) {
            newRole = UserRole.ADMIN;
          } else if (issuerMembers.has(user.azureId)) {
            newRole = UserRole.ISSUER;
          } else {
            // Not in any Security Group — check directReports
            const directReportsCount = await this.prisma.user.count({
              where: { managerId: user.id },
            });
            newRole =
              directReportsCount > 0 ? UserRole.MANAGER : UserRole.EMPLOYEE;
          }

          // Check manager
          let newManagerId: string | null | undefined;
          try {
            const managerData = await this.fetchWithRetry<{ id: string }>(
              `https://graph.microsoft.com/v1.0/users/${user.azureId}/manager`,
            );
            if (managerData?.id) {
              const localManager = await this.prisma.user.findUnique({
                where: { azureId: managerData.id },
                select: { id: true },
              });
              // Manager in Graph but not locally → clear stale link
              newManagerId = localManager?.id ?? null;
            } else {
              // Graph returned empty manager → clear
              newManagerId = null;
            }
          } catch (err) {
            if ((err as { statusCode?: number })?.statusCode === 404) {
              // 404 = no manager assigned → clear stale managerId
              newManagerId = null;
            } else {
              this.logger.warn(`Failed to fetch manager for user ${user.id}`);
            }
          }

          // Apply role + manager updates
          const updateData: Record<string, unknown> = {};

          if (newRole !== user.role) {
            updateData.role = newRole;
            roleChanges++;
          }

          if (newManagerId !== undefined && newManagerId !== user.managerId) {
            updateData.managerId = newManagerId;
            managerChanges++;
          }

          if (Object.keys(updateData).length > 0) {
            updateData.lastSyncAt = new Date();
            await this.prisma.user.update({
              where: { id: user.id },
              data: updateData,
            });
          }
        } catch (error) {
          errors.push(`user:${user.id}: ${(error as Error).message}`);
        }
      }

      const durationMs = Date.now() - startTime;
      const status = errors.length === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS';

      await this.prisma.m365SyncLog.update({
        where: { id: syncLog.id },
        data: {
          status,
          userCount: m365Users.length,
          syncedCount: m365Users.length - errors.length,
          updatedCount: roleChanges + managerChanges,
          failedCount: errors.length,
          durationMs,
          errorMessage:
            errors.length > 0 ? errors.slice(0, 10).join('; ') : null,
          metadata: { roleChanges, managerChanges },
        },
      });

      this.logger.log(
        `GROUPS_ONLY sync complete: ${roleChanges} role changes, ${managerChanges} manager changes, ${errors.length} errors`,
      );

      return {
        syncId: syncLog.id,
        status,
        totalUsers: m365Users.length,
        syncedUsers: m365Users.length - errors.length,
        createdUsers: 0,
        updatedUsers: roleChanges + managerChanges,
        deactivatedUsers: 0,
        failedUsers: errors.length,
        errors,
        durationMs,
        startedAt,
        completedAt: new Date(),
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      await this.prisma.m365SyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILURE',
          errorMessage: (error as Error).message,
          durationMs,
        },
      });

      this.logger.error(`GROUPS_ONLY sync failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Story 12.3a AC #30: After linking managers, update roles for users with directReports.
   * Users who have at least one direct report get MANAGER role — unless overridden by Security Group.
   */
  private async updateDirectReportsRoles(
    syncedAzureIds: string[],
  ): Promise<void> {
    // Find all users that are managers (have at least one user with managerId pointing to them)
    const usersWithReports = await this.prisma.user.findMany({
      where: {
        azureId: { in: syncedAzureIds },
        directReports: { some: {} },
      },
      select: { id: true, azureId: true, role: true, roleSetManually: true },
    });

    for (const user of usersWithReports) {
      if (!user.azureId) continue;
      // Only upgrade to MANAGER if current role is EMPLOYEE and not manually set
      // Security Group roles (ADMIN/ISSUER) take priority — already set in Pass 1
      if (user.role === UserRole.EMPLOYEE && !user.roleSetManually) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { role: UserRole.MANAGER },
        });
      }
    }
  }

  /**
   * Get sync logs (history)
   *
   * @param limit Maximum number of logs to return (default: 10)
   * @returns Array of sync log DTOs
   */
  async getSyncLogs(limit: number = 10): Promise<SyncLogDto[]> {
    const logs = await this.prisma.m365SyncLog.findMany({
      take: limit,
      orderBy: { syncDate: 'desc' },
    });

    return logs.map((log) => ({
      id: log.id,
      syncDate: log.syncDate,
      syncType: log.syncType,
      userCount: log.userCount,
      syncedCount: log.syncedCount,
      createdCount: log.createdCount,
      updatedCount: log.updatedCount,
      failedCount: log.failedCount,
      status: log.status,
      errorMessage: log.errorMessage,
      durationMs: log.durationMs,
      syncedBy: log.syncedBy,
      metadata: log.metadata as Record<string, unknown> | null,
      createdAt: log.createdAt,
    }));
  }

  /**
   * Get single sync log by ID
   *
   * @param id Sync log ID
   * @returns Sync log DTO
   * @throws NotFoundException if log not found
   */
  async getSyncLogById(id: string): Promise<SyncLogDto> {
    const log = await this.prisma.m365SyncLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw new NotFoundException(`Sync log ${id} not found`);
    }

    return {
      id: log.id,
      syncDate: log.syncDate,
      syncType: log.syncType,
      userCount: log.userCount,
      syncedCount: log.syncedCount,
      createdCount: log.createdCount,
      updatedCount: log.updatedCount,
      failedCount: log.failedCount,
      status: log.status,
      errorMessage: log.errorMessage,
      durationMs: log.durationMs,
      syncedBy: log.syncedBy,
      metadata: log.metadata as Record<string, unknown> | null,
      createdAt: log.createdAt,
    };
  }

  /**
   * Get M365 integration status
   *
   * @returns Integration status with availability and last sync info
   */
  async getIntegrationStatus(): Promise<IntegrationStatusDto> {
    const available = this.graphTokenProvider.isAvailable();

    // Get last sync log
    const lastLog = await this.prisma.m365SyncLog.findFirst({
      orderBy: { syncDate: 'desc' },
    });

    return {
      available,
      lastSync: lastLog?.syncDate || null,
      lastSyncStatus: lastLog?.status || null,
      lastSyncUserCount: lastLog?.userCount || null,
    };
  }
}
