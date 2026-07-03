import { Router } from 'express';
import { db } from '../store/db';
import { serializeLeague, serializeTeam } from './serializers';
import { ApiError } from '../middleware/errorHandler';
import { Player, SeasonStatLine } from '../types';

export const leaguesRouter = Router();

leaguesRouter.get('/', (req, res) => {
  res.json({ count: db.leagues.size, leagues: Array.from(db.leagues.values()).map((l) => serializeLeague(l, req)) });
});

/**
 * Global Coverage: browsable catalog of 1,200+ worldwide competitions across
 * all six confederations. Entries with hasLiveData=true are fully simulated
 * (scores, events, lineups, odds); the rest are catalog/metadata only.
 */
leaguesRouter.get('/coverage', (req, res) => {
  const { confederation, countryCode, query } = req.query as Record<string, string | undefined>;
  let entries = db.competitionCatalog;
  if (confederation) entries = entries.filter((e) => e.confederation === confederation);
  if (countryCode) entries = entries.filter((e) => e.countryCode.toLowerCase() === countryCode.toLowerCase());
  if (query) {
    const q = query.toLowerCase();
    entries = entries.filter((e) => e.name.toLowerCase().includes(q) || e.country.toLowerCase().includes(q));
  }
  const limit = Math.min(Number(req.query.limit ?? 100), 500);
  res.json({
    totalSupportedCompetitions: db.competitionCatalog.length,
    matched: entries.length,
    competitions: entries.slice(0, limit),
  });
});

leaguesRouter.get('/:id', (req, res) => {
  const league = db.leagues.get(req.params.id);
  if (!league) throw new ApiError(404, 'League not found');
  res.json(serializeLeague(league, req));
});

leaguesRouter.get('/:id/teams', (req, res) => {
  const league = db.leagues.get(req.params.id);
  if (!league) throw new ApiError(404, 'League not found');
  const teams = Array.from(db.teams.values()).filter((t) =>
    Array.from(db.matches.values()).some((m) => m.leagueId === league.id && (m.homeTeamId === t.id || m.awayTeamId === t.id)),
  );
  res.json({ leagueId: league.id, teams: teams.map((t) => serializeTeam(t, req)) });
});

/** League Standings: real-time table, updated on every match result. */
leaguesRouter.get('/:id/standings', (req, res) => {
  const league = db.leagues.get(req.params.id);
  if (!league) throw new ApiError(404, 'League not found');
  const standings = db.standingsFor(league.id);
  res.json({
    leagueId: league.id,
    season: league.season,
    updatedAt: new Date().toISOString(),
    table: standings.map((s) => ({ ...s, team: db.teams.get(s.teamId)?.name.en })),
  });
});

/** Top Scorers: goals, assists, and cards leaderboard for the league. */
leaguesRouter.get('/:id/top-scorers', (req, res) => {
  const league = db.leagues.get(req.params.id);
  if (!league) throw new ApiError(404, 'League not found');
  const sortBy = (req.query.sortBy as string) || 'goals';
  const players = Array.from(db.players.values())
    .map((p) => {
      const stat = p.careerStats.find((s) => s.competitionId === league.id && s.season === league.season);
      return stat ? { player: p, stat } : null;
    })
    .filter((x): x is { player: Player; stat: SeasonStatLine } => x !== null);

  const key: keyof SeasonStatLine = sortBy === 'assists' ? 'assists' : sortBy === 'cards' ? 'yellowCards' : 'goals';
  const sorted = players.sort((a, b) => (b.stat[key] as number) - (a.stat[key] as number));

  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  res.json({
    leagueId: league.id,
    sortBy,
    leaders: sorted.slice(0, limit).map(({ player, stat }) => ({
      playerId: player.id,
      name: player.name,
      teamId: player.teamId,
      team: player.teamId ? db.teams.get(player.teamId)?.name.en : null,
      appearances: stat.appearances,
      goals: stat.goals,
      assists: stat.assists,
      yellowCards: stat.yellowCards,
      redCards: stat.redCards,
    })),
  });
});
