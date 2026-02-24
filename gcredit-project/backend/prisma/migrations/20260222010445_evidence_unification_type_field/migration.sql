-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('FILE', 'URL');

-- AlterTable
ALTER TABLE "evidence_files" ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "type" "EvidenceType" NOT NULL DEFAULT 'FILE';
