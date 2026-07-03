import { v4 as uuid } from 'uuid';
import { DateTime } from 'luxon';
import {
  Coach,
  Injury,
  League,
  Match,
  NewsArticle,
  Player,
  PlayerPosition,
  StandingsEntry,
  Team,
  Transfer,
} from '../types';
import { CORE_LEAGUES, CORE_TEAM_SEEDS, SEASON, buildTeams } from './coreLeagues';
import { mulberry32, nameAt, nationalityAt } from './nameData';
import { COMPETITION_CATALOG, markCoreLeaguesAsLive } from './coverageRegistry';

const rand = mulberry32(20260703);

const SQUAD_TEMPLATE: { position: PlayerPosition; count: number }[] = [
  { position: 'GK', count: 2 },
  { position: 'DF', count: 5 },
  { position: 'MF', count: 5 },
  { position: 'FW', count: 3 },
];

export interface SeedBundle {
  leagues: League[];
  teams: Team[];
  players: Player[];
  coaches: Coach[];
  matches: Match[];
  standings: StandingsEntry[];
  transfers: Transfer[];
  injuries: Injury[];
  news: NewsArticle[];
  competitionCatalog: typeof COMPETITION_CATALOG;
}

function buildCoaches(teams: Team[]): Coach[] {
  return teams.map((team, idx) => {
    const seedIdx = idx + 500;
    const startYear = 2019 + (idx % 5);
    return {
      id: `coach-${team.id}`,
      name: nameAt(seedIdx),
      nationality: nationalityAt(seedIdx),
      dateOfBirth: DateTime.fromObject({ year: 1968 + (idx % 20), month: 1 + (idx % 12), day: 1 + (idx % 27) }).toISODate()!,
      currentTeamId: team.id,
      careerHistory: [
        {
          teamId: team.id,
          from: `${startYear}-07-01`,
          to: null,
          matches: 40 + (idx % 60),
          wins: 20 + (idx % 20),
          draws: 8 + (idx % 6),
          losses: 6 + (idx % 10),
          trophies: idx % 3 === 0 ? ['Domestic Cup ' + (startYear + 1)] : [],
        },
      ],
    };
  });
}

function buildPlayersForTeam(team: Team, teamIndex: number, leagueId: string): Player[] {
  const players: Player[] = [];
  let shirt = 1;
  let seedIdx = teamIndex * 20;
  for (const group of SQUAD_TEMPLATE) {
    for (let i = 0; i < group.count; i++) {
      seedIdx++;
      const apps = 10 + Math.floor(rand() * 25);
      const goals = group.position === 'FW'
        ? Math.floor(rand() * 20)
        : group.position === 'MF'
          ? Math.floor(rand() * 10)
          : group.position === 'DF'
            ? Math.floor(rand() * 4)
            : 0;
      const assists = group.position === 'GK' ? 0 : Math.floor(rand() * 10);
      players.push({
        id: `pl-${team.id}-${shirt}`,
        name: nameAt(seedIdx),
        dateOfBirth: DateTime.fromObject({
          year: 1994 + Math.floor(rand() * 12),
          month: 1 + Math.floor(rand() * 12),
          day: 1 + Math.floor(rand() * 27),
        }).toISODate()!,
        nationality: nationalityAt(seedIdx),
        position: group.position,
        shirtNumber: shirt,
        teamId: team.id,
        heightCm: 170 + Math.floor(rand() * 25),
        preferredFoot: rand() > 0.8 ? 'Left' : rand() > 0.5 ? 'Right' : 'Both',
        marketValueEUR: Math.round((1 + rand() * 90) * 1_000_000),
        careerStats: [
          {
            season: SEASON,
            teamId: team.id,
            competitionId: leagueId,
            appearances: apps,
            goals,
            assists,
            yellowCards: Math.floor(rand() * 8),
            redCards: rand() > 0.92 ? 1 : 0,
            minutesPlayed: apps * (60 + Math.floor(rand() * 30)),
          },
        ],
      });
      shirt++;
    }
  }
  return players;
}

function buildStandingsBaseline(leagueId: string, teamIds: string[]): StandingsEntry[] {
  return teamIds
    .map((teamId, idx) => {
      const played = 18 + Math.floor(rand() * 4);
      const win = Math.floor(played * (0.3 + rand() * 0.4));
      const loss = Math.floor((played - win) * rand());
      const draw = played - win - loss;
      const goalsFor = win * 2 + draw + Math.floor(rand() * 10);
      const goalsAgainst = loss * 2 + Math.floor(rand() * 8);
      return {
        leagueId,
        teamId,
        played,
        win,
        draw,
        loss,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points: win * 3 + draw,
        form: Array.from({ length: 5 }, () => (['W', 'D', 'L'] as const)[Math.floor(rand() * 3)]),
        rank: idx + 1,
      };
    })
    .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
}

function buildMatchesForLeague(leagueId: string, teamIds: string[]): Match[] {
  const now = DateTime.utc();
  const matches: Match[] = [];
  const [teamA, teamB, teamC, teamD] = teamIds;

  // One match currently LIVE (kicked off 37 minutes ago).
  matches.push({
    id: `mt-${leagueId}-live`,
    leagueId,
    season: SEASON,
    round: 'Matchday 24',
    homeTeamId: teamA,
    awayTeamId: teamB,
    kickoffUTC: now.minus({ minutes: 37 }).toISO()!,
    venue: { name: 'Match Venue', city: 'Host City', capacity: 50000 },
    status: 'LIVE',
    minute: 37,
    addedTime: 0,
    score: { home: 1, away: 0 },
    halfTimeScore: { home: 0, away: 0 },
  });

  // One upcoming fixture.
  matches.push({
    id: `mt-${leagueId}-scheduled`,
    leagueId,
    season: SEASON,
    round: 'Matchday 24',
    homeTeamId: teamC,
    awayTeamId: teamD,
    kickoffUTC: now.plus({ hours: 3 }).toISO()!,
    venue: { name: 'Match Venue', city: 'Host City', capacity: 45000 },
    status: 'SCHEDULED',
    minute: 0,
    addedTime: 0,
    score: { home: 0, away: 0 },
    halfTimeScore: { home: 0, away: 0 },
  });

  // One completed fixture (for H2H / historical data).
  matches.push({
    id: `mt-${leagueId}-finished`,
    leagueId,
    season: SEASON,
    round: 'Matchday 23',
    homeTeamId: teamD,
    awayTeamId: teamA,
    kickoffUTC: now.minus({ days: 7 }).toISO()!,
    venue: { name: 'Match Venue', city: 'Host City', capacity: 48000 },
    status: 'FT',
    minute: 90,
    addedTime: 3,
    score: { home: 2, away: 2 },
    halfTimeScore: { home: 1, away: 1 },
  });

  return matches;
}

function buildTransfers(players: Player[], teams: Team[]): Transfer[] {
  const transfers: Transfer[] = [];
  players.slice(0, 12).forEach((player, idx) => {
    const fromTeam = teams[(idx + 3) % teams.length];
    if (fromTeam.id === player.teamId) return;
    transfers.push({
      id: uuid(),
      playerId: player.id,
      fromTeamId: fromTeam.id,
      toTeamId: player.teamId!,
      date: DateTime.utc().minus({ months: 6 + idx }).toISODate()!,
      feeEUR: idx % 4 === 0 ? null : Math.round((2 + rand() * 60) * 1_000_000),
      type: idx % 5 === 0 ? 'Loan' : idx % 7 === 0 ? 'Free' : 'Permanent',
      window: idx % 2 === 0 ? 'Summer' : 'Winter',
    });
  });
  return transfers;
}

function buildInjuries(players: Player[]): Injury[] {
  const injuryTypes = ['Hamstring Strain', 'ACL Tear', 'Ankle Sprain', 'Groin Injury', 'Concussion Protocol', 'Calf Strain'];
  const injuries: Injury[] = [];
  players.slice(0, 10).forEach((player, idx) => {
    const startDate = DateTime.utc().minus({ days: 5 + idx * 4 });
    const durationDays = 14 + idx * 6;
    const status = idx % 4 === 0 ? 'Doubtful' : idx % 3 === 0 ? 'Recovering' : 'Out';
    injuries.push({
      id: uuid(),
      playerId: player.id,
      teamId: player.teamId!,
      type: injuryTypes[idx % injuryTypes.length],
      status,
      startDate: startDate.toISODate()!,
      expectedReturn: status === 'Out' || status === 'Recovering' ? startDate.plus({ days: durationDays }).toISODate() : null,
    });
  });
  return injuries;
}

function buildNews(teams: Team[], leagues: League[]): NewsArticle[] {
  const headlines = [
    { title: 'Late winner sends title race to the wire', summary: 'A stoppage-time strike shakes up the top of the table.' },
    { title: 'Star forward returns from injury ahead of schedule', summary: 'Medical staff clear the striker for full training.' },
    { title: 'Manager praises squad depth after midweek rotation', summary: 'Rotation policy pays off with a clean sheet.' },
    { title: 'Transfer window: club closes in on marquee signing', summary: 'Fee reported to be a club-record deal.' },
    { title: 'Youth academy graduate earns first senior call-up', summary: 'The 18-year-old has impressed in reserve fixtures.' },
    { title: 'VAR review overturns contested penalty decision', summary: 'Officials review the incident for over three minutes.' },
  ];
  return headlines.map((h, idx) => {
    const team = teams[idx % teams.length];
    const league = leagues.find((l) => l.id === CORE_TEAM_SEEDS.find((t) => t.id === team.id)!.leagueId)!;
    return {
      id: uuid(),
      title: { en: h.title },
      summary: { en: h.summary },
      body: { en: `${h.summary} ${h.title} — full match reaction and analysis from ${team.name.en}.` },
      source: 'Football Wire Desk',
      publishedAt: DateTime.utc().minus({ hours: idx * 6 }).toISO()!,
      tags: { teamIds: [team.id], leagueIds: [league.id], playerIds: [] },
    };
  });
}

export function buildSeedBundle(): SeedBundle {
  const teams = buildTeams();
  const coaches = buildCoaches(teams);
  const players = teams.flatMap((team, idx) => {
    const leagueId = CORE_TEAM_SEEDS.find((t) => t.id === team.id)!.leagueId;
    return buildPlayersForTeam(team, idx, leagueId);
  });

  const matches: Match[] = [];
  const standings: StandingsEntry[] = [];
  for (const league of CORE_LEAGUES) {
    const teamIds = CORE_TEAM_SEEDS.filter((t) => t.leagueId === league.id).map((t) => t.id);
    matches.push(...buildMatchesForLeague(league.id, teamIds));
    standings.push(...buildStandingsBaseline(league.id, teamIds));
  }

  markCoreLeaguesAsLive(CORE_LEAGUES.map((l) => l.countryCode));

  return {
    leagues: CORE_LEAGUES,
    teams,
    players,
    coaches,
    matches,
    standings,
    transfers: buildTransfers(players, teams),
    injuries: buildInjuries(players),
    news: buildNews(teams, CORE_LEAGUES),
    competitionCatalog: COMPETITION_CATALOG,
  };
}
