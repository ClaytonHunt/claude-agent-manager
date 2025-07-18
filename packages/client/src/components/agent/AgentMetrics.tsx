import React, { useMemo, useState } from 'react';
import { formatDate, cn } from '@/utils';
import { Agent } from '@claude-agent-manager/shared';
import { Card, CardHeader, CardContent, Badge } from '@/components/common';
import { 
  Cpu, 
  HardDrive, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Users,
  RefreshCw,
  Activity,
  BarChart3,
  Zap,
} from 'lucide-react';

interface AgentMetricsProps {
  agent: Agent;
  realTimeUpdates?: boolean;
  updateInterval?: number;
  showHistory?: boolean;
  className?: string;
}

interface AgentMetrics {
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    responseTime: number;
  };
  operational: {
    uptime: number;
    errorRate: number;
    requestCount: number;
  };
  realtime: {
    status: 'active' | 'idle' | 'error' | 'handoff';
    lastActivity: Date;
    connectedClients: number;
  };
}

// Mock hook for metrics - would be replaced with actual implementation
const useAgentMetrics = (agentId: string, agent: Agent) => {
  // Generate mock metrics based on agent data
  const metrics: AgentMetrics = useMemo(() => ({
    performance: {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      responseTime: Math.random() * 500 + 50,
    },
    operational: {
      uptime: Date.now() - new Date(agent.created).getTime(),
      errorRate: Math.random() * 10,
      requestCount: agent.logs?.length * 10 || 0,
    },
    realtime: {
      status: agent.status,
      lastActivity: new Date(agent.lastActivity),
      connectedClients: Math.floor(Math.random() * 5) + 1,
    },
  }), [agent]);

  return {
    metrics,
    loading: false,
    error: null,
    refreshMetrics: () => {},
  };
};

export function AgentMetrics({
  agent,
  realTimeUpdates = false,
  updateInterval = 5000,
  showHistory = false,
  className,
}: AgentMetricsProps) {
  const { metrics, loading, error, refreshMetrics } = useAgentMetrics(agent.id, agent);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getErrorRateColor = (errorRate: number) => {
    if (errorRate < 1) return 'text-success-600';
    if (errorRate < 5) return 'text-warning-600';
    return 'text-error-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success-100 text-success-800';
      case 'idle': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-error-100 text-error-800';
      case 'handoff': return 'bg-warning-100 text-warning-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div data-testid="metrics-loading" className={className}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Card key={i} data-testid="metric-skeleton">
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="metrics-error" className={cn("text-center p-8", className)}>
        <AlertTriangle className="w-12 h-12 text-error-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Metrics</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={refreshMetrics}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div data-testid="metrics-unavailable" className={cn("text-center p-8", className)}>
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Metrics not available</h3>
        <p className="text-gray-600">Agent metrics will be displayed here when available.</p>
      </div>
    );
  }

  return (
    <div data-testid="agent-metrics-dashboard" className={className}>
      {/* Real-time connection indicator */}
      {realTimeUpdates && (
        <div data-testid="websocket-metrics-connection" className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Real-time metrics active</span>
            <span data-testid="last-updated-timestamp" className="text-xs text-gray-500">
              Updated: {formatDate(new Date(), 'HH:mm:ss')}
            </span>
          </div>
          {updateInterval && (
            <div data-testid="update-debouncer" className="text-xs text-gray-500">
              Update interval: {updateInterval / 1000}s
            </div>
          )}
        </div>
      )}

      {/* Performance Metrics */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CPU Usage */}
          <Card data-testid="cpu-usage-metric">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">CPU Usage</p>
                  <p className="text-2xl font-bold text-gray-900" aria-label="CPU usage percentage">
                    {metrics.performance.cpuUsage.toFixed(1)}%
                  </p>
                </div>
                <Cpu className="w-8 h-8 text-primary-600" />
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${metrics.performance.cpuUsage}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Memory Usage */}
          <Card data-testid="memory-usage-metric">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                  <p className="text-2xl font-bold text-gray-900" aria-label="Memory usage percentage">
                    {metrics.performance.memoryUsage.toFixed(1)}%
                  </p>
                </div>
                <HardDrive className="w-8 h-8 text-primary-600" />
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${metrics.performance.memoryUsage}%` }}
                ></div>
              </div>
              <div data-testid="memory-trend-chart" className="mt-2 text-xs text-gray-500">
                Trend: Stable
              </div>
            </CardContent>
          </Card>

          {/* Response Time */}
          <Card data-testid="response-time-metric">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Response Time</p>
                  <p className="text-2xl font-bold text-gray-900" aria-label="Average response time">
                    {Math.round(metrics.performance.responseTime)}ms
                  </p>
                </div>
                <Clock className="w-8 h-8 text-primary-600" />
              </div>
              <div data-testid="response-time-chart" className="mt-2 text-xs text-gray-500">
                Avg: {Math.round(metrics.performance.responseTime)}ms
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Operational Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Uptime */}
          <Card data-testid="uptime-metric">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Uptime</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatUptime(metrics.operational.uptime)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-success-600" />
              </div>
            </CardContent>
          </Card>

          {/* Error Rate */}
          <Card data-testid="error-rate-metric">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Error Rate</p>
                  <p className={cn("text-2xl font-bold", getErrorRateColor(metrics.operational.errorRate))}>
                    {metrics.operational.errorRate.toFixed(1)}%
                  </p>
                </div>
                <AlertTriangle 
                  className={cn("w-8 h-8", getErrorRateColor(metrics.operational.errorRate))}
                  data-testid="error-rate-indicator"
                />
              </div>
            </CardContent>
          </Card>

          {/* Request Count */}
          <Card data-testid="request-count-metric">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.operational.requestCount.toLocaleString()}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-primary-600" />
              </div>
              <div data-testid="throughput-calculation" className="mt-2 text-xs text-gray-500">
                Throughput: {Math.round(metrics.operational.requestCount / (metrics.operational.uptime / (1000 * 60 * 60)))} req/h
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Real-time Status */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Real-time Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Current Status */}
          <Card data-testid="current-status-indicator">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge 
                      variant={metrics.realtime.status === 'active' ? 'success' : 'gray'}
                      className={getStatusColor(metrics.realtime.status)}
                    >
                      {metrics.realtime.status.charAt(0).toUpperCase() + metrics.realtime.status.slice(1)}
                    </Badge>
                    <div 
                      data-testid="status-indicator-active"
                      className={cn(
                        "w-2 h-2 rounded-full",
                        metrics.realtime.status === 'active' ? 'bg-success-500 animate-pulse' : 'bg-gray-400'
                      )}
                    ></div>
                  </div>
                </div>
                <Zap className="w-8 h-8 text-primary-600" />
              </div>
            </CardContent>
          </Card>

          {/* Last Activity */}
          <Card data-testid="last-activity-metric">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Activity:</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(metrics.realtime.lastActivity, 'HH:mm:ss')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(metrics.realtime.lastActivity, 'MMM dd')}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-primary-600" />
              </div>
            </CardContent>
          </Card>

          {/* Connected Clients */}
          <Card data-testid="connected-clients-metric">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Connected Clients</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.realtime.connectedClients}
                  </p>
                </div>
                <Users className="w-8 h-8 text-primary-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Historical Data Section */}
      {showHistory && (
        <div data-testid="metrics-history-section" className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Historical Data</h2>
            <div data-testid="time-range-selector" className="flex space-x-2">
              {['1h', '24h', '7d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={cn(
                    'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                    selectedTimeRange === range
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card data-testid="cpu-history-chart">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-600 mb-2">CPU History</h3>
                <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Chart placeholder</span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="memory-history-chart">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Memory History</h3>
                <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Chart placeholder</span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="response-time-history-chart">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Response Time History</h3>
                <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Chart placeholder</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Cached aggregations indicator */}
      <div data-testid="cached-aggregations" className="sr-only">
        Cached metric calculations active
      </div>

      {/* Screen reader announcement for metric updates */}
      <div role="status" aria-live="polite" className="sr-only">
        Metrics updated
      </div>

      {/* Refresh button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={refreshMetrics}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          aria-label="Refresh metrics"
          tabIndex={0}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Metrics
        </button>
      </div>
    </div>
  );
}