import { db } from '../store/db';
import { NewsArticle } from '../types';

export interface NewsFilter {
  teamId?: string;
  leagueId?: string;
  playerId?: string;
  query?: string;
  limit?: number;
}

export function listNews(filter: NewsFilter): NewsArticle[] {
  let results = db.news.slice().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  if (filter.teamId) results = results.filter((n) => n.tags.teamIds.includes(filter.teamId!));
  if (filter.leagueId) results = results.filter((n) => n.tags.leagueIds.includes(filter.leagueId!));
  if (filter.playerId) results = results.filter((n) => n.tags.playerIds.includes(filter.playerId!));
  if (filter.query) {
    const q = filter.query.toLowerCase();
    results = results.filter(
      (n) => n.title.en.toLowerCase().includes(q) || n.summary.en.toLowerCase().includes(q) || n.body.en.toLowerCase().includes(q),
    );
  }

  return results.slice(0, filter.limit ?? 20);
}
