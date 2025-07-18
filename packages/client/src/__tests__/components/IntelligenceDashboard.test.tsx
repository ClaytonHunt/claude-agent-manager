import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { IntelligenceDashboard } from '../../components/intelligence/IntelligenceDashboard';
import { AnalyticsMetrics, Pattern, Insight } from '@claude-agent-manager/shared';
import { Agent } from '@claude-agent-manager/shared';

// Mock analytics service
jest.mock('../../services/AnalyticsService', () => ({
  AnalyticsService: {
    getInstance: jest.fn().mockReturnValue({
      getMetrics: jest.fn(),
      getPatterns: jest.fn(),
      getInsights: jest.fn(),
      subscribeToAnalytics: jest.fn(),
      unsubscribeFromAnalytics: jest.fn()
    })
  }
}));

// Mock data generators
const createMockAnalyticsData = {
  agents: (count: number): Agent[] => Array.from({ length: count }, (_, i) => ({
    id: `agent-${i}`,
    projectPath: `/project/${i}`,
    status: 'active',
    created: new Date(Date.now() - Math.random() * 86400000),
    lastActivity: new Date(Date.now() - Math.random() * 3600000),
    context: { task: `task-${i}` },
    logs: [],
    tags: ['test']
  })),
  
  metrics: (): AnalyticsMetrics => ({
    performance: {
      averageResponseTime: 250,
      throughput: 85,
      errorRate: 0.03,
      resourceUtilization: 0.65
    },
    usage: {
      totalAgents: 100,
      activeAgents: 75,
      completedTasks: 1500,
      averageRuntime: 3600
    },
    patterns: {
      peakHours: [9, 10, 11, 14, 15, 16],
      commonWorkflows: ['tdd-cycle', 'bug-fix', 'feature-dev'],
      efficiencyTrends: Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 86400000),
        value: 80 + Math.random() * 20
      }))
    }
  }),
  
  patterns: (): Pattern[] => [
    {
      id: 'pattern-1',
      type: 'behavioral',
      confidence: 0.9,
      actionable: true,
      description: 'Peak productivity hours between 9-11 AM',
      recommendations: ['Schedule complex tasks during peak hours'],
      detectedAt: new Date(),
      agentIds: ['agent-1', 'agent-2', 'agent-3'],
      frequency: 0.85
    },
    {
      id: 'pattern-2',
      type: 'performance',
      confidence: 0.8,
      actionable: true,
      description: 'Response time increases during afternoon',
      recommendations: ['Implement caching', 'Scale resources'],
      detectedAt: new Date(),
      agentIds: ['agent-4', 'agent-5'],
      frequency: 0.7
    }
  ],
  
  insights: (): Insight[] => [
    {
      id: 'insight-1',
      type: 'optimization',
      title: 'Workflow Optimization Opportunity',
      description: 'Agents show 40% higher productivity in morning hours',
      priority: 'medium',
      patterns: [],
      generatedAt: new Date(),
      actionableSteps: ['Reschedule critical tasks', 'Implement morning focus blocks'],
      expectedImpact: 'Increase overall productivity by 25%'
    }
  ]
};

describe('IntelligenceDashboard', () => {
  let mockAnalyticsService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mock service instance
    const { AnalyticsService } = require('../../services/AnalyticsService');
    mockAnalyticsService = AnalyticsService.getInstance();
    
    // Set up mock implementations
    mockAnalyticsService.getMetrics.mockResolvedValue({
      performance: {
        averageResponseTime: 250,
        throughput: 85,
        errorRate: 0.03,
        resourceUtilization: 0.65
      },
      usage: {
        totalAgents: 100,
        activeAgents: 75,
        completedTasks: 1500,
        averageRuntime: 3600
      },
      patterns: {
        peakHours: [9, 10, 11, 14, 15, 16],
        commonWorkflows: ['tdd-cycle', 'bug-fix', 'feature-dev'],
        efficiencyTrends: []
      },
      tools: {
        mostUsedTools: [],
        toolUsageDistribution: {},
        totalToolUsage: 0,
        recentToolActivity: []
      }
    });
    
    mockAnalyticsService.getPatterns.mockResolvedValue([]);
    mockAnalyticsService.getInsights.mockResolvedValue([]);
    mockAnalyticsService.subscribeToAnalytics.mockReturnValue(() => {});
  });

  describe('Component Rendering', () => {
    it('should render intelligence dashboard with all panels', () => {
      const mockAgents = createMockAnalyticsData.agents(10);
      
      render(<IntelligenceDashboard agents={mockAgents} />);
      
      expect(screen.getByText('Intelligence Dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('metrics-panel')).toBeInTheDocument();
      expect(screen.getByTestId('patterns-panel')).toBeInTheDocument();
      expect(screen.getByTestId('insights-panel')).toBeInTheDocument();
      expect(screen.getByTestId('recommendations-panel')).toBeInTheDocument();
    });

    it('should display loading state during data fetch', () => {
      const mockAgents = createMockAnalyticsData.agents(5);
      
      render(<IntelligenceDashboard agents={mockAgents} loading={true} />);
      
      expect(screen.getByText('Loading intelligence data...')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should display error state when data fetch fails', () => {
      const mockAgents = createMockAnalyticsData.agents(5);
      
      render(<IntelligenceDashboard agents={mockAgents} error="Failed to load analytics" />);
      
      expect(screen.getByText('Failed to load analytics')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('Performance Metrics Panel', () => {
    it('should display performance metrics correctly', () => {
      const mockAgents = createMockAnalyticsData.agents(10);
      const mockMetrics = createMockAnalyticsData.metrics();
      
      render(<IntelligenceDashboard agents={mockAgents} metrics={mockMetrics} />);
      
      expect(screen.getByText('250ms')).toBeInTheDocument(); // Average response time
      expect(screen.getByText('85')).toBeInTheDocument(); // Throughput
      expect(screen.getByText('3%')).toBeInTheDocument(); // Error rate
      expect(screen.getByText('65%')).toBeInTheDocument(); // Resource utilization
    });

    it('should update metrics in real-time', async () => {
      const mockAgents = createMockAnalyticsData.agents(10);
      const initialMetrics = createMockAnalyticsData.metrics();
      
      const { rerender } = render(
        <IntelligenceDashboard agents={mockAgents} metrics={initialMetrics} />
      );
      
      expect(screen.getByText('250ms')).toBeInTheDocument();
      
      // Simulate real-time update
      const updatedMetrics = {
        ...initialMetrics,
        performance: {
          ...initialMetrics.performance,
          averageResponseTime: 180
        }
      };
      
      rerender(<IntelligenceDashboard agents={mockAgents} metrics={updatedMetrics} />);
      
      await waitFor(() => {
        expect(screen.getByText('180ms')).toBeInTheDocument();
      });
    });

    it('should handle missing metrics gracefully', () => {
      const mockAgents = createMockAnalyticsData.agents(10);
      
      render(<IntelligenceDashboard agents={mockAgents} metrics={undefined} />);
      
      expect(screen.getByTestId('response-time-value')).toHaveTextContent('--');
      expect(screen.getByTestId('throughput-value')).toHaveTextContent('--');
      expect(screen.getByTestId('error-rate-value')).toHaveTextContent('--');
      expect(screen.getByTestId('resource-usage-value')).toHaveTextContent('--');
    });
  });

  describe('Pattern Recognition Panel', () => {
    it('should display detected patterns', () => {
      const mockAgents = createMockAnalyticsData.agents(10);
      const mockPatterns = createMockAnalyticsData.patterns();
      
      render(<IntelligenceDashboard agents={mockAgents} patterns={mockPatterns} />);
      
      expect(screen.getByText('Peak productivity hours between 9-11 AM')).toBeInTheDocument();
      expect(screen.getByText('Response time increases during afternoon')).toBeInTheDocument();
    });

    it('should show pattern confidence levels', () => {
      const mockAgents = createMockAnalyticsData.agents(10);
      const mockPatterns = createMockAnalyticsData.patterns();
      
      render(<IntelligenceDashboard agents={mockAgents} patterns={mockPatterns} />);
      
      expect(screen.getByText('90%')).toBeInTheDocument(); // High confidence
      expect(screen.getByText('80%')).toBeInTheDocument(); // Medium confidence
    });

    it('should filter patterns by type', () => {
      const mockAgents = createMockAnalyticsData.agents(10);
      const mockPatterns = createMockAnalyticsData.patterns();
      
      render(<IntelligenceDashboard agents={mockAgents} patterns={mockPatterns} />);
      
      // Click behavioral filter
      fireEvent.click(screen.getByText('Behavioral'));
      
      expect(screen.getByText('Peak productivity hours between 9-11 AM')).toBeInTheDocument();
      expect(screen.queryByText('Response time increases during afternoon')).not.toBeInTheDocument();
    });

    it('should display pattern recommendations', () => {
      const mockAgents = createMockAnalyticsData.agents(10);
      const mockPatterns = createMockAnalyticsData.patterns();
      
      render(<IntelligenceDashboard agents={mockAgents} patterns={mockPatterns} />);
      
      expect(screen.getByText('Schedule complex tasks during peak hours')).toBeInTheDocument();
      expect(screen.getByText('Implement caching')).toBeInTheDocument();
    });
  });

  describe('Insights Panel', () => {
    it('should display generated insights', () => {
      const mockAgents = createMockAnalyticsData.agents(10);
      const mockInsights = createMockAnalyticsData.insights();
      
      render(<IntelligenceDashboard agents={mockAgents} insights={mockInsights} />);
      
      expect(screen.getByText('Workflow Optimization Opportunity')).toBeInTheDocument();
      expect(screen.getByText('Agents show 40% higher productivity in morning hours')).toBeInTheDocument();
    });

    it('should prioritize insights by importance', () => {
      const mockAgents = createMockAnalyticsData.agents(10);
      const mockInsights = [
        {
          id: 'insight-1',
          type: 'optimization',
          title: 'Critical Performance Issue',
          description: 'Severe performance degradation detected',
          priority: 'critical',
          patterns: [],
          generatedAt: new Date(),
          actionableSteps: ['Immediate action required'],
          expectedImpact: 'Prevent system failure'
        },
        {
          id: 'insight-2',
          type: 'recommendation',
          title: 'Minor Optimization',
          description: 'Small improvement opportunity',
          priority: 'low',
          patterns: [],
          generatedAt: new Date(),
          actionableSteps: ['Consider when convenient'],
          expectedImpact: 'Minor efficiency gain'
        }
      ] as Insight[];
      
      render(<IntelligenceDashboard agents={mockAgents} insights={mockInsights} />);
      
      const criticalInsight = screen.getByText('Critical Performance Issue');
      const minorInsight = screen.getByText('Minor Optimization');
      
      // Critical insight should appear first
      expect(criticalInsight.compareDocumentPosition(minorInsight) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('should show actionable steps for insights', () => {
      const mockAgents = createMockAnalyticsData.agents(10);
      const mockInsights = createMockAnalyticsData.insights();
      
      render(<IntelligenceDashboard agents={mockAgents} insights={mockInsights} />);
      
      expect(screen.getByText('Reschedule critical tasks')).toBeInTheDocument();
      expect(screen.getByText('Implement morning focus blocks')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should subscribe to real-time analytics updates', () => {
      const mockAgents = createMockAnalyticsData.agents(10);
      
      render(<IntelligenceDashboard agents={mockAgents} />);
      
      // Should subscribe to analytics updates
      expect(mockAnalyticsService.subscribeToAnalytics).toHaveBeenCalled();
    });

    it('should unsubscribe on component unmount', () => {
      const mockAgents = createMockAnalyticsData.agents(10);
      
      const { unmount } = render(<IntelligenceDashboard agents={mockAgents} />);
      
      unmount();
      
      expect(mockAnalyticsService.unsubscribeFromAnalytics).toHaveBeenCalled();
    });

    it('should handle real-time metric updates', async () => {
      const mockAgents = createMockAnalyticsData.agents(10);
      
      render(<IntelligenceDashboard agents={mockAgents} />);
      
      // Simulate real-time update
      const updateCallback = mockAnalyticsService.subscribeToAnalytics.mock.calls[0][0];
      
      updateCallback({
        type: 'metrics_update',
        data: createMockAnalyticsData.metrics()
      });
      
      await waitFor(() => {
        expect(screen.getByText('250ms')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Testing', () => {
    it('should render 1000 agents within 2 seconds', async () => {
      const mockAgents = createMockAnalyticsData.agents(1000);
      
      const startTime = Date.now();
      render(<IntelligenceDashboard agents={mockAgents} />);
      
      await waitFor(() => {
        expect(screen.getByText('1000 total agents')).toBeInTheDocument();
      });
      
      const renderTime = Date.now() - startTime;
      expect(renderTime).toBeLessThan(2000);
    });

    it('should handle real-time updates without performance degradation', async () => {
      const mockAgents = createMockAnalyticsData.agents(100);
      
      const { rerender } = render(<IntelligenceDashboard agents={mockAgents} />);
      
      const renderTimes = [];
      
      for (let i = 0; i < 100; i++) {
        const startTime = Date.now();
        const updatedAgents = createMockAnalyticsData.agents(i + 1);
        
        rerender(<IntelligenceDashboard agents={updatedAgents} />);
        
        renderTimes.push(Date.now() - startTime);
      }
      
      const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
      expect(avgRenderTime).toBeLessThan(50); // 50ms average
    });

    it('should maintain responsiveness during high-frequency updates', async () => {
      const mockAgents = createMockAnalyticsData.agents(50);
      
      const { rerender } = render(<IntelligenceDashboard agents={mockAgents} />);
      
      // Simulate high-frequency updates
      const updatePromises = [];
      
      for (let i = 0; i < 50; i++) {
        const promise = new Promise(resolve => {
          setTimeout(() => {
            const updatedMetrics = createMockAnalyticsData.metrics();
            rerender(<IntelligenceDashboard agents={mockAgents} metrics={updatedMetrics} />);
            resolve(true);
          }, i * 10); // Updates every 10ms
        });
        updatePromises.push(promise);
      }
      
      const startTime = Date.now();
      await Promise.all(updatePromises);
      const totalTime = Date.now() - startTime;
      
      expect(totalTime).toBeLessThan(1000); // Should handle 50 updates in under 1 second
    });
  });

  describe('Error Handling', () => {
    it('should handle analytics service errors gracefully', () => {
      const mockAgents = createMockAnalyticsData.agents(10);
      
      render(<IntelligenceDashboard agents={mockAgents} error="Analytics service unavailable" />);
      
      expect(screen.getByText('Analytics service unavailable')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should retry failed analytics requests', async () => {
      const mockAgents = createMockAnalyticsData.agents(10);
      
      render(<IntelligenceDashboard agents={mockAgents} error="Connection failed" />);
      
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(mockAnalyticsService.getMetrics).toHaveBeenCalled();
      });
    });

    it('should handle malformed analytics data', () => {
      const mockAgents = createMockAnalyticsData.agents(10);
      const malformedMetrics = {
        performance: null,
        usage: undefined,
        patterns: 'invalid'
      } as any;
      
      render(<IntelligenceDashboard agents={mockAgents} metrics={malformedMetrics} />);
      
      expect(screen.getByText('Data validation error')).toBeInTheDocument();
    });
  });
});