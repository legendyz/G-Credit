# Story 8.9: M365 Production Hardening - Dev Prompt

**Story**: U-2b M365 Production Hardening  
**Sprint**: 8  
**Estimate**: 8.5h  
**Priority**: HIGH - 生产环境就绪关键路径  
**Date**: 2026-02-05

---

## 📋 Story Overview

实现 Microsoft 365 用户同步的生产级增强功能，包括分页处理支持1000+用户、指数退避重试机制、完整的审计日志记录、用户停用同步以及健壮的错误恢复机制。

**关键目标**: 确保 M365 同步服务能够在生产环境中可靠运行，处理大规模用户基础，并提供完整的可观测性。

---

## ✅ Acceptance Criteria

### AC1: 分页处理 (Pagination)
- 使用 Microsoft Graph API 的 `@odata.nextLink` 分页机制
- 支持同步 1000+ 用户
- 每页最大 999 条记录 (Graph API 限制)
- 完整遍历所有页面直到获取全部用户

### AC2: 重试机制 (Retry with Exponential Backoff)
- 遵循 ADR-008 重试策略规范
- 实现指数退避: 1s → 2s → 4s (3次重试)
- 处理 429 (Rate Limit) 和 5xx 错误
- 记录每次重试尝试

### AC3: 审计日志 (Audit Logging)
- 使用已有的 `M365SyncLog` 表记录同步结果
- 记录: syncDate, syncType, userCount, syncedCount, status, errorMessage, durationMs
- 支持 FULL 和 INCREMENTAL 同步类型

### AC4: 用户停用同步 (User Deactivation)
- 识别在 Azure AD 中已删除/禁用的用户
- 将本地用户标记为 `isActive = false`
- **关键**: 保留 `roleSetManually = true` 的用户角色设置
- 更新 `lastSyncAt` 时间戳

### AC5: 错误恢复 (Per-User Error Recovery)
- 单个用户同步失败不影响其他用户
- 不使用事务回滚，采用逐用户处理
- 收集并汇总所有错误
- 部分成功时仍记录同步结果

---

## 🏗️ 技术架构

### 模块结构

```
backend/src/m365-sync/
├── m365-sync.module.ts
├── m365-sync.service.ts
├── m365-sync.controller.ts
├── dto/
│   ├── trigger-sync.dto.ts
│   ├── sync-result.dto.ts
│   └── sync-log.dto.ts
├── interfaces/
│   └── graph-user.interface.ts
└── __tests__/
    ├── m365-sync.service.spec.ts
    └── m365-sync.controller.spec.ts
```

### 依赖注入

```typescript
// m365-sync.module.ts
@Module({
  imports: [
    MicrosoftGraphModule,
    PrismaModule,
  ],
  controllers: [M365SyncController],
  providers: [M365SyncService],
  exports: [M365SyncService],
})
export class M365SyncModule {}
```

---

## 📐 接口定义

### GraphUser Interface

```typescript
// interfaces/graph-user.interface.ts
export interface GraphUser {
  id: string;                    // Azure AD Object ID
  displayName: string;
  mail: string | null;
  userPrincipalName: string;
  accountEnabled: boolean;
  jobTitle?: string;
  department?: string;
}

export interface GraphUsersResponse {
  '@odata.nextLink'?: string;
  value: GraphUser[];
}
```

### DTOs

```typescript
// dto/trigger-sync.dto.ts
export class TriggerSyncDto {
  @IsOptional()
  @IsEnum(['FULL', 'INCREMENTAL'])
  syncType?: 'FULL' | 'INCREMENTAL' = 'FULL';
}

// dto/sync-result.dto.ts
export class SyncResultDto {
  syncId: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  totalUsers: number;
  syncedUsers: number;
  deactivatedUsers: number;
  failedUsers: number;
  errors: string[];
  durationMs: number;
  startedAt: Date;
  completedAt: Date;
}
```

---

## 🔧 核心实现

### 1. 分页获取所有用户

```typescript
// m365-sync.service.ts
async getAllAzureUsers(): Promise<GraphUser[]> {
  const allUsers: GraphUser[] = [];
  let nextLink: string | undefined = undefined;
  
  const baseUrl = 'https://graph.microsoft.com/v1.0/users';
  const selectFields = '$select=id,displayName,mail,userPrincipalName,accountEnabled,jobTitle,department';
  const pageSize = '$top=999';
  
  let url = `${baseUrl}?${selectFields}&${pageSize}`;
  
  do {
    const response = await this.fetchWithRetry<GraphUsersResponse>(
      nextLink || url
    );
    
    allUsers.push(...response.value);
    nextLink = response['@odata.nextLink'];
    
    this.logger.log(`Fetched ${allUsers.length} users, hasMore: ${!!nextLink}`);
  } while (nextLink);
  
  return allUsers;
}
```

### 2. 指数退避重试 (ADR-008)

```typescript
private async fetchWithRetry<T>(
  url: string,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const authProvider = this.graphTokenProvider.getAuthProvider();
      const client = Client.initWithMiddleware({ authProvider });
      
      // Graph SDK 使用相对路径
      const relativePath = url.replace('https://graph.microsoft.com/v1.0/', '');
      return await client.api(relativePath).get();
      
    } catch (error) {
      lastError = error;
      
      const isRetryable = this.isRetryableError(error);
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      const delayMs = baseDelayMs * Math.pow(2, attempt);
      this.logger.warn(
        `Retry ${attempt + 1}/${maxRetries} after ${delayMs}ms: ${error.message}`
      );
      
      await this.delay(delayMs);
    }
  }
  
  throw lastError;
}

private isRetryableError(error: any): boolean {
  const statusCode = error?.statusCode || error?.code;
  return statusCode === 429 || (statusCode >= 500 && statusCode < 600);
}

private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 3. 用户停用同步 (保留 roleSetManually)

```typescript
async syncUserDeactivations(
  azureUsers: GraphUser[],
  syncLog: M365SyncLog
): Promise<{ deactivated: number; errors: string[] }> {
  const azureUserIds = new Set(azureUsers.map(u => u.id));
  const errors: string[] = [];
  let deactivatedCount = 0;
  
  // 获取所有活跃的本地用户
  const activeLocalUsers = await this.prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, azureId: true, email: true, roleSetManually: true }
  });
  
  for (const localUser of activeLocalUsers) {
    // 跳过没有 Azure ID 的用户 (本地创建)
    if (!localUser.azureId) continue;
    
    // 检查用户是否仍在 Azure AD 中
    if (!azureUserIds.has(localUser.azureId)) {
      try {
        await this.prisma.user.update({
          where: { id: localUser.id },
          data: {
            isActive: false,
            lastSyncAt: new Date(),
            // 保留 roleSetManually 状态，不修改角色
          }
        });
        
        // 记录审计日志
        await this.prisma.userAuditLog.create({
          data: {
            userId: localUser.id,
            action: 'DEACTIVATED_BY_SYNC',
            performedBy: 'SYSTEM',
            details: JSON.stringify({
              reason: 'User not found in Azure AD',
              syncLogId: syncLog.id,
              rolePreserved: localUser.roleSetManually
            })
          }
        });
        
        deactivatedCount++;
        this.logger.log(`Deactivated user: ${localUser.email}`);
        
      } catch (error) {
        errors.push(`Failed to deactivate ${localUser.email}: ${error.message}`);
      }
    }
  }
  
  return { deactivated: deactivatedCount, errors };
}
```

### 4. 主同步流程

```typescript
async runSync(syncType: 'FULL' | 'INCREMENTAL' = 'FULL'): Promise<SyncResultDto> {
  const startTime = Date.now();
  const errors: string[] = [];
  let syncedCount = 0;
  let deactivatedCount = 0;
  let totalUsers = 0;
  
  // 创建同步日志记录
  const syncLog = await this.prisma.m365SyncLog.create({
    data: {
      syncDate: new Date(),
      syncType,
      status: 'IN_PROGRESS',
      userCount: 0,
      syncedCount: 0
    }
  });
  
  try {
    // AC1: 分页获取所有用户
    const azureUsers = await this.getAllAzureUsers();
    totalUsers = azureUsers.length;
    
    // AC5: 逐用户同步，错误不回滚
    for (const azureUser of azureUsers) {
      try {
        await this.syncSingleUser(azureUser);
        syncedCount++;
      } catch (error) {
        errors.push(`User ${azureUser.mail}: ${error.message}`);
      }
    }
    
    // AC4: 用户停用同步
    const deactivationResult = await this.syncUserDeactivations(azureUsers, syncLog);
    deactivatedCount = deactivationResult.deactivated;
    errors.push(...deactivationResult.errors);
    
    // AC3: 更新同步日志
    const durationMs = Date.now() - startTime;
    const status = errors.length === 0 ? 'SUCCESS' : 
                   syncedCount > 0 ? 'PARTIAL' : 'FAILED';
    
    await this.prisma.m365SyncLog.update({
      where: { id: syncLog.id },
      data: {
        status,
        userCount: totalUsers,
        syncedCount,
        durationMs,
        errorMessage: errors.length > 0 ? errors.join('; ') : null
      }
    });
    
    return {
      syncId: syncLog.id,
      status,
      totalUsers,
      syncedUsers: syncedCount,
      deactivatedUsers: deactivatedCount,
      failedUsers: errors.length,
      errors,
      durationMs,
      startedAt: syncLog.syncDate,
      completedAt: new Date()
    };
    
  } catch (error) {
    // 整体失败
    await this.prisma.m365SyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'FAILED',
        errorMessage: error.message,
        durationMs: Date.now() - startTime
      }
    });
    
    throw error;
  }
}
```

---

## 🌐 API 端点

### Controller

```typescript
// m365-sync.controller.ts
@Controller('api/admin/m365-sync')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiTags('M365 Sync')
export class M365SyncController {
  constructor(private readonly m365SyncService: M365SyncService) {}

  @Post()
  @ApiOperation({ summary: 'Trigger M365 user sync' })
  @ApiResponse({ status: 201, type: SyncResultDto })
  async triggerSync(@Body() dto: TriggerSyncDto): Promise<SyncResultDto> {
    return this.m365SyncService.runSync(dto.syncType);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get sync history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getSyncLogs(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ): Promise<SyncLogDto[]> {
    return this.m365SyncService.getSyncLogs(limit);
  }

  @Get('logs/:id')
  @ApiOperation({ summary: 'Get sync log details' })
  async getSyncLogById(@Param('id') id: string): Promise<SyncLogDto> {
    return this.m365SyncService.getSyncLogById(id);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get M365 integration status' })
  async getIntegrationStatus(): Promise<{ available: boolean; lastSync: Date | null }> {
    return this.m365SyncService.getIntegrationStatus();
  }
}
```

### API 端点汇总

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/m365-sync` | 触发同步 |
| GET | `/api/admin/m365-sync/logs` | 获取同步历史 |
| GET | `/api/admin/m365-sync/logs/:id` | 获取同步详情 |
| GET | `/api/admin/m365-sync/status` | 获取集成状态 |

---

## 🧪 测试要求

### 单元测试 (≥30 tests)

**M365SyncService Tests:**
1. `getAllAzureUsers` - 成功获取单页用户
2. `getAllAzureUsers` - 分页处理多页用户
3. `getAllAzureUsers` - 空用户列表处理
4. `fetchWithRetry` - 首次成功不重试
5. `fetchWithRetry` - 429错误后重试成功
6. `fetchWithRetry` - 500错误后重试成功
7. `fetchWithRetry` - 重试耗尽后抛出错误
8. `fetchWithRetry` - 400错误不重试直接抛出
9. `syncUserDeactivations` - 停用不在Azure的用户
10. `syncUserDeactivations` - 保留roleSetManually用户角色
11. `syncUserDeactivations` - 跳过无azureId的本地用户
12. `syncUserDeactivations` - 单用户失败不影响其他
13. `syncSingleUser` - 创建新用户
14. `syncSingleUser` - 更新现有用户
15. `syncSingleUser` - 跳过禁用账户
16. `runSync` - FULL同步成功
17. `runSync` - INCREMENTAL同步成功
18. `runSync` - 部分成功状态 (PARTIAL)
19. `runSync` - 全部失败状态 (FAILED)
20. `runSync` - 创建同步日志
21. `runSync` - 更新同步日志
22. `runSync` - 记录持续时间
23. `getSyncLogs` - 返回分页历史
24. `getSyncLogById` - 返回单条记录
25. `getSyncLogById` - 记录不存在抛出404
26. `getIntegrationStatus` - 返回可用状态
27. `getIntegrationStatus` - Graph不可用返回false
28. `isRetryableError` - 识别429错误
29. `isRetryableError` - 识别5xx错误
30. `isRetryableError` - 4xx错误不可重试

**Controller Tests:**
31. `POST /m365-sync` - Admin可访问
32. `POST /m365-sync` - 非Admin返回403
33. `GET /logs` - 返回同步历史
34. `GET /logs/:id` - 返回同步详情

### E2E 测试 (≥5 tests)

```typescript
// test/m365-sync.e2e-spec.ts
describe('M365 Sync (e2e)', () => {
  it('POST /api/admin/m365-sync - triggers sync as admin');
  it('POST /api/admin/m365-sync - returns 403 for non-admin');
  it('GET /api/admin/m365-sync/logs - returns sync history');
  it('GET /api/admin/m365-sync/logs/:id - returns sync details');
  it('GET /api/admin/m365-sync/status - returns integration status');
});
```

---

## 🔗 集成点

### 现有服务依赖

| Service | 文件位置 | 用途 |
|---------|----------|------|
| `GraphTokenProviderService` | `src/microsoft-graph/services/graph-token-provider.service.ts` | 获取 Graph API 认证 |
| `PrismaService` | `src/prisma/prisma.service.ts` | 数据库操作 |

### Prisma Schema (已存在)

```prisma
model M365SyncLog {
  id          String   @id @default(uuid())
  syncDate    DateTime
  syncType    String   // FULL, INCREMENTAL
  userCount   Int
  syncedCount Int
  status      String   // SUCCESS, PARTIAL, FAILED, IN_PROGRESS
  errorMessage String?
  durationMs  Int?
  createdAt   DateTime @default(now())
}
```

### 用户模型关键字段

```prisma
model User {
  isActive       Boolean  @default(true)
  azureId        String?  @unique
  roleSetManually Boolean @default(false)  // ⚠️ 同步时必须保留
  lastSyncAt     DateTime?
  roleVersion    Int      @default(1)
}
```

---

## ⚠️ 关键注意事项

### 1. roleSetManually 保护
```typescript
// ❌ 错误: 会覆盖手动设置的角色
await prisma.user.update({
  where: { id: user.id },
  data: { role: azureUser.role } // 不要这样做!
});

// ✅ 正确: 检查 roleSetManually
if (!user.roleSetManually) {
  await prisma.user.update({
    where: { id: user.id },
    data: { role: mappedRole }
  });
}
```

### 2. Graph API 分页限制
- 单次请求最大 999 条
- 必须处理 `@odata.nextLink` 直到为空
- 使用 `$select` 减少响应大小

### 3. 错误重试策略 (ADR-008)
- 仅对 429 和 5xx 重试
- 4xx 错误 (除429) 不重试
- 最大 3 次重试
- 指数退避: 1s, 2s, 4s

### 4. 审计日志完整性
- 每次同步创建 M365SyncLog 记录
- 用户停用时创建 UserAuditLog 记录
- 记录 durationMs 用于性能监控

---

## 📝 App Module 注册

```typescript
// app.module.ts
import { M365SyncModule } from './m365-sync/m365-sync.module';

@Module({
  imports: [
    // ... existing modules
    M365SyncModule,
  ],
})
export class AppModule {}
```

---

## 🎯 验收检查清单

- [ ] 分页获取1000+用户成功
- [ ] 429/5xx 错误自动重试
- [ ] 同步日志记录完整
- [ ] 用户停用正确同步
- [ ] roleSetManually 用户角色保留
- [ ] 单用户错误不影响整体
- [ ] 所有 API 端点正常工作
- [ ] 30+ 单元测试通过
- [ ] 5+ E2E 测试通过
- [ ] Admin 权限控制正确

---

## 📚 参考文档

- [Story 8.9 需求文档](../U-2b-m365-hardening.md)
- [ADR-008 重试策略](../../decisions/ADR-008-retry-strategy.md)
- [Microsoft Graph API 分页](https://learn.microsoft.com/en-us/graph/paging)
- [Graph API 用户端点](https://learn.microsoft.com/en-us/graph/api/user-list)

---

**预计完成时间**: 8.5 小时  
**建议开发顺序**: AC1 → AC2 → AC3 → AC4 → AC5 → Tests
