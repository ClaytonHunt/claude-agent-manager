"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hookRoutes = hookRoutes;
const express_1 = require("express");
const shared_1 = require("@claude-agent-manager/shared");
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const hookEventSchema = zod_1.z.object({
    type: zod_1.z.string(),
    agentId: zod_1.z.string(),
    timestamp: zod_1.z.string().datetime(),
    data: zod_1.z.record(zod_1.z.any())
});
function hookRoutes(agentService, wsService) {
    const router = (0, express_1.Router)();
    // Claude Code hook receiver
    router.post('/claude-code', async (req, res) => {
        try {
            const parsed = hookEventSchema.parse(req.body);
            const hookEvent = {
                ...parsed,
                timestamp: new Date(parsed.timestamp)
            };
            await handleClaudeCodeHook(hookEvent, agentService, wsService);
            res.json({ success: true, timestamp: new Date().toISOString() });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new shared_1.ValidationError(error.errors.map(e => e.message).join(', '));
            }
            throw error;
        }
    });
    // Generic webhook receiver
    router.post('/webhook/:type', async (req, res) => {
        const { type } = req.params;
        const data = req.body;
        logger_1.logger.info(`Received webhook: ${type}`, data);
        // Handle different webhook types
        switch (type) {
            case 'agent-start':
                await handleAgentStart(data, agentService, wsService);
                break;
            case 'agent-stop':
                await handleAgentStop(data, agentService, wsService);
                break;
            case 'agent-error':
                await handleAgentError(data, agentService, wsService);
                break;
            case 'context-update':
                await handleContextUpdate(data, agentService, wsService);
                break;
            default:
                logger_1.logger.warn(`Unknown webhook type: ${type}`);
        }
        res.json({ success: true });
    });
    // Health check for hooks
    router.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            webhooks: {
                'claude-code': '/api/hooks/claude-code',
                'agent-start': '/api/hooks/webhook/agent-start',
                'agent-stop': '/api/hooks/webhook/agent-stop',
                'agent-error': '/api/hooks/webhook/agent-error',
                'context-update': '/api/hooks/webhook/context-update'
            }
        });
    });
    return router;
}
async function handleClaudeCodeHook(hookEvent, agentService, wsService) {
    const { type, agentId, data } = hookEvent;
    logger_1.logger.info(`Claude Code hook: ${type} for agent ${agentId}`);
    try {
        switch (type) {
            case 'agent.started':
                await handleAgentStarted(agentId, data, agentService, wsService);
                break;
            case 'agent.stopped':
                await handleAgentStopped(agentId, data, agentService, wsService);
                break;
            case 'agent.error':
                await handleAgentErrored(agentId, data, agentService, wsService);
                break;
            case 'tool.called':
                await handleToolCalled(agentId, data, agentService, wsService);
                break;
            case 'tool.completed':
                await handleToolCompleted(agentId, data, agentService, wsService);
                break;
            case 'context.updated':
                await handleContextUpdated(agentId, data, agentService, wsService);
                break;
            case 'task.started':
                await handleTaskStarted(agentId, data, agentService, wsService);
                break;
            case 'task.completed':
                await handleTaskCompleted(agentId, data, agentService, wsService);
                break;
            default:
                logger_1.logger.warn(`Unknown Claude Code hook type: ${type}`);
        }
    }
    catch (error) {
        logger_1.logger.error(`Error handling Claude Code hook ${type}:`, error);
    }
}
async function handleAgentStarted(agentId, data, agentService, wsService) {
    try {
        await agentService.updateAgentStatus(agentId, 'active');
        await agentService.addLogEntry(agentId, {
            level: 'info',
            message: 'Agent started',
            metadata: data
        });
    }
    catch (error) {
        logger_1.logger.error(`Error handling agent started: ${error}`);
    }
}
async function handleAgentStopped(agentId, data, agentService, wsService) {
    try {
        await agentService.updateAgentStatus(agentId, 'complete');
        await agentService.addLogEntry(agentId, {
            level: 'info',
            message: 'Agent stopped',
            metadata: data
        });
    }
    catch (error) {
        logger_1.logger.error(`Error handling agent stopped: ${error}`);
    }
}
async function handleAgentErrored(agentId, data, agentService, wsService) {
    try {
        await agentService.updateAgentStatus(agentId, 'error');
        await agentService.addLogEntry(agentId, {
            level: 'error',
            message: `Agent error: ${data.error || 'Unknown error'}`,
            metadata: data
        });
    }
    catch (error) {
        logger_1.logger.error(`Error handling agent error: ${error}`);
    }
}
async function handleToolCalled(agentId, data, agentService, wsService) {
    try {
        await agentService.addLogEntry(agentId, {
            level: 'info',
            message: `Tool called: ${data.tool || 'unknown'}`,
            metadata: data
        });
    }
    catch (error) {
        logger_1.logger.error(`Error handling tool called: ${error}`);
    }
}
async function handleToolCompleted(agentId, data, agentService, wsService) {
    try {
        await agentService.addLogEntry(agentId, {
            level: 'info',
            message: `Tool completed: ${data.tool || 'unknown'}`,
            metadata: data
        });
    }
    catch (error) {
        logger_1.logger.error(`Error handling tool completed: ${error}`);
    }
}
async function handleContextUpdated(agentId, data, agentService, wsService) {
    try {
        await agentService.updateAgentContext(agentId, data.context || {});
        await agentService.addLogEntry(agentId, {
            level: 'info',
            message: 'Context updated',
            metadata: data
        });
    }
    catch (error) {
        logger_1.logger.error(`Error handling context updated: ${error}`);
    }
}
async function handleTaskStarted(agentId, data, agentService, wsService) {
    try {
        await agentService.addLogEntry(agentId, {
            level: 'info',
            message: `Task started: ${data.task || 'unknown'}`,
            metadata: data
        });
    }
    catch (error) {
        logger_1.logger.error(`Error handling task started: ${error}`);
    }
}
async function handleTaskCompleted(agentId, data, agentService, wsService) {
    try {
        await agentService.addLogEntry(agentId, {
            level: 'info',
            message: `Task completed: ${data.task || 'unknown'}`,
            metadata: data
        });
    }
    catch (error) {
        logger_1.logger.error(`Error handling task completed: ${error}`);
    }
}
// Helper functions for webhook handlers
async function handleAgentStart(data, agentService, wsService) {
    const { agentId, projectPath } = data;
    try {
        await agentService.registerAgent({
            id: agentId,
            projectPath,
            context: data.context || {},
            tags: data.tags || []
        });
    }
    catch (error) {
        logger_1.logger.error(`Error registering agent: ${error}`);
    }
}
async function handleAgentStop(data, agentService, wsService) {
    const { agentId } = data;
    try {
        await agentService.updateAgentStatus(agentId, 'complete');
    }
    catch (error) {
        logger_1.logger.error(`Error stopping agent: ${error}`);
    }
}
async function handleAgentError(data, agentService, wsService) {
    const { agentId, error } = data;
    try {
        await agentService.updateAgentStatus(agentId, 'error');
        await agentService.addLogEntry(agentId, {
            level: 'error',
            message: `Agent error: ${error}`,
            metadata: data
        });
    }
    catch (err) {
        logger_1.logger.error(`Error handling agent error: ${err}`);
    }
}
async function handleContextUpdate(data, agentService, wsService) {
    const { agentId, context } = data;
    try {
        await agentService.updateAgentContext(agentId, context);
    }
    catch (error) {
        logger_1.logger.error(`Error updating context: ${error}`);
    }
}
