// Deterministic name pools used to synthesize realistic-looking squads without
// pulling in an external "faker" dependency or hand-authoring hundreds of records.

export const FIRST_NAMES = [
  'Lucas', 'Mateo', 'Noah', 'Liam', 'Diego', 'Marco', 'Hugo', 'Leon', 'Mikael', 'Rafael',
  'Kwame', 'Idris', 'Youssef', 'Amara', 'Kofi', 'Sadio', 'Victor', 'Bruno', 'Andre', 'Felix',
  'Ivan', 'Pavel', 'Dmitri', 'Erik', 'Anders', 'Jonas', 'Karim', 'Omar', 'Tariq', 'Reza',
  'Kenji', 'Haruto', 'Min-jun', 'Wei', 'Arjun', 'Rohan', 'Carlos', 'Pedro', 'Santiago', 'Emiliano',
  'James', 'Harry', 'Oliver', 'Jack', 'George', 'Callum', 'Declan', 'Mason', 'Tyrone', 'Reece',
] as const;

export const LAST_NAMES = [
  'Silva', 'Fernandez', 'Rossi', 'Muller', 'Schmidt', 'Dubois', 'Martin', 'Garcia', 'Lopez', 'Costa',
  'Okafor', 'Mensah', 'Diallo', 'Toure', 'Nkomo', 'Ibrahim', 'Hassan', 'Novak', 'Kowalski', 'Petrov',
  'Andersson', 'Johansson', 'Nielsen', 'Kim', 'Tanaka', 'Sato', 'Sharma', 'Patel', 'Alvarez', 'Torres',
  'Moreno', 'Romero', 'Vidal', 'Neves', 'Almeida', 'Barros', 'Souza', 'Weber', 'Becker', 'Hofmann',
  'Smith', 'Walker', 'Bennett', 'Foster', 'Hughes', 'Clarke', 'Reid', 'Marsh', 'Palmer', 'Stone',
] as const;

export const NATIONALITIES = [
  'England', 'Spain', 'Italy', 'Germany', 'France', 'Portugal', 'Brazil', 'Argentina', 'Netherlands',
  'Belgium', 'Croatia', 'Senegal', 'Nigeria', 'Ghana', 'Ivory Coast', 'Morocco', 'Egypt', 'Japan',
  'South Korea', 'United States', 'Uruguay', 'Colombia', 'Poland', 'Serbia', 'Sweden', 'Denmark', 'Norway',
] as const;

export function nameAt(seedIndex: number): string {
  const first = FIRST_NAMES[seedIndex % FIRST_NAMES.length];
  const last = LAST_NAMES[(seedIndex * 7 + 3) % LAST_NAMES.length];
  return `${first} ${last}`;
}

export function nationalityAt(seedIndex: number): string {
  return NATIONALITIES[(seedIndex * 5 + 1) % NATIONALITIES.length];
}

/** Small, seedable PRNG (mulberry32) so generated stats are stable across runs. */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
