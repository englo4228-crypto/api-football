import { League, Team } from '../types';

export const SEASON = '2025/2026';

export const CORE_LEAGUES: League[] = [
  {
    id: 'lg-eng-pl',
    name: { en: 'Premier League', es: 'Premier League', fr: 'Premier League', de: 'Premier League', pt: 'Premier League', it: 'Premier League', ar: 'الدوري الإنجليزي الممتاز', hi: 'प्रीमियर लीग' },
    countryCode: 'GB',
    tier: 1,
    season: SEASON,
    numberOfTeams: 4,
    confederation: 'UEFA',
  },
  {
    id: 'lg-esp-laliga',
    name: { en: 'La Liga', es: 'La Liga', fr: 'Liga espagnole', de: 'La Liga', pt: 'La Liga', it: 'Liga spagnola', ar: 'الدوري الإسباني', hi: 'ला लीगा' },
    countryCode: 'ES',
    tier: 1,
    season: SEASON,
    numberOfTeams: 4,
    confederation: 'UEFA',
  },
  {
    id: 'lg-ita-seriea',
    name: { en: 'Serie A', es: 'Serie A', fr: 'Serie A', de: 'Serie A', pt: 'Serie A', it: 'Serie A', ar: 'الدوري الإيطالي', hi: 'सीरी ए' },
    countryCode: 'IT',
    tier: 1,
    season: SEASON,
    numberOfTeams: 4,
    confederation: 'UEFA',
  },
  {
    id: 'lg-ger-bundesliga',
    name: { en: 'Bundesliga', es: 'Bundesliga', fr: 'Bundesliga', de: 'Bundesliga', pt: 'Bundesliga', it: 'Bundesliga', ar: 'الدوري الألماني', hi: 'बुंडेसलीगा' },
    countryCode: 'DE',
    tier: 1,
    season: SEASON,
    numberOfTeams: 4,
    confederation: 'UEFA',
  },
];

interface TeamSeed {
  id: string;
  leagueId: string;
  name: string;
  shortName: string;
  city: string;
  founded: number;
  capacity: number;
}

export const CORE_TEAM_SEEDS: TeamSeed[] = [
  // Premier League
  { id: 'tm-eng-01', leagueId: 'lg-eng-pl', name: 'North London Rangers', shortName: 'NLR', city: 'London', founded: 1892, capacity: 60704 },
  { id: 'tm-eng-02', leagueId: 'lg-eng-pl', name: 'Manchester Ironsides', shortName: 'MCI', city: 'Manchester', founded: 1880, capacity: 55097 },
  { id: 'tm-eng-03', leagueId: 'lg-eng-pl', name: 'Merseyside Reds', shortName: 'MSR', city: 'Liverpool', founded: 1892, capacity: 61276 },
  { id: 'tm-eng-04', leagueId: 'lg-eng-pl', name: 'West Coast Albion', shortName: 'WCA', city: 'Birmingham', founded: 1874, capacity: 42785 },
  // La Liga
  { id: 'tm-esp-01', leagueId: 'lg-esp-laliga', name: 'Real Capital CF', shortName: 'RCC', city: 'Madrid', founded: 1902, capacity: 81044 },
  { id: 'tm-esp-02', leagueId: 'lg-esp-laliga', name: 'Blaugrana Barcelona', shortName: 'BLB', city: 'Barcelona', founded: 1899, capacity: 47500 },
  { id: 'tm-esp-03', leagueId: 'lg-esp-laliga', name: 'Atletico Metropolitano', shortName: 'ATM', city: 'Madrid', founded: 1903, capacity: 68456 },
  { id: 'tm-esp-04', leagueId: 'lg-esp-laliga', name: 'Andalucia Sevilla FC', shortName: 'AND', city: 'Seville', founded: 1890, capacity: 43883 },
  // Serie A
  { id: 'tm-ita-01', leagueId: 'lg-ita-seriea', name: 'Milano Nerazzurri', shortName: 'MNZ', city: 'Milan', founded: 1908, capacity: 75923 },
  { id: 'tm-ita-02', leagueId: 'lg-ita-seriea', name: 'Milano Rossoneri', shortName: 'MRN', city: 'Milan', founded: 1899, capacity: 75923 },
  { id: 'tm-ita-03', leagueId: 'lg-ita-seriea', name: 'Torino Vecchia Signora', shortName: 'TVS', city: 'Turin', founded: 1897, capacity: 41507 },
  { id: 'tm-ita-04', leagueId: 'lg-ita-seriea', name: 'Napoli Azzurri', shortName: 'NAP', city: 'Naples', founded: 1926, capacity: 54726 },
  // Bundesliga
  { id: 'tm-ger-01', leagueId: 'lg-ger-bundesliga', name: 'Bavarian Munich SC', shortName: 'BAY', city: 'Munich', founded: 1900, capacity: 75024 },
  { id: 'tm-ger-02', leagueId: 'lg-ger-bundesliga', name: 'Ruhr Valley BVB', shortName: 'RVB', city: 'Dortmund', founded: 1909, capacity: 81365 },
  { id: 'tm-ger-03', leagueId: 'lg-ger-bundesliga', name: 'Rhein Leverkusen', shortName: 'RHL', city: 'Leverkusen', founded: 1904, capacity: 30210 },
  { id: 'tm-ger-04', leagueId: 'lg-ger-bundesliga', name: 'Hanseatic Hamburg SV', shortName: 'HHS', city: 'Hamburg', founded: 1887, capacity: 57000 },
];

export function buildTeams(): Team[] {
  return CORE_TEAM_SEEDS.map((seed, idx) => ({
    id: seed.id,
    name: { en: seed.name },
    shortName: seed.shortName,
    countryCode: CORE_LEAGUES.find((l) => l.id === seed.leagueId)!.countryCode,
    founded: seed.founded,
    venue: { name: `${seed.name} Stadium`, city: seed.city, capacity: seed.capacity },
    coachId: `coach-${seed.id}`,
    crestUrl: `https://example.com/crests/${seed.id}.png`,
  }));
}
