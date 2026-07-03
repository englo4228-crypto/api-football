import { Router } from 'express';
import { db } from '../store/db';
import { serializeMatch } from './serializers';
import { ApiError } from '../middleware/errorHandler';

export const liveScoresRouter = Router();

/**
 * GET /api/live-scores
 * Snapshot of all currently live/half-time matches. The simulation engine
 * mutates match state every LIVE_TICK_INTERVAL_MS (default 15s), so polling
 * this endpoint on that cadence yields near real-time scores. Prefer the
 * WebSocket gateway (/live) for push-based updates on the same cadence.
 */
liveScoresRouter.get('/', (req, res) => {
  const leagueId = req.query.leagueId as string | undefined;
  const matches = db
    .listMatches({ leagueId, status: 'LIVE' })
    .concat(db.listMatches({ leagueId, status: 'HT' }));
  res.json({
    updatedAt: new Date().toISOString(),
    refreshIntervalMs: Number(process.env.LIVE_TICK_INTERVAL_MS ?? 15000),
    count: matches.length,
    matches: matches.map((m) => serializeMatch(m, req)),
  });
});

liveScoresRouter.get('/:matchId', (req, res) => {
  const match = db.matches.get(req.params.matchId);
  if (!match) throw new ApiError(404, 'Match not found');
  res.json(serializeMatch(match, req));
});
