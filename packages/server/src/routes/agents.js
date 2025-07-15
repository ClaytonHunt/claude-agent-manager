"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentRoutes = agentRoutes;
const express_1 = require("express");
const shared_1 = require("@claude-agent-manager/shared");
const zod_1 = require("zod");
const agentRegistrationSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    projectPath: zod_1.z.string().min(1),
    parentId: zod_1.z.string().optional(),
    context: zod_1.z.record(zod_1.z.any()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional()
});
const agentQuerySchema = zod_1.z.object({
    projectPath: zod_1.z.string().optional(),
    status: zod_1.z.enum(['idle', 'active', 'error', 'handoff', 'complete']).optional(),
    parentId: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    limit: zod_1.z.number().int().positive().optional(),
    offset: zod_1.z.number().int().min(0).optional()
});
const logEntrySchema = zod_1.z.object({
    level: zod_1.z.enum(['info', 'warn', 'error', 'debug']),
    message: zod_1.z.string(),
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
const handoffSchema = zod_1.z.object({
    fromAgentId: zod_1.z.string(),
    toAgentId: zod_1.z.string(),
    context: zod_1.z.record(zod_1.z.any()),
    reason: zod_1.z.string()
});
function agentRoutes(agentService, wsService) {
    const router = (0, express_1.Router)();
    // Register a new agent
    router.post('/', async (req, res) => {
        try {
            const registration = agentRegistrationSchema.parse(req.body);
            const agent = await agentService.registerAgent(registration);
            wsService.broadcastAgentUpdate(agent);
            res.status(201).json(agent);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new shared_1.ValidationError(error.errors.map(e => e.message).join(', '));
            }
            throw error;
        }
    });
    // Get all agents with optional filtering
    router.get('/', async (req, res) => {
        try {
            const query = agentQuerySchema.parse(req.query);
            const agents = await agentService.getAgents(query);
            res.json(agents);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new shared_1.ValidationError(error.errors.map(e => e.message).join(', '));
            }
            throw error;
        }
    });
    // Get specific agent
    router.get('/:id', async (req, res) => {
        const agent = await agentService.getAgent(req.params.id);
        res.json(agent);
    });
    // Update agent status
    router.patch('/:id/status', async (req, res) => {
        const { status } = req.body;
        if (!status || !['idle', 'active', 'error', 'handoff', 'complete'].includes(status)) {
            throw new shared_1.ValidationError('Invalid status value');
        }
        const agent = await agentService.updateAgentStatus(req.params.id, status);
        wsService.broadcastAgentUpdate(agent);
        res.json(agent);
    });
    // Add log entry to agent
    router.post('/:id/logs', async (req, res) => {
        try {
            const logEntry = logEntrySchema.parse(req.body);
            await agentService.addLogEntry(req.params.id, logEntry);
            const agent = await agentService.getAgent(req.params.id);
            const newLogEntry = agent.logs[agent.logs.length - 1];
            wsService.broadcastLogEntry(req.params.id, newLogEntry);
            res.status(201).json({ success: true });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new shared_1.ValidationError(error.errors.map(e => e.message).join(', '));
            }
            throw error;
        }
    });
    // Get agent logs
    router.get('/:id/logs', async (req, res) => {
        const limit = parseInt(req.query.limit) || 100;
        const logs = await agentService.getAgentLogs(req.params.id, limit);
        res.json(logs);
    });
    // Update agent context
    router.patch('/:id/context', async (req, res) => {
        const { context } = req.body;
        if (!context || typeof context !== 'object') {
            throw new shared_1.ValidationError('Context must be an object');
        }
        const agent = await agentService.updateAgentContext(req.params.id, context);
        wsService.broadcastAgentUpdate(agent);
        res.json(agent);
    });
    // Agent handoff
    router.post('/handoff', async (req, res) => {
        try {
            const handoff = handoffSchema.parse(req.body);
            await agentService.handoffAgent({
                ...handoff,
                timestamp: new Date()
            });
            wsService.broadcastHandoff(handoff.fromAgentId, handoff.toAgentId, handoff.context);
            res.json({ success: true });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new shared_1.ValidationError(error.errors.map(e => e.message).join(', '));
            }
            throw error;
        }
    });
    // Delete agent
    router.delete('/:id', async (req, res) => {
        await agentService.deleteAgent(req.params.id);
        // Broadcast deletion
        wsService.broadcastAgentUpdate({
            id: req.params.id,
            deleted: true
        });
        res.status(204).send();
    });
    // Get project statistics
    router.get('/projects/:projectPath/stats', async (req, res) => {
        const stats = await agentService.getProjectStats(req.params.projectPath);
        res.json(stats);
    });
    // Search agents
    router.get('/search/:query', async (req, res) => {
        const agents = await agentService.searchAgents(req.params.query);
        res.json(agents);
    });
    // Get agent hierarchy
    router.get('/hierarchy/:rootId?', async (req, res) => {
        const hierarchy = await agentService.getAgentHierarchy(req.params.rootId);
        // Convert Map to object for JSON serialization
        const hierarchyObj = {};
        for (const [key, value] of hierarchy) {
            hierarchyObj[key] = value;
        }
        res.json(hierarchyObj);
    });
    return router;
}
