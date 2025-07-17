import { AnalyticsService } from '../../services/AnalyticsService';
import { 
  AnalyticsEvent, 
  AnalyticsMetrics, 
  Pattern, 
  Insight, 
  AnalyticsQuery,
  AnalyticsProcessingResult 
} from '@claude-agent-manager/shared';
import { Agent } from '@claude-agent-manager/shared';

// Mock data generators
const createMockAgent = (id: string): Agent => ({
  id,
  projectPath: `/test/project/${id}`,
  status: 'active',
  created: new Date(Date.now() - Math.random() * 86400000),
  lastActivity: new Date(Date.now() - Math.random() * 3600000),
  context: { task: `test-task-${id}` },
  logs: [],
  tags: ['test']
});

const createMockAnalyticsEvent = (agentId: string): AnalyticsEvent => ({
  id: `event-${Date.now()}-${Math.random()}`,
  type: 'agent_updated',
  agentId,
  timestamp: new Date(),
  data: {
    responseTime: Math.random() * 1000,
    throughput: Math.random() * 100,
    errorRate: Math.random() * 0.1
  }
});

const createMockAgents = (count: number): Agent[] => 
  Array.from({ length: count }, (_, i) => createMockAgent(`agent-${i}`));

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
  });

  describe('Event Processing', () => {
    it('should process analytics events within 100ms', async () => {
      const event = createMockAnalyticsEvent('test-agent-1');
      
      const startTime = Date.now();
      await analyticsService.processEvent(event);
      const processingTime = Date.now() - startTime;
      
      expect(processingTime).toBeLessThan(100);
    });

    it('should handle batch processing of 1000 events', async () => {
      const events = Array.from({ length: 1000 }, (_, i) => 
        createMockAnalyticsEvent(`agent-${i}`)
      );
      
      const startTime = Date.now();
      const results = await analyticsService.processBatch(events);
      const processingTime = Date.now() - startTime;
      
      expect(results.length).toBe(1000);
      expect(processingTime).toBeLessThan(5000); // 5 seconds for 1000 events
    });

    it('should validate event data before processing', async () => {
      const invalidEvent = {
        id: 'invalid',
        type: 'invalid_type',
        agentId: '',
        timestamp: 'invalid-date',
        data: null
      } as any;

      await expect(analyticsService.processEvent(invalidEvent))
        .rejects
        .toThrow('Invalid analytics event');
    });
  });

  describe('Metrics Generation', () => {
    it('should generate comprehensive metrics from agent data', async () => {
      const mockAgents = createMockAgents(100);
      
      const metrics = await analyticsService.generateMetrics(mockAgents);
      
      expect(metrics).toHaveProperty('performance');
      expect(metrics.performance).toHaveProperty('averageResponseTime');
      expect(metrics.performance).toHaveProperty('throughput');
      expect(metrics.performance).toHaveProperty('errorRate');
      expect(metrics.performance).toHaveProperty('resourceUtilization');
      
      expect(metrics).toHaveProperty('usage');
      expect(metrics.usage.totalAgents).toBe(100);
      expect(metrics.usage.activeAgents).toBeGreaterThan(0);
    });

    it('should handle empty agent data gracefully', async () => {
      const metrics = await analyticsService.generateMetrics([]);
      
      expect(metrics.usage.totalAgents).toBe(0);
      expect(metrics.usage.activeAgents).toBe(0);
      expect(metrics.performance.averageResponseTime).toBe(0);
    });

    it('should calculate metrics within 200ms for 10K agents', async () => {
      const mockAgents = createMockAgents(10000);
      
      const startTime = Date.now();
      const metrics = await analyticsService.generateMetrics(mockAgents);
      const processingTime = Date.now() - startTime;
      
      expect(processingTime).toBeLessThan(200);
      expect(metrics.usage.totalAgents).toBe(10000);
    });
  });

  describe('Pattern Detection', () => {
    it('should detect behavioral patterns with >80% confidence', async () => {
      const mockAgents = createMockAgents(100);
      
      const patterns = await analyticsService.detectPatterns(mockAgents);
      
      expect(patterns).toBeInstanceOf(Array);
      expect(patterns.length).toBeGreaterThan(0);
      
      const behavioralPatterns = patterns.filter(p => p.type === 'behavioral');
      expect(behavioralPatterns.length).toBeGreaterThan(0);
      
      behavioralPatterns.forEach(pattern => {
        expect(pattern.confidence).toBeGreaterThan(0.8);
        expect(pattern.actionable).toBe(true);
      });
    });

    it('should detect performance patterns and bottlenecks', async () => {
      const mockAgents = createMockAgents(50);
      
      const patterns = await analyticsService.detectPatterns(mockAgents);
      const performancePatterns = patterns.filter(p => p.type === 'performance');
      
      expect(performancePatterns.length).toBeGreaterThan(0);
      performancePatterns.forEach(pattern => {
        expect(pattern.description).toBeTruthy();
        expect(pattern.recommendations.length).toBeGreaterThan(0);
      });
    });

    it('should handle insufficient data gracefully', async () => {
      const mockAgents = createMockAgents(5);
      
      const patterns = await analyticsService.detectPatterns(mockAgents);
      
      patterns.forEach(pattern => {
        expect(pattern.confidence).toBeLessThan(0.6);
        expect(pattern.actionable).toBe(false);
      });
    });
  });

  describe('Insights Generation', () => {
    it('should generate actionable insights from patterns', async () => {
      const mockPatterns: Pattern[] = [
        {
          id: 'pattern-1',
          type: 'performance',
          confidence: 0.9,
          actionable: true,
          description: 'High response time during peak hours',
          recommendations: ['Implement caching', 'Scale horizontally'],
          detectedAt: new Date(),
          agentIds: ['agent-1', 'agent-2'],
          frequency: 0.8
        }
      ];
      
      const insights = await analyticsService.generateInsights(mockPatterns);
      
      expect(insights).toBeInstanceOf(Array);
      expect(insights.length).toBeGreaterThan(0);
      
      insights.forEach(insight => {
        expect(insight.actionableSteps.length).toBeGreaterThan(0);
        expect(insight.expectedImpact).toBeTruthy();
        expect(['low', 'medium', 'high', 'critical']).toContain(insight.priority);
      });
    });

    it('should prioritize insights by impact and urgency', async () => {
      const mockPatterns: Pattern[] = [
        {
          id: 'pattern-1',
          type: 'performance',
          confidence: 0.95,
          actionable: true,
          description: 'Critical performance issue',
          recommendations: ['Immediate scaling required'],
          detectedAt: new Date(),
          agentIds: ['agent-1'],
          frequency: 0.9
        },
        {
          id: 'pattern-2',
          type: 'behavioral',
          confidence: 0.65, // Lower confidence for low priority
          actionable: true,
          description: 'Minor workflow optimization',
          recommendations: ['Consider automation'],
          detectedAt: new Date(),
          agentIds: ['agent-2'],
          frequency: 0.3
        }
      ];
      
      const insights = await analyticsService.generateInsights(mockPatterns);
      
      expect(insights[0].priority).toBe('critical');
      expect(insights[1].priority).toBe('low');
    });
  });

  describe('Real-time Processing', () => {
    it('should process real-time analytics within 50ms', async () => {
      const event = createMockAnalyticsEvent('real-time-agent');
      
      const startTime = Date.now();
      await analyticsService.processRealTimeEvent(event);
      const processingTime = Date.now() - startTime;
      
      expect(processingTime).toBeLessThan(50);
    });

    it('should handle 10K concurrent real-time events', async () => {
      const events = Array.from({ length: 10000 }, (_, i) => 
        createMockAnalyticsEvent(`concurrent-agent-${i}`)
      );
      
      const promises = events.map(event => 
        analyticsService.processRealTimeEvent(event)
      );
      
      const startTime = Date.now();
      const results = await Promise.all(promises);
      const processingTime = Date.now() - startTime;
      
      expect(results.length).toBe(10000);
      expect(processingTime).toBeLessThan(10000); // 10 seconds for 10K events
    });

    it('should maintain data quality during high-throughput processing', async () => {
      const events = Array.from({ length: 1000 }, (_, i) => 
        createMockAnalyticsEvent(`quality-agent-${i}`)
      );
      
      const results = await analyticsService.processHighThroughputBatch(events);
      
      expect(results.dataQuality.completeness).toBeGreaterThan(0.95);
      expect(results.dataQuality.accuracy).toBeGreaterThan(0.95);
      expect(results.dataQuality.freshness).toBeGreaterThan(0.90);
    });
  });

  describe('Query Processing', () => {
    it('should execute complex analytics queries within 100ms', async () => {
      const query: AnalyticsQuery = {
        timeRange: {
          start: new Date(Date.now() - 86400000), // 24 hours ago
          end: new Date()
        },
        agentIds: ['agent-1', 'agent-2', 'agent-3'],
        eventTypes: ['performance_metric', 'error'],
        limit: 100
      };
      
      const startTime = Date.now();
      const results = await analyticsService.executeQuery(query);
      const processingTime = Date.now() - startTime;
      
      expect(processingTime).toBeLessThan(100);
      expect(results).toHaveProperty('metrics');
      expect(results).toHaveProperty('patterns');
      expect(results).toHaveProperty('insights');
    });

    it('should handle pagination for large result sets', async () => {
      const query: AnalyticsQuery = {
        timeRange: {
          start: new Date(Date.now() - 86400000),
          end: new Date()
        },
        limit: 50,
        offset: 0
      };
      
      const firstPage = await analyticsService.executeQuery(query);
      const secondPage = await analyticsService.executeQuery({
        ...query,
        offset: 50
      });
      
      expect(firstPage.patterns.length).toBeLessThanOrEqual(50);
      expect(secondPage.patterns.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const invalidAgents = [null, undefined, 'invalid'] as any;
      
      await expect(analyticsService.generateMetrics(invalidAgents))
        .rejects
        .toThrow('Invalid agent data');
    });

    it('should implement circuit breaker for external dependencies', async () => {
      // Simulate external service failures
      const mockFailingService = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      
      analyticsService.setExternalService(mockFailingService);
      
      // Trigger multiple failures to open circuit breaker
      try {
        await analyticsService.processEvent(createMockAnalyticsEvent('test1'));
      } catch (error) {
        // Expected to fail
      }
      
      try {
        await analyticsService.processEvent(createMockAnalyticsEvent('test2'));
      } catch (error) {
        // Expected to fail
      }
      
      try {
        await analyticsService.processEvent(createMockAnalyticsEvent('test3'));
      } catch (error) {
        // Expected to fail
      }
      
      // Should fail fast after multiple failures
      await expect(analyticsService.processEvent(createMockAnalyticsEvent('test4')))
        .rejects
        .toThrow('Circuit breaker open');
    });
  });
});