import { Router } from 'express';
import { db } from '../store/db';
import { serializeMatch } from './serializers';
import { ApiError } from '../middleware/errorHandler';
import { ensureMatchAssets } from '../services/matchSimulator';

export const matchesRouter = Router();

matchesRouter.get('/', (req, res) => {
  const { leagueId, status, teamId } = req.query as Record<string, string | undefined>;
  const matches = db.listMatches({ leagueId, status, teamId });
  res.json({ count: matches.length, matches: matches.map((m) => serializeMatch(m, req)) });
});

matchesRouter.get('/:id', (req, res) => {
  const match = db.matches.get(req.params.id);
  if (!match) throw new ApiError(404, 'Match not found');
  res.json(serializeMatch(match, req));
});

/** Match Events: goals, cards, substitutions, VAR reviews, in chronological order. */
matchesRouter.get('/:id/events', (req, res) => {
  const match = db.matches.get(req.params.id);
  if (!match) throw new ApiError(404, 'Match not found');
  const events = db.eventsFor(match.id);
  res.json({
    matchId: match.id,
    count: events.length,
    events: events.map((e) => ({
      ...e,
      player: e.playerId ? db.players.get(e.playerId)?.name ?? null : null,
      relatedPlayer: e.relatedPlayerId ? db.players.get(e.relatedPlayerId)?.name ?? null : null,
      team: e.teamId ? db.teams.get(e.teamId)?.name.en ?? null : null,
    })),
  });
});

/** Lineups & Formations: starting XI, bench, and formation per side. */
matchesRouter.get('/:id/lineups', (req, res) => {
  const match = db.matches.get(req.params.id);
  if (!match) throw new ApiError(404, 'Match not found');
  ensureMatchAssets(match);
  const lineups = db.lineupsFor(match.id);
  res.json({
    matchId: match.id,
    lineups: lineups.map((l) => ({
      team: { id: l.teamId, name: db.teams.get(l.teamId)?.name.en },
      formation: l.formation,
      coach: l.coachId ? db.coaches.get(l.coachId)?.name ?? null : null,
      startXI: l.startXI.map((slot) => ({
        ...slot,
        player: db.players.get(slot.playerId)?.name ?? null,
      })),
      bench: l.bench.map((slot) => ({
        ...slot,
        player: db.players.get(slot.playerId)?.name ?? null,
      })),
    })),
  });
});

/** Live Statistics: possession, shots, fouls, cards, and more, per side. */
matchesRouter.get('/:id/statistics', (req, res) => {
  const match = db.matches.get(req.params.id);
  if (!match) throw new ApiError(404, 'Match not found');
  ensureMatchAssets(match);
  const stats = db.statsFor(match.id);
  res.json({
    matchId: match.id,
    statistics: stats.map((s) => ({ ...s, team: db.teams.get(s.teamId)?.name.en })),
  });
});
