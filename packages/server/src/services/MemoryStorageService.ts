import { Agent, AgentQuery, LogEntry } from '@claude-agent-manager/shared';
import { logger } from '../utils/logger';

/**
 * In-memory storage service for development when Redis is not available
 * This is NOT suitable for production use!
 */
export class MemoryStorageService {
  private agents: Map<string, Agent> = new Map();
  private projectIndex: Map<string, Set<string>> = new Map();
  private statusIndex: Map<string, Set<string>> = new Map();
  private retentionMs: number;

  constructor() {
    this.retentionMs = parseInt(process.env.RETENTION_DAYS || '30') * 24 * 60 * 60 * 1000;
    logger.warn('⚠️  Using in-memory storage - data will be lost on restart!');
    logger.warn('⚠️  Install Redis for production use: sudo apt install redis-server');
    
    // Cleanup old entries every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  async connect(): Promise<void> {
    logger.info('✅ Memory storage ready (development mode)');
  }

  async disconnect(): Promise<void> {
    this.agents.clear();
    this.projectIndex.clear();
    this.statusIndex.clear();
  }

  async saveAgent(agent: Agent): Promise<void> {
    const oldAgent = this.agents.get(agent.id);
    
    // Remove from old indexes if status/project changed
    if (oldAgent) {
      if (oldAgent.status !== agent.status) {
        this.removeFromStatusIndex(oldAgent.status, agent.id);
      }
      if (oldAgent.projectPath !== agent.projectPath) {
        this.removeFromProjectIndex(oldAgent.projectPath, agent.id);
      }
    }
    
    // Save agent
    this.agents.set(agent.id, { ...agent });
    
    // Update indexes
    this.addToProjectIndex(agent.projectPath, agent.id);
    this.addToStatusIndex(agent.status, agent.id);
  }

  async getAgent(id: string): Promise<Agent | null> {
    const agent = this.agents.get(id);
    if (!agent) return null;
    
    // Check if expired
    const now = Date.now();
    const agentAge = now - agent.created.getTime();
    if (agentAge > this.retentionMs) {
      await this.deleteAgent(id);
      return null;
    }
    
    return { ...agent };
  }

  async getAgents(query: AgentQuery = {}): Promise<Agent[]> {
    let agentIds: string[] = [];
    
    if (query.projectPath) {
      const projectAgents = this.projectIndex.get(query.projectPath);
      agentIds = projectAgents ? Array.from(projectAgents) : [];
    } else if (query.status) {
      const statusAgents = this.statusIndex.get(query.status);
      agentIds = statusAgents ? Array.from(statusAgents) : [];
    } else {
      agentIds = Array.from(this.agents.keys());
    }
    
    const agents: Agent[] = [];
    
    for (const id of agentIds) {
      const agent = await this.getAgent(id);
      if (agent) {
        // Apply additional filters
        if (query.parentId && agent.parentId !== query.parentId) continue;
        if (query.tags && !query.tags.some(tag => agent.tags.includes(tag))) continue;
        
        agents.push(agent);
      }
    }
    
    // Sort by last activity
    agents.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    
    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    
    return agents.slice(offset, offset + limit);
  }

  async deleteAgent(id: string): Promise<void> {
    const agent = this.agents.get(id);
    if (!agent) return;
    
    // Remove from indexes
    this.removeFromProjectIndex(agent.projectPath, id);
    this.removeFromStatusIndex(agent.status, id);
    
    // Delete agent
    this.agents.delete(id);
  }

  async updateAgentStatus(id: string, status: Agent['status']): Promise<void> {
    const agent = this.agents.get(id);
    if (!agent) return;
    
    // Remove from old status index
    this.removeFromStatusIndex(agent.status, id);
    
    // Update agent
    agent.status = status;
    agent.lastActivity = new Date();
    
    // Add to new status index
    this.addToStatusIndex(status, id);
    
    this.agents.set(id, agent);
  }

  async addLogToAgent(id: string, log: LogEntry): Promise<void> {
    const agent = this.agents.get(id);
    if (!agent) return;
    
    agent.logs.push(log);
    agent.lastActivity = new Date();
    
    // Keep only last 1000 logs per agent
    if (agent.logs.length > 1000) {
      agent.logs = agent.logs.slice(-1000);
    }
    
    this.agents.set(id, agent);
  }

  async getProjectStats(projectPath: string): Promise<Record<string, number>> {
    const agentIds = this.projectIndex.get(projectPath);
    const stats: Record<string, number> = {
      total: agentIds ? agentIds.size : 0,
      idle: 0,
      active: 0,
      error: 0,
      handoff: 0,
      complete: 0
    };
    
    if (agentIds) {
      for (const id of agentIds) {
        const agent = this.agents.get(id);
        if (agent) {
          stats[agent.status]++;
        }
      }
    }
    
    return stats;
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    const expiredIds: string[] = [];
    
    // Find expired agents
    for (const [id, agent] of this.agents) {
      const agentAge = now - agent.created.getTime();
      if (agentAge > this.retentionMs) {
        expiredIds.push(id);
      }
    }
    
    // Remove expired agents
    for (const id of expiredIds) {
      await this.deleteAgent(id);
    }
    
    if (expiredIds.length > 0) {
      logger.info(`🧹 Cleaned up ${expiredIds.length} expired agents`);
    }
  }

  private addToProjectIndex(projectPath: string, agentId: string): void {
    if (!this.projectIndex.has(projectPath)) {
      this.projectIndex.set(projectPath, new Set());
    }
    this.projectIndex.get(projectPath)!.add(agentId);
  }

  private removeFromProjectIndex(projectPath: string, agentId: string): void {
    const agents = this.projectIndex.get(projectPath);
    if (agents) {
      agents.delete(agentId);
      if (agents.size === 0) {
        this.projectIndex.delete(projectPath);
      }
    }
  }

  private addToStatusIndex(status: string, agentId: string): void {
    if (!this.statusIndex.has(status)) {
      this.statusIndex.set(status, new Set());
    }
    this.statusIndex.get(status)!.add(agentId);
  }

  private removeFromStatusIndex(status: string, agentId: string): void {
    const agents = this.statusIndex.get(status);
    if (agents) {
      agents.delete(agentId);
      if (agents.size === 0) {
        this.statusIndex.delete(status);
      }
    }
  }

  // Stats for debugging
  getStats(): { totalAgents: number; totalProjects: number; memoryUsage: string } {
    return {
      totalAgents: this.agents.size,
      totalProjects: this.projectIndex.size,
      memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
    };
  }
}