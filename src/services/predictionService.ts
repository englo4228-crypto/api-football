import { DateTime } from 'luxon';
import { db } from '../store/db';
import { Match, Prediction } from '../types';
import { mulberry32 } from '../data/nameData';

function seedFromString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  return h >>> 0;
}

function formPoints(teamId: string, leagueId: string): number {
  const standing = db.standingsFor(leagueId).find((s) => s.teamId === teamId);
  if (!standing) return 1;
  const formScore = standing.form.reduce((acc, r) => acc + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0);
  const ppg = standing.played > 0 ? standing.points / standing.played : 1;
  return ppg * 0.7 + (formScore / Math.max(standing.form.length, 1)) * 0.3;
}

function avgGoalsFor(teamId: string, leagueId: string): number {
  const standing = db.standingsFor(leagueId).find((s) => s.teamId === teamId);
  if (!standing || standing.played === 0) return 1.2;
  return standing.goalsFor / standing.played;
}

function avgGoalsAgainst(teamId: string, leagueId: string): number {
  const standing = db.standingsFor(leagueId).find((s) => s.teamId === teamId);
  if (!standing || standing.played === 0) return 1.1;
  return standing.goalsAgainst / standing.played;
}

export function getPrediction(matchId: string): Prediction | null {
  const match: Match | undefined = db.matches.get(matchId);
  if (!match) return null;

  const rand = mulberry32(seedFromString(matchId));
  const homeForm = formPoints(match.homeTeamId, match.leagueId) + 0.15; // home advantage
  const awayForm = formPoints(match.awayTeamId, match.leagueId);
  const total = homeForm + awayForm + 0.5;
  const homeWin = homeForm / total;
  const awayWin = awayForm / total;
  const draw = 1 - homeWin - awayWin;

  const expectedHomeGoals = (avgGoalsFor(match.homeTeamId, match.leagueId) + avgGoalsAgainst(match.awayTeamId, match.leagueId)) / 2 + rand() * 0.1;
  const expectedAwayGoals = (avgGoalsFor(match.awayTeamId, match.leagueId) + avgGoalsAgainst(match.homeTeamId, match.leagueId)) / 2 + rand() * 0.1;

  const bttsProbability = Math.min(0.9, Math.max(0.15, (expectedHomeGoals > 0.8 ? 0.5 : 0.3) + (expectedAwayGoals > 0.8 ? 0.2 : 0)));
  const over25Probability = Math.min(0.92, Math.max(0.1, (expectedHomeGoals + expectedAwayGoals - 2.5) * 0.25 + 0.5));

  return {
    matchId,
    model: 'xg-form-v1',
    generatedAt: DateTime.utc().toISO()!,
    winProbability: {
      home: Math.round(homeWin * 1000) / 1000,
      draw: Math.round(draw * 1000) / 1000,
      away: Math.round(awayWin * 1000) / 1000,
    },
    expectedGoals: {
      home: Math.round(expectedHomeGoals * 100) / 100,
      away: Math.round(expectedAwayGoals * 100) / 100,
    },
    bothTeamsToScoreProbability: Math.round(bttsProbability * 1000) / 1000,
    over2_5GoalsProbability: Math.round(over25Probability * 1000) / 1000,
  };
}
