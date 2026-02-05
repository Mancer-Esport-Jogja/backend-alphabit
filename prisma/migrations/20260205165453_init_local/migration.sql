/*
  Warnings:

  - You are about to drop the column `payout_seller` on the `trade_activities` table. All the data in the column will be lost.
  - You are about to drop the column `settled_at` on the `trade_activities` table. All the data in the column will be lost.
  - Added the required column `option_type_raw` to the `trade_activities` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PredictionStatus" AS ENUM ('ACTIVE', 'SETTLED', 'EXPIRED');

-- DropIndex
DROP INDEX "trade_activities_status_idx";

-- DropIndex
DROP INDEX "trade_activities_user_id_created_at_idx";

-- AlterTable
ALTER TABLE "trade_activities" DROP COLUMN "payout_seller",
DROP COLUMN "settled_at",
ADD COLUMN     "close_block" INTEGER,
ADD COLUMN     "close_timestamp" TIMESTAMP(3),
ADD COLUMN     "close_tx_hash" TEXT,
ADD COLUMN     "collateral_returned_seller" TEXT,
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "entry_block" INTEGER,
ADD COLUMN     "exercised" BOOLEAN,
ADD COLUMN     "explicit_close" JSONB,
ADD COLUMN     "normalized_volume" DECIMAL(20,8),
ADD COLUMN     "option_type_raw" INTEGER NOT NULL,
ADD COLUMN     "oracle_failure" BOOLEAN DEFAULT false,
ADD COLUMN     "oracle_failure_reason" TEXT,
ADD COLUMN     "pnl" DECIMAL(20,8),
ADD COLUMN     "price_feed" TEXT,
ADD COLUMN     "roi_percent" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "current_login_streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "current_win_streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_login_date" TIMESTAMP(3),
ADD COLUMN     "max_login_streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "max_win_streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "user_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period" VARCHAR(16) NOT NULL,
    "total_pnl" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "total_roi_percent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_volume" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "total_trades" INTEGER NOT NULL DEFAULT 0,
    "win_count" INTEGER NOT NULL DEFAULT 0,
    "win_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_daily_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date_utc" TIMESTAMP(3) NOT NULL,
    "total_pnl" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "total_roi_percent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_volume" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "total_trades" INTEGER NOT NULL DEFAULT 0,
    "win_count" INTEGER NOT NULL DEFAULT 0,
    "win_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "target_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_predictions" (
    "id" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "recommendedStrike" DECIMAL(20,8) NOT NULL,
    "confidence" INTEGER NOT NULL,
    "reasoning" TEXT NOT NULL,
    "status" "PredictionStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiry_time" TIMESTAMP(3) NOT NULL,
    "settled_at" TIMESTAMP(3),
    "start_price" DECIMAL(20,8),
    "end_price" DECIMAL(20,8),
    "result" TEXT,

    CONSTRAINT "ai_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_votes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "prediction_id" TEXT NOT NULL,
    "vote" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prediction_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_stats_period_total_pnl_idx" ON "user_stats"("period", "total_pnl" DESC);

-- CreateIndex
CREATE INDEX "user_stats_period_total_roi_percent_idx" ON "user_stats"("period", "total_roi_percent" DESC);

-- CreateIndex
CREATE INDEX "user_stats_period_total_volume_idx" ON "user_stats"("period", "total_volume" DESC);

-- CreateIndex
CREATE INDEX "user_stats_period_win_rate_idx" ON "user_stats"("period", "win_rate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_stats_user_id_period_key" ON "user_stats"("user_id", "period");

-- CreateIndex
CREATE INDEX "user_daily_stats_user_id_date_utc_idx" ON "user_daily_stats"("user_id", "date_utc");

-- CreateIndex
CREATE INDEX "user_daily_stats_date_utc_idx" ON "user_daily_stats"("date_utc");

-- CreateIndex
CREATE INDEX "user_daily_stats_date_utc_total_pnl_idx" ON "user_daily_stats"("date_utc", "total_pnl" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_daily_stats_user_id_date_utc_key" ON "user_daily_stats"("user_id", "date_utc");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_code_key" ON "notification_templates"("code");

-- CreateIndex
CREATE INDEX "ai_predictions_status_idx" ON "ai_predictions"("status");

-- CreateIndex
CREATE INDEX "ai_predictions_created_at_idx" ON "ai_predictions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "prediction_votes_user_id_prediction_id_key" ON "prediction_votes"("user_id", "prediction_id");

-- CreateIndex
CREATE INDEX "trade_activities_user_id_created_at_idx" ON "trade_activities"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "trade_activities_status_expiry_timestamp_idx" ON "trade_activities"("status", "expiry_timestamp");

-- CreateIndex
CREATE INDEX "trade_activities_close_tx_hash_idx" ON "trade_activities"("close_tx_hash");

-- CreateIndex
CREATE INDEX "trade_activities_underlying_asset_status_idx" ON "trade_activities"("underlying_asset", "status");

-- CreateIndex
CREATE INDEX "trade_activities_user_id_close_timestamp_idx" ON "trade_activities"("user_id", "close_timestamp");

-- CreateIndex
CREATE INDEX "trade_activities_user_id_entry_timestamp_idx" ON "trade_activities"("user_id", "entry_timestamp");

-- CreateIndex
CREATE INDEX "trade_activities_user_id_pnl_idx" ON "trade_activities"("user_id", "pnl");

-- CreateIndex
CREATE INDEX "trade_activities_user_id_roi_percent_idx" ON "trade_activities"("user_id", "roi_percent");

-- CreateIndex
CREATE INDEX "trade_activities_user_id_normalized_volume_idx" ON "trade_activities"("user_id", "normalized_volume");

-- AddForeignKey
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_daily_stats" ADD CONSTRAINT "user_daily_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_votes" ADD CONSTRAINT "prediction_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_votes" ADD CONSTRAINT "prediction_votes_prediction_id_fkey" FOREIGN KEY ("prediction_id") REFERENCES "ai_predictions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
