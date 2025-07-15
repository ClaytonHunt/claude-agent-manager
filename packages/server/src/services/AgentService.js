"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentService = void 0;
const shared_1 = require("@claude-agent-manager/shared");
const logger_1 = require("../utils/logger");
class AgentService {
    redisService;
    constructor(redisService) {
        this.redisService = redisService;
    }
    async registerAgent(registration) {
        // Validate registration
        if (!registration.projectPath) {
            throw new shared_1.ValidationError('Project path is required');
        }
        // Check if agent already exists
        const existingAgent = await this.redisService.getAgent(registration.id);
        if (existingAgent) {
            throw new shared_1.ValidationError(`Agent with ID ${registration.id} already exists`);
        }
        // Create agent
        const agent = {
            id: registration.id,
            parentId: registration.parentId,
            projectPath: registration.projectPath,
            status: 'idle',
            created: new Date(),
            lastActivity: new Date(),
            context: (0, shared_1.sanitizeContext)(registration.context || {}),
            logs: [
                (0, shared_1.createLogEntry)('info', `Agent registered for project: ${registration.projectPath}`)
            ],
            tags: registration.tags || []
        };
        await this.redisService.saveAgent(agent);
        logger_1.logger.info(`Agent registered: ${agent.id} for project: ${agent.projectPath}`);
        return agent;
    }
    async getAgent(id) {
        const agent = await this.redisService.getAgent(id);
        if (!agent) {
            throw new shared_1.NotFoundError(`Agent with ID ${id} not found`);
        }
        return agent;
    }
    async getAgents(query = {}) {
        return await this.redisService.getAgents(query);
    }
    async updateAgentStatus(id, status) {
        const agent = await this.getAgent(id);
        await this.redisService.updateAgentStatus(id, status);
        // Add status change log
        const logEntry = (0, shared_1.createLogEntry)('info', `Status changed to: ${status}`);
        await this.redisService.addLogToAgent(id, logEntry);
        logger_1.logger.info(`Agent ${id} status changed to: ${status}`);
        return await this.getAgent(id);
    }
    async addLogEntry(id, entry) {
        const logEntry = (0, shared_1.createLogEntry)(entry.level, entry.message, entry.metadata);
        await this.redisService.addLogToAgent(id, logEntry);
    }
    async updateAgentContext(id, context) {
        const agent = await this.getAgent(id);
        agent.context = { ...agent.context, ...(0, shared_1.sanitizeContext)(context) };
        agent.lastActivity = new Date();
        await this.redisService.saveAgent(agent);
        const logEntry = (0, shared_1.createLogEntry)('info', 'Context updated');
        await this.redisService.addLogToAgent(id, logEntry);
        return agent;
    }
    async handoffAgent(context) {
        const fromAgent = await this.getAgent(context.fromAgentId);
        const toAgent = await this.getAgent(context.toAgentId);
        // Update from agent status
        await this.updateAgentStatus(context.fromAgentId, 'handoff');
        // Update to agent with handoff context
        await this.updateAgentContext(context.toAgentId, context.context);
        await this.updateAgentStatus(context.toAgentId, 'active');
        // Add handoff logs
        const fromLogEntry = (0, shared_1.createLogEntry)('info', `Handed off to agent: ${context.toAgentId}`, {
            reason: context.reason,
            toAgent: context.toAgentId
        });
        const toLogEntry = (0, shared_1.createLogEntry)('info', `Received handoff from agent: ${context.fromAgentId}`, {
            reason: context.reason,
            fromAgent: context.fromAgentId
        });
        await this.redisService.addLogToAgent(context.fromAgentId, fromLogEntry);
        await this.redisService.addLogToAgent(context.toAgentId, toLogEntry);
        logger_1.logger.info(`Agent handoff: ${context.fromAgentId} -> ${context.toAgentId}`);
    }
    async deleteAgent(id) {
        const agent = await this.getAgent(id);
        await this.redisService.deleteAgent(id);
        logger_1.logger.info(`Agent deleted: ${id}`);
    }
    async getProjectStats(projectPath) {
        return await this.redisService.getProjectStats(projectPath);
    }
    async getActiveAgents() {
        return await this.getAgents({ status: 'active' });
    }
    async getAgentHierarchy(rootId) {
        const agents = await this.getAgents();
        const hierarchy = new Map();
        for (const agent of agents) {
            const parentId = agent.parentId || 'root';
            if (!hierarchy.has(parentId)) {
                hierarchy.set(parentId, []);
            }
            hierarchy.get(parentId).push(agent);
        }
        return hierarchy;
    }
    async searchAgents(query) {
        const agents = await this.getAgents();
        const lowerQuery = query.toLowerCase();
        return agents.filter(agent => agent.id.toLowerCase().includes(lowerQuery) ||
            agent.projectPath.toLowerCase().includes(lowerQuery) ||
            agent.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
            agent.logs.some(log => log.message.toLowerCase().includes(lowerQuery)));
    }
    async getAgentLogs(id, limit = 100) {
        const agent = await this.getAgent(id);
        return agent.logs.slice(-limit);
    }
    async cleanup() {
        await this.redisService.cleanup();
        logger_1.logger.info('Agent cleanup completed');
    }
    async healthCheck() {
        try {
            const agents = await this.getAgents({ limit: 1 });
            const stats = {
                totalAgents: agents.length,
                timestamp: new Date().toISOString()
            };
            return { healthy: true, stats };
        }
        catch (error) {
            logger_1.logger.error('Health check failed:', error);
            return { healthy: false, stats: null };
        }
    }
}
exports.AgentService = AgentService;
