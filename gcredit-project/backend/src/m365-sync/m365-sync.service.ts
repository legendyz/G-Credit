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
      throw new Error('Graph API not configured - Azure AD credentials missing');
    }

    const client = Client.initWithMiddleware({ authProvider });
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Graph SDK uses relative paths (without https://graph.microsoft.com/v1.0)
        const relativePath = url.startsWith('/')
          ? url
          : `/${url}`;
        return await client.api(relativePath).get();
      } catch (error) {
        lastError = error as Error;
        const isRetryable = this.isRetryableError(error);

        if (!isRetryable || attempt === maxRetries) {
          this.logger.error(
            `Graph API error (attempt ${attempt + 1}/${maxRetries + 1}): ${(error as Error).message}`,
          );
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
    const networkErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 'EAI_AGAIN', 'EPIPE'];
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
    syncLogId: string,
  ): Promise<DeactivationResult> {
    // Build maps for efficient lookups
    const azureUserById = new Map(azureUsers.map((u) => [u.id, u]));
    const disabledAzureIds = new Set(
      azureUsers.filter((u) => !u.accountEnabled).map((u) => u.id),
    );
    const errors: string[] = [];
    let deactivatedCount = 0;

    // Get all active local users with Azure IDs
    const activeLocalUsers = await this.prisma.user.findMany({
      where: { isActive: true, azureId: { not: null } },
      select: {
        id: true,
        azureId: true,
        email: true,
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
            `Deactivated user: ${localUser.email} (${deactivationReason})`,
          );
        } catch (error) {
          errors.push(
            `Failed to deactivate ${localUser.email}: ${(error as Error).message}`,
          );
          this.logger.error(
            `Failed to deactivate ${localUser.email}`,
            (error as Error).stack,
          );
        }
      }
    }

    return { deactivated: deactivatedCount, errors };
  }

  /**
   * AC5: Sync a single user with error recovery
   *
   * Creates or updates a user based on Azure AD data.
   * Errors are caught and returned, not thrown.
   *
   * @param azureUser User data from Azure AD
   * @returns Object with success status, action taken, and any error
   */
  async syncSingleUser(
    azureUser: GraphUser,
  ): Promise<{ success: boolean; action: 'created' | 'updated' | 'skipped'; error?: string }> {
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
      });

      const userData = {
        email: email.toLowerCase(),
        azureId: azureUser.id,
        firstName: azureUser.displayName?.split(' ')[0] || '',
        lastName: azureUser.displayName?.split(' ').slice(1).join(' ') || '',
        department: azureUser.department || null,
        lastSyncAt: new Date(),
      };

      if (existingUser) {
        // Update existing user
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: userData,
        });

        return { success: true, action: 'updated' };
      } else {
        // Create new user
        await this.prisma.user.create({
          data: {
            ...userData,
            passwordHash: '', // Empty - user will authenticate via SSO
            isActive: true,
            role: 'EMPLOYEE', // Default role for new users
          },
        });

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
   * AC1-AC5: Main sync flow
   *
   * Orchestrates the complete sync process:
   * 1. Create sync log entry (AC3)
   * 2. Fetch all users with pagination (AC1) and retry (AC2)
   * 3. Sync each user with error recovery (AC5)
   * 4. Sync deactivations (AC4)
   * 5. Update sync log with results (AC3)
   *
   * @param syncType 'FULL' or 'INCREMENTAL'
   * @param syncedBy Who triggered the sync (user email or 'SYSTEM' for scheduled)
   * @returns SyncResultDto with complete sync results
   */
  async runSync(syncType: SyncType = 'FULL', syncedBy?: string): Promise<SyncResultDto> {
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
      // AC1: Fetch all users with pagination
      this.logger.log(`Starting ${syncType} M365 sync...`);
      const azureUsers = await this.getAllAzureUsers();
      totalUsers = azureUsers.length;
      this.logger.log(`Fetched ${totalUsers} users from Azure AD`);

      // AC5: Sync each user with error recovery
      for (const azureUser of azureUsers) {
        const result = await this.syncSingleUser(azureUser);

        if (result.success) {
          syncedCount++;
          if (result.action === 'created') createdCount++;
          if (result.action === 'updated') updatedCount++;
        } else if (result.error) {
          errors.push(
            `${azureUser.mail || azureUser.userPrincipalName}: ${result.error}`,
          );
        }
      }

      // AC4: Sync deactivations
      const deactivationResult = await this.syncUserDeactivations(
        azureUsers,
        syncLog.id,
      );
      deactivatedCount = deactivationResult.deactivated;
      errors.push(...deactivationResult.errors);

      // AC3: Update sync log with results
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
            errors.length > 0 ? errors.slice(0, 10).join('; ') : null, // Limit error message length
          metadata: { 
            retryAttempts: 0, 
            pagesProcessed: Math.ceil(totalUsers / 999),
            deactivatedCount,
          },
        },
      });

      this.logger.log(
        `Sync complete: ${createdCount} created, ${updatedCount} updated, ${deactivatedCount} deactivated, ${errors.length} failed`,
      );

      // Status enum now aligned - PARTIAL_SUCCESS used in both DB and DTO
      return {
        syncId: syncLog.id,
        status: status === 'FAILURE' ? 'FAILED' : status as 'SUCCESS' | 'PARTIAL_SUCCESS',
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
