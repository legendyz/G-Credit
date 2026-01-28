# Badge Wallet Developer Guide

**Last Updated:** 2026-01-28  
**Sprint:** 4 (Epic 5 - Employee Badge Wallet)  
**Status:** Backend Complete, Frontend Pending

## Overview

The Badge Wallet system provides employees with a comprehensive view of their earned badges through five integrated features:

1. **Timeline View** - Chronological list of all earned badges with pagination
2. **Badge Detail Modal** - Detailed view with skills, evidence, and recommendations
3. **Evidence Management** - Upload/download files with secure Azure Blob Storage integration
4. **Milestone Achievements** - Automatic detection and display of badge milestones
5. **Similar Badges** - ML-powered recommendations based on skill similarity

This guide provides technical documentation for frontend developers integrating these APIs.

---

## Table of Contents

- [Timeline View API](#timeline-view-api)
- [Badge Detail Modal](#badge-detail-modal)
- [Evidence Management](#evidence-management)
- [Milestones System](#milestones-system)
- [Similar Badges Algorithm](#similar-badges-algorithm)
- [Empty States](#empty-states)
- [Error Handling](#error-handling)
- [Performance Guidelines](#performance-guidelines)

---

## Timeline View API

### Endpoint

```
GET /api/badges/wallet?page=1&limit=10&sortBy=earnedAt&sortOrder=desc
```

### Authentication

Requires JWT authentication. The API automatically filters badges for the authenticated user.

```typescript
// Request Headers
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Current page number (1-indexed) |
| `limit` | number | 10 | Items per page (1-100) |
| `sortBy` | string | 'earnedAt' | Sort field: `earnedAt` or `badgeName` |
| `sortOrder` | string | 'desc' | Sort order: `asc` or `desc` |

### Response Format

```typescript
interface WalletResponse {
  badges: Badge[];
  milestones: MilestoneAchievement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface Badge {
  id: number;
  employeeId: number;
  badgeTemplateId: number;
  earnedAt: string; // ISO 8601 datetime
  evidenceDescription: string | null;
  badgeName: string;
  badgeDescription: string;
  skillNames: string[];
  categoryName: string;
  imageUrl: string | null;
}

interface MilestoneAchievement {
  id: number;
  employeeId: number;
  milestoneConfigId: number;
  achievedAt: string; // ISO 8601 datetime
  milestone: {
    name: string;
    description: string;
    triggerCondition: {
      type: 'badge_count' | 'category_badges' | 'skill_mastery';
      badgeTemplateId?: number;
      categoryId?: number;
      skillId?: number;
      targetCount: number;
    };
    iconUrl: string | null;
  };
}
```

### Example Request

```typescript
async function fetchWalletBadges(page = 1, limit = 10) {
  const response = await fetch(
    `/api/badges/wallet?page=${page}&limit=${limit}&sortBy=earnedAt&sortOrder=desc`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch wallet: ${response.statusText}`);
  }
  
  return await response.json();
}
```

### Example Response

```json
{
  "badges": [
    {
      "id": 101,
      "employeeId": 1,
      "badgeTemplateId": 5,
      "earnedAt": "2026-01-15T10:30:00Z",
      "evidenceDescription": "Completed advanced Git workflow training",
      "badgeName": "Git Master",
      "badgeDescription": "Demonstrates advanced Git proficiency",
      "skillNames": ["Git", "Version Control", "Code Review"],
      "categoryName": "Engineering Excellence",
      "imageUrl": "/badges/git-master.png"
    }
  ],
  "milestones": [
    {
      "id": 42,
      "employeeId": 1,
      "milestoneConfigId": 3,
      "achievedAt": "2026-01-15T10:30:05Z",
      "milestone": {
        "name": "10 Badges Earned",
        "description": "Achieved 10 total badges",
        "triggerCondition": {
          "type": "badge_count",
          "targetCount": 10
        },
        "iconUrl": "/milestones/ten-badges.png"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 23,
    "totalPages": 3
  }
}
```

### UI Implementation Notes

- **Pagination**: Display page controls only if `totalPages > 1`
- **Empty State**: Check `badges.length === 0` to show "No badges yet" message
- **Milestones**: Render milestone badges interleaved with regular badges based on `achievedAt` timestamp
- **Performance**: API returns in <150ms for typical queries (tested with 50 badges)

---

## Badge Detail Modal

### Endpoint

```
GET /api/badges/:badgeId
```

### Response Format

```typescript
interface BadgeDetail {
  id: number;
  employeeId: number;
  badgeTemplateId: number;
  earnedAt: string;
  evidenceDescription: string | null;
  template: {
    id: number;
    name: string;
    description: string;
    imageUrl: string | null;
    categoryId: number;
    category: {
      id: number;
      name: string;
      description: string;
    };
    skills: Array<{
      id: number;
      name: string;
      description: string;
      categoryId: number;
    }>;
  };
  evidenceFiles: Array<{
    id: number;
    badgeId: number;
    filename: string;
    blobName: string;
    uploadedAt: string;
    fileType: string;
    fileSizeBytes: number;
  }>;
}
```

### Example Request

```typescript
async function fetchBadgeDetail(badgeId: number) {
  const response = await fetch(`/api/badges/${badgeId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Badge not found');
    }
    if (response.status === 403) {
      throw new Error('Access denied: Badge belongs to another employee');
    }
    throw new Error(`Failed to fetch badge: ${response.statusText}`);
  }
  
  return await response.json();
}
```

### Modal Components

The Badge Detail Modal consists of 10 components (to be implemented in Sprint 5):

1. **BadgeDetailModal** - Main container with overlay
2. **BadgeHeader** - Badge name, image, earned date
3. **SkillsList** - Pills displaying associated skills
4. **CategoryBadge** - Category tag with icon
5. **EvidenceSection** - Description and file uploads
6. **SimilarBadgesCarousel** - Recommended badges
7. **IssueReportButton** - Report incorrect badge
8. **CloseButton** - Modal dismiss control
9. **LoadingSkeleton** - Loading state UI
10. **ErrorDisplay** - Error message component

### Performance Target

- Modal open time: <300ms (includes badge detail + similar badges + evidence files)
- Tested with badges containing 5 skills, 3 evidence files

---

## Evidence Management

### Upload Evidence

#### Endpoint

```
POST /api/badges/evidence/upload
Content-Type: multipart/form-data
```

#### Request

```typescript
interface UploadRequest {
  badgeId: number;
  file: File; // Multipart file upload
}
```

#### Example

```typescript
async function uploadEvidence(badgeId: number, file: File) {
  const formData = new FormData();
  formData.append('badgeId', badgeId.toString());
  formData.append('file', file);
  
  const response = await fetch('/api/badges/evidence/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`
      // Note: Do NOT set Content-Type for multipart/form-data
      // Browser sets it automatically with boundary
    },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }
  
  return await response.json();
}
```

#### Response

```json
{
  "id": 789,
  "badgeId": 101,
  "filename": "training-certificate.pdf",
  "blobName": "evidence/1_101_1737984123456_training-certificate.pdf",
  "uploadedAt": "2026-01-15T10:35:23Z",
  "fileType": "application/pdf",
  "fileSizeBytes": 245678
}
```

#### File Validation

- **Max size**: 10 MB (enforced server-side)
- **Allowed types**: PDF, JPEG, PNG, DOC, DOCX, TXT, MP4, WEBM
- **Naming**: Original filename preserved, blob name includes timestamp for uniqueness

### Download Evidence

#### Endpoint

```
GET /api/badges/evidence/:fileId/download
```

#### Response

Returns a **SAS (Shared Access Signature) URL** valid for 5 minutes.

```json
{
  "url": "https://gcreditstorage.blob.core.windows.net/evidence/1_101_1737984123456_training-certificate.pdf?sv=2021-06-08&ss=b&srt=o&sp=r&se=2026-01-15T10:40:23Z&sig=<signature>",
  "expiresAt": "2026-01-15T10:40:23Z"
}
```

#### Example

```typescript
async function downloadEvidence(fileId: number) {
  const response = await fetch(`/api/badges/evidence/${fileId}/download`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }
  
  const { url, expiresAt } = await response.json();
  
  // Option 1: Open in new tab
  window.open(url, '_blank');
  
  // Option 2: Trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = 'evidence-file'; // Browser will use server filename
  link.click();
}
```

#### Security Notes

- **SAS Token Expiry**: 5 minutes (configurable via `AZURE_STORAGE_SAS_EXPIRY_MINUTES`)
- **Permissions**: Read-only access to specific blob
- **RBAC**: Backend validates employee owns the badge before generating SAS token
- **No Credentials in Frontend**: Frontend never accesses storage account keys

---

## Milestones System

### Admin Configuration

#### Create Milestone

```
POST /api/milestones/configs
```

#### Request Body

```typescript
interface CreateMilestoneDto {
  name: string;
  description: string;
  triggerCondition: {
    type: 'badge_count' | 'category_badges' | 'skill_mastery';
    badgeTemplateId?: number;      // For specific badge repetition
    categoryId?: number;            // For category-specific milestones
    skillId?: number;               // For skill-based milestones
    targetCount: number;            // Threshold to trigger
  };
  iconUrl?: string;
  isActive?: boolean; // Default: true
}
```

#### Example: Badge Count Milestone

```json
{
  "name": "10 Badges Earned",
  "description": "Achieved a total of 10 badges across all categories",
  "triggerCondition": {
    "type": "badge_count",
    "targetCount": 10
  },
  "iconUrl": "/milestones/ten-badges.png",
  "isActive": true
}
```

#### Example: Category Mastery

```json
{
  "name": "Engineering Excellence Master",
  "description": "Earned 5 badges in Engineering Excellence category",
  "triggerCondition": {
    "type": "category_badges",
    "categoryId": 2,
    "targetCount": 5
  },
  "iconUrl": "/milestones/engineering-master.png"
}
```

#### Example: Skill Mastery

```json
{
  "name": "Git Expert",
  "description": "Earned 3 badges demonstrating Git skills",
  "triggerCondition": {
    "type": "skill_mastery",
    "skillId": 7,
    "targetCount": 3
  },
  "iconUrl": "/milestones/git-expert.png"
}
```

#### Example: Specific Badge Repetition

```json
{
  "name": "Git Master x3",
  "description": "Earned the Git Master badge 3 times",
  "triggerCondition": {
    "type": "badge_count",
    "badgeTemplateId": 5,
    "targetCount": 3
  },
  "iconUrl": "/milestones/git-master-x3.png"
}
```

### Automatic Detection

Milestones are automatically detected and awarded when:

1. **Badge Issuance** - Admin grants badge to employee
2. **Badge Claim** - Employee claims self-service badge

Detection happens **asynchronously** in the background:

```typescript
// In BadgeIssuanceService.claimBadge() and issueBadge()
await this.badgesRepository.save(badge); // Persists badge first

// Trigger milestone check (non-blocking)
this.milestonesService.checkMilestones(employeeId)
  .catch(err => {
    this.logger.error(`Milestone check failed for employee ${employeeId}`, err.stack);
  });
```

#### Performance Characteristics

- **Detection Time**: <500ms for typical configurations (10 milestones, 50 employee badges)
- **Async Execution**: Does not block badge issuance flow
- **Deduplication**: Prevents duplicate milestone achievements via unique constraint
- **Cache Strategy**: No caching (JSONB queries are fast, premature optimization avoided)

### Fetch User Achievements

```
GET /api/milestones/my-achievements
```

#### Response

```json
[
  {
    "id": 42,
    "employeeId": 1,
    "milestoneConfigId": 3,
    "achievedAt": "2026-01-15T10:30:05Z",
    "milestone": {
      "id": 3,
      "name": "10 Badges Earned",
      "description": "Achieved 10 total badges",
      "triggerCondition": {
        "type": "badge_count",
        "targetCount": 10
      },
      "iconUrl": "/milestones/ten-badges.png",
      "isActive": true
    }
  }
]
```

---

## Similar Badges Algorithm

### Endpoint

```
GET /api/badges/:badgeId/similar?limit=5
```

### Algorithm Overview

The recommendation algorithm uses **Jaccard similarity** on badge skills:

```
Similarity(A, B) = |Skills(A) ∩ Skills(B)| / |Skills(A) ∪ Skills(B)|
```

#### Scoring Rules

1. **Skill Intersection**: Count shared skills between badges
2. **Skill Union**: Count total unique skills across both badges
3. **Jaccard Score**: Divide intersection by union (0.0 to 1.0)
4. **Filtering**: Exclude badges already earned by the employee
5. **Sorting**: Return top N by highest score, then by badge name (alphabetical)

### Example Calculation

**Current Badge (Git Master):**
- Skills: [Git, Version Control, Code Review]

**Candidate Badge A (Code Reviewer):**
- Skills: [Code Review, Communication, Git]
- Intersection: {Git, Code Review} = 2 skills
- Union: {Git, Version Control, Code Review, Communication} = 4 skills
- **Score: 2/4 = 0.50**

**Candidate Badge B (CI/CD Expert):**
- Skills: [Git, Docker, Jenkins]
- Intersection: {Git} = 1 skill
- Union: {Git, Version Control, Code Review, Docker, Jenkins} = 5 skills
- **Score: 1/5 = 0.20**

Result: Code Reviewer ranks higher (0.50 > 0.20)

### Response Format

```json
[
  {
    "id": 8,
    "name": "Code Reviewer",
    "description": "Demonstrates code review excellence",
    "imageUrl": "/badges/code-reviewer.png",
    "categoryId": 2,
    "categoryName": "Engineering Excellence",
    "skillNames": ["Code Review", "Communication", "Git"],
    "similarityScore": 0.5
  },
  {
    "id": 12,
    "name": "CI/CD Expert",
    "description": "Proficient in automated deployment pipelines",
    "imageUrl": "/badges/cicd-expert.png",
    "categoryId": 2,
    "categoryName": "Engineering Excellence",
    "skillNames": ["Git", "Docker", "Jenkins"],
    "similarityScore": 0.2
  }
]
```

### Performance

- **Query Time**: <200ms for 50 badge templates, 10 skills per badge
- **Limit**: Default 5, max 20 recommendations
- **Optimization**: Uses PostgreSQL array functions for intersection/union

---

## Empty States

### Detection Logic

The frontend should display empty states based on these conditions:

#### 1. No Badges Earned

```typescript
if (walletData.badges.length === 0 && walletData.pagination.total === 0) {
  // Show: "You haven't earned any badges yet"
  // CTA: "Browse available badges" (link to badge catalog)
}
```

#### 2. No Evidence Files

```typescript
if (badgeDetail.evidenceFiles.length === 0) {
  // Show: "No evidence uploaded yet"
  // CTA: "Upload evidence to document your achievement"
}
```

#### 3. No Similar Badges

```typescript
const similarBadges = await fetchSimilarBadges(badgeId);
if (similarBadges.length === 0) {
  // Show: "No similar badges found"
  // Note: This is rare - only happens for badges with unique skill combinations
}
```

#### 4. No Milestones Achieved

```typescript
if (walletData.milestones.length === 0) {
  // Don't show empty state - milestones are auto-awarded
  // Simply don't render milestone section
}
```

### Empty State Components (Sprint 5)

To be implemented:

- `EmptyBadgeList.tsx` - No badges message + browse CTA
- `EmptyEvidenceList.tsx` - No evidence message + upload CTA
- `EmptySimilarBadges.tsx` - No recommendations message (rare)

---

## Error Handling

### Common Error Codes

| Status | Error | Cause | Frontend Action |
|--------|-------|-------|-----------------|
| 400 | `Invalid pagination parameters` | Page/limit out of range | Reset to page 1 |
| 401 | `Unauthorized` | Missing/invalid JWT | Redirect to login |
| 403 | `Forbidden: Badge belongs to another employee` | Accessing other employee's badge | Show "Access Denied" message |
| 404 | `Badge not found` | Invalid badge ID | Show "Badge not found" message |
| 413 | `File too large (max 10MB)` | Evidence file > 10MB | Show file size error |
| 415 | `Unsupported file type` | Invalid evidence format | Show allowed formats |
| 500 | `Internal server error` | Database/Azure issues | Show "Try again later" |

### Example Error Handler

```typescript
async function handleBadgeRequest(action: () => Promise<any>) {
  try {
    return await action();
  } catch (error) {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      showToast('Access denied: You cannot view this badge', 'error');
    } else if (error.response?.status === 404) {
      showToast('Badge not found', 'error');
    } else if (error.response?.status === 413) {
      showToast('File too large. Maximum size is 10MB', 'error');
    } else {
      showToast('Something went wrong. Please try again later', 'error');
    }
    throw error;
  }
}
```

---

## Performance Guidelines

### Response Time Targets

- **Wallet Query**: <150ms (tested with 50 badges)
- **Badge Detail**: <200ms (includes skills, category, evidence)
- **Similar Badges**: <200ms (Jaccard calculation on 50 templates)
- **Milestone Detection**: <500ms (background process, non-blocking)
- **Evidence Upload**: <2s for 5MB file (depends on network)
- **Evidence Download**: <100ms to generate SAS URL

### Optimization Tips

1. **Pagination**: Always use pagination for wallet queries (limit=10 recommended)
2. **Caching**: Cache badge templates and categories in frontend (change infrequently)
3. **Lazy Loading**: Load badge detail only when modal opens (not on initial wallet load)
4. **Image Optimization**: Use lazy loading for badge images (`loading="lazy"`)
5. **Debouncing**: Debounce search/filter inputs (300ms recommended)

### Load Testing Results

Tested on local development environment:

- **50 concurrent wallet queries**: Avg 180ms, P95 220ms
- **10 concurrent evidence uploads (5MB each)**: Avg 2.1s, P95 3.2s
- **100 milestone checks**: Avg 450ms, P95 600ms

---

## Issue Reporting

### Endpoint

```
POST /api/badges/:badgeId/report-issue
```

### Request Body

```json
{
  "reason": "incorrect_badge",
  "comments": "This badge was awarded for the wrong project"
}
```

### Response

```json
{
  "id": 42,
  "badgeId": 101,
  "reportedBy": 1,
  "reason": "incorrect_badge",
  "comments": "This badge was awarded for the wrong project",
  "status": "pending",
  "reportedAt": "2026-01-15T10:45:00Z"
}
```

### Implementation (Sprint 5)

Frontend should provide:
- Modal/form for reporting issues
- Reason dropdown (incorrect_badge, missing_evidence, wrong_skills, other)
- Optional comments textarea
- Confirmation message after submission

---

## Next Steps

### Sprint 5 Implementation

This guide documents the **backend APIs** completed in Sprint 4. Frontend implementation is pending:

**High Priority:**
1. Implement 10 Badge Detail Modal components
2. Create Timeline View with pagination
3. Add evidence upload/download UI
4. Build Similar Badges carousel
5. Implement empty states

**Medium Priority:**
6. Add E2E tests for wallet workflows
7. Optimize for 1000+ badge scale
8. Add milestone achievement notifications
9. Create badge analytics dashboard

### Documentation Updates

When implementing frontend components, update this guide with:
- Component API documentation
- State management patterns (Redux/Context)
- TypeScript type definitions
- Error boundary implementations
- Accessibility (a11y) considerations

---

## Related Documentation

- [Architecture Decision Records](../architecture/)
- [Sprint 4 Retrospective](../sprints/sprint-4/retrospective.md)
- [Infrastructure Inventory](../setup/infrastructure-inventory.md) - Database schemas
- [API Security](../security/api-authentication.md) - JWT implementation
- [Azure Setup Guide](../sprints/sprint-2-azure-setup-guide.md) - Storage configuration

---

## Support

For questions or issues:
- **Backend bugs**: Check [CHANGELOG.md](../../backend/CHANGELOG.md) for known issues
- **API testing**: Use Postman collection in `backend/test-scripts/`
- **Database queries**: See Prisma schema in `backend/prisma/schema.prisma`

Last updated by Amelia during Sprint 4 completion (2026-01-28).
