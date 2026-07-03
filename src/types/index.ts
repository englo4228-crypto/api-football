export type LangCode = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'it' | 'ar' | 'hi';

export interface LocalizedText {
  en: string;
  [lang: string]: string | undefined;
}

export type MatchStatus =
  | 'SCHEDULED'
  | 'LIVE'
  | 'HT'
  | 'FT'
  | 'POSTPONED'
  | 'CANCELLED';

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: LocalizedText;
}

export interface Coach {
  id: string;
  name: string;
  nationality: string;
  dateOfBirth: string; // ISO date
  currentTeamId: string | null;
  careerHistory: CoachStint[];
}

export interface CoachStint {
  teamId: string;
  from: string; // ISO date
  to: string | null; // null = present
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  trophies: string[];
}

export interface Venue {
  name: string;
  city: string;
  capacity: number;
}

export interface Team {
  id: string;
  name: LocalizedText;
  shortName: string;
  countryCode: string;
  founded: number;
  venue: Venue;
  coachId: string | null;
  crestUrl?: string;
}

export type PlayerPosition = 'GK' | 'DF' | 'MF' | 'FW';

export interface SeasonStatLine {
  season: string; // e.g. "2025/2026"
  teamId: string;
  competitionId: string;
  appearances: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
}

export interface Player {
  id: string;
  name: string;
  dateOfBirth: string;
  nationality: string;
  position: PlayerPosition;
  shirtNumber: number;
  teamId: string | null;
  heightCm: number;
  preferredFoot: 'Left' | 'Right' | 'Both';
  marketValueEUR: number;
  careerStats: SeasonStatLine[];
}

export interface Transfer {
  id: string;
  playerId: string;
  fromTeamId: string | null; // null = free agent / academy
  toTeamId: string;
  date: string; // ISO date
  feeEUR: number | null; // null = undisclosed
  type: 'Permanent' | 'Loan' | 'Free' | 'Loan Return';
  window: 'Summer' | 'Winter';
}

export type InjuryStatus = 'Out' | 'Doubtful' | 'Recovering' | 'Available';

export interface Injury {
  id: string;
  playerId: string;
  teamId: string;
  type: string; // e.g. "Hamstring Strain"
  status: InjuryStatus;
  startDate: string;
  expectedReturn: string | null;
}

export interface League {
  id: string;
  name: LocalizedText;
  countryCode: string;
  tier: number;
  season: string;
  numberOfTeams: number;
  confederation: 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'CAF' | 'AFC' | 'OFC';
}

export interface StandingsEntry {
  leagueId: string;
  teamId: string;
  played: number;
  win: number;
  draw: number;
  loss: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
  rank: number;
}

export interface MatchScore {
  home: number;
  away: number;
}

export interface Match {
  id: string;
  leagueId: string;
  season: string;
  round: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoffUTC: string; // ISO datetime
  venue: Venue;
  status: MatchStatus;
  minute: number;
  addedTime: number;
  score: MatchScore;
  halfTimeScore: MatchScore;
}

export type MatchEventType =
  | 'GOAL'
  | 'PENALTY_GOAL'
  | 'OWN_GOAL'
  | 'YELLOW_CARD'
  | 'SECOND_YELLOW'
  | 'RED_CARD'
  | 'SUBSTITUTION'
  | 'VAR_REVIEW'
  | 'KICK_OFF'
  | 'HALF_TIME'
  | 'FULL_TIME';

export interface MatchEvent {
  id: string;
  matchId: string;
  minute: number;
  addedTime: number;
  type: MatchEventType;
  teamId: string | null;
  playerId: string | null;
  relatedPlayerId: string | null; // assist provider or substitute coming on
  detail: string;
  timestamp: string;
}

export interface LineupSlot {
  playerId: string;
  position: PlayerPosition;
  shirtNumber: number;
  isCaptain: boolean;
}

export interface TeamLineup {
  matchId: string;
  teamId: string;
  formation: string; // e.g. "4-3-3"
  startXI: LineupSlot[];
  bench: LineupSlot[];
  coachId: string | null;
}

export interface TeamMatchStatistics {
  matchId: string;
  teamId: string;
  possessionPct: number;
  shotsTotal: number;
  shotsOnTarget: number;
  corners: number;
  fouls: number;
  offsides: number;
  yellowCards: number;
  redCards: number;
  passes: number;
  passAccuracyPct: number;
  saves: number;
}

export type OddsMarket = 'MATCH_WINNER' | 'OVER_UNDER_2_5' | 'BOTH_TEAMS_TO_SCORE';

export interface OddsSelection {
  name: string;
  price: number; // decimal odds
}

export interface OddsSnapshot {
  id: string;
  matchId: string;
  bookmaker: string;
  market: OddsMarket;
  selections: OddsSelection[];
  isLive: boolean;
  timestamp: string;
}

export interface Prediction {
  matchId: string;
  model: string;
  generatedAt: string;
  winProbability: { home: number; draw: number; away: number };
  expectedGoals: { home: number; away: number };
  bothTeamsToScoreProbability: number;
  over2_5GoalsProbability: number;
}

export interface HeadToHeadRecord {
  teamAId: string;
  teamBId: string;
  totalMatches: number;
  teamAWins: number;
  teamBWins: number;
  draws: number;
  lastMeetings: {
    matchId: string;
    date: string;
    score: MatchScore;
    leagueId: string;
  }[];
}

export interface NewsArticle {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  body: LocalizedText;
  source: string;
  publishedAt: string;
  tags: {
    teamIds: string[];
    leagueIds: string[];
    playerIds: string[];
  };
}
