-- CreateEnum
CREATE TYPE "PredictionStatus" AS ENUM ('ACTIVE', 'SETTLED', 'EXPIRED');

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
CREATE INDEX "ai_predictions_status_idx" ON "ai_predictions"("status");

-- CreateIndex
CREATE INDEX "ai_predictions_created_at_idx" ON "ai_predictions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "prediction_votes_user_id_prediction_id_key" ON "prediction_votes"("user_id", "prediction_id");

-- AddForeignKey
ALTER TABLE "prediction_votes" ADD CONSTRAINT "prediction_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_votes" ADD CONSTRAINT "prediction_votes_prediction_id_fkey" FOREIGN KEY ("prediction_id") REFERENCES "ai_predictions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "trade_activities_user_id_normalized_volume_idx" RENAME TO "trade_activities_user_id_normalizedVolume_idx";

-- RenameIndex
ALTER INDEX "trade_activities_user_id_roi_percent_idx" RENAME TO "trade_activities_user_id_roiPercent_idx";
