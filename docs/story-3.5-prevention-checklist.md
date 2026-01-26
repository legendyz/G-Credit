# Story 3.5 Prevention Checklist

**Purpose:** Prevent repeating the 4 main issues encountered in Story 3.5  
**Created:** 2026-01-26  
**Use When:** Implementing DTOs with nested objects, JSON fields, or public APIs

---

## ✅ Pre-Development Checklist

### Before Writing Code

- [ ] **Review similar existing code** (e.g., badge-templates for reference)
- [ ] **Check global guards** - Are there APP_GUARD providers in app.module.ts?
- [ ] **Check existing routes** - Will new routes conflict with `:param` routes?
- [ ] **Identify Prisma Json fields** - Will DTOs be stored in Json columns?

---

## 🔍 During Development - DTO Design

### When Creating DTOs with Nested Objects

- [ ] **Prisma Json Field?**
  - YES → Plan to convert DTO to plain object before saving
  - Add conversion in service: `JSON.parse(JSON.stringify(dto.field))`
  - Test with actual class instances, not plain objects

- [ ] **Union Type Field?** (e.g., `string | number | boolean`)
  - YES → Add validation decorator (minimum `@IsNotEmpty()`)
  - Consider custom validator for stricter type checking
  - Document why union type is needed in comment

- [ ] **Nested DTO with @ValidateNested()?**
  - YES → Remember: This creates class instances!
  - Plan for Prisma Json conversion
  - Test nested validation thoroughly

### DTO Pattern Template

```typescript
// ✅ CORRECT Pattern for DTOs with Json storage
export class MyNestedDto {
  @IsString()
  field: string;
  
  @IsNotEmpty()  // ⚠️ Required for union types
  value: string | number | boolean;
}

export class MyParentDto {
  @ValidateNested()  // ⚠️ Creates class instance!
  @Type(() => MyNestedDto)
  nestedData: MyNestedDto;
}

// In Service:
async create(dto: MyParentDto) {
  return this.prisma.model.create({
    data: {
      // ⚠️ Convert to plain object for Json field
      nestedData: dto.nestedData 
        ? JSON.parse(JSON.stringify(dto.nestedData))
        : null,
    }
  });
}
```

---

## 🛣️ During Development - Route Design

### When Adding New Endpoints

- [ ] **Check existing routes in controller**
  - Find all `@Get()`, `@Post()`, etc. decorators
  - Identify dynamic routes (`:id`, `:param`)
  - Note their line numbers

- [ ] **Route Order Checklist**
  - [ ] Specific routes (`'exact-string'`) defined first
  - [ ] Multi-segment paths before single segment
  - [ ] Dynamic routes (`:param`) defined LAST
  - [ ] Add comment: `// ⚠️ Keep :id routes last`

- [ ] **Route Conflict Test**
  - Test with curl/Postman/test script
  - Verify specific routes not caught by `:id`
  - Check error messages are correct

### Route Order Pattern

```typescript
// ✅ CORRECT Route Order
@Controller('resources')
export class ResourcesController {
  // 1. Exact matches first
  @Get('all')
  @Get('templates')
  @Get('templates/:key')
  
  // 2. Specific actions
  @Get('search')
  @Post('bulk-import')
  
  // 3. Dynamic params LAST
  @Get(':id')           // ⚠️ Keep this last - matches any string
  @Get(':id/children')
}
```

---

## 🔐 During Development - Authentication

### When Adding New Endpoints

- [ ] **Is this endpoint public?**
  - YES → Add `@Public()` decorator
  - NO → Add `@Roles(UserRole.X)` decorator

- [ ] **Test without authentication**
  ```powershell
  # Public endpoint - should work
  Invoke-RestMethod -Uri "http://localhost:3000/api/public" -Method Get
  
  # Protected endpoint - should return 401
  Invoke-RestMethod -Uri "http://localhost:3000/api/protected" -Method Get
  ```

- [ ] **Document in Swagger**
  - Public: No `@ApiBearerAuth()`
  - Protected: Include `@ApiBearerAuth()`

### Public Endpoint Pattern

```typescript
// ✅ CORRECT - Public endpoint with global guard
import { Public } from '../common/decorators/public.decorator';

@Controller('resources')
export class ResourcesController {
  // Public endpoint - bypass JWT guard
  @Public()
  @Get('templates')
  @ApiOperation({ summary: 'Get public templates' })
  getTemplates() {}
  
  // Protected endpoint - requires authentication + role
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Post()
  create() {}
}
```

---

## 🧪 Testing Checklist

### Required Tests for Story 3.5 Patterns

- [ ] **DTO Validation Tests**
  - Valid nested DTO → Should pass
  - Invalid union type → Should fail with clear error
  - Missing required fields → Should fail

- [ ] **Prisma Integration Tests**
  - Save DTO with nested objects → Should succeed
  - Retrieve and verify Json field → Data intact
  - Test with class instances (not plain objects)

- [ ] **Route Tests**
  - Specific route before `:id` → Should match correctly
  - Dynamic route with UUID → Should work
  - Specific route returns correct data (not `:id` handler)

- [ ] **Authentication Tests**
  - Public endpoint without token → Should work (200)
  - Protected endpoint without token → Should fail (401)
  - Public endpoint with token → Should work (200)

### Test Script Template

```powershell
# Test 1: Public endpoint (no auth)
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/public" -Method Get
Write-Host "Public endpoint: $($response.count) items"

# Test 2: Protected endpoint (should fail)
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/protected" -Method Get
    Write-Host "ERROR: Should have returned 401"
} catch {
    Write-Host "Protected endpoint correctly returned 401"
}

# Test 3: Specific route before :id
$template = Invoke-RestMethod -Uri "http://localhost:3000/api/templates/exam_score" -Method Get
Write-Host "Template type: $($template.type)"

# Test 4: DTO with nested validation
$body = @{
    field = "value"
    nestedData = @{
        field = "nested"
        value = 123  # Union type
    }
} | ConvertTo-Json -Depth 10

$result = Invoke-RestMethod -Uri "http://localhost:3000/api/resource" `
    -Method Post -Body $body -ContentType "application/json" `
    -Headers @{ "Authorization" = "Bearer $token" }
Write-Host "Created: $($result.id)"
```

---

## 📝 Code Review Checklist

### Before Committing

- [ ] **All DTOs with union types have validators**
- [ ] **All Prisma Json fields have DTO→object conversion**
- [ ] **Route order correct (specific before dynamic)**
- [ ] **Public endpoints have @Public() decorator**
- [ ] **Tests cover all 4 patterns**
- [ ] **No hardcoded test data in production code**
- [ ] **Error messages are clear and actionable**

### Git Commit Message Template

```
Story X.Y: [Feature Name]

- Create [DTO Name] with [validation details]
  - [List specific validations]
  - Union type fields validated with @IsNotEmpty()
  
- Implement [Service Name]
  - Convert DTOs to plain objects for Prisma Json fields
  - [Business logic details]
  
- Add public API endpoints
  - GET /path/to/resource - [Description]
  - Marked as @Public() for open access
  - Route order: specific before :id
  
- Comprehensive E2E testing
  - [X/Y] test cases covering all scenarios
  - All tests passing
  
- Technical fixes
  - [List specific technical solutions]
```

---

## 🚨 Red Flags - Stop and Check

### If You See These, Review This Checklist

1. **Prisma Error:** `Type 'MyDto' is not assignable to type 'JsonValue'`
   → Missing JSON.parse(JSON.stringify()) conversion

2. **Validation Error:** `"property value should not exist"`
   → Missing validator on union type field

3. **Wrong Endpoint:** Calling `/resources/templates` but `:id` handler executes
   → Route order incorrect, `:id` defined before `templates`

4. **Unexpected 401:** Public endpoint returns Unauthorized
   → Missing @Public() decorator (global guard active)

---

## 📚 Quick Reference Links

- [IMPORT-PATHS.md](../IMPORT-PATHS.md) - Copy-paste imports & patterns
- [lessons-learned.md](./lessons-learned.md) - Detailed explanations
- [backend-code-structure-guide.md](./backend-code-structure-guide.md) - Architecture
- Story 3.5 commit: `a7d0e34` - Working example

---

## 💡 When to Use This Checklist

**ALWAYS use when:**
- Creating DTOs with `@ValidateNested()` or `@Type()`
- Mapping DTOs to Prisma models with `Json` fields
- Adding routes to controllers with existing `:id` routes
- Creating public endpoints (with global APP_GUARD)

**Optional (but recommended) when:**
- Adding any new controller endpoints
- Implementing complex validation logic
- Writing E2E test scripts
- Reviewing PRs with DTO changes

---

**Last Updated:** 2026-01-26 (Story 3.5)  
**Next Review:** After Story 3.6 or any DTO-related issues  
**Status:** Active - Update as new patterns emerge
