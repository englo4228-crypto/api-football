import { Router } from 'express';
import { listNews } from '../services/newsService';
import { localize } from '../middleware/requestContext';

export const newsRouter = Router();

/** News: articles tagged to teams, leagues, and players, newest first. */
newsRouter.get('/', (req, res) => {
  const { teamId, leagueId, playerId, query, limit } = req.query as Record<string, string | undefined>;
  const articles = listNews({ teamId, leagueId, playerId, query, limit: limit ? Number(limit) : undefined });
  res.json({
    count: articles.length,
    articles: articles.map((a) => ({
      id: a.id,
      title: localize(a.title, req.lang),
      summary: localize(a.summary, req.lang),
      source: a.source,
      publishedAt: a.publishedAt,
      tags: a.tags,
    })),
  });
});
