import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { streamLedgers } from './horizon';

interface PulsarEvent {
  type: string;
  data: Record<string, any>;
  timestamp: number;
  txHash?: string;
}

const clients = new Set<WebSocket>();

export function setupWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    clients.add(ws);
    console.log(`[WS] Client connected. Total: ${clients.size}`);

    // Send welcome message
    sendToClient(ws, {
      type: 'connected',
      data: { message: 'Connected to PulsarTrack WebSocket server' },
      timestamp: Date.now(),
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[WS] Client disconnected. Total: ${clients.size}`);
    });

    ws.on('error', (err) => {
      console.error('[WS] Client error:', err.message);
      clients.delete(ws);
    });

    // Handle ping-pong
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ping') {
          sendToClient(ws, { type: 'pong', data: {}, timestamp: Date.now() });
        }
      } catch {
        // ignore
      }
    });
  });

  // Start streaming Stellar ledger events
  const stopStream = streamLedgers(
    (ledger) => {
      broadcast({
        type: 'ledger_closed',
        data: {
          sequence: ledger.sequence,
          closedAt: ledger.closed_at,
          transactionCount: ledger.transaction_count,
        },
        timestamp: Date.now(),
      });
    },
    (err) => {
      console.error('[WS] Ledger stream error:', err?.message);
    }
  );

  // Clean up on server close
  wss.on('close', () => {
    stopStream();
  });

  return wss;
}

function sendToClient(ws: WebSocket, event: PulsarEvent): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(event));
  }
}

export function broadcast(event: PulsarEvent): void {
  const msg = JSON.stringify(event);
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

/**
 * Broadcast a campaign event
 */
export function broadcastCampaignEvent(
  type: 'campaign_created' | 'view_recorded' | 'payment_processed',
  data: Record<string, any>
): void {
  broadcast({ type, data, timestamp: Date.now() });
}

/**
 * Broadcast an auction event
 */
export function broadcastAuctionEvent(
  type: 'bid_placed' | 'auction_created' | 'auction_settled',
  data: Record<string, any>
): void {
  broadcast({ type, data, timestamp: Date.now() });
}
