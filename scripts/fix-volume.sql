-- ================================================
-- MIGRATION: Fix Volume Calculation
-- Change from collateralAmount to entryPremium
-- ================================================

-- Step 1: Update trade_activities.normalized_volume
-- Use entryPremium instead of collateralAmount
UPDATE trade_activities
SET normalized_volume = (entry_premium::numeric / POWER(10, collateral_decimals));

-- Verify Step 1
SELECT 
  id,
  entry_premium,
  collateral_amount,
  collateral_decimals,
  normalized_volume,
  (entry_premium::numeric / POWER(10, collateral_decimals)) as correct_volume
FROM trade_activities
LIMIT 5;

-- Step 2: Recalculate user_daily_stats.total_volume
-- Delete and recalculate from scratch
DELETE FROM user_daily_stats;

INSERT INTO user_daily_stats (
  user_id,
  date_utc,
  total_pnl,
  total_volume,
  total_trades,
  win_count,
  win_rate,
  total_roi_percent,
  created_at,
  updated_at
)
SELECT
  user_id,
  DATE_TRUNC('day', close_timestamp AT TIME ZONE 'UTC')::date AS date_utc,
  SUM(COALESCE(pnl, 0)) AS total_pnl,
  SUM(COALESCE(normalized_volume, 0)) AS total_volume,
  COUNT(id) AS total_trades,
  SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) AS win_count,
  CASE 
    WHEN COUNT(id) > 0 THEN (SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END)::numeric / COUNT(id)::numeric * 100)
    ELSE 0
  END AS win_rate,
  AVG(COALESCE("roiPercent", 0)) AS total_roi_percent,
  NOW() AS created_at,
  NOW() AS updated_at
FROM trade_activities
WHERE status = 'SETTLED' AND close_timestamp IS NOT NULL
GROUP BY user_id, DATE_TRUNC('day', close_timestamp AT TIME ZONE 'UTC')::date;

-- Verify Step 2
SELECT * FROM user_daily_stats LIMIT 5;

-- Step 3: Recalculate user_stats.total_volume for all periods
-- Delete and recalculate
DELETE FROM user_stats;

-- Insert 24h stats
INSERT INTO user_stats (
  user_id,
  period,
  total_pnl,
  total_volume,
  total_trades,
  win_count,
  win_rate,
  total_roi_percent,
  created_at,
  updated_at
)
SELECT
  user_id,
  '24h' as period,
  SUM(total_pnl) AS total_pnl,
  SUM(total_volume) AS total_volume,
  SUM(total_trades) AS total_trades,
  SUM(win_count) AS win_count,
  CASE 
    WHEN SUM(total_trades) > 0 THEN (SUM(win_count)::numeric / SUM(total_trades)::numeric * 100)
    ELSE 0
  END AS win_rate,
  AVG(total_roi_percent) AS total_roi_percent,
  NOW() AS created_at,
  NOW() AS updated_at
FROM user_daily_stats
WHERE date_utc >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY user_id;

-- Insert 7d stats
INSERT INTO user_stats (
  user_id,
  period,
  total_pnl,
  total_volume,
  total_trades,
  win_count,
  win_rate,
  total_roi_percent,
  created_at,
  updated_at
)
SELECT
  user_id,
  '7d' as period,
  SUM(total_pnl) AS total_pnl,
  SUM(total_volume) AS total_volume,
  SUM(total_trades) AS total_trades,
  SUM(win_count) AS win_count,
  CASE 
    WHEN SUM(total_trades) > 0 THEN (SUM(win_count)::numeric / SUM(total_trades)::numeric * 100)
    ELSE 0
  END AS win_rate,
  AVG(total_roi_percent) AS total_roi_percent,
  NOW() AS created_at,
  NOW() AS updated_at
FROM user_daily_stats
WHERE date_utc >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY user_id;

-- Insert 30d stats
INSERT INTO user_stats (
  user_id,
  period,
  total_pnl,
  total_volume,
  total_trades,
  win_count,
  win_rate,
  total_roi_percent,
  created_at,
  updated_at
)
SELECT
  user_id,
  '30d' as period,
  SUM(total_pnl) AS total_pnl,
  SUM(total_volume) AS total_volume,
  SUM(total_trades) AS total_trades,
  SUM(win_count) AS win_count,
  CASE 
    WHEN SUM(total_trades) > 0 THEN (SUM(win_count)::numeric / SUM(total_trades)::numeric * 100)
    ELSE 0
  END AS win_rate,
  AVG(total_roi_percent) AS total_roi_percent,
  NOW() AS created_at,
  NOW() AS updated_at
FROM user_daily_stats
WHERE date_utc >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id;

-- Insert all-time stats
INSERT INTO user_stats (
  user_id,
  period,
  total_pnl,
  total_volume,
  total_trades,
  win_count,
  win_rate,
  total_roi_percent,
  created_at,
  updated_at
)
SELECT
  user_id,
  'all' as period,
  SUM(total_pnl) AS total_pnl,
  SUM(total_volume) AS total_volume,
  SUM(total_trades) AS total_trades,
  SUM(win_count) AS win_count,
  CASE 
    WHEN SUM(total_trades) > 0 THEN (SUM(win_count)::numeric / SUM(total_trades)::numeric * 100)
    ELSE 0
  END AS win_rate,
  AVG(total_roi_percent) AS total_roi_percent,
  NOW() AS created_at,
  NOW() AS updated_at
FROM user_daily_stats
GROUP BY user_id;

-- Verify Step 3
SELECT * FROM user_stats ORDER BY period, total_volume DESC LIMIT 10;

-- ================================================
-- FINAL VERIFICATION
-- ================================================

-- Check sample trades
SELECT 
  id,
  entry_premium / POWER(10, collateral_decimals) as should_be_volume,
  normalized_volume as current_volume,
  collateral_amount / POWER(10, collateral_decimals) as old_wrong_volume,
  CASE 
    WHEN ABS((entry_premium / POWER(10, collateral_decimals)) - normalized_volume) < 0.001 THEN '✅ CORRECT'
    ELSE '❌ WRONG'
  END as status
FROM trade_activities
LIMIT 10;

-- Summary
SELECT 
  'trade_activities' as table_name,
  COUNT(*) as total_rows,
  SUM(normalized_volume) as total_volume
FROM trade_activities
UNION ALL
SELECT 
  'user_daily_stats',
  COUNT(*),
  SUM(total_volume)
FROM user_daily_stats
UNION ALL
SELECT 
  'user_stats',
  COUNT(*),
  SUM(total_volume)
FROM user_stats;
