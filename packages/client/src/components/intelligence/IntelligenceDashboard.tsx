import React, { useState, useEffect, useCallback } from 'react';
import { Agent } from '@claude-agent-manager/shared';
import { 
  AnalyticsMetrics, 
  Pattern, 
  Insight 
} from '@claude-agent-manager/shared';

interface IntelligenceDashboardProps {
  agents: Agent[];
  metrics?: AnalyticsMetrics;
  patterns?: Pattern[];
  insights?: Insight[];
  loading?: boolean;
  error?: string;
}

interface AnalyticsUpdate {
  type: string;
  data: any;
}

// Mock analytics service
const mockAnalyticsService = {
  getMetrics: async () => ({
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
    }
  }),
  getPatterns: async () => [],
  getInsights: async () => [],
  subscribeToAnalytics: (callback: (update: AnalyticsUpdate) => void) => {
    // Mock subscription
    return () => {};
  },
  unsubscribeFromAnalytics: () => {
    // Mock unsubscribe
  }
};

export function IntelligenceDashboard({ 
  agents, 
  metrics: propMetrics, 
  patterns: propPatterns, 
  insights: propInsights,
  loading = false,
  error 
}: IntelligenceDashboardProps) {
  const [localMetrics, setLocalMetrics] = useState<AnalyticsMetrics | undefined>(propMetrics);
  const [localPatterns, setLocalPatterns] = useState<Pattern[]>(propPatterns || []);
  const [localInsights, setLocalInsights] = useState<Insight[]>(propInsights || []);
  const [selectedPatternType, setSelectedPatternType] = useState<string>('all');

  // Use prop data if available, otherwise use local state
  const metrics = propMetrics || localMetrics;
  const patterns = propPatterns || localPatterns;
  const insights = propInsights || localInsights;

  // Handle real-time updates
  const handleAnalyticsUpdate = useCallback((update: AnalyticsUpdate) => {
    switch (update.type) {
      case 'metrics_update':
        setLocalMetrics(update.data);
        break;
      case 'patterns_update':
        setLocalPatterns(update.data);
        break;
      case 'insights_update':
        setLocalInsights(update.data);
        break;
    }
  }, []);

  // Subscribe to real-time analytics updates
  useEffect(() => {
    const unsubscribe = mockAnalyticsService.subscribeToAnalytics(handleAnalyticsUpdate);
    return () => {
      unsubscribe();
      mockAnalyticsService.unsubscribeFromAnalytics();
    };
  }, [handleAnalyticsUpdate]);

  // Handle retry on error
  const handleRetry = useCallback(async () => {
    try {
      const [metricsData, patternsData, insightsData] = await Promise.all([
        mockAnalyticsService.getMetrics(),
        mockAnalyticsService.getPatterns(),
        mockAnalyticsService.getInsights()
      ]);
      
      setLocalMetrics(metricsData);
      setLocalPatterns(patternsData);
      setLocalInsights(insightsData);
    } catch (error) {
      console.error('Failed to refresh analytics data:', error);
    }
  }, []);

  // Filter patterns by type
  const filteredPatterns = selectedPatternType === 'all' 
    ? patterns 
    : patterns.filter(p => p.type === selectedPatternType);

  // Sort insights by priority
  const sortedInsights = [...insights].sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div data-testid="loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading intelligence data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">
          {error.includes('validation') ? 'Data validation error' : error}
        </div>
        <button 
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Intelligence Dashboard</h1>
        <p className="text-gray-600 mt-1">AI-powered insights and analytics</p>
      </div>

      {/* Metrics Panel */}
      <div data-testid="metrics-panel" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Response Time</h3>
          <div className="text-2xl font-bold text-gray-900">
            {metrics?.performance?.averageResponseTime ? `${metrics.performance.averageResponseTime}ms` : '--'}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Throughput</h3>
          <div className="text-2xl font-bold text-gray-900">
            {metrics?.performance?.throughput || '--'}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Error Rate</h3>
          <div className="text-2xl font-bold text-gray-900">
            {metrics?.performance?.errorRate ? `${Math.round(metrics.performance.errorRate * 100)}%` : '--'}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Resource Usage</h3>
          <div className="text-2xl font-bold text-gray-900">
            {metrics?.performance?.resourceUtilization ? `${Math.round(metrics.performance.resourceUtilization * 100)}%` : '--'}
          </div>
        </div>
      </div>

      {/* Agent Count Display */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="text-sm text-gray-600">
          {agents.length} total agents
        </div>
      </div>

      {/* Patterns Panel */}
      <div data-testid="patterns-panel" className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Pattern Recognition</h2>
          <div className="flex space-x-2">
            {['all', 'behavioral', 'performance', 'error'].map(type => (
              <button
                key={type}
                onClick={() => setSelectedPatternType(type)}
                className={`px-3 py-1 rounded text-sm ${
                  selectedPatternType === type 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          {filteredPatterns.map(pattern => (
            <div key={pattern.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{pattern.description}</span>
                <span className="text-sm text-gray-500">
                  {Math.round(pattern.confidence * 100)}%
                </span>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                Recommendations:
              </div>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {pattern.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          ))}
          
          {filteredPatterns.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No patterns detected for the selected type
            </div>
          )}
        </div>
      </div>

      {/* Insights Panel */}
      <div data-testid="insights-panel" className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h2>
        
        <div className="space-y-4">
          {sortedInsights.map(insight => (
            <div key={insight.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{insight.title}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  insight.priority === 'critical' ? 'bg-red-100 text-red-800' :
                  insight.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {insight.priority}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
              
              <div className="text-sm text-gray-600 mb-2">Action Steps:</div>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {insight.actionableSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
          ))}
          
          {sortedInsights.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No insights available
            </div>
          )}
        </div>
      </div>

      {/* Recommendations Panel */}
      <div data-testid="recommendations-panel" className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h2>
        
        <div className="text-center py-8 text-gray-500">
          AI recommendations will be displayed here
        </div>
      </div>
    </div>
  );
}