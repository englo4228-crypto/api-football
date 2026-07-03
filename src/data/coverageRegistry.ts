// "Global Coverage" catalog: a searchable registry of competitions across the
// world's footballing nations. This is metadata-only (id/name/country/tier) —
// full live simulation (scores, events, lineups, odds) runs for the four
// CORE_LEAGUES seeded in coreLeagues.ts. The registry demonstrates that the
// data model and routes are country/competition-agnostic and scale to a
// large catalog; wiring a real vendor feed for any entry here is a data
// integration exercise, not an architectural one.

export interface CompetitionCatalogEntry {
  id: string;
  name: string;
  countryCode: string;
  country: string;
  confederation: 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'CAF' | 'AFC' | 'OFC';
  tier: number;
  hasLiveData: boolean; // true only for the seeded core leagues
}

interface CountrySeed {
  code: string;
  name: string;
  confederation: CompetitionCatalogEntry['confederation'];
}

// 210 national football associations, grouped by confederation.
const COUNTRIES: CountrySeed[] = [
  // UEFA (55)
  ...[
    ['GB', 'England'], ['ES', 'Spain'], ['IT', 'Italy'], ['DE', 'Germany'], ['FR', 'France'],
    ['PT', 'Portugal'], ['NL', 'Netherlands'], ['BE', 'Belgium'], ['TR', 'Turkey'], ['RU', 'Russia'],
    ['UA', 'Ukraine'], ['GR', 'Greece'], ['SCT', 'Scotland'], ['CH', 'Switzerland'], ['AT', 'Austria'],
    ['DK', 'Denmark'], ['SE', 'Sweden'], ['NO', 'Norway'], ['PL', 'Poland'], ['CZ', 'Czechia'],
    ['RO', 'Romania'], ['HR', 'Croatia'], ['RS', 'Serbia'], ['HU', 'Hungary'], ['IE', 'Ireland'],
    ['IL', 'Israel'], ['CY', 'Cyprus'], ['BG', 'Bulgaria'], ['SK', 'Slovakia'], ['SI', 'Slovenia'],
    ['FI', 'Finland'], ['IS', 'Iceland'], ['WAL', 'Wales'], ['NIR', 'Northern Ireland'], ['BA', 'Bosnia and Herzegovina'],
    ['AL', 'Albania'], ['MK', 'North Macedonia'], ['MD', 'Moldova'], ['LU', 'Luxembourg'], ['LV', 'Latvia'],
    ['LT', 'Lithuania'], ['EE', 'Estonia'], ['GE', 'Georgia'], ['AM', 'Armenia'], ['AZ', 'Azerbaijan'],
    ['KZ', 'Kazakhstan'], ['MT', 'Malta'], ['AD', 'Andorra'], ['SM', 'San Marino'], ['ME', 'Montenegro'],
    ['XK', 'Kosovo'], ['FO', 'Faroe Islands'], ['GI', 'Gibraltar'], ['LI', 'Liechtenstein'], ['MC', 'Monaco'],
  ].map(([code, name]) => ({ code, name, confederation: 'UEFA' as const })),
  // CONMEBOL (10)
  ...[
    ['BR', 'Brazil'], ['AR', 'Argentina'], ['UY', 'Uruguay'], ['CL', 'Chile'], ['CO', 'Colombia'],
    ['PE', 'Peru'], ['EC', 'Ecuador'], ['PY', 'Paraguay'], ['BO', 'Bolivia'], ['VE', 'Venezuela'],
  ].map(([code, name]) => ({ code, name, confederation: 'CONMEBOL' as const })),
  // CONCACAF (35)
  ...[
    ['US', 'United States'], ['MX', 'Mexico'], ['CA', 'Canada'], ['CR', 'Costa Rica'], ['JM', 'Jamaica'],
    ['HN', 'Honduras'], ['PA', 'Panama'], ['GT', 'Guatemala'], ['SV', 'El Salvador'], ['TT', 'Trinidad and Tobago'],
    ['CU', 'Cuba'], ['HT', 'Haiti'], ['NI', 'Nicaragua'], ['BZ', 'Belize'], ['GY', 'Guyana'],
    ['SR', 'Suriname'], ['BB', 'Barbados'], ['BS', 'Bahamas'], ['DO', 'Dominican Republic'], ['PR', 'Puerto Rico'],
    ['CW', 'Curacao'], ['AW', 'Aruba'], ['GP', 'Guadeloupe'], ['MQ', 'Martinique'], ['BM', 'Bermuda'],
    ['GD', 'Grenada'], ['LC', 'Saint Lucia'], ['VC', 'Saint Vincent and the Grenadines'], ['DM', 'Dominica'], ['KN', 'Saint Kitts and Nevis'],
    ['AG', 'Antigua and Barbuda'], ['VG', 'British Virgin Islands'], ['VI', 'US Virgin Islands'], ['AI', 'Anguilla'], ['KY', 'Cayman Islands'],
  ].map(([code, name]) => ({ code, name, confederation: 'CONCACAF' as const })),
  // CAF (54)
  ...[
    ['NG', 'Nigeria'], ['EG', 'Egypt'], ['MA', 'Morocco'], ['SN', 'Senegal'], ['ZA', 'South Africa'],
    ['GH', 'Ghana'], ['CI', 'Ivory Coast'], ['CM', 'Cameroon'], ['DZ', 'Algeria'], ['TN', 'Tunisia'],
    ['KE', 'Kenya'], ['UG', 'Uganda'], ['TZ', 'Tanzania'], ['ET', 'Ethiopia'], ['ZM', 'Zambia'],
    ['ZW', 'Zimbabwe'], ['AO', 'Angola'], ['MZ', 'Mozambique'], ['ML', 'Mali'], ['BF', 'Burkina Faso'],
    ['GN', 'Guinea'], ['BJ', 'Benin'], ['TG', 'Togo'], ['CD', 'DR Congo'], ['CG', 'Congo'],
    ['GA', 'Gabon'], ['CV', 'Cape Verde'], ['MR', 'Mauritania'], ['NE', 'Niger'], ['TD', 'Chad'],
    ['RW', 'Rwanda'], ['BI', 'Burundi'], ['SL', 'Sierra Leone'], ['LR', 'Liberia'], ['GM', 'Gambia'],
    ['GW', 'Guinea-Bissau'], ['NA', 'Namibia'], ['BW', 'Botswana'], ['LS', 'Lesotho'], ['SZ', 'Eswatini'],
    ['MW', 'Malawi'], ['MG', 'Madagascar'], ['MU', 'Mauritius'], ['SC', 'Seychelles'], ['KM', 'Comoros'],
    ['DJ', 'Djibouti'], ['SO', 'Somalia'], ['ER', 'Eritrea'], ['SS', 'South Sudan'], ['SD', 'Sudan'],
    ['LY', 'Libya'], ['CF', 'Central African Republic'], ['ST', 'Sao Tome and Principe'], ['GQ', 'Equatorial Guinea'],
  ].map(([code, name]) => ({ code, name, confederation: 'CAF' as const })),
  // AFC (47)
  ...[
    ['JP', 'Japan'], ['KR', 'South Korea'], ['AU', 'Australia'], ['SA', 'Saudi Arabia'], ['IR', 'Iran'],
    ['QA', 'Qatar'], ['AE', 'United Arab Emirates'], ['CN', 'China'], ['IQ', 'Iraq'], ['UZ', 'Uzbekistan'],
    ['IN', 'India'], ['TH', 'Thailand'], ['VN', 'Vietnam'], ['ID', 'Indonesia'], ['MY', 'Malaysia'],
    ['SG', 'Singapore'], ['PH', 'Philippines'], ['JO', 'Jordan'], ['LB', 'Lebanon'], ['SY', 'Syria'],
    ['KW', 'Kuwait'], ['BH', 'Bahrain'], ['OM', 'Oman'], ['YE', 'Yemen'], ['PK', 'Pakistan'],
    ['BD', 'Bangladesh'], ['LK', 'Sri Lanka'], ['NP', 'Nepal'], ['MM', 'Myanmar'], ['KH', 'Cambodia'],
    ['LA', 'Laos'], ['BN', 'Brunei'], ['TL', 'Timor-Leste'], ['MV', 'Maldives'], ['AF', 'Afghanistan'],
    ['TJ', 'Tajikistan'], ['TM', 'Turkmenistan'], ['KG', 'Kyrgyzstan'], ['MN', 'Mongolia'], ['HK', 'Hong Kong'],
    ['TW', 'Chinese Taipei'], ['MO', 'Macau'], ['PS', 'Palestine'], ['GU', 'Guam'], ['MP', 'Northern Mariana Islands'],
    ['BT', 'Bhutan'], ['KP', 'North Korea'],
  ].map(([code, name]) => ({ code, name, confederation: 'AFC' as const })),
  // OFC (9)
  ...[
    ['NZ', 'New Zealand'], ['FJ', 'Fiji'], ['PG', 'Papua New Guinea'], ['SB', 'Solomon Islands'], ['VU', 'Vanuatu'],
    ['NC', 'New Caledonia'], ['TO', 'Tonga'], ['TA', 'American Samoa'], ['CK', 'Cook Islands'],
  ].map(([code, name]) => ({ code, name, confederation: 'OFC' as const })),
];

const COMPETITION_TEMPLATES: { suffix: string; tier: number }[] = [
  { suffix: 'Premier Division', tier: 1 },
  { suffix: 'Second Division', tier: 2 },
  { suffix: 'National Cup', tier: 1 },
  { suffix: "Women's Premier League", tier: 1 },
  { suffix: 'U-21 Youth League', tier: 3 },
  { suffix: 'Super Cup', tier: 1 },
];

function buildCatalog(): CompetitionCatalogEntry[] {
  const entries: CompetitionCatalogEntry[] = [];
  for (const country of COUNTRIES) {
    for (const tpl of COMPETITION_TEMPLATES) {
      entries.push({
        id: `cat-${country.code.toLowerCase()}-${tpl.suffix.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: `${country.name} ${tpl.suffix}`,
        countryCode: country.code,
        country: country.name,
        confederation: country.confederation,
        tier: tpl.tier,
        hasLiveData: false,
      });
    }
  }
  return entries;
}

export const COMPETITION_CATALOG: CompetitionCatalogEntry[] = buildCatalog();

export function markCoreLeaguesAsLive(coreLeagueCountryCodes: string[]): void {
  for (const entry of COMPETITION_CATALOG) {
    if (coreLeagueCountryCodes.includes(entry.countryCode) && entry.tier === 1 && entry.name.endsWith('Premier Division')) {
      entry.hasLiveData = true;
    }
  }
}
