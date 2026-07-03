import { Router } from 'express';
import { db } from '../store/db';
import { serializeTeam } from './serializers';
import { ApiError } from '../middleware/errorHandler';

export const teamsRouter = Router();

teamsRouter.get('/', (req, res) => {
  const { countryCode, query } = req.query as Record<string, string | undefined>;
  let teams = Array.from(db.teams.values());
  if (countryCode) teams = teams.filter((t) => t.countryCode.toLowerCase() === countryCode.toLowerCase());
  if (query) teams = teams.filter((t) => t.name.en.toLowerCase().includes(query.toLowerCase()));
  res.json({ count: teams.length, teams: teams.map((t) => serializeTeam(t, req)) });
});

teamsRouter.get('/:id', (req, res) => {
  const team = db.teams.get(req.params.id);
  if (!team) throw new ApiError(404, 'Team not found');
  res.json(serializeTeam(team, req));
});

/** Team Squads: current active roster grouped by position. */
teamsRouter.get('/:id/squad', (req, res) => {
  const team = db.teams.get(req.params.id);
  if (!team) throw new ApiError(404, 'Team not found');
  const squad = db.squadFor(team.id).sort((a, b) => a.shirtNumber - b.shirtNumber);
  res.json({
    teamId: team.id,
    team: team.name.en,
    count: squad.length,
    squad: squad.map((p) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      shirtNumber: p.shirtNumber,
      nationality: p.nationality,
      dateOfBirth: p.dateOfBirth,
    })),
  });
});

/** Injury Reports: sidelined players, status, and expected return timelines. */
teamsRouter.get('/:id/injuries', (req, res) => {
  const team = db.teams.get(req.params.id);
  if (!team) throw new ApiError(404, 'Team not found');
  const injuries = db.injuriesForTeam(team.id);
  res.json({
    teamId: team.id,
    count: injuries.length,
    injuries: injuries.map((i) => ({ ...i, player: db.players.get(i.playerId)?.name ?? null })),
  });
});

teamsRouter.get('/:id/coach', (req, res) => {
  const team = db.teams.get(req.params.id);
  if (!team) throw new ApiError(404, 'Team not found');
  if (!team.coachId) throw new ApiError(404, 'No coach assigned');
  const coach = db.coaches.get(team.coachId);
  if (!coach) throw new ApiError(404, 'Coach not found');
  res.json(coach);
});
