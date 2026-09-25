import { WebSocket, WebSocketServer } from 'ws';
import { WebSocketMessage } from './types';

interface ClientConnection {
  ws: WebSocket;
  restaurantId?: string;
  tableId?: string;
  orderId?: string;
  role?: string;
}

const clients = new Set<ClientConnection>();

export function setupWebSocketServer(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    const conn: ClientConnection = { ws };
    clients.add(conn);

    ws.on('message', (message: string) => {
      try {
        const payload: WebSocketMessage = JSON.parse(message.toString());
        if (payload.type === 'SUBSCRIBE') {
          conn.restaurantId = payload.restaurant_id;
          if (payload.data?.tableId) conn.tableId = payload.data.tableId;
          if (payload.data?.orderId) conn.orderId = payload.data.orderId;
          if (payload.data?.role) conn.role = payload.data.role;

          ws.send(JSON.stringify({ type: 'PONG', data: { status: 'SUBSCRIBED' } }));
        } else if (payload.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG' }));
        }
      } catch (err) {
        // Ignore malformed message
      }
    });

    ws.on('close', () => {
      clients.delete(conn);
    });

    ws.on('error', () => {
      clients.delete(conn);
    });
  });
}

export function broadcastToRestaurant(restaurantId: string, message: WebSocketMessage) {
  const payload = JSON.stringify(message);
  for (const conn of clients) {
    if (conn.ws.readyState === WebSocket.OPEN) {
      if (!conn.restaurantId || conn.restaurantId === restaurantId) {
        conn.ws.send(payload);
      }
    }
  }
}
