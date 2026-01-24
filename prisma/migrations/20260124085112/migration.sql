/*
  Warnings:

  - You are about to drop the column `picture_profile` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `walletAddress` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `fid` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('OPEN', 'SETTLED', 'EXPIRED');

-- DropIndex
DROP INDEX "users_walletAddress_idx";

-- DropIndex
DROP INDEX "users_walletAddress_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "picture_profile",
DROP COLUMN "walletAddress",
ADD COLUMN     "display_name" TEXT,
ADD COLUMN     "pfp_url" TEXT,
ADD COLUMN     "primary_eth_address" VARCHAR(42),
ADD COLUMN     "username" TEXT,
ALTER COLUMN "fid" SET NOT NULL;

-- CreateTable
CREATE TABLE "trade_activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "option_address" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "status" "TradeStatus" NOT NULL DEFAULT 'OPEN',
    "underlying_asset" TEXT NOT NULL,
    "option_type" TEXT NOT NULL,
    "is_call" BOOLEAN NOT NULL,
    "is_long" BOOLEAN NOT NULL,
    "strikes" JSONB NOT NULL,
    "expiry_timestamp" TIMESTAMP(3) NOT NULL,
    "buyer" TEXT NOT NULL,
    "seller" TEXT NOT NULL,
    "referrer" TEXT,
    "collateral_token" TEXT NOT NULL,
    "collateral_symbol" TEXT NOT NULL,
    "collateral_decimals" INTEGER NOT NULL,
    "entry_premium" TEXT NOT NULL,
    "entry_fee_paid" TEXT NOT NULL,
    "num_contracts" TEXT NOT NULL,
    "collateral_amount" TEXT NOT NULL,
    "settlement_price" TEXT,
    "payout_buyer" TEXT,
    "payout_seller" TEXT,
    "entry_timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "settled_at" TIMESTAMP(3),

    CONSTRAINT "trade_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trade_activities_tx_hash_key" ON "trade_activities"("tx_hash");

-- CreateIndex
CREATE INDEX "trade_activities_user_id_created_at_idx" ON "trade_activities"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "trade_activities_user_id_status_idx" ON "trade_activities"("user_id", "status");

-- CreateIndex
CREATE INDEX "trade_activities_status_idx" ON "trade_activities"("status");

-- CreateIndex
CREATE INDEX "trade_activities_option_address_idx" ON "trade_activities"("option_address");

-- CreateIndex
CREATE INDEX "trade_activities_tx_hash_idx" ON "trade_activities"("tx_hash");

-- CreateIndex
CREATE INDEX "trade_activities_referrer_idx" ON "trade_activities"("referrer");

-- CreateIndex
CREATE UNIQUE INDEX "configs_key_key" ON "configs"("key");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_fid_idx" ON "users"("fid");

-- CreateIndex
CREATE INDEX "users_primary_eth_address_idx" ON "users"("primary_eth_address");

-- AddForeignKey
ALTER TABLE "trade_activities" ADD CONSTRAINT "trade_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
