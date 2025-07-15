import { Agent, AgentQuery } from '@claude-agent-manager/shared';
export declare class RedisService {
    private client;
    private readonly keyPrefix;
    private readonly retentionDays;
    constructor(url: string);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private agentKey;
    private projectKey;
    private statusKey;
    saveAgent(agent: Agent): Promise<void>;
    getAgent(id: string): Promise<Agent | null>;
    getAgents(query?: AgentQuery): Promise<Agent[]>;
    deleteAgent(id: string): Promise<void>;
    updateAgentStatus(id: string, status: Agent['status']): Promise<void>;
    addLogToAgent(id: string, log: Agent['logs'][0]): Promise<void>;
    getProjectStats(projectPath: string): Promise<Record<string, number>>;
    private refreshTTL;
    cleanup(): Promise<void>;
}
