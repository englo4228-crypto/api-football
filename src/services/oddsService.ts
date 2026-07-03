import { v4 as uuid } from 'uuid';
import { DateTime } from 'luxon';
import { db } from '../store/db';
import { Match, OddsMarket, OddsSelection, OddsSnapshot } from '../types';
import { mulberry32 } from '../data/nameData';

const BOOKMAKERS = ['Pitchside Bet', 'GoalLine Odds', 'FullTime Markets', 'Kickoff Wagers'];

function seedFromString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  return h >>> 0;
}

function impliedFromStrength(homeStrength: number, awayStrength: number): { home: number; draw: number; away: number } {
  const total = homeStrength + awayStrength + 0.55; // draw baseline
  const home = homeStrength / total;
  const away = awayStrength / total;
  const draw = 1 - home - away;
  return { home, draw, away };
}

function toDecimalOdds(probability: number, margin = 1.06): number {
  const fair = 1 / Math.max(probability, 0.02);
  return Math.round(fair * margin * 100) / 100;
}

function teamStrength(teamId: string, leagueId: string): number {
  const standing = db.standingsFor(leagueId).find((s) => s.teamId === teamId);
  if (!standing || standing.played === 0) return 1;
  return Math.max(0.3, standing.points / standing.played);
}

function buildMarkets(match: Match, isLive: boolean, rand: () => number): OddsSnapshot[] {
  const homeStrength = teamStrength(match.homeTeamId, match.leagueId) + (isLive ? match.score.home * 0.4 : 0);
  const awayStrength = teamStrength(match.awayTeamId, match.leagueId) + (isLive ? match.score.away * 0.4 : 0);
  const winProb = impliedFromStrength(homeStrength, awayStrength);

  const totalGoalsSoFar = match.score.home + match.score.away;
  const minutesLeft = isLive ? Math.max(0, 90 - match.minute) : 90;
  const over25Prob = Math.min(0.92, Math.max(0.08, (totalGoalsSoFar >= 3 ? 0.95 : 0.5) - (minutesLeft / 90) * 0.15 + rand() * 0.05));
  const bttsProb = Math.min(0.9, Math.max(0.1, 0.5 + (Math.min(match.score.home, match.score.away) > 0 ? 0.3 : 0) + rand() * 0.05));

  const bookmaker = BOOKMAKERS[Math.floor(rand() * BOOKMAKERS.length)];
  const timestamp = DateTime.utc().toISO()!;

  const matchWinner: OddsSelection[] = [
    { name: 'Home', price: toDecimalOdds(winProb.home) },
    { name: 'Draw', price: toDecimalOdds(winProb.draw) },
    { name: 'Away', price: toDecimalOdds(winProb.away) },
  ];
  const overUnder: OddsSelection[] = [
    { name: 'Over 2.5', price: toDecimalOdds(over25Prob) },
    { name: 'Under 2.5', price: toDecimalOdds(1 - over25Prob) },
  ];
  const btts: OddsSelection[] = [
    { name: 'Yes', price: toDecimalOdds(bttsProb) },
    { name: 'No', price: toDecimalOdds(1 - bttsProb) },
  ];

  const markets: [OddsMarket, OddsSelection[]][] = [
    ['MATCH_WINNER', matchWinner],
    ['OVER_UNDER_2_5', overUnder],
    ['BOTH_TEAMS_TO_SCORE', btts],
  ];

  return markets.map(([market, selections]) => ({
    id: uuid(),
    matchId: match.id,
    bookmaker,
    market,
    selections,
    isLive,
    timestamp,
  }));
}

export function getPreMatchOdds(matchId: string): OddsSnapshot[] {
  const match = db.matches.get(matchId);
  if (!match) return [];
  const existing = db.oddsFor(matchId).filter((o) => !o.isLive);
  if (existing.length > 0) return existing;
  const rand = mulberry32(seedFromString(`${matchId}-prematch`));
  const snapshots = buildMarkets(match, false, rand);
  snapshots.forEach((s) => db.addOdds(matchId, s));
  return snapshots;
}

export function getLiveOdds(matchId: string): OddsSnapshot[] {
  const match = db.matches.get(matchId);
  if (!match) return [];
  if (match.status !== 'LIVE' && match.status !== 'HT') {
    return db.oddsFor(matchId).filter((o) => o.isLive);
  }
  const rand = mulberry32(seedFromString(`${matchId}-live-${match.minute}-${match.score.home}-${match.score.away}`));
  return buildMarkets(match, true, rand);
}
