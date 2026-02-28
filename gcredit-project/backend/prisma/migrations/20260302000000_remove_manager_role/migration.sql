-- Story 14.2: Remove MANAGER from UserRole enum (ADR-015, ADR-017 §3)
-- Manager identity is now derived from directReports relation, not role enum.

-- Step 1: Migrate data BEFORE altering the enum
UPDATE "users" SET "role" = 'EMPLOYEE' WHERE "role" = 'MANAGER';

-- Step 2: Remove MANAGER from the enum type
-- PostgreSQL requires creating a new type, migrating, and dropping the old one
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'ISSUER', 'EMPLOYEE');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';
