import { db } from '../store/db';
import { HeadToHeadRecord } from '../types';

export function getHeadToHead(teamAId: string, teamBId: string): HeadToHeadRecord {
  const meetings = Array.from(db.matches.values())
    .filter(
      (m) =>
        m.status === 'FT' &&
        ((m.homeTeamId === teamAId && m.awayTeamId === teamBId) ||
          (m.homeTeamId === teamBId && m.awayTeamId === teamAId)),
    )
    .sort((a, b) => b.kickoffUTC.localeCompare(a.kickoffUTC));

  let teamAWins = 0;
  let teamBWins = 0;
  let draws = 0;

  for (const m of meetings) {
    const aIsHome = m.homeTeamId === teamAId;
    const aGoals = aIsHome ? m.score.home : m.score.away;
    const bGoals = aIsHome ? m.score.away : m.score.home;
    if (aGoals > bGoals) teamAWins += 1;
    else if (bGoals > aGoals) teamBWins += 1;
    else draws += 1;
  }

  return {
    teamAId,
    teamBId,
    totalMatches: meetings.length,
    teamAWins,
    teamBWins,
    draws,
    lastMeetings: meetings.slice(0, 10).map((m) => ({
      matchId: m.id,
      date: m.kickoffUTC,
      score: m.score,
      leagueId: m.leagueId,
    })),
  };
}
