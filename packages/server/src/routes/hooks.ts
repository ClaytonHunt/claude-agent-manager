import { Router, Request, Response } from 'express';
import { AgentService } from '../services/AgentService';
import { WebSocketService } from '../services/WebSocketService';
import { HookEvent, ValidationError } from '@claude-agent-manager/shared';
import { z } from 'zod';
import { logger } from '../utils/logger';

const hookEventSchema = z.object({
  type: z.string(),
  agentId: z.string(),
  timestamp: z.string().datetime(),
  data: z.record(z.any())
});

export function hookRoutes(
  agentService: AgentService,
  wsService: WebSocketService
): Router {
  const router = Router();

  // Claude Code hook receiver
  router.post('/claude-code', async (req: Request, res: Response) => {
    try {
      const parsed = hookEventSchema.parse(req.body);
      const hookEvent: HookEvent = {
        ...parsed,
        timestamp: new Date(parsed.timestamp)
      };
      
      await handleClaudeCodeHook(hookEvent, agentService, wsService);
      
      res.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  });

  // Generic webhook receiver
  router.post('/webhook/:type', async (req: Request, res: Response) => {
    const { type } = req.params;
    const data = req.body;
    
    logger.info(`Received webhook: ${type}`, data);
    
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
        logger.warn(`Unknown webhook type: ${type}`);
    }
    
    res.json({ success: true });
  });

  // Health check for hooks
  router.get('/health', (req: Request, res: Response) => {
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

async function handleClaudeCodeHook(
  hookEvent: HookEvent,
  agentService: AgentService,
  wsService: WebSocketService
): Promise<void> {
  const { type, agentId, data } = hookEvent;
  
  logger.info(`Claude Code hook: ${type} for agent ${agentId}`);
  
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
        logger.warn(`Unknown Claude Code hook type: ${type}`);
    }
  } catch (error) {
    logger.error(`Error handling Claude Code hook ${type}:`, error);
  }
}

async function handleAgentStarted(
  agentId: string,
  data: any,
  agentService: AgentService,
  wsService: WebSocketService
): Promise<void> {
  try {
    await agentService.updateAgentStatus(agentId, 'active');
    await agentService.addLogEntry(agentId, {
      level: 'info',
      message: 'Agent started',
      metadata: data
    });
  } catch (error) {
    logger.error(`Error handling agent started: ${error}`);
  }
}

async function handleAgentStopped(
  agentId: string,
  data: any,
  agentService: AgentService,
  wsService: WebSocketService
): Promise<void> {
  try {
    await agentService.updateAgentStatus(agentId, 'complete');
    await agentService.addLogEntry(agentId, {
      level: 'info',
      message: 'Agent stopped',
      metadata: data
    });
  } catch (error) {
    logger.error(`Error handling agent stopped: ${error}`);
  }
}

async function handleAgentErrored(
  agentId: string,
  data: any,
  agentService: AgentService,
  wsService: WebSocketService
): Promise<void> {
  try {
    await agentService.updateAgentStatus(agentId, 'error');
    await agentService.addLogEntry(agentId, {
      level: 'error',
      message: `Agent error: ${data.error || 'Unknown error'}`,
      metadata: data
    });
  } catch (error) {
    logger.error(`Error handling agent error: ${error}`);
  }
}

async function handleToolCalled(
  agentId: string,
  data: any,
  agentService: AgentService,
  wsService: WebSocketService
): Promise<void> {
  try {
    await agentService.addLogEntry(agentId, {
      level: 'info',
      message: `Tool called: ${data.tool || 'unknown'}`,
      metadata: data
    });
  } catch (error) {
    logger.error(`Error handling tool called: ${error}`);
  }
}

async function handleToolCompleted(
  agentId: string,
  data: any,
  agentService: AgentService,
  wsService: WebSocketService
): Promise<void> {
  try {
    await agentService.addLogEntry(agentId, {
      level: 'info',
      message: `Tool completed: ${data.tool || 'unknown'}`,
      metadata: data
    });
  } catch (error) {
    logger.error(`Error handling tool completed: ${error}`);
  }
}

async function handleContextUpdated(
  agentId: string,
  data: any,
  agentService: AgentService,
  wsService: WebSocketService
): Promise<void> {
  try {
    await agentService.updateAgentContext(agentId, data.context || {});
    await agentService.addLogEntry(agentId, {
      level: 'info',
      message: 'Context updated',
      metadata: data
    });
  } catch (error) {
    logger.error(`Error handling context updated: ${error}`);
  }
}

async function handleTaskStarted(
  agentId: string,
  data: any,
  agentService: AgentService,
  wsService: WebSocketService
): Promise<void> {
  try {
    await agentService.addLogEntry(agentId, {
      level: 'info',
      message: `Task started: ${data.task || 'unknown'}`,
      metadata: data
    });
  } catch (error) {
    logger.error(`Error handling task started: ${error}`);
  }
}

async function handleTaskCompleted(
  agentId: string,
  data: any,
  agentService: AgentService,
  wsService: WebSocketService
): Promise<void> {
  try {
    await agentService.addLogEntry(agentId, {
      level: 'info',
      message: `Task completed: ${data.task || 'unknown'}`,
      metadata: data
    });
  } catch (error) {
    logger.error(`Error handling task completed: ${error}`);
  }
}

// Helper functions for webhook handlers
async function handleAgentStart(
  data: any,
  agentService: AgentService,
  wsService: WebSocketService
): Promise<void> {
  const { agentId, projectPath } = data;
  
  try {
    await agentService.registerAgent({
      id: agentId,
      projectPath,
      context: data.context || {},
      tags: data.tags || []
    });
  } catch (error) {
    logger.error(`Error registering agent: ${error}`);
  }
}

async function handleAgentStop(
  data: any,
  agentService: AgentService,
  wsService: WebSocketService
): Promise<void> {
  const { agentId } = data;
  
  try {
    await agentService.updateAgentStatus(agentId, 'complete');
  } catch (error) {
    logger.error(`Error stopping agent: ${error}`);
  }
}

async function handleAgentError(
  data: any,
  agentService: AgentService,
  wsService: WebSocketService
): Promise<void> {
  const { agentId, error } = data;
  
  try {
    await agentService.updateAgentStatus(agentId, 'error');
    await agentService.addLogEntry(agentId, {
      level: 'error',
      message: `Agent error: ${error}`,
      metadata: data
    });
  } catch (err) {
    logger.error(`Error handling agent error: ${err}`);
  }
}

async function handleContextUpdate(
  data: any,
  agentService: AgentService,
  wsService: WebSocketService
): Promise<void> {
  const { agentId, context } = data;
  
  try {
    await agentService.updateAgentContext(agentId, context);
  } catch (error) {
    logger.error(`Error updating context: ${error}`);
  }
}