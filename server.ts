import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import apiRoutes from './src/server/routes';
import { initDatabase } from './src/server/db';
import { setupWebSocketServer } from './src/server/websocket';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Initialize storage & demo data
  await initDatabase();

  app.use(express.json());

  // Mount API router
  app.use('/api/v1', apiRoutes);

  const server = http.createServer(app);

  // Setup WebSocket server on /ws
  const wss = new WebSocketServer({ server, path: '/ws' });
  setupWebSocketServer(wss);

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[RestoDine] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[RestoDine] Fatal server error:', err);
  process.exit(1);
});
