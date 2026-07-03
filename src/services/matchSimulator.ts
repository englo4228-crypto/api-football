import { v4 as uuid } from 'uuid';
import { DateTime } from 'luxon';
import { db } from '../store/db';
import {
  LineupSlot,
  Match,
  MatchEvent,
  MatchEventType,
  Player,
  TeamLineup,
  TeamMatchStatistics,
} from '../types';
import { mulberry32 } from '../data/nameData';

type ChangeListener = (payload: { type: 'MATCH_UPDATE'; match: Match; events: MatchEvent[] }) => void;

const listeners = new Set<ChangeListener>();
export function onLiveUpdate(listener: ChangeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const rand = mulberry32(Date.now() & 0xffffffff);

const FORMATIONS = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1'];

function pickFormationSlots(formation: string, squad: Player[]): { startXI: LineupSlot[]; bench: LineupSlot[] } {
  const gks = squad.filter((p) => p.position === 'GK');
  const dfs = squad.filter((p) => p.position === 'DF');
  const mfs = squad.filter((p) => p.position === 'MF');
  const fws = squad.filter((p) => p.position === 'FW');

  const counts: Record<string, [number, number, number]> = {
    '4-3-3': [4, 3, 3],
    '4-4-2': [4, 4, 2],
    '3-5-2': [3, 5, 2],
    '4-2-3-1': [4, 4, 1],
  };
  const [dCount, mCount, fCount] = counts[formation] ?? [4, 3, 3];

  const chosenGK = gks.slice(0, 1);
  const chosenDF = dfs.slice(0, dCount);
  const chosenMF = mfs.slice(0, mCount);
  const chosenFW = fws.slice(0, fCount);
  const starters = [...chosenGK, ...chosenDF, ...chosenMF, ...chosenFW];
  const starterIds = new Set(starters.map((p) => p.id));
  const bench = squad.filter((p) => !starterIds.has(p.id)).slice(0, 9);

  const toSlot = (p: Player, idx: number): LineupSlot => ({
    playerId: p.id,
    position: p.position,
    shirtNumber: p.shirtNumber,
    isCaptain: idx === 6 % Math.max(starters.length, 1),
  });

  return {
    startXI: starters.map(toSlot),
    bench: bench.map((p, idx) => toSlot(p, idx + 100)),
  };
}

function zeroStats(matchId: string, teamId: string): TeamMatchStatistics {
  return {
    matchId,
    teamId,
    possessionPct: 50,
    shotsTotal: 0,
    shotsOnTarget: 0,
    corners: 0,
    fouls: 0,
    offsides: 0,
    yellowCards: 0,
    redCards: 0,
    passes: 0,
    passAccuracyPct: 80,
    saves: 0,
  };
}

export function ensureMatchAssets(match: Match): void {
  if (db.lineupsFor(match.id).length === 0) {
    const homeSquad = db.squadFor(match.homeTeamId);
    const awaySquad = db.squadFor(match.awayTeamId);
    const homeFormation = FORMATIONS[Math.floor(rand() * FORMATIONS.length)];
    const awayFormation = FORMATIONS[Math.floor(rand() * FORMATIONS.length)];
    const home = pickFormationSlots(homeFormation, homeSquad);
    const away = pickFormationSlots(awayFormation, awaySquad);
    const homeTeam = db.teams.get(match.homeTeamId)!;
    const awayTeam = db.teams.get(match.awayTeamId)!;
    const lineups: TeamLineup[] = [
      { matchId: match.id, teamId: match.homeTeamId, formation: homeFormation, ...home, coachId: homeTeam.coachId },
      { matchId: match.id, teamId: match.awayTeamId, formation: awayFormation, ...away, coachId: awayTeam.coachId },
    ];
    db.setLineups(match.id, lineups);
  }
  if (db.statsFor(match.id).length === 0) {
    db.setStats(match.id, [zeroStats(match.id, match.homeTeamId), zeroStats(match.id, match.awayTeamId)]);
  }
}

function pushEvent(match: Match, type: MatchEventType, teamId: string | null, playerId: string | null, relatedPlayerId: string | null, detail: string): MatchEvent {
  const event: MatchEvent = {
    id: uuid(),
    matchId: match.id,
    minute: match.minute,
    addedTime: match.addedTime,
    type,
    teamId,
    playerId,
    relatedPlayerId,
    detail,
    timestamp: DateTime.utc().toISO()!,
  };
  db.addEvent(match.id, event);
  return event;
}

function randomStarter(matchId: string, teamId: string): LineupSlot | undefined {
  const lineup = db.lineupsFor(matchId).find((l) => l.teamId === teamId);
  if (!lineup || lineup.startXI.length === 0) return undefined;
  return lineup.startXI[Math.floor(rand() * lineup.startXI.length)];
}

function applyGoal(match: Match, teamId: string): MatchEvent[] {
  const isHome = teamId === match.homeTeamId;
  if (isHome) match.score.home += 1;
  else match.score.away += 1;
  const scorer = randomStarter(match.id, teamId);
  const assistCandidate = randomStarter(match.id, teamId);
  const events = [pushEvent(match, 'GOAL', teamId, scorer?.playerId ?? null, assistCandidate?.playerId ?? null, 'Goal!')];
  const stats = db.statsFor(match.id);
  const teamStats = stats.find((s) => s.teamId === teamId);
  if (teamStats) {
    teamStats.shotsTotal += 1;
    teamStats.shotsOnTarget += 1;
  }
  return events;
}

function finalizeStandings(match: Match): void {
  const entries = db.standingsFor(match.leagueId);
  const home = entries.find((e) => e.teamId === match.homeTeamId);
  const away = entries.find((e) => e.teamId === match.awayTeamId);
  if (!home || !away) return;
  home.played += 1;
  away.played += 1;
  home.goalsFor += match.score.home;
  home.goalsAgainst += match.score.away;
  away.goalsFor += match.score.away;
  away.goalsAgainst += match.score.home;
  home.goalDifference = home.goalsFor - home.goalsAgainst;
  away.goalDifference = away.goalsFor - away.goalsAgainst;

  if (match.score.home > match.score.away) {
    home.win += 1; home.points += 3; home.form.push('W');
    away.loss += 1; away.form.push('L');
  } else if (match.score.home < match.score.away) {
    away.win += 1; away.points += 3; away.form.push('W');
    home.loss += 1; home.form.push('L');
  } else {
    home.draw += 1; home.points += 1; home.form.push('D');
    away.draw += 1; away.points += 1; away.form.push('D');
  }
  home.form = home.form.slice(-5);
  away.form = away.form.slice(-5);

  const resorted = entries
    .slice()
    .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor);
  resorted.forEach((e, idx) => (e.rank = idx + 1));
  db.standings.set(match.leagueId, resorted);
}

function spawnNextFixture(finished: Match): void {
  const now = DateTime.utc();
  const nextKickoff = now.plus({ minutes: 5 });
  const nextMatch: Match = {
    id: `mt-${finished.leagueId}-${uuid().slice(0, 8)}`,
    leagueId: finished.leagueId,
    season: finished.season,
    round: `Matchday ${25 + Math.floor(rand() * 10)}`,
    homeTeamId: finished.awayTeamId,
    awayTeamId: finished.homeTeamId,
    kickoffUTC: nextKickoff.toISO()!,
    venue: finished.venue,
    status: 'SCHEDULED',
    minute: 0,
    addedTime: 0,
    score: { home: 0, away: 0 },
    halfTimeScore: { home: 0, away: 0 },
  };
  db.matches.set(nextMatch.id, nextMatch);
}

function advanceLiveMatch(match: Match): MatchEvent[] {
  ensureMatchAssets(match);
  const events: MatchEvent[] = [];

  if (match.status === 'HT') {
    match.status = 'LIVE';
    match.minute = 46;
    events.push(pushEvent(match, 'KICK_OFF', null, null, null, 'Second half underway'));
    return events;
  }

  match.minute += 1;

  const stats = db.statsFor(match.id);
  for (const s of stats) {
    if (rand() > 0.6) s.passes += 3 + Math.floor(rand() * 6);
    if (rand() > 0.85) s.fouls += 1;
    if (rand() > 0.9) s.corners += 1;
    if (rand() > 0.93) { s.shotsTotal += 1; if (rand() > 0.5) s.shotsOnTarget += 1; }
  }
  const home = stats.find((s) => s.teamId === match.homeTeamId);
  const away = stats.find((s) => s.teamId === match.awayTeamId);
  if (home && away) {
    const drift = (rand() - 0.5) * 4;
    home.possessionPct = Math.min(70, Math.max(30, Math.round(home.possessionPct + drift)));
    away.possessionPct = 100 - home.possessionPct;
  }

  const roll = rand();
  if (roll > 0.965) {
    const scoringTeam = rand() > 0.5 ? match.homeTeamId : match.awayTeamId;
    events.push(...applyGoal(match, scoringTeam));
  } else if (roll > 0.92) {
    const teamId = rand() > 0.5 ? match.homeTeamId : match.awayTeamId;
    const player = randomStarter(match.id, teamId);
    const s = stats.find((st) => st.teamId === teamId);
    if (s) s.yellowCards += 1;
    events.push(pushEvent(match, 'YELLOW_CARD', teamId, player?.playerId ?? null, null, 'Booking for a tactical foul'));
  } else if (roll > 0.9 && (match.minute === 60 || match.minute === 70 || match.minute === 80)) {
    const teamId = rand() > 0.5 ? match.homeTeamId : match.awayTeamId;
    const lineup = db.lineupsFor(match.id).find((l) => l.teamId === teamId);
    if (lineup && lineup.bench.length > 0) {
      const outIdx = Math.floor(rand() * lineup.startXI.length);
      const playerOut = lineup.startXI[outIdx];
      const playerIn = lineup.bench.shift()!;
      lineup.startXI[outIdx] = playerIn;
      lineup.bench.push(playerOut);
      events.push(pushEvent(match, 'SUBSTITUTION', teamId, playerIn.playerId, playerOut.playerId, 'Tactical substitution'));
    }
  }

  if (match.minute === 45 && match.status === 'LIVE') {
    match.halfTimeScore = { ...match.score };
    match.status = 'HT';
    events.push(pushEvent(match, 'HALF_TIME', null, null, null, 'Half-time'));
  } else if (match.minute >= 90 + match.addedTime) {
    if (match.addedTime === 0 && match.minute === 90) {
      match.addedTime = 1 + Math.floor(rand() * 5);
    } else {
      match.status = 'FT';
      events.push(pushEvent(match, 'FULL_TIME', null, null, null, 'Full-time'));
      finalizeStandings(match);
      spawnNextFixture(match);
    }
  }

  return events;
}

function promoteScheduledMatches(): void {
  const now = DateTime.utc();
  for (const match of db.matches.values()) {
    if (match.status === 'SCHEDULED' && DateTime.fromISO(match.kickoffUTC) <= now) {
      match.status = 'LIVE';
      match.minute = 0;
      ensureMatchAssets(match);
      pushEvent(match, 'KICK_OFF', null, null, null, 'Kick-off');
    }
  }
}

export function tick(): void {
  promoteScheduledMatches();
  for (const match of db.matches.values()) {
    if (match.status === 'LIVE' || match.status === 'HT') {
      const events = advanceLiveMatch(match);
      db.bumpVersion();
      if (events.length > 0) {
        for (const listener of listeners) listener({ type: 'MATCH_UPDATE', match, events });
      }
    }
  }
}

let intervalHandle: ReturnType<typeof setInterval> | null = null;

export function startMatchSimulator(intervalMs: number): void {
  if (intervalHandle) return;
  for (const match of db.matches.values()) ensureMatchAssets(match);
  intervalHandle = setInterval(tick, intervalMs);
  if (typeof intervalHandle.unref === 'function') intervalHandle.unref();
}

export function stopMatchSimulator(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
