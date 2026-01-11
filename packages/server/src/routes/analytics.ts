import { Router, Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { AgentService } from '../services/AgentService';
import { PatternRecognitionService } from '../services/PatternRecognitionService';
import { ValidationError } from '@claude-agent-manager/shared';
import { z } from 'zod';

const analyticsQuerySchema = z.object({
  agentId: z.string().optional(),
  startDate: z.string().transform((val) => new Date(val)).optional(),
  endDate: z.string().transform((val) => new Date(val)).optional(),
});

export function analyticsRoutes(
  analyticsService: AnalyticsService,
  agentService: AgentService,
  patternRecognitionService?: PatternRecognitionService
): Router {
  const router = Router();

  // Get tool usage analytics
  router.get('/tools', async (req: Request, res: Response) => {
    try {
      const query = analyticsQuerySchema.parse(req.query);
      const analytics = analyticsService.getToolAnalytics(query.agentId);
      res.json(analytics);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors.map((e) => e.message).join(', '));
      }
      throw error;
    }
  });

  // Get tool usage stats (simple)
  router.get('/tools/stats', async (req: Request, res: Response) => {
    const stats = analyticsService.getToolUsageStats();
    const statsObj: Record<string, any> = {};
    for (const [key, value] of stats) {
      statsObj[key] = value;
    }
    res.json(statsObj);
  });

  // Get comprehensive metrics
  router.get('/metrics', async (req: Request, res: Response) => {
    const agents = await agentService.getAgents();
    const metrics = await analyticsService.generateMetrics(agents);
    res.json(metrics);
  });

  // Get detected patterns
  router.get('/patterns', async (req: Request, res: Response) => {
    const agents = await agentService.getAgents();
    const patterns = await analyticsService.detectPatterns(agents);
    res.json(patterns);
  });

  // Get insights
  router.get('/insights', async (req: Request, res: Response) => {
    const agents = await agentService.getAgents();
    const patterns = await analyticsService.detectPatterns(agents);
    const insights = await analyticsService.generateInsights(patterns);
    res.json(insights);
  });

  // Get dashboard summary (aggregated stats)
  router.get('/dashboard', async (req: Request, res: Response) => {
    const agents = await agentService.getAgents();
    const metrics = await analyticsService.generateMetrics(agents);
    const patterns = await analyticsService.detectPatterns(agents);
    const insights = await analyticsService.generateInsights(patterns);
    const toolAnalytics = analyticsService.getToolAnalytics();

    const summary = {
      agents: {
        total: agents.length,
        active: agents.filter((a) => a.status === 'active').length,
        idle: agents.filter((a) => a.status === 'idle').length,
        error: agents.filter((a) => a.status === 'error').length,
        complete: agents.filter((a) => a.status === 'complete').length,
        handoff: agents.filter((a) => a.status === 'handoff').length,
      },
      performance: metrics.performance,
      tools: toolAnalytics.summary,
      patterns: {
        total: patterns.length,
        actionable: patterns.filter((p) => p.actionable).length,
        highConfidence: patterns.filter((p) => p.confidence > 0.8).length,
      },
      insights: {
        total: insights.length,
        critical: insights.filter((i) => i.priority === 'critical').length,
        high: insights.filter((i) => i.priority === 'high').length,
      },
      lastUpdated: new Date().toISOString(),
    };

    res.json(summary);
  });

  // Track tool usage event
  router.post('/tools/track', async (req: Request, res: Response) => {
    const { toolName, duration } = req.body;

    if (!toolName || typeof toolName !== 'string') {
      throw new ValidationError('toolName is required and must be a string');
    }

    analyticsService.trackToolUsage(toolName, duration);
    res.json({ success: true });
  });

  // Execute analytics query
  router.post('/query', async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.executeQuery(req.body);
      res.json(result);
    } catch (error) {
      throw error;
    }
  });

  return router;
}
