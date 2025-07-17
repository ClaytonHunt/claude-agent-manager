import { Router, Request, Response } from 'express';
import { AgentService } from '../services/AgentService';
import { WebSocketService } from '../services/WebSocketService';
import { HookEvent, ValidationError } from '@claude-agent-manager/shared';
import { z } from 'zod';
import { logger } from '../utils/logger';

// Helper function to extract specialist type from task description
function extractSpecialistType(description: string): string {
  const desc = description.toLowerCase();
  
  if (desc.includes('architecture') || desc.includes('system design')) {
    return 'architecture-specialist';
  }
  if (desc.includes('quality') || desc.includes('testing') || desc.includes('qa')) {
    return 'quality-specialist';
  }
  if (desc.includes('security') || desc.includes('threat') || desc.includes('vulnerability')) {
    return 'security-specialist';
  }
  if (desc.includes('performance') || desc.includes('optimization') || desc.includes('profiling')) {
    return 'performance-specialist';
  }
  if (desc.includes('frontend') || desc.includes('ui') || desc.includes('react') || desc.includes('component')) {
    return 'frontend-specialist';
  }
  if (desc.includes('backend') || desc.includes('api') || desc.includes('database') || desc.includes('server')) {
    return 'backend-specialist';
  }
  if (desc.includes('devops') || desc.includes('deployment') || desc.includes('ci/cd') || desc.includes('build')) {
    return 'devops-specialist';
  }
  if (desc.includes('documentation') || desc.includes('tech writer') || desc.includes('docs')) {
    return 'tech-writer-specialist';
  }
  if (desc.includes('code review') || desc.includes('review')) {
    return 'code-review-specialist';
  }
  
  return 'general-specialist';
}

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
        
      case 'pre_tool_use':
        await handlePreToolUse(agentId, data, agentService, wsService);
        break;
        
      case 'post_tool_use':
        await handlePostToolUse(agentId, data, agentService, wsService);
        break;
        
      case 'conversation_start':
        await handleConversationStart(agentId, data, agentService, wsService);
        break;
        
      case 'conversation_end':
        await handleConversationEnd(agentId, data, agentService, wsService);
        break;
        
      case 'stop':
        await handleStop(agentId, data, agentService, wsService);
        break;
        
      case 'notification':
        await handleNotification(agentId, data, agentService, wsService);
        break;
        
      case 'subagent_stop':
        await handleSubagentStop(agentId, data, agentService, wsService);
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
    // Ensure agent exists - register if not found
    try {
      await agentService.updateAgentStatus(agentId, 'active');
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        // Auto-register agent if it doesn't exist
        await agentService.registerAgent({
          id: agentId,
          projectPath: data.projectPath || data.workingDirectory || process.cwd(),
          context: data.context || {},
          tags: ['claude-code']
        });
        await agentService.updateAgentStatus(agentId, 'active');
      } else {
        throw error;
      }
    }
    
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
    // Ensure agent exists - register if not found
    try {
      await agentService.updateAgentStatus(agentId, 'complete');
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        // Auto-register agent if it doesn't exist
        await agentService.registerAgent({
          id: agentId,
          projectPath: data.projectPath || data.workingDirectory || process.cwd(),
          context: data.context || {},
          tags: ['claude-code']
        });
        await agentService.updateAgentStatus(agentId, 'complete');
      } else {
        throw error;
      }
    }
    
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
    // Ensure agent exists - register if not found
    try {
      await agentService.updateAgentStatus(agentId, 'error');
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        // Auto-register agent if it doesn't exist
        await agentService.registerAgent({
          id: agentId,
          projectPath: data.projectPath || data.workingDirectory || process.cwd(),
          context: data.context || {},
          tags: ['claude-code']
        });
        await agentService.updateAgentStatus(agentId, 'error');
      } else {
        throw error;
      }
    }
    
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

async function handlePreToolUse(
  agentId: string,
  data: any,
  agentService: AgentService,
  wsService: WebSocketService
): Promise<void> {
  try {
    // Ensure agent exists - register if not found
    try {
      await agentService.updateAgentStatus(agentId, 'active');
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        // Auto-register agent if it doesn't exist
        // For Task agents, use the description for better naming
        const taskDescription = data.toolInput?.description || data.tool_input?.description;
        const toolName = data.toolName || data.tool_name || data.tool;
        
        let agentTags = ['claude-code'];
        let agentContext = data.context || {};
        
        // Enhance context for Task agents
        if (toolName === 'Task' && taskDescription) {
          agentTags.push('specialist-subagent');
          agentContext = {
            ...agentContext,
            taskDescription,
            toolName,
            specialist: extractSpecialistType(taskDescription),
            createdFrom: 'Task tool call'
          };
        }
        
        await agentService.registerAgent({
          id: agentId,
          projectPath: data.projectPath || data.workingDirectory || process.cwd(),
          context: agentContext,
          tags: agentTags
        });
        await agentService.updateAgentStatus(agentId, 'active');
      } else {
        throw error;
      }
    }
    
    // Create descriptive log message based on available data
    const taskDescription = data.toolInput?.description || data.tool_input?.description;
    const toolName = data.toolName || data.tool_name || data.tool || 'unknown';
    
    let logMessage = `Starting tool: ${toolName}`;
    if (toolName === 'Task' && taskDescription) {
      logMessage = `Starting specialist analysis: ${taskDescription}`;
    }
    
    await agentService.addLogEntry(agentId, {
      level: 'info',
      message: logMessage,
      metadata: { ...data, phase: 'pre_tool_use', taskDescription }
    });
    
    // Broadcast real-time update
    wsService.broadcastEvent('tool_started', {
      agentId,
      tool: data.tool_name || data.tool,
      timestamp: new Date().toISOString()
    }, `agent:${agentId}`);
  } catch (error) {
    logger.error(`Error handling pre tool use: ${error}`);
  }
}

async function handlePostToolUse(
  agentId: string,
  data: any,
  agentService: AgentService,
  wsService: WebSocketService
): Promise<void> {
  try {
    await agentService.addLogEntry(agentId, {
      level: 'info',
      message: `Completed tool: ${data.tool_name || data.tool || 'unknown'}`,
      metadata: { ...data, phase: 'post_tool_use' }
    });
    
    // Broadcast real-time update
    wsService.broadcastEvent('tool_completed', {
      agentId,
      tool: data.tool_name || data.tool,
      timestamp: new Date().toISOString(),
      success: !data.error
    }, `agent:${agentId}`);
  } catch (error) {
    logger.error(`Error handling post tool use: ${error}`);
  }
}

async function handleConversationStart(
  agentId: string,
  data: any,
  agentService: AgentService,
  wsService: WebSocketService
): Promise<void> {
  try {
    await agentService.registerAgent({
      id: agentId,
      projectPath: data.projectPath || 'unknown',
      context: data.context || {},
      tags: data.tags || []
    });
    
    await agentService.addLogEntry(agentId, {
      level: 'info',
      message: 'Conversation started',
      metadata: data
    });
    
    // Broadcast real-time update
    wsService.broadcastEvent('agent_started', {
      agentId,
      timestamp: new Date().toISOString()
    }, `agent:${agentId}`);
  } catch (error) {
    logger.error(`Error handling conversation start: ${error}`);
  }
}

async function handleConversationEnd(
  agentId: string,
  data: any,
  agentService: AgentService,
  wsService: WebSocketService
): Promise<void> {
  try {
    await agentService.updateAgentStatus(agentId, 'complete');
    await agentService.addLogEntry(agentId, {
      level: 'info',
      message: 'Conversation ended',
      metadata: data
    });
    
    // Broadcast real-time update
    wsService.broadcastEvent('agent_stopped', {
      agentId,
      timestamp: new Date().toISOString()
    }, `agent:${agentId}`);
  } catch (error) {
    logger.error(`Error handling conversation end: ${error}`);
  }
}

async function handleStop(
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
      metadata: { ...data, phase: 'stop' }
    });
    
    // Broadcast real-time update
    wsService.broadcastEvent('agent_stopped', {
      agentId,
      timestamp: new Date().toISOString(),
      reason: data.reason || 'manual_stop'
    }, `agent:${agentId}`);
  } catch (error) {
    logger.error(`Error handling stop: ${error}`);
  }
}

async function handleSubagentStop(
  agentId: string,
  data: any,
  agentService: AgentService,
  wsService: WebSocketService
): Promise<void> {
  try {
    await agentService.updateAgentStatus(agentId, 'complete');
    await agentService.addLogEntry(agentId, {
      level: 'info',
      message: 'Subagent stopped',
      metadata: { ...data, phase: 'subagent_stop' }
    });
    
    // Broadcast real-time update
    wsService.broadcastEvent('agent_stopped', {
      agentId,
      timestamp: new Date().toISOString(),
      reason: data.reason || 'subagent_completion',
      isSubagent: true
    }, `agent:${agentId}`);
  } catch (error) {
    logger.error(`Error handling subagent stop: ${error}`);
  }
}

async function handleNotification(
  agentId: string,
  data: any,
  agentService: AgentService,
  wsService: WebSocketService
): Promise<void> {
  try {
    await agentService.addLogEntry(agentId, {
      level: data.level || 'info',
      message: data.message || 'Notification received',
      metadata: { ...data, phase: 'notification' }
    });
    
    // Broadcast real-time update for important notifications
    if (data.level === 'error' || data.level === 'warn') {
      wsService.broadcastEvent('agent_notification', {
        agentId,
        level: data.level,
        message: data.message,
        timestamp: new Date().toISOString()
      }, `agent:${agentId}`);
    }
  } catch (error) {
    logger.error(`Error handling notification: ${error}`);
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