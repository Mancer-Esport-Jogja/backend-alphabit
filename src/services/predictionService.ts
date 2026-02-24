import { prisma } from '../lib/prisma';

/**
 * Service to handle AIPrediction Logic
 * Implements "Proof of Profit" settlement:
 * - AI is judged based on whether users who followed it (SYNC) actually made money.
 */
export const predictionService = {

    /**
     * Settle expired predictions
     * Checks all ACTIVE predictions that have passed expiryTime.
     * Looks for 'SYNC' votes and checks if those users had profitable trades.
     */
    async settleExpiredPredictions() {
        // 1. Find Expired + Active Predictions
        const expired = await prisma.aIPrediction.findMany({
            where: {
                status: 'ACTIVE',
                expiryTime: { lte: new Date() }
            },
            include: {
                votes: {
                    where: { vote: 'SYNC' } // Only care about believers
                }
            }
        });

        if (expired.length === 0) return;

        console.log(`[PredictionService] Found ${expired.length} expired predictions to settle.`);

        // 2. Process each
        for (const pred of expired) {
            try {
                // If no one voted SYNC, we can't verify based on "Proof of Profit"
                if (pred.votes.length === 0) {
                    await prisma.aIPrediction.update({
                        where: { id: pred.id },
                        data: { status: 'SETTLED', result: 'No Votes' }
                    });
                    console.log(`[PredictionService] Settled ${pred.id}: UNVERIFIED (No SYNC votes)`);
                    continue;
                }

                // Get User IDs of SYNC voters
                const believerIds = pred.votes.map(v => v.userId);

                // 3. Find relevant trades for these users
                // Criteria: 
                // - Created AFTER prediction started
                // - Settled status
                // - Asset matches
                // - Direction (Call/Put) matches AI
                const isCall = pred.direction === 'MOON';

                const confirmingTrades = await prisma.tradeActivity.findMany({
                    where: {
                        userId: { in: believerIds },
                        status: 'SETTLED',
                        underlyingAsset: pred.asset, // ETH or BTC
                        isCall: isCall,
                        entryTimestamp: { gte: pred.createdAt } // Trade must be after prediction
                        // We don't strictly enforce end time, as long as it was influenced by this prediction
                    },
                    select: {
                        payoutBuyer: true,
                        userId: true
                    }
                });

                if (confirmingTrades.length === 0) {
                    // Believers existed but they didn't trade (or trade not settled yet).
                    // If prediction is expired but trades aren't settled, we might be too early?
                    // BUT, scheduler syncs trades FIRST. So if they are settled on-chain, they should be in DB.
                    // If no trades found, we mark as UNVERIFIED or LOSS?
                    // Let's mark as UNVERIFIED for now to be safe.
                    await prisma.aIPrediction.update({
                        where: { id: pred.id },
                        data: { status: 'SETTLED', result: 'No Trades' }
                    });
                    console.log(`[PredictionService] Settled ${pred.id}: UNVERIFIED (Votes but No Trades)`);
                    continue;
                }

                // 4. Check for ANY Profit
                // If at least one believer made a profit, the AI provided a winning signal.
                const hasProfit = confirmingTrades.some(t => Number(t.payoutBuyer || 0) > 0);

                const result = hasProfit ? 'WIN' : 'LOSS';

                // Update DB
                await prisma.aIPrediction.update({
                    where: { id: pred.id },
                    data: {
                        status: 'SETTLED',
                        settledAt: new Date(),
                        result
                    }
                });

                console.log(`[PredictionService] Settled ${pred.id} (${pred.asset}): ${result} (Based on ${confirmingTrades.length} trades)`);

            } catch (error) {
                console.error(`[PredictionService] Failed to settle ${pred.id}:`, error);
            }
        }
    }
};
