import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// GET /active - Get current active prediction + stats for a specific asset
export const getActivePrediction = async (req: Request, res: Response) => {
    try {
        const { asset, userId } = req.query; // Optional: filter by asset (ETH/BTC) and check user vote

        // Build where clause
        const whereClause: any = {
            status: { in: ['ACTIVE'] },
            expiryTime: { gt: new Date() }
        };

        // Add asset filter if provided
        if (asset && typeof asset === 'string') {
            whereClause.asset = asset;
        }

        // 1. Find the latest active prediction
        const activePred = await prisma.aIPrediction.findFirst({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { votes: true }
                }
            }
        });

        if (!activePred) {
            return res.json({ prediction: null });
        }

        // 2. Aggregate Votes (Sync vs Override)
        const votes = await prisma.predictionVote.groupBy({
            by: ['vote'],
            where: { predictionId: activePred.id },
            _count: { vote: true }
        });

        const syncCount = votes.find((v: any) => v.vote === 'SYNC')?._count.vote || 0;
        const overrideCount = votes.find((v: any) => v.vote === 'OVERRIDE')?._count.vote || 0;
        const totalVotes = syncCount + overrideCount;

        // Calculate consensus percentage (Sync %)
        const consensus = totalVotes > 0 ? Math.round((syncCount / totalVotes) * 100) : 50;

        // 3. Check if user has already voted (if userId provided)
        let userVote: string | null = null;
        if (userId && typeof userId === 'string') {
            const existingVote = await prisma.predictionVote.findUnique({
                where: {
                    userId_predictionId: {
                        userId: userId,
                        predictionId: activePred.id
                    }
                }
            });
            userVote = existingVote?.vote || null;
        }

        return res.json({
            prediction: activePred,
            stats: {
                syncCount,
                overrideCount,
                totalVotes,
                consensus // e.g., 75 means 75% agreed
            },
            userVote // 'SYNC' | 'OVERRIDE' | null
        });

    } catch (error) {
        console.error('Error fetching active prediction:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};

// POST /create - Client triggers this when no active prediction exists
export const createPrediction = async (req: Request, res: Response) => {
    try {
        const {
            asset,
            direction,
            duration,
            recommendedStrike,
            confidence,
            reasoning,
            expiryTime,
            startPrice // Expecting startPrice from client 
        } = req.body;

        // Check if there's already an active prediction for THIS ASSET
        const existing = await prisma.aIPrediction.findFirst({
            where: {
                asset: asset, // Filter by SAME asset only
                status: 'ACTIVE',
                expiryTime: { gt: new Date() }
            }
        });

        if (existing) {
            // Return existing prediction gracefully (not an error)
            return res.status(200).json({ message: 'Active prediction already exists', prediction: existing });
        }

        const newPred = await prisma.aIPrediction.create({
            data: {
                asset,
                direction,
                duration,
                recommendedStrike,
                confidence,
                reasoning,
                expiryTime: new Date(expiryTime),
                startPrice: startPrice ? Number(startPrice) : undefined, // Store it
                status: 'ACTIVE'
            }
        });

        return res.status(201).json(newPred);

    } catch (error) {
        console.error('Error creating prediction:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};

// POST /vote - User votes Sync or Override
export const votePrediction = async (req: Request, res: Response) => {
    try {
        const { predictionId, vote, userId } = req.body; // userId passed from client for now, auth later

        if (!['SYNC', 'OVERRIDE'].includes(vote)) {
            return res.status(400).json({ error: 'Invalid vote' });
        }

        const result = await prisma.predictionVote.upsert({
            where: {
                userId_predictionId: {
                    userId,
                    predictionId
                }
            },
            update: { vote },
            create: {
                userId,
                predictionId,
                vote
            }
        });

        return res.json(result);

    } catch (error) {
        console.error('Error voting:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};
