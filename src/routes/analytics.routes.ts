import { Router } from 'express';
import { db } from '../store/db';
import { ApiError } from '../middleware/errorHandler';
import { getPreMatchOdds, getLiveOdds } from '../services/oddsService';
import { getPrediction } from '../services/predictionService';
import { getHeadToHead } from '../services/headToHeadService';

export const analyticsRouter = Router();

function requireMatch(id: string) {
  const match = db.matches.get(id);
  if (!match) throw new ApiError(404, 'Match not found');
  return match;
}

/** Pre-Match Odds: aggregated bookmaker opening lines (1x2, over/under, BTTS). */
analyticsRouter.get('/matches/:id/odds/pre-match', (req, res) => {
  requireMatch(req.params.id);
  res.json({ matchId: req.params.id, odds: getPreMatchOdds(req.params.id) });
});

/** Live Odds: markets recomputed from live score/minute as the match plays out. */
analyticsRouter.get('/matches/:id/odds/live', (req, res) => {
  const match = requireMatch(req.params.id);
  res.json({ matchId: match.id, matchStatus: match.status, odds: getLiveOdds(match.id) });
});

/** Match Predictions: stats-based outcome probabilities and expected goals. */
analyticsRouter.get('/matches/:id/predictions', (req, res) => {
  requireMatch(req.params.id);
  const prediction = getPrediction(req.params.id);
  if (!prediction) throw new ApiError(404, 'Prediction unavailable');
  res.json(prediction);
});

/** Head-to-Head: historical results between two teams. */
analyticsRouter.get('/head-to-head', (req, res) => {
  const { teamA, teamB } = req.query as Record<string, string | undefined>;
  if (!teamA || !teamB) throw new ApiError(400, 'Query params teamA and teamB are required');
  if (!db.teams.has(teamA)) throw new ApiError(404, `Unknown team: ${teamA}`);
  if (!db.teams.has(teamB)) throw new ApiError(404, `Unknown team: ${teamB}`);
  res.json(getHeadToHead(teamA, teamB));
});
