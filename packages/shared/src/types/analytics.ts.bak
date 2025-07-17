/**
 * Analytics types for Mission Control Intelligence Engine
 */

export interface AnalyticsMetrics {
  performance: {
    averageResponseTime: number;
    throughput: number;
    errorRate: number;
    resourceUtilization: number;
  };
  usage: {
    totalAgents: number;
    activeAgents: number;
    completedTasks: number;
    averageRuntime: number;
  };
  patterns: {
    peakHours: number[];
    commonWorkflows: string[];
    efficiencyTrends: TrendData[];
  };
}

export interface TrendData {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface Pattern {
  id: string;
  type: 'behavioral' | 'performance' | 'collaboration' | 'error';
  confidence: number;
  actionable: boolean;
  description: string;
  recommendations: string[];
  detectedAt: Date;
  agentIds: string[];
  frequency: number;
}

export interface Insight {
  id: string;
  type: 'optimization' | 'warning' | 'recommendation' | 'anomaly';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  patterns: Pattern[];
  generatedAt: Date;
  actionableSteps: string[];
  expectedImpact: string;
}

export interface Recommendation {
  id: string;
  type: 'performance' | 'workflow' | 'resource' | 'quality';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedImpact: 'low' | 'medium' | 'high';
  implementationTime: string;
  relatedPatterns: string[];
  actionItems: string[];
}

export interface AnalyticsEvent {
  id: string;
  type: 'agent_created' | 'agent_updated' | 'agent_deleted' | 'log_entry' | 'error' | 'performance_metric';
  agentId: string;
  timestamp: Date;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface PatternDetectionResult {
  patterns: Pattern[];
  confidence: number;
  processingTime: number;
  dataPoints: number;
}

export interface AnalyticsQuery {
  timeRange: {
    start: Date;
    end: Date;
  };
  agentIds?: string[];
  eventTypes?: string[];
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
}

export interface AnalyticsProcessingResult {
  metrics: AnalyticsMetrics;
  patterns: Pattern[];
  insights: Insight[];
  recommendations: Recommendation[];
  processingTime: number;
  dataQuality: {
    completeness: number;
    accuracy: number;
    freshness: number;
  };
}

export interface MLModelConfig {
  modelType: 'pattern_recognition' | 'anomaly_detection' | 'performance_prediction';
  version: string;
  threshold: number;
  parameters: Record<string, any>;
}

export interface MLModelResult {
  predictions: any[];
  confidence: number;
  modelVersion: string;
  processingTime: number;
  features: string[];
}

export interface AnalyticsError extends Error {
  code: string;
  context?: Record<string, any>;
  timestamp: Date;
}

export interface AnalyticsServiceConfig {
  enableRealTimeProcessing: boolean;
  batchSize: number;
  processingInterval: number;
  retentionPeriod: number;
  performanceTargets: {
    maxResponseTime: number;
    minThroughput: number;
    maxErrorRate: number;
  };
}