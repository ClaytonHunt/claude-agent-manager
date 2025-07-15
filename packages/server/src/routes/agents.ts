import { Router, Request, Response } from 'express';
import { AgentService } from '../services/AgentService';
import { WebSocketService } from '../services/WebSocketService';
import { AgentRegistration, AgentQuery, ValidationError } from '@claude-agent-manager/shared';
import { z } from 'zod';

const agentRegistrationSchema = z.object({
  id: z.string().min(1),
  projectPath: z.string().min(1),
  parentId: z.string().optional(),
  context: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional()
});

const agentQuerySchema = z.object({
  projectPath: z.string().optional(),
  status: z.enum(['idle', 'active', 'error', 'handoff', 'complete']).optional(),
  parentId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().min(0).optional()
});

const logEntrySchema = z.object({
  level: z.enum(['info', 'warn', 'error', 'debug']),
  message: z.string(),
  metadata: z.record(z.any()).optional()
});

const handoffSchema = z.object({
  fromAgentId: z.string(),
  toAgentId: z.string(),
  context: z.record(z.any()),
  reason: z.string()
});

export function agentRoutes(
  agentService: AgentService,
  wsService: WebSocketService
): Router {
  const router = Router();

  // Register a new agent
  router.post('/', async (req: Request, res: Response) => {
    try {
      const registration = agentRegistrationSchema.parse(req.body);
      const agent = await agentService.registerAgent(registration);
      
      wsService.broadcastAgentUpdate(agent);
      
      res.status(201).json(agent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  });

  // Get all agents with optional filtering
  router.get('/', async (req: Request, res: Response) => {
    try {
      const query = agentQuerySchema.parse(req.query);
      const agents = await agentService.getAgents(query);
      
      res.json(agents);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  });

  // Get specific agent
  router.get('/:id', async (req: Request, res: Response) => {
    const agent = await agentService.getAgent(req.params.id);
    res.json(agent);
  });

  // Update agent status
  router.patch('/:id/status', async (req: Request, res: Response) => {
    const { status } = req.body;
    
    if (!status || !['idle', 'active', 'error', 'handoff', 'complete'].includes(status)) {
      throw new ValidationError('Invalid status value');
    }
    
    const agent = await agentService.updateAgentStatus(req.params.id, status);
    
    wsService.broadcastAgentUpdate(agent);
    
    res.json(agent);
  });

  // Add log entry to agent
  router.post('/:id/logs', async (req: Request, res: Response) => {
    try {
      const logEntry = logEntrySchema.parse(req.body);
      await agentService.addLogEntry(req.params.id, logEntry);
      
      const agent = await agentService.getAgent(req.params.id);
      const newLogEntry = agent.logs[agent.logs.length - 1];
      
      wsService.broadcastLogEntry(req.params.id, newLogEntry);
      
      res.status(201).json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  });

  // Get agent logs
  router.get('/:id/logs', async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 100;
    const logs = await agentService.getAgentLogs(req.params.id, limit);
    
    res.json(logs);
  });

  // Update agent context
  router.patch('/:id/context', async (req: Request, res: Response) => {
    const { context } = req.body;
    
    if (!context || typeof context !== 'object') {
      throw new ValidationError('Context must be an object');
    }
    
    const agent = await agentService.updateAgentContext(req.params.id, context);
    
    wsService.broadcastAgentUpdate(agent);
    
    res.json(agent);
  });

  // Agent handoff
  router.post('/handoff', async (req: Request, res: Response) => {
    try {
      const handoff = handoffSchema.parse(req.body);
      
      await agentService.handoffAgent({
        ...handoff,
        timestamp: new Date()
      });
      
      wsService.broadcastHandoff(handoff.fromAgentId, handoff.toAgentId, handoff.context);
      
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  });

  // Delete agent
  router.delete('/:id', async (req: Request, res: Response) => {
    await agentService.deleteAgent(req.params.id);
    
    // Broadcast deletion
    wsService.broadcastAgentUpdate({
      id: req.params.id,
      deleted: true
    } as any);
    
    res.status(204).send();
  });

  // Get project statistics
  router.get('/projects/:projectPath/stats', async (req: Request, res: Response) => {
    const stats = await agentService.getProjectStats(req.params.projectPath);
    res.json(stats);
  });

  // Search agents
  router.get('/search/:query', async (req: Request, res: Response) => {
    const agents = await agentService.searchAgents(req.params.query);
    res.json(agents);
  });

  // Get agent hierarchy
  router.get('/hierarchy/:rootId?', async (req: Request, res: Response) => {
    const hierarchy = await agentService.getAgentHierarchy(req.params.rootId);
    
    // Convert Map to object for JSON serialization
    const hierarchyObj: Record<string, any> = {};
    for (const [key, value] of hierarchy) {
      hierarchyObj[key] = value;
    }
    
    res.json(hierarchyObj);
  });

  return router;
}