import { Server as HttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { db } from '../store/db';
import { onLiveUpdate } from '../services/matchSimulator';

interface ClientState {
  socket: WebSocket;
  subscribedMatchIds: Set<string> | null; // null = subscribed to all live matches
}

/**
 * Pushes live match updates over WebSocket as the simulation engine ticks
 * (every LIVE_TICK_INTERVAL_MS, default 15s). Clients connect to /live and
 * may send { "action": "subscribe", "matchIds": ["mt-..."] } to narrow the
 * feed, or omit matchIds to receive every live match update.
 */
export function attachLiveGateway(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/live' });
  const clients = new Map<WebSocket, ClientState>();

  wss.on('connection', (socket) => {
    clients.set(socket, { socket, subscribedMatchIds: null });

    socket.send(
      JSON.stringify({
        type: 'WELCOME',
        message: 'Subscribed to all live matches by default. Send {"action":"subscribe","matchIds":[...]} to filter.',
        liveMatches: db.listLiveMatches().map((m) => m.id),
      }),
    );

    socket.on('message', (raw) => {
      try {
        const payload = JSON.parse(raw.toString());
        if (payload.action === 'subscribe' && Array.isArray(payload.matchIds)) {
          clients.set(socket, { socket, subscribedMatchIds: new Set(payload.matchIds) });
          socket.send(JSON.stringify({ type: 'SUBSCRIBED', matchIds: payload.matchIds }));
        } else if (payload.action === 'subscribeAll') {
          clients.set(socket, { socket, subscribedMatchIds: null });
          socket.send(JSON.stringify({ type: 'SUBSCRIBED', matchIds: 'ALL' }));
        }
      } catch {
        socket.send(JSON.stringify({ type: 'ERROR', message: 'Invalid message payload; expected JSON.' }));
      }
    });

    socket.on('close', () => clients.delete(socket));
  });

  onLiveUpdate(({ match, events }) => {
    const message = JSON.stringify({
      type: 'MATCH_UPDATE',
      matchId: match.id,
      status: match.status,
      minute: match.minute,
      score: match.score,
      newEvents: events,
      timestamp: new Date().toISOString(),
    });
    for (const client of clients.values()) {
      if (client.socket.readyState !== WebSocket.OPEN) continue;
      if (client.subscribedMatchIds && !client.subscribedMatchIds.has(match.id)) continue;
      client.socket.send(message);
    }
  });

  return wss;
}
