-- Manual Migration: Rename camelCase columns to snake_case
-- Run with: npx ts-node scripts/rename-columns.ts

BEGIN;

-- Rename normalizedVolume to normalized_volume
ALTER TABLE trade_activities 
  RENAME COLUMN "normalizedVolume" TO normalized_volume;

-- Rename roiPercent to roi_percent
ALTER TABLE trade_activities 
  RENAME COLUMN "roiPercent" TO roi_percent;

-- pnl is already lowercase (no rename needed)

COMMIT;

-- Verification:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'trade_activities' AND column_name IN ('normalized_volume', 'roi_percent', 'pnl');
