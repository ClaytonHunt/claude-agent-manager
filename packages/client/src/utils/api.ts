import { Agent, AgentQuery, AgentRegistration, LogEntry, HandoffContext } from '@/types';
import { API_BASE_URL } from './constants';

// Base fetch wrapper with error handling
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}

// Agent API methods
export const agentApi = {
  // Get all agents with optional filtering
  async getAgents(query: AgentQuery = {}): Promise<Agent[]> {
    const searchParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, String(v)));
        } else {
          searchParams.set(key, String(value));
        }
      }
    });
    
    const queryString = searchParams.toString();
    const endpoint = `/api/agents${queryString ? `?${queryString}` : ''}`;
    
    return fetchApi<Agent[]>(endpoint);
  },

  // Get specific agent by ID
  async getAgent(id: string): Promise<Agent> {
    return fetchApi<Agent>(`/api/agents/${id}`);
  },

  // Register new agent
  async registerAgent(registration: AgentRegistration): Promise<Agent> {
    return fetchApi<Agent>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(registration),
    });
  },

  // Update agent status
  async updateAgentStatus(id: string, status: string): Promise<Agent> {
    return fetchApi<Agent>(`/api/agents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Add log entry to agent
  async addLogEntry(id: string, logEntry: Omit<LogEntry, 'id' | 'timestamp'>): Promise<void> {
    return fetchApi<void>(`/api/agents/${id}/logs`, {
      method: 'POST',
      body: JSON.stringify(logEntry),
    });
  },

  // Get agent logs
  async getAgentLogs(id: string, limit = 100): Promise<LogEntry[]> {
    return fetchApi<LogEntry[]>(`/api/agents/${id}/logs?limit=${limit}`);
  },

  // Update agent context
  async updateAgentContext(id: string, context: Record<string, any>): Promise<Agent> {
    return fetchApi<Agent>(`/api/agents/${id}/context`, {
      method: 'PATCH',
      body: JSON.stringify({ context }),
    });
  },

  // Perform agent handoff
  async handoffAgent(handoff: Omit<HandoffContext, 'timestamp'>): Promise<void> {
    return fetchApi<void>('/api/agents/handoff', {
      method: 'POST',
      body: JSON.stringify(handoff),
    });
  },

  // Delete agent
  async deleteAgent(id: string): Promise<void> {
    return fetchApi<void>(`/api/agents/${id}`, {
      method: 'DELETE',
    });
  },

  // Get project statistics
  async getProjectStats(projectPath: string): Promise<any> {
    return fetchApi<any>(`/api/agents/projects/${encodeURIComponent(projectPath)}/stats`);
  },

  // Search agents
  async searchAgents(query: string): Promise<Agent[]> {
    return fetchApi<Agent[]>(`/api/agents/search/${encodeURIComponent(query)}`);
  },

  // Get agent hierarchy
  async getAgentHierarchy(rootId?: string): Promise<Record<string, any>> {
    const endpoint = rootId 
      ? `/api/agents/hierarchy/${rootId}`
      : '/api/agents/hierarchy';
    return fetchApi<Record<string, any>>(endpoint);
  },
};

// Health check API
export const healthApi = {
  async check(): Promise<{ status: string; timestamp: string; version: string }> {
    return fetchApi<{ status: string; timestamp: string; version: string }>('/health');
  },
};

// Export convenience functions
export async function getAgents(query?: AgentQuery): Promise<Agent[]> {
  return agentApi.getAgents(query);
}

export async function getAgent(id: string): Promise<Agent> {
  return agentApi.getAgent(id);
}

export async function registerAgent(registration: AgentRegistration): Promise<Agent> {
  return agentApi.registerAgent(registration);
}

export async function updateAgentStatus(id: string, status: string): Promise<Agent> {
  return agentApi.updateAgentStatus(id, status);
}

export async function addLogEntry(id: string, logEntry: Omit<LogEntry, 'id' | 'timestamp'>): Promise<void> {
  return agentApi.addLogEntry(id, logEntry);
}

export async function getAgentLogs(id: string, limit?: number): Promise<LogEntry[]> {
  return agentApi.getAgentLogs(id, limit);
}

export async function deleteAgent(id: string): Promise<void> {
  return agentApi.deleteAgent(id);
}

export async function searchAgents(query: string): Promise<Agent[]> {
  return agentApi.searchAgents(query);
}

export async function getAgentHierarchy(rootId?: string): Promise<Record<string, any>> {
  return agentApi.getAgentHierarchy(rootId);
}