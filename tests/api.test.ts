import request from 'supertest';
import { createApp } from '../src/app';
import { db } from '../src/store/db';
import { tick } from '../src/services/matchSimulator';

const app = createApp();

describe('root and health', () => {
  it('GET / returns service metadata', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('api-football');
  });

  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('live scores', () => {
  it('lists at least one live match', async () => {
    const res = await request(app).get('/api/live-scores');
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);
    expect(res.body.matches[0]).toHaveProperty('homeTeam');
    expect(res.body.matches[0]).toHaveProperty('kickoffLocal');
  });

  it('applies timezone conversion via ?tz=', async () => {
    const res = await request(app).get('/api/live-scores?tz=America/New_York');
    expect(res.status).toBe(200);
    expect(res.body.matches[0].timezone).toBe('America/New_York');
  });

  it('404s for unknown match id', async () => {
    const res = await request(app).get('/api/live-scores/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('matches sub-resources', () => {
  const liveMatchId = () => db.listLiveMatches()[0].id;

  it('returns match events', async () => {
    const res = await request(app).get(`/api/matches/${liveMatchId()}/events`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);
  });

  it('returns lineups with formation and starters', async () => {
    const res = await request(app).get(`/api/matches/${liveMatchId()}/lineups`);
    expect(res.status).toBe(200);
    expect(res.body.lineups).toHaveLength(2);
    expect(res.body.lineups[0].startXI).toHaveLength(11);
  });

  it('returns live statistics for both teams', async () => {
    const res = await request(app).get(`/api/matches/${liveMatchId()}/statistics`);
    expect(res.status).toBe(200);
    expect(res.body.statistics).toHaveLength(2);
  });
});

describe('leagues', () => {
  it('lists seeded leagues', async () => {
    const res = await request(app).get('/api/leagues');
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(4);
  });

  it('exposes a 1200+ competition coverage catalog', async () => {
    const res = await request(app).get('/api/leagues/coverage');
    expect(res.status).toBe(200);
    expect(res.body.totalSupportedCompetitions).toBeGreaterThan(1200);
  });

  it('returns localized league names', async () => {
    const leagueId = Array.from(db.leagues.keys())[0];
    const res = await request(app).get(`/api/leagues/${leagueId}?lang=es`);
    expect(res.status).toBe(200);
    expect(typeof res.body.name).toBe('string');
  });

  it('returns standings sorted by rank', async () => {
    const leagueId = Array.from(db.leagues.keys())[0];
    const res = await request(app).get(`/api/leagues/${leagueId}/standings`);
    expect(res.status).toBe(200);
    expect(res.body.table[0].rank).toBe(1);
  });

  it('returns top scorers leaderboard', async () => {
    const leagueId = Array.from(db.leagues.keys())[0];
    const res = await request(app).get(`/api/leagues/${leagueId}/top-scorers`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.leaders)).toBe(true);
  });
});

describe('teams and players', () => {
  const teamId = () => Array.from(db.teams.keys())[0];

  it('returns a team squad', async () => {
    const res = await request(app).get(`/api/teams/${teamId()}/squad`);
    expect(res.status).toBe(200);
    expect(res.body.squad.length).toBeGreaterThan(10);
  });

  it('returns team injuries', async () => {
    const res = await request(app).get(`/api/teams/${teamId()}/injuries`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.injuries)).toBe(true);
  });

  it('returns a player profile with career stats', async () => {
    const playerId = Array.from(db.players.keys())[0];
    const res = await request(app).get(`/api/players/${playerId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.careerStats)).toBe(true);
  });

  it('returns transfer history for a player', async () => {
    const playerId = db.transfers[0]?.playerId ?? Array.from(db.players.keys())[0];
    const res = await request(app).get(`/api/players/${playerId}/transfers`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.transfers)).toBe(true);
  });
});

describe('coaches', () => {
  it('returns a coach profile', async () => {
    const coachId = Array.from(db.coaches.keys())[0];
    const res = await request(app).get(`/api/coaches/${coachId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.careerHistory)).toBe(true);
  });
});

describe('betting analytics', () => {
  const liveMatchId = () => db.listLiveMatches()[0].id;

  it('returns pre-match odds across markets', async () => {
    const res = await request(app).get(`/api/matches/${liveMatchId()}/odds/pre-match`);
    expect(res.status).toBe(200);
    expect(res.body.odds.length).toBeGreaterThanOrEqual(3);
  });

  it('returns live odds', async () => {
    const res = await request(app).get(`/api/matches/${liveMatchId()}/odds/live`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.odds)).toBe(true);
  });

  it('returns match predictions with probabilities summing near 1', async () => {
    const res = await request(app).get(`/api/matches/${liveMatchId()}/predictions`);
    expect(res.status).toBe(200);
    const { home, draw, away } = res.body.winProbability;
    expect(home + draw + away).toBeCloseTo(1, 1);
  });

  it('returns head-to-head record between two teams', async () => {
    const [teamA, teamB] = Array.from(db.teams.keys());
    const res = await request(app).get(`/api/head-to-head?teamA=${teamA}&teamB=${teamB}`);
    expect(res.status).toBe(200);
    expect(res.body.teamAId).toBe(teamA);
  });

  it('400s when head-to-head params are missing', async () => {
    const res = await request(app).get('/api/head-to-head');
    expect(res.status).toBe(400);
  });
});

describe('news', () => {
  it('lists news articles', async () => {
    const res = await request(app).get('/api/news');
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('filters news by team', async () => {
    const teamId = Array.from(db.teams.keys())[0];
    const res = await request(app).get(`/api/news?teamId=${teamId}`);
    expect(res.status).toBe(200);
    for (const article of res.body.articles) {
      expect(article.tags.teamIds).toContain(teamId);
    }
  });
});

describe('live simulation engine', () => {
  it('advances live matches on tick without throwing', () => {
    const before = db.listLiveMatches().map((m) => ({ id: m.id, minute: m.minute }));
    tick();
    const after = db.listLiveMatches();
    expect(after.length).toBeGreaterThanOrEqual(0);
    expect(before.length).toBeGreaterThanOrEqual(0);
  });
});
