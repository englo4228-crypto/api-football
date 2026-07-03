import { Router } from 'express';
import { db } from '../store/db';
import { ApiError } from '../middleware/errorHandler';

export const playersRouter = Router();

playersRouter.get('/', (req, res) => {
  const { teamId, position, query } = req.query as Record<string, string | undefined>;
  let players = Array.from(db.players.values());
  if (teamId) players = players.filter((p) => p.teamId === teamId);
  if (position) players = players.filter((p) => p.position === position.toUpperCase());
  if (query) players = players.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  const limit = Math.min(Number(req.query.limit ?? 50), 300);
  res.json({ count: players.length, players: players.slice(0, limit) });
});

/** Player Profiles: biographical info plus historical career statistics. */
playersRouter.get('/:id', (req, res) => {
  const player = db.players.get(req.params.id);
  if (!player) throw new ApiError(404, 'Player not found');
  res.json({
    ...player,
    team: player.teamId ? db.teams.get(player.teamId)?.name.en ?? null : null,
  });
});

/** Transfer History: logs of the player's movement between clubs. */
playersRouter.get('/:id/transfers', (req, res) => {
  const player = db.players.get(req.params.id);
  if (!player) throw new ApiError(404, 'Player not found');
  const transfers = db.transfersForPlayer(player.id);
  res.json({
    playerId: player.id,
    count: transfers.length,
    transfers: transfers.map((t) => ({
      ...t,
      fromTeam: t.fromTeamId ? db.teams.get(t.fromTeamId)?.name.en ?? null : null,
      toTeam: db.teams.get(t.toTeamId)?.name.en ?? null,
    })),
  });
});
