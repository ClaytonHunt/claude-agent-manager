import { WebSocketServer, WebSocket } from 'ws';
import { WebSocketMessage, Agent, LogEntry } from '@claude-agent-manager/shared';
import { logger } from '../utils/logger';

interface ClientConnection {
  id: string;
  socket: WebSocket;
  subscriptions: Set<string>;
  lastPing: Date;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  initialize(wss: WebSocketServer): void {
    this.wss = wss;
    
    wss.on('connection', (socket: WebSocket) => {
      this.handleConnection(socket);
    });
    
    // Start ping interval
    this.pingInterval = setInterval(() => {
      this.pingClients();
    }, 30000); // Every 30 seconds
    
    logger.info('WebSocket service initialized');
  }

  private handleConnection(socket: WebSocket): void {
    const clientId = this.generateClientId();
    const client: ClientConnection = {
      id: clientId,
      socket,
      subscriptions: new Set(),
      lastPing: new Date()
    };
    
    this.clients.set(clientId, client);
    
    socket.on('message', (data: Buffer) => {
      this.handleMessage(clientId, data);
    });
    
    socket.on('close', () => {
      this.clients.delete(clientId);
      logger.debug(`Client disconnected: ${clientId}`);
    });
    
    socket.on('error', (error: Error) => {
      logger.error(`WebSocket error for client ${clientId}:`, error);
      this.clients.delete(clientId);
    });
    
    // Send welcome message
    this.sendToClient(clientId, {
      type: 'ping',
      data: { clientId },
      timestamp: new Date()
    });
    
    logger.debug(`Client connected: ${clientId}`);
  }

  private handleMessage(clientId: string, data: Buffer): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'pong':
          client.lastPing = new Date();
          break;
          
        case 'subscribe':
          this.handleSubscription(clientId, message.data);
          break;
          
        case 'unsubscribe':
          this.handleUnsubscription(clientId, message.data);
          break;
          
        default:
          logger.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      logger.error(`Error handling message from client ${clientId}:`, error);
    }
  }

  private handleSubscription(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const { channels } = data;
    
    if (Array.isArray(channels)) {
      channels.forEach(channel => {
        client.subscriptions.add(channel);
      });
    }
    
    logger.debug(`Client ${clientId} subscribed to: ${channels.join(', ')}`);
  }

  private handleUnsubscription(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const { channels } = data;
    
    if (Array.isArray(channels)) {
      channels.forEach(channel => {
        client.subscriptions.delete(channel);
      });
    }
    
    logger.debug(`Client ${clientId} unsubscribed from: ${channels.join(', ')}`);
  }

  private pingClients(): void {
    const now = new Date();
    const timeout = 60000; // 1 minute timeout
    
    for (const [clientId, client] of this.clients) {
      if (now.getTime() - client.lastPing.getTime() > timeout) {
        // Client timed out
        client.socket.close();
        this.clients.delete(clientId);
        logger.debug(`Client timed out: ${clientId}`);
      } else {
        // Send ping
        this.sendToClient(clientId, {
          type: 'ping',
          data: {},
          timestamp: new Date()
        });
      }
    }
  }

  private sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    
    try {
      client.socket.send(JSON.stringify(message));
    } catch (error) {
      logger.error(`Error sending message to client ${clientId}:`, error);
      this.clients.delete(clientId);
    }
  }

  private broadcast(message: WebSocketMessage, channel?: string): void {
    for (const [clientId, client] of this.clients) {
      if (channel && !client.subscriptions.has(channel)) {
        continue;
      }
      
      this.sendToClient(clientId, message);
    }
  }

  // Public methods for broadcasting updates
  broadcastAgentUpdate(agent: Agent): void {
    this.broadcast({
      type: 'agent_update',
      data: agent,
      timestamp: new Date()
    }, `agent:${agent.id}`);
    
    this.broadcast({
      type: 'agent_update',
      data: agent,
      timestamp: new Date()
    }, `project:${agent.projectPath}`);
  }

  broadcastLogEntry(agentId: string, logEntry: LogEntry): void {
    this.broadcast({
      type: 'log_entry',
      data: { agentId, logEntry },
      timestamp: new Date()
    }, `agent:${agentId}`);
  }

  broadcastHandoff(fromAgentId: string, toAgentId: string, context: any): void {
    this.broadcast({
      type: 'handoff',
      data: { fromAgentId, toAgentId, context },
      timestamp: new Date()
    }, `agent:${fromAgentId}`);
    
    this.broadcast({
      type: 'handoff',
      data: { fromAgentId, toAgentId, context },
      timestamp: new Date()
    }, `agent:${toAgentId}`);
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConnectedClients(): number {
    return this.clients.size;
  }

  shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    for (const [clientId, client] of this.clients) {
      client.socket.close();
    }
    
    this.clients.clear();
    
    if (this.wss) {
      this.wss.close();
    }
    
    logger.info('WebSocket service shutdown');
  }
}