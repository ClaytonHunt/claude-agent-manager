import { 
  Agent, 
  AgentRegistration, 
  AgentQuery, 
  LogEntry, 
  HandoffContext,
  AgentManagerError,
  ValidationError,
  NotFoundError,
  generateId,
  createLogEntry,
  sanitizeContext
} from '@claude-agent-manager/shared';
import { RedisService } from './RedisService';
import { MemoryStorageService } from './MemoryStorageService';
import { logger } from '../utils/logger';

// Interface for storage service
interface StorageService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  saveAgent(agent: Agent): Promise<void>;
  getAgent(id: string): Promise<Agent | null>;
  getAgents(query?: AgentQuery): Promise<Agent[]>;
  deleteAgent(id: string): Promise<void>;
  updateAgentStatus(id: string, status: Agent['status']): Promise<void>;
  addLogToAgent(id: string, log: LogEntry): Promise<void>;
  getProjectStats(projectPath: string): Promise<Record<string, number>>;
  cleanup(): Promise<void>;
}

export class AgentService {
  private storage: StorageService;

  constructor(redisService: RedisService, private fallbackToMemory: boolean = true) {
    this.storage = redisService;
  }

  async initialize(): Promise<void> {
    try {
      await this.storage.connect();
    } catch (error) {
      if (this.fallbackToMemory) {
        logger.warn('⚠️  Redis connection failed, falling back to memory storage');
        logger.warn('📝 For production: sudo apt install redis-server && sudo systemctl start redis-server');
        this.storage = new MemoryStorageService();
        await this.storage.connect();
      } else {
        logger.error('❌ Redis connection failed and fallback disabled');
        throw error;
      }
    }
  }

  async registerAgent(registration: AgentRegistration): Promise<Agent> {
    // Validate registration
    if (!registration.projectPath) {
      throw new ValidationError('Project path is required');
    }

    // Check if agent already exists
    const existingAgent = await this.storage.getAgent(registration.id);
    if (existingAgent) {
      throw new ValidationError(`Agent with ID ${registration.id} already exists`);
    }

    // Create agent
    const agent: Agent = {
      id: registration.id,
      parentId: registration.parentId,
      projectPath: registration.projectPath,
      status: 'idle',
      created: new Date(),
      lastActivity: new Date(),
      context: sanitizeContext(registration.context || {}),
      logs: [
        createLogEntry('info', `Agent registered for project: ${registration.projectPath}`)
      ],
      tags: registration.tags || []
    };

    await this.storage.saveAgent(agent);
    
    logger.info(`Agent registered: ${agent.id} for project: ${agent.projectPath}`);
    
    return agent;
  }

  async getAgent(id: string): Promise<Agent> {
    const agent = await this.storage.getAgent(id);
    if (!agent) {
      throw new NotFoundError(`Agent with ID ${id} not found`);
    }
    return agent;
  }

  async getAgents(query: AgentQuery = {}): Promise<Agent[]> {
    return await this.storage.getAgents(query);
  }

  async updateAgentStatus(id: string, status: Agent['status']): Promise<Agent> {
    const agent = await this.getAgent(id);
    
    await this.storage.updateAgentStatus(id, status);
    
    // Add status change log
    const logEntry = createLogEntry('info', `Status changed to: ${status}`);
    await this.storage.addLogToAgent(id, logEntry);
    
    logger.info(`Agent ${id} status changed to: ${status}`);
    
    return await this.getAgent(id);
  }

  async addLogEntry(id: string, entry: Omit<LogEntry, 'id' | 'timestamp'>): Promise<void> {
    const logEntry = createLogEntry(entry.level, entry.message, entry.metadata);
    await this.storage.addLogToAgent(id, logEntry);
  }

  async updateAgentContext(id: string, context: Record<string, any>): Promise<Agent> {
    const agent = await this.getAgent(id);
    
    agent.context = { ...agent.context, ...sanitizeContext(context) };
    agent.lastActivity = new Date();
    
    await this.storage.saveAgent(agent);
    
    const logEntry = createLogEntry('info', 'Context updated');
    await this.storage.addLogToAgent(id, logEntry);
    
    return agent;
  }

  async handoffAgent(context: HandoffContext): Promise<void> {
    const fromAgent = await this.getAgent(context.fromAgentId);
    const toAgent = await this.getAgent(context.toAgentId);
    
    // Update from agent status
    await this.updateAgentStatus(context.fromAgentId, 'handoff');
    
    // Update to agent with handoff context
    await this.updateAgentContext(context.toAgentId, context.context);
    await this.updateAgentStatus(context.toAgentId, 'active');
    
    // Add handoff logs
    const fromLogEntry = createLogEntry('info', `Handed off to agent: ${context.toAgentId}`, {
      reason: context.reason,
      toAgent: context.toAgentId
    });
    
    const toLogEntry = createLogEntry('info', `Received handoff from agent: ${context.fromAgentId}`, {
      reason: context.reason,
      fromAgent: context.fromAgentId
    });
    
    await this.storage.addLogToAgent(context.fromAgentId, fromLogEntry);
    await this.storage.addLogToAgent(context.toAgentId, toLogEntry);
    
    logger.info(`Agent handoff: ${context.fromAgentId} -> ${context.toAgentId}`);
  }

  async deleteAgent(id: string): Promise<void> {
    const agent = await this.getAgent(id);
    await this.storage.deleteAgent(id);
    
    logger.info(`Agent deleted: ${id}`);
  }

  async getProjectStats(projectPath: string): Promise<Record<string, number>> {
    return await this.storage.getProjectStats(projectPath);
  }

  async getActiveAgents(): Promise<Agent[]> {
    return await this.getAgents({ status: 'active' });
  }

  async getAgentHierarchy(rootId?: string): Promise<Map<string, Agent[]>> {
    const agents = await this.getAgents();
    const hierarchy = new Map<string, Agent[]>();
    
    for (const agent of agents) {
      const parentId = agent.parentId || 'root';
      if (!hierarchy.has(parentId)) {
        hierarchy.set(parentId, []);
      }
      hierarchy.get(parentId)!.push(agent);
    }
    
    return hierarchy;
  }

  async searchAgents(query: string): Promise<Agent[]> {
    const agents = await this.getAgents();
    const lowerQuery = query.toLowerCase();
    
    return agents.filter(agent => 
      agent.id.toLowerCase().includes(lowerQuery) ||
      agent.projectPath.toLowerCase().includes(lowerQuery) ||
      agent.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      agent.logs.some(log => log.message.toLowerCase().includes(lowerQuery))
    );
  }

  async getAgentLogs(id: string, limit: number = 100): Promise<LogEntry[]> {
    const agent = await this.getAgent(id);
    return agent.logs.slice(-limit);
  }

  async cleanup(): Promise<void> {
    await this.storage.cleanup();
    logger.info('Agent cleanup completed');
  }

  async healthCheck(): Promise<{ healthy: boolean; stats: any }> {
    try {
      const agents = await this.getAgents({ limit: 1 });
      const stats = {
        totalAgents: agents.length,
        timestamp: new Date().toISOString()
      };
      
      return { healthy: true, stats };
    } catch (error) {
      logger.error('Health check failed:', error);
      return { healthy: false, stats: null };
    }
  }
}