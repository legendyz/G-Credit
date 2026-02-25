-- Story 13.2 / DEC-011-13: Clear temp passwords for M365 users (SSO-only enforcement)
-- M365 users authenticate exclusively via Azure AD SSO — temp passwords are no longer needed.
-- This migration is idempotent: only affects users with azureId set and non-empty passwordHash.
UPDATE "users" SET "passwordHash" = '' WHERE "azureId" IS NOT NULL AND "passwordHash" != '';
