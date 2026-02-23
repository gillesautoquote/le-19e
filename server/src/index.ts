import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import express from 'express';
import { createServer } from 'http';
import { WorldRoom } from './rooms/WorldRoom';

const PORT = Number(process.env.PORT) || 2567;

const app = express();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const httpServer = createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});

gameServer.define('world', WorldRoom);

httpServer.listen(PORT, () => {
  console.log(`Le 19e server listening on port ${PORT}`);
});
