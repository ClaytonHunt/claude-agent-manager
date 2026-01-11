import React, { useMemo } from 'react';
import { ToolAnalytics } from '@claude-agent-manager/shared';
import { Card, CardHeader, CardContent, Badge } from '@/components/common';
import { cn, formatDate } from '@/utils';
import {
  Wrench,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  Lightbulb,
} from 'lucide-react';

interface ToolUsageDashboardProps {
  analytics: ToolAnalytics | null;
  isLoading?: boolean;
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  file_operations: 'bg-blue-100 text-blue-700',
  search_operations: 'bg-purple-100 text-purple-700',
  system_operations: 'bg-orange-100 text-orange-700',
  network_operations: 'bg-green-100 text-green-700',
  agent_operations: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-700',
};

const CATEGORY_LABELS: Record<string, string> = {
  file_operations: 'File Operations',
  search_operations: 'Search Operations',
  system_operations: 'System Operations',
  network_operations: 'Network Operations',
  agent_operations: 'Agent Operations',
  other: 'Other',
};

export function ToolUsageDashboard({
  analytics,
  isLoading = false,
  className,
}: ToolUsageDashboardProps) {
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const categoryData = useMemo(() => {
    if (!analytics?.byCategory) return [];
    return Object.entries(analytics.byCategory)
      .map(([category, data]) => ({
        category,
        label: CATEGORY_LABELS[category] || category,
        ...data,
      }))
      .sort((a, b) => b.count - a.count);
  }, [analytics?.byCategory]);

  const totalCategoryCount = useMemo(() => {
    return categoryData.reduce((sum, cat) => sum + cat.count, 0);
  }, [categoryData]);

  if (isLoading) {
    return (
      <div className={cn('p-8 text-center text-gray-500', className)}>
        <BarChart3 className="w-8 h-8 mx-auto mb-2 animate-pulse" />
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={cn('p-8 text-center text-gray-500', className)}>
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No analytics data available</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wrench className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Tool Calls</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.summary.totalToolCalls.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Unique Tools</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.summary.uniqueToolsUsed}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Execution Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(analytics.summary.averageExecutionTime)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(analytics.summary.successRate * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool Usage by Category */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">Usage by Category</h3>
            </div>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No category data</p>
            ) : (
              <div className="space-y-3">
                {categoryData.map((cat) => {
                  const percentage =
                    totalCategoryCount > 0
                      ? ((cat.count / totalCategoryCount) * 100).toFixed(1)
                      : '0';
                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.other
                          )}
                        >
                          {cat.label}
                        </span>
                        <span className="text-gray-600">
                          {cat.count.toLocaleString()} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={cn(
                            'h-2 rounded-full',
                            cat.category === 'file_operations'
                              ? 'bg-blue-500'
                              : cat.category === 'search_operations'
                              ? 'bg-purple-500'
                              : cat.category === 'system_operations'
                              ? 'bg-orange-500'
                              : cat.category === 'network_operations'
                              ? 'bg-green-500'
                              : cat.category === 'agent_operations'
                              ? 'bg-pink-500'
                              : 'bg-gray-500'
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Avg: {formatDuration(cat.avgDuration)}</span>
                        <span>
                          Error rate: {((cat.errorRate || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Tools */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">Top Tools</h3>
            </div>
          </CardHeader>
          <CardContent>
            {analytics.topTools.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No tool data</p>
            ) : (
              <div className="space-y-2">
                {analytics.topTools.slice(0, 8).map((tool, index) => (
                  <div
                    key={tool.toolName}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{tool.toolName}</p>
                        <p className="text-xs text-gray-500">
                          {CATEGORY_LABELS[tool.category] || tool.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {tool.count.toLocaleString()} calls
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDuration(tool.avgDuration)} avg
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Patterns & Insights */}
      {analytics.patterns.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Patterns & Recommendations
              </h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.patterns.map((pattern, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md"
                >
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{pattern.type}</p>
                    <p className="text-sm text-gray-600">{pattern.description}</p>
                    {pattern.recommendation && (
                      <p className="text-sm text-yellow-700 mt-1">
                        <span className="font-medium">Recommendation:</span>{' '}
                        {pattern.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Timeline */}
      {analytics.timeline.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">Recent Tool Activity</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {analytics.timeline.slice(0, 20).map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        entry.success ? 'bg-green-500' : 'bg-red-500'
                      )}
                    />
                    <span className="font-medium text-gray-900">{entry.toolName}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{formatDuration(entry.duration)}</span>
                    <span>{formatDate(entry.timestamp, 'HH:mm:ss')}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ToolUsageDashboard;
