import { Agent, AgentQuery, LogEntry, HandoffContext } from '@claude-agent-manager/shared';

export interface AgentManagerClientConfig {
  serverUrl: string;
  authentication?: {
    type: 'bearer' | 'apikey';
    token: string;
  };
}

export class AgentManagerClient {
  private config: AgentManagerClientConfig;

  constructor(config: AgentManagerClientConfig) {
    this.config = config;
  }

  private async request<T>(
    path: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.serverUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...(options.headers as Record<string, string> || {})
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private getAuthHeaders(): Record<string, string> {
    if (!this.config.authentication) return {};

    switch (this.config.authentication.type) {
      case 'bearer':
        return { 'Authorization': `Bearer ${this.config.authentication.token}` };
      case 'apikey':
        return { 'X-API-Key': this.config.authentication.token };
      default:
        return {};
    }
  }

  // Agent management
  async getAgents(query: AgentQuery = {}): Promise<Agent[]> {
    const params = new URLSearchParams();
    if (query.projectPath) params.set('projectPath', query.projectPath);
    if (query.status) params.set('status', query.status);
    if (query.parentId) params.set('parentId', query.parentId);
    if (query.limit) params.set('limit', query.limit.toString());
    if (query.offset) params.set('offset', query.offset.toString());
    if (query.tags) params.set('tags', query.tags.join(','));

    const queryString = params.toString();
    const path = `/api/agents${queryString ? `?${queryString}` : ''}`;
    
    return await this.request<Agent[]>(path);
  }

  async getAgent(id: string): Promise<Agent> {
    return await this.request<Agent>(`/api/agents/${id}`);
  }

  async updateAgentStatus(id: string, status: Agent['status']): Promise<Agent> {
    return await this.request<Agent>(`/api/agents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async addLogEntry(id: string, entry: Omit<LogEntry, 'id' | 'timestamp'>): Promise<void> {
    await this.request(`/api/agents/${id}/logs`, {
      method: 'POST',
      body: JSON.stringify(entry)
    });
  }

  async getAgentLogs(id: string, limit: number = 100): Promise<LogEntry[]> {
    return await this.request<LogEntry[]>(`/api/agents/${id}/logs?limit=${limit}`);
  }

  async updateAgentContext(id: string, context: Record<string, any>): Promise<Agent> {
    return await this.request<Agent>(`/api/agents/${id}/context`, {
      method: 'PATCH',
      body: JSON.stringify({ context })
    });
  }

  async handoffAgent(handoff: Omit<HandoffContext, 'timestamp'>): Promise<void> {
    await this.request('/api/agents/handoff', {
      method: 'POST',
      body: JSON.stringify(handoff)
    });
  }

  async deleteAgent(id: string): Promise<void> {
    await this.request(`/api/agents/${id}`, {
      method: 'DELETE'
    });
  }

  async getProjectStats(projectPath: string): Promise<Record<string, number>> {
    return await this.request<Record<string, number>>(`/api/agents/projects/${encodeURIComponent(projectPath)}/stats`);
  }

  async searchAgents(query: string): Promise<Agent[]> {
    return await this.request<Agent[]>(`/api/agents/search/${encodeURIComponent(query)}`);
  }

  async getAgentHierarchy(rootId?: string): Promise<Record<string, Agent[]>> {
    const path = rootId ? `/api/agents/hierarchy/${rootId}` : '/api/agents/hierarchy';
    return await this.request<Record<string, Agent[]>>(path);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    return await this.request<{ status: string; timestamp: string; version: string }>('/health');
  }
}

// Convenience function to create client
export function createAgentManagerClient(config: AgentManagerClientConfig): AgentManagerClient {
  return new AgentManagerClient(config);
}

// WebSocket client for real-time updates
export class AgentManagerWebSocketClient {
  private ws: WebSocket | null = null;
  private config: AgentManagerClientConfig;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(config: AgentManagerClientConfig) {
    this.config = config;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.config.serverUrl.replace(/^https?/, 'ws');
      this.ws = new WebSocket(`${wsUrl}/ws`);

      this.ws.onopen = () => {
        console.log('Connected to Agent Manager WebSocket');
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('Disconnected from Agent Manager WebSocket');
        // Auto-reconnect after 5 seconds
        setTimeout(() => this.connect(), 5000);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
    });
  }

  private handleMessage(message: any): void {
    const { type, data } = message;
    const listeners = this.listeners.get(type);
    
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in WebSocket listener:', error);
        }
      });
    }
  }

  subscribe(channel: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        data: { channels: [channel] }
      }));
    }
  }

  unsubscribe(channel: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        data: { channels: [channel] }
      }));
    }
  }

  on(eventType: string, listener: Function): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
  }

  off(eventType: string, listener: Function): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}