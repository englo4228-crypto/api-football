import 'dotenv/config';
import { createServer } from 'http';
import { createApp } from './app';
import { attachLiveGateway } from './websocket/liveGateway';
import { startMatchSimulator } from './services/matchSimulator';

const PORT = Number(process.env.PORT ?? 3000);
const LIVE_TICK_INTERVAL_MS = Number(process.env.LIVE_TICK_INTERVAL_MS ?? 15000);

const app = createApp();
const server = createServer(app);
attachLiveGateway(server);
startMatchSimulator(LIVE_TICK_INTERVAL_MS);

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`api-football listening on port ${PORT} (live tick every ${LIVE_TICK_INTERVAL_MS}ms)`);
});
