import { WebSocketMessage, ClientWebSocketMessage } from '@/types';
import { WS_URL, WS_HEARTBEAT_INTERVAL, WS_RECONNECT_DELAY, WS_MAX_RECONNECT_ATTEMPTS } from './constants';

export type WebSocketEventHandler = (message: WebSocketMessage) => void;
export type WebSocketStatusHandler = (connected: boolean, error?: string) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectDelay: number;
  private heartbeatInterval: number;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isManuallyDisconnected = false;
  
  private eventHandlers = new Map<string, Set<WebSocketEventHandler>>();
  private statusHandlers = new Set<WebSocketStatusHandler>();
  private subscriptions = new Set<string>();

  constructor(
    url: string = WS_URL,
    options: {
      maxReconnectAttempts?: number;
      reconnectDelay?: number;
      heartbeatInterval?: number;
    } = {}
  ) {
    this.url = url;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? WS_MAX_RECONNECT_ATTEMPTS;
    this.reconnectDelay = options.reconnectDelay ?? WS_RECONNECT_DELAY;
    this.heartbeatInterval = options.heartbeatInterval ?? WS_HEARTBEAT_INTERVAL;
  }

  // Connection management
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isManuallyDisconnected = false;
    this.createConnection();
  }

  disconnect(): void {
    this.isManuallyDisconnected = true;
    this.cleanup();
  }

  // Event handlers
  on(event: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  onStatus(handler: WebSocketStatusHandler): void {
    this.statusHandlers.add(handler);
  }

  offStatus(handler: WebSocketStatusHandler): void {
    this.statusHandlers.delete(handler);
  }

  // Subscription management
  subscribe(channels: string[]): void {
    channels.forEach(channel => this.subscriptions.add(channel));
    
    if (this.isConnected()) {
      this.send({
        type: 'subscribe',
        data: { channels },
        timestamp: new Date(),
      });
    }
  }

  unsubscribe(channels: string[]): void {
    channels.forEach(channel => this.subscriptions.delete(channel));
    
    if (this.isConnected()) {
      this.send({
        type: 'unsubscribe',
        data: { channels },
        timestamp: new Date(),
      });
    }
  }

  // Message sending
  send(message: ClientWebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }

  // Status checks
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  isConnecting(): boolean {
    return this.ws?.readyState === WebSocket.CONNECTING;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  // Private methods
  private createConnection(): void {
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.notifyStatusHandlers(false, error instanceof Error ? error.message : 'Connection failed');
      this.scheduleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.notifyStatusHandlers(true);
      this.startHeartbeat();
      this.resubscribeToChannels();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.stopHeartbeat();
      this.notifyStatusHandlers(false);
      
      if (!this.isManuallyDisconnected) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.notifyStatusHandlers(false, 'WebSocket error occurred');
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    // Handle ping/pong for heartbeat
    if (message.type === 'ping') {
      this.send({
        type: 'pong',
        data: {},
        timestamp: new Date(),
      });
      return;
    }

    // Emit message to specific event handlers
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in WebSocket event handler:', error);
        }
      });
    }

    // Emit to global handlers
    const globalHandlers = this.eventHandlers.get('*');
    if (globalHandlers) {
      globalHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in global WebSocket event handler:', error);
        }
      });
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        // Heartbeat is handled by server pings, no action needed
      } else {
        this.stopHeartbeat();
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.isManuallyDisconnected || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.createConnection();
    }, delay);
  }

  private resubscribeToChannels(): void {
    if (this.subscriptions.size > 0) {
      this.send({
        type: 'subscribe',
        data: { channels: Array.from(this.subscriptions) },
        timestamp: new Date(),
      });
    }
  }

  private notifyStatusHandlers(connected: boolean, error?: string): void {
    this.statusHandlers.forEach(handler => {
      try {
        handler(connected, error);
      } catch (error) {
        console.error('Error in WebSocket status handler:', error);
      }
    });
  }

  private cleanup(): void {
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Create a singleton instance
export const wsClient = new WebSocketClient();