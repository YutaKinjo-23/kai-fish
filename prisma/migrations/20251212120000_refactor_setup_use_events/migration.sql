-- Refactor FishingEvent setup/use events
-- Applied manually to match production state

-- Drop old columns
ALTER TABLE "FishingEvent" DROP COLUMN IF EXISTS "rig";
ALTER TABLE "FishingEvent" DROP COLUMN IF EXISTS "tackle";
ALTER TABLE "FishingEvent" DROP COLUMN IF EXISTS "target";
ALTER TABLE "FishingEvent" DROP COLUMN IF EXISTS "targetSpeciesId";

-- Add new columns
ALTER TABLE "FishingEvent" ADD COLUMN IF NOT EXISTS "color" TEXT;
ALTER TABLE "FishingEvent" ADD COLUMN IF NOT EXISTS "rigType" TEXT;
ALTER TABLE "FishingEvent" ADD COLUMN IF NOT EXISTS "rigWeight" DOUBLE PRECISION;
ALTER TABLE "FishingEvent" ADD COLUMN IF NOT EXISTS "targetSpeciesIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
