import {
  Coach,
  Injury,
  League,
  Match,
  MatchEvent,
  NewsArticle,
  OddsSnapshot,
  Player,
  StandingsEntry,
  Team,
  TeamLineup,
  TeamMatchStatistics,
  Transfer,
} from '../types';
import { buildSeedBundle } from '../data/seed';
import { CompetitionCatalogEntry } from '../data/coverageRegistry';

class InMemoryDatabase {
  leagues: Map<string, League> = new Map();
  teams: Map<string, Team> = new Map();
  players: Map<string, Player> = new Map();
  coaches: Map<string, Coach> = new Map();
  matches: Map<string, Match> = new Map();
  matchEvents: Map<string, MatchEvent[]> = new Map(); // matchId -> events
  lineups: Map<string, TeamLineup[]> = new Map(); // matchId -> [home, away]
  statistics: Map<string, TeamMatchStatistics[]> = new Map(); // matchId -> [home, away]
  standings: Map<string, StandingsEntry[]> = new Map(); // leagueId -> entries
  transfers: Transfer[] = [];
  injuries: Injury[] = [];
  news: NewsArticle[] = [];
  odds: Map<string, OddsSnapshot[]> = new Map(); // matchId -> snapshots
  competitionCatalog: CompetitionCatalogEntry[] = [];

  private version = 0;

  constructor() {
    this.reload();
  }

  reload(): void {
    const bundle = buildSeedBundle();
    this.leagues = new Map(bundle.leagues.map((l) => [l.id, l]));
    this.teams = new Map(bundle.teams.map((t) => [t.id, t]));
    this.players = new Map(bundle.players.map((p) => [p.id, p]));
    this.coaches = new Map(bundle.coaches.map((c) => [c.id, c]));
    this.matches = new Map(bundle.matches.map((m) => [m.id, m]));
    this.transfers = bundle.transfers;
    this.injuries = bundle.injuries;
    this.news = bundle.news;
    this.competitionCatalog = bundle.competitionCatalog;

    this.standings = new Map();
    for (const league of bundle.leagues) {
      this.standings.set(
        league.id,
        bundle.standings.filter((s) => s.leagueId === league.id),
      );
    }

    this.matchEvents = new Map();
    this.lineups = new Map();
    this.statistics = new Map();
    this.odds = new Map();
    this.version++;
  }

  bumpVersion(): number {
    return ++this.version;
  }

  getVersion(): number {
    return this.version;
  }

  listMatches(filter?: { leagueId?: string; status?: string; teamId?: string }): Match[] {
    let all = Array.from(this.matches.values());
    if (filter?.leagueId) all = all.filter((m) => m.leagueId === filter.leagueId);
    if (filter?.status) all = all.filter((m) => m.status === filter.status);
    if (filter?.teamId) all = all.filter((m) => m.homeTeamId === filter.teamId || m.awayTeamId === filter.teamId);
    return all.sort((a, b) => a.kickoffUTC.localeCompare(b.kickoffUTC));
  }

  listLiveMatches(): Match[] {
    return this.listMatches({ status: 'LIVE' });
  }

  eventsFor(matchId: string): MatchEvent[] {
    return this.matchEvents.get(matchId) ?? [];
  }

  addEvent(matchId: string, event: MatchEvent): void {
    const list = this.matchEvents.get(matchId) ?? [];
    list.push(event);
    this.matchEvents.set(matchId, list);
  }

  lineupsFor(matchId: string): TeamLineup[] {
    return this.lineups.get(matchId) ?? [];
  }

  setLineups(matchId: string, lineups: TeamLineup[]): void {
    this.lineups.set(matchId, lineups);
  }

  statsFor(matchId: string): TeamMatchStatistics[] {
    return this.statistics.get(matchId) ?? [];
  }

  setStats(matchId: string, stats: TeamMatchStatistics[]): void {
    this.statistics.set(matchId, stats);
  }

  standingsFor(leagueId: string): StandingsEntry[] {
    return (this.standings.get(leagueId) ?? []).slice().sort((a, b) => a.rank - b.rank);
  }

  oddsFor(matchId: string): OddsSnapshot[] {
    return this.odds.get(matchId) ?? [];
  }

  addOdds(matchId: string, snapshot: OddsSnapshot): void {
    const list = this.odds.get(matchId) ?? [];
    list.push(snapshot);
    this.odds.set(matchId, list);
  }

  squadFor(teamId: string): Player[] {
    return Array.from(this.players.values()).filter((p) => p.teamId === teamId);
  }

  transfersForPlayer(playerId: string): Transfer[] {
    return this.transfers.filter((t) => t.playerId === playerId);
  }

  injuriesForTeam(teamId: string): Injury[] {
    return this.injuries.filter((i) => i.teamId === teamId);
  }
}

export const db = new InMemoryDatabase();
export type { InMemoryDatabase };
