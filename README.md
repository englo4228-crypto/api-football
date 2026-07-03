# api-football

A real-time football (soccer) data API: live scores, match events, lineups,
statistics, standings, player/team insight, betting analytics, and news —
served over REST and WebSocket.

There is no licensed third-party sports-data feed wired in here (that's a
commercial data-vendor contract, not a code problem). Instead, this ships
with a self-contained **live match simulation engine**: seeded fixtures
across four top-flight leagues advance in real time, generating goals,
cards, substitutions, and live statistics on a fixed tick. The data layer,
routes, and WebSocket gateway are written so swapping the simulator for a
real provider (e.g. a webhook/poll adapter that writes into the same store)
is a drop-in change — no route or type changes required.

## Quick start

```bash
npm install
cp .env.example .env
npm run dev      # ts-node-dev, hot reload
# or
npm run build && npm start
```

Server starts on `http://localhost:3000`. Visit `/api` for a machine-readable
route index.

## Feature coverage

**Live match center**
- Live Scores — `GET /api/live-scores`, refreshed by the simulation engine every `LIVE_TICK_INTERVAL_MS` (default 15000ms)
- Match Events — `GET /api/matches/:id/events` (goals, cards, substitutions, VAR)
- Lineups & Formations — `GET /api/matches/:id/lineups` (starting XI, bench, formation, coach)
- Live Statistics — `GET /api/matches/:id/statistics` (possession, shots, fouls, corners, cards)
- League Standings — `GET /api/leagues/:id/standings`, recomputed the instant a match ends

**Player & team insight**
- Player Profiles — `GET /api/players/:id` (career stat lines by season/competition)
- Top Scorers — `GET /api/leagues/:id/top-scorers?sortBy=goals|assists|cards`
- Team Squads — `GET /api/teams/:id/squad`
- Transfer History — `GET /api/players/:id/transfers`
- Injury Reports — `GET /api/teams/:id/injuries`

**Analytics & betting data**
- Pre-Match Odds — `GET /api/matches/:id/odds/pre-match` (1x2, over/under 2.5, BTTS)
- Live Odds — `GET /api/matches/:id/odds/live` (recomputed from live score/minute)
- Match Predictions — `GET /api/matches/:id/predictions` (win probability, xG, BTTS%, over 2.5%)
- Head-to-Head — `GET /api/head-to-head?teamA=<id>&teamB=<id>`
- Coach Profiles — `GET /api/coaches/:id` (stint-by-stint managerial record)

**News**
- `GET /api/news?teamId=&leagueId=&playerId=&query=` — articles tagged to teams/leagues/players

**Technical**
- Global Coverage — `GET /api/leagues/coverage` catalogs 1,260 competitions across all six
  confederations (metadata: id/name/country/tier). Four core leagues (`hasLiveData: true`)
  carry full live simulation; the rest are discoverable catalog entries, demonstrating that
  the schema/routes are country-agnostic.
- Localization — pass `?lang=` (`en`,`es`,`fr`,`de`,`pt`,`it`,`ar`,`hi`) or an `Accept-Language`
  header; team/league/news names are returned in that language with an English fallback.
- Timezone Config — pass `?tz=<IANA zone>` (e.g. `?tz=America/New_York`) and fixture kickoff
  times are returned in both UTC and the requested local zone.

## Real-time transport

- **Poll** any endpoint above; the underlying state changes on the same 15s cadence.
- **Subscribe** via WebSocket for push updates:
  ```js
  const ws = new WebSocket('ws://localhost:3000/live');
  ws.onmessage = (e) => console.log(JSON.parse(e.data));
  // Optionally narrow the feed:
  ws.send(JSON.stringify({ action: 'subscribe', matchIds: ['mt-lg-eng-pl-live'] }));
  ```
  Every tick that produces an event (kick-off, goal, card, sub, half/full-time) broadcasts a
  `MATCH_UPDATE` message to subscribed clients.

## Project layout

```
src/
  types/               Domain model (League, Team, Player, Match, Odds, ...)
  data/                 Seed data: leagues/teams (coreLeagues), name pools (nameData),
                        the 1,200+ competition catalog (coverageRegistry), and the
                        assembly function (seed.ts)
  store/db.ts           In-memory data store + query helpers
  services/
    matchSimulator.ts   Advances live matches, generates events/stats/lineups,
                        updates standings, spawns the next fixture on full-time
    oddsService.ts      Pre-match & live odds derived from standings/score/minute
    predictionService.ts  xG-and-form based outcome probabilities
    headToHeadService.ts  Historical results between two teams
    newsService.ts      News filtering/search
  middleware/            Localization + timezone resolution, error handling
  routes/                One router per feature area
  websocket/liveGateway.ts  WebSocket push layer over the simulator's event bus
tests/api.test.ts       Endpoint + simulation-tick coverage (Jest + Supertest)
```

## Configuration

See `.env.example`:
- `PORT` — HTTP port (default 3000)
- `LIVE_TICK_INTERVAL_MS` — simulation/broadcast cadence (default 15000)
- `DEFAULT_TIMEZONE`, `DEFAULT_LANGUAGE` — fallbacks when a request omits `?tz=`/`?lang=`

## Testing

```bash
npm test
```

26 tests cover every route group plus a direct call into the simulation tick.

## Production notes

- Swap the in-memory `InMemoryDatabase` (`src/store/db.ts`) for Postgres/Redis-backed
  repositories behind the same interface to persist state across restarts and scale
  horizontally (the WebSocket gateway would move to a pub/sub backend like Redis in that case).
  - Replace `matchSimulator.ts`'s tick logic with an adapter that ingests a licensed
    live-data feed (webhook or polling) and writes into the same store shape — routes,
    serializers, and the WebSocket gateway need no changes.
  - The `coverageRegistry.ts` catalog can be backed by a real competitions table once a
    data vendor is contracted per confederation/country.
