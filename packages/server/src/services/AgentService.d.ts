import { Agent, AgentRegistration, AgentQuery, LogEntry, HandoffContext } from '@claude-agent-manager/shared';
import { RedisService } from './RedisService';
export declare class AgentService {
    private redisService;
    constructor(redisService: RedisService);
    registerAgent(registration: AgentRegistration): Promise<Agent>;
    getAgent(id: string): Promise<Agent>;
    getAgents(query?: AgentQuery): Promise<Agent[]>;
    updateAgentStatus(id: string, status: Agent['status']): Promise<Agent>;
    addLogEntry(id: string, entry: Omit<LogEntry, 'id' | 'timestamp'>): Promise<void>;
    updateAgentContext(id: string, context: Record<string, any>): Promise<Agent>;
    handoffAgent(context: HandoffContext): Promise<void>;
    deleteAgent(id: string): Promise<void>;
    getProjectStats(projectPath: string): Promise<Record<string, number>>;
    getActiveAgents(): Promise<Agent[]>;
    getAgentHierarchy(rootId?: string): Promise<Map<string, Agent[]>>;
    searchAgents(query: string): Promise<Agent[]>;
    getAgentLogs(id: string, limit?: number): Promise<LogEntry[]>;
    cleanup(): Promise<void>;
    healthCheck(): Promise<{
        healthy: boolean;
        stats: any;
    }>;
}
