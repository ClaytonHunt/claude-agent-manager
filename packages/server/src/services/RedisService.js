"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const redis_1 = require("redis");
const logger_1 = require("../utils/logger");
class RedisService {
    client;
    keyPrefix = 'claude-agent:';
    retentionDays;
    constructor(url) {
        this.client = (0, redis_1.createClient)({ url });
        this.retentionDays = parseInt(process.env.RETENTION_DAYS || '30');
        this.client.on('error', (err) => {
            logger_1.logger.error('Redis Client Error:', err);
        });
        this.client.on('connect', () => {
            logger_1.logger.info('Connected to Redis');
        });
    }
    async connect() {
        await this.client.connect();
    }
    async disconnect() {
        await this.client.disconnect();
    }
    agentKey(id) {
        return `${this.keyPrefix}agent:${id}`;
    }
    projectKey(projectPath) {
        return `${this.keyPrefix}project:${projectPath}`;
    }
    statusKey(status) {
        return `${this.keyPrefix}status:${status}`;
    }
    async saveAgent(agent) {
        const key = this.agentKey(agent.id);
        const data = JSON.stringify({
            ...agent,
            created: agent.created.toISOString(),
            lastActivity: agent.lastActivity.toISOString(),
            logs: agent.logs.map(log => ({
                ...log,
                timestamp: log.timestamp.toISOString()
            }))
        });
        await this.client.setEx(key, this.retentionDays * 24 * 60 * 60, data);
        // Add to project index
        await this.client.sAdd(this.projectKey(agent.projectPath), agent.id);
        // Add to status index
        await this.client.sAdd(this.statusKey(agent.status), agent.id);
        // Refresh TTL on access
        await this.refreshTTL(agent.id);
    }
    async getAgent(id) {
        const key = this.agentKey(id);
        const data = await this.client.get(key);
        if (!data)
            return null;
        // Refresh TTL on access
        await this.refreshTTL(id);
        const parsed = JSON.parse(data);
        return {
            ...parsed,
            created: new Date(parsed.created),
            lastActivity: new Date(parsed.lastActivity),
            logs: parsed.logs.map((log) => ({
                ...log,
                timestamp: new Date(log.timestamp)
            }))
        };
    }
    async getAgents(query = {}) {
        let agentIds = [];
        if (query.projectPath) {
            agentIds = await this.client.sMembers(this.projectKey(query.projectPath));
        }
        else if (query.status) {
            agentIds = await this.client.sMembers(this.statusKey(query.status));
        }
        else {
            // Get all agent keys
            const keys = await this.client.keys(`${this.keyPrefix}agent:*`);
            agentIds = keys.map(key => key.replace(`${this.keyPrefix}agent:`, ''));
        }
        const agents = [];
        for (const id of agentIds) {
            const agent = await this.getAgent(id);
            if (agent) {
                // Apply additional filters
                if (query.parentId && agent.parentId !== query.parentId)
                    continue;
                if (query.tags && !query.tags.some(tag => agent.tags.includes(tag)))
                    continue;
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
    async deleteAgent(id) {
        const agent = await this.getAgent(id);
        if (!agent)
            return;
        // Remove from indexes
        await this.client.sRem(this.projectKey(agent.projectPath), id);
        await this.client.sRem(this.statusKey(agent.status), id);
        // Delete agent data
        await this.client.del(this.agentKey(id));
    }
    async updateAgentStatus(id, status) {
        const agent = await this.getAgent(id);
        if (!agent)
            return;
        // Remove from old status index
        await this.client.sRem(this.statusKey(agent.status), id);
        // Add to new status index
        await this.client.sAdd(this.statusKey(status), id);
        // Update agent
        agent.status = status;
        agent.lastActivity = new Date();
        await this.saveAgent(agent);
    }
    async addLogToAgent(id, log) {
        const agent = await this.getAgent(id);
        if (!agent)
            return;
        agent.logs.push(log);
        agent.lastActivity = new Date();
        // Keep only last 1000 logs per agent
        if (agent.logs.length > 1000) {
            agent.logs = agent.logs.slice(-1000);
        }
        await this.saveAgent(agent);
    }
    async getProjectStats(projectPath) {
        const agentIds = await this.client.sMembers(this.projectKey(projectPath));
        const stats = {
            total: agentIds.length,
            idle: 0,
            active: 0,
            error: 0,
            handoff: 0,
            complete: 0
        };
        for (const id of agentIds) {
            const agent = await this.getAgent(id);
            if (agent) {
                stats[agent.status]++;
            }
        }
        return stats;
    }
    async refreshTTL(id) {
        const key = this.agentKey(id);
        await this.client.expire(key, this.retentionDays * 24 * 60 * 60);
    }
    async cleanup() {
        // Clean up expired agents from indexes
        const projects = await this.client.keys(`${this.keyPrefix}project:*`);
        const statuses = await this.client.keys(`${this.keyPrefix}status:*`);
        for (const projectKey of projects) {
            const agentIds = await this.client.sMembers(projectKey);
            for (const id of agentIds) {
                const exists = await this.client.exists(this.agentKey(id));
                if (!exists) {
                    await this.client.sRem(projectKey, id);
                }
            }
        }
        for (const statusKey of statuses) {
            const agentIds = await this.client.sMembers(statusKey);
            for (const id of agentIds) {
                const exists = await this.client.exists(this.agentKey(id));
                if (!exists) {
                    await this.client.sRem(statusKey, id);
                }
            }
        }
    }
}
exports.RedisService = RedisService;
