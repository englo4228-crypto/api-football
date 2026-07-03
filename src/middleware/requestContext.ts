import { NextFunction, Request, Response } from 'express';
import { DateTime } from 'luxon';
import { LangCode, LocalizedText } from '../types';

const SUPPORTED_LANGUAGES: LangCode[] = ['en', 'es', 'fr', 'de', 'pt', 'it', 'ar', 'hi'];
const DEFAULT_LANGUAGE = (process.env.DEFAULT_LANGUAGE as LangCode) || 'en';
const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || 'UTC';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      lang: LangCode;
      timezone: string;
    }
  }
}

function resolveLanguage(req: Request): LangCode {
  const queryLang = (req.query.lang as string | undefined)?.toLowerCase();
  if (queryLang && SUPPORTED_LANGUAGES.includes(queryLang as LangCode)) return queryLang as LangCode;

  const header = req.headers['accept-language'];
  if (header) {
    const preferred = header.split(',')[0]?.split('-')[0]?.toLowerCase();
    if (preferred && SUPPORTED_LANGUAGES.includes(preferred as LangCode)) return preferred as LangCode;
  }
  return DEFAULT_LANGUAGE;
}

function resolveTimezone(req: Request): string {
  const queryTz = req.query.tz as string | undefined;
  if (queryTz && DateTime.local().setZone(queryTz).isValid) return queryTz;
  return DEFAULT_TIMEZONE;
}

export function requestContext(req: Request, _res: Response, next: NextFunction): void {
  req.lang = resolveLanguage(req);
  req.timezone = resolveTimezone(req);
  next();
}

export function localize(text: LocalizedText, lang: LangCode): string {
  return text[lang] ?? text.en;
}

export function toLocalTime(isoUTC: string, timezone: string): string {
  const dt = DateTime.fromISO(isoUTC, { zone: 'utc' }).setZone(timezone);
  return dt.isValid ? dt.toISO()! : isoUTC;
}

export function supportedLanguages(): LangCode[] {
  return SUPPORTED_LANGUAGES;
}
