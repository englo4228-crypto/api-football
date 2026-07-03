import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestContext, supportedLanguages } from './middleware/requestContext';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { liveScoresRouter } from './routes/liveScores.routes';
import { matchesRouter } from './routes/matches.routes';
import { leaguesRouter } from './routes/leagues.routes';
import { teamsRouter } from './routes/teams.routes';
import { playersRouter } from './routes/players.routes';
import { coachesRouter } from './routes/coaches.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { newsRouter } from './routes/news.routes';

export function createApp(): Express {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(requestContext);

  app.get('/', (_req, res) => {
    res.json({
      name: 'api-football',
      description: 'Real-time football data API — live scores, events, lineups, statistics, standings, player/team insight, betting analytics, and news.',
      supportedLanguages: supportedLanguages(),
      defaultTimezone: process.env.DEFAULT_TIMEZONE || 'UTC',
      liveRefreshIntervalMs: Number(process.env.LIVE_TICK_INTERVAL_MS ?? 15000),
      documentation: '/api',
    });
  });

  app.get('/health', (_req, res) => res.json({ status: 'ok', uptimeSeconds: process.uptime() }));

  app.get('/api', (_req, res) => {
    res.json({
      liveScores: '/api/live-scores',
      matches: '/api/matches',
      matchEvents: '/api/matches/:id/events',
      lineups: '/api/matches/:id/lineups',
      statistics: '/api/matches/:id/statistics',
      leagues: '/api/leagues',
      leagueCoverage: '/api/leagues/coverage',
      standings: '/api/leagues/:id/standings',
      topScorers: '/api/leagues/:id/top-scorers',
      teams: '/api/teams',
      squads: '/api/teams/:id/squad',
      injuries: '/api/teams/:id/injuries',
      players: '/api/players',
      playerProfile: '/api/players/:id',
      transferHistory: '/api/players/:id/transfers',
      coaches: '/api/coaches/:id',
      preMatchOdds: '/api/matches/:id/odds/pre-match',
      liveOdds: '/api/matches/:id/odds/live',
      predictions: '/api/matches/:id/predictions',
      headToHead: '/api/head-to-head?teamA=&teamB=',
      news: '/api/news',
      websocket: 'ws(s)://<host>/live',
      queryParams: { lang: supportedLanguages(), tz: 'Any IANA timezone, e.g. America/New_York' },
    });
  });

  app.use('/api/live-scores', liveScoresRouter);
  app.use('/api/matches', matchesRouter);
  app.use('/api/leagues', leaguesRouter);
  app.use('/api/teams', teamsRouter);
  app.use('/api/players', playersRouter);
  app.use('/api/coaches', coachesRouter);
  app.use('/api/news', newsRouter);
  app.use('/api', analyticsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
