import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Agent, AgentQuery, AgentFilters, LogEntry } from '@/types';
import { agentApi } from '@/utils/api';

interface AgentStore {
  // State
  agents: Agent[];
  selectedAgent: Agent | null;
  loading: boolean;
  error: string | null;
  filters: AgentFilters;
  query: AgentQuery;
  
  // Actions
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (agent: Agent) => void;
  removeAgent: (agentId: string) => void;
  setSelectedAgent: (agent: Agent | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<AgentFilters>) => void;
  setQuery: (query: Partial<AgentQuery>) => void;
  
  // Async actions
  fetchAgents: () => Promise<void>;
  fetchAgent: (id: string) => Promise<Agent | null>;
  refreshAgents: () => Promise<void>;
  updateAgentStatus: (id: string, status: string) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  addLogToAgent: (agentId: string, logEntry: LogEntry) => void;
  
  // Computed getters
  getFilteredAgents: () => Agent[];
  getAgentsByProject: () => Record<string, Agent[]>;
  getAgentStats: () => {
    total: number;
    idle: number;
    active: number;
    error: number;
    handoff: number;
    complete: number;
  };
}

export const useAgentStore = create<AgentStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    agents: [],
    selectedAgent: null,
    loading: false,
    error: null,
    filters: {
      status: [],
      projectPath: undefined,
      tags: [],
      search: '',
    },
    query: {
      limit: 50,
      offset: 0,
    },

    // Basic setters
    setAgents: (agents) => set({ agents }),
    
    addAgent: (agent) => set((state) => ({
      agents: [...state.agents, agent],
    })),
    
    updateAgent: (updatedAgent) => set((state) => ({
      agents: state.agents.map(agent => 
        agent.id === updatedAgent.id ? updatedAgent : agent
      ),
      selectedAgent: state.selectedAgent?.id === updatedAgent.id 
        ? updatedAgent 
        : state.selectedAgent,
    })),
    
    removeAgent: (agentId) => set((state) => ({
      agents: state.agents.filter(agent => agent.id !== agentId),
      selectedAgent: state.selectedAgent?.id === agentId 
        ? null 
        : state.selectedAgent,
    })),
    
    setSelectedAgent: (agent) => set({ selectedAgent: agent }),
    
    setLoading: (loading) => set({ loading }),
    
    setError: (error) => set({ error }),
    
    setFilters: (newFilters) => set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
    
    setQuery: (newQuery) => set((state) => ({
      query: { ...state.query, ...newQuery },
    })),

    // Async actions
    fetchAgents: async () => {
      const { query, setLoading, setError, setAgents } = get();
      
      setLoading(true);
      setError(null);
      
      try {
        const agents = await agentApi.getAgents(query);
        setAgents(agents);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch agents';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },

    fetchAgent: async (id: string) => {
      const { setError, setSelectedAgent } = get();
      
      try {
        const agent = await agentApi.getAgent(id);
        if (agent) {
          setSelectedAgent(agent);
        }
        return agent;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch agent';
        setError(errorMessage);
        setSelectedAgent(null);
        return null;
      }
    },

    refreshAgents: async () => {
      await get().fetchAgents();
    },

    updateAgentStatus: async (id: string, status: string) => {
      const { updateAgent, setError } = get();
      
      try {
        const updatedAgent = await agentApi.updateAgentStatus(id, status);
        updateAgent(updatedAgent);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update agent status';
        setError(errorMessage);
      }
    },

    deleteAgent: async (id: string) => {
      const { removeAgent, setError } = get();
      
      try {
        await agentApi.deleteAgent(id);
        removeAgent(id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete agent';
        setError(errorMessage);
      }
    },

    addLogToAgent: (agentId: string, logEntry: LogEntry) => set((state) => ({
      agents: state.agents.map(agent => 
        agent.id === agentId 
          ? { ...agent, logs: [...agent.logs, logEntry] }
          : agent
      ),
      selectedAgent: state.selectedAgent?.id === agentId
        ? { ...state.selectedAgent, logs: [...state.selectedAgent.logs, logEntry] }
        : state.selectedAgent,
    })),

    // Computed getters
    getFilteredAgents: () => {
      const { agents, filters } = get();
      
      return agents.filter(agent => {
        // Status filter
        if (filters.status && filters.status.length > 0) {
          if (!filters.status.includes(agent.status)) {
            return false;
          }
        }
        
        // Project path filter
        if (filters.projectPath) {
          if (!agent.projectPath.includes(filters.projectPath)) {
            return false;
          }
        }
        
        // Tags filter
        if (filters.tags && filters.tags.length > 0) {
          const hasMatchingTag = filters.tags.some(tag => 
            agent.tags.some(agentTag => 
              agentTag.toLowerCase().includes(tag.toLowerCase())
            )
          );
          if (!hasMatchingTag) {
            return false;
          }
        }
        
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesSearch = 
            agent.id.toLowerCase().includes(searchLower) ||
            agent.projectPath.toLowerCase().includes(searchLower) ||
            agent.tags.some(tag => tag.toLowerCase().includes(searchLower));
          
          if (!matchesSearch) {
            return false;
          }
        }
        
        return true;
      });
    },

    getAgentsByProject: () => {
      const { agents } = get();
      
      return agents.reduce((acc, agent) => {
        const project = agent.projectPath;
        if (!acc[project]) {
          acc[project] = [];
        }
        acc[project].push(agent);
        return acc;
      }, {} as Record<string, Agent[]>);
    },

    getAgentStats: () => {
      const { agents } = get();
      
      return agents.reduce(
        (stats, agent) => {
          stats.total++;
          // Only increment known status counters to prevent NaN
          if (agent.status in stats) {
            stats[agent.status]++;
          }
          return stats;
        },
        {
          total: 0,
          idle: 0,
          active: 0,
          error: 0,
          handoff: 0,
          complete: 0,
        }
      );
    },
  }))
);