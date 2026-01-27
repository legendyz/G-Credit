-- Update existing badge template images with reliable CDN URLs
-- Run this with: npx prisma db execute --file prisma/update-badge-images.sql --schema prisma/schema.prisma

UPDATE "badge_templates" 
SET "imageUrl" = 'https://picsum.photos/400/400?random=1'
WHERE name = 'Outstanding Performance';

UPDATE "badge_templates" 
SET "imageUrl" = 'https://picsum.photos/400/400?random=2'
WHERE name = 'Team Player';
