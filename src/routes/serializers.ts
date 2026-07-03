import { Request } from 'express';
import { db } from '../store/db';
import { League, Match, Team } from '../types';
import { localize, toLocalTime } from '../middleware/requestContext';

export function serializeTeam(team: Team, req: Request) {
  return {
    id: team.id,
    name: localize(team.name, req.lang),
    shortName: team.shortName,
    countryCode: team.countryCode,
    founded: team.founded,
    venue: team.venue,
    coachId: team.coachId,
    crestUrl: team.crestUrl,
  };
}

export function serializeLeague(league: League, req: Request) {
  return {
    id: league.id,
    name: localize(league.name, req.lang),
    countryCode: league.countryCode,
    tier: league.tier,
    season: league.season,
    numberOfTeams: league.numberOfTeams,
    confederation: league.confederation,
  };
}

export function serializeMatch(match: Match, req: Request) {
  const home = db.teams.get(match.homeTeamId);
  const away = db.teams.get(match.awayTeamId);
  const league = db.leagues.get(match.leagueId);
  return {
    id: match.id,
    league: league ? { id: league.id, name: localize(league.name, req.lang) } : null,
    season: match.season,
    round: match.round,
    status: match.status,
    minute: match.minute,
    addedTime: match.addedTime,
    kickoffUTC: match.kickoffUTC,
    kickoffLocal: toLocalTime(match.kickoffUTC, req.timezone),
    timezone: req.timezone,
    venue: match.venue,
    score: match.score,
    halfTimeScore: match.halfTimeScore,
    homeTeam: home ? { id: home.id, name: localize(home.name, req.lang), shortName: home.shortName } : null,
    awayTeam: away ? { id: away.id, name: localize(away.name, req.lang), shortName: away.shortName } : null,
  };
}
