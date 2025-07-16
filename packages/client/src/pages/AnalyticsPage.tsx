import React, { useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react';
import { Card, CardHeader, CardContent, LoadingState } from '@/components/common';
import { useAgentStore } from '@/stores';
import { formatDuration, groupBy } from '@/utils';
import { Agent } from '@/types';

export function AnalyticsPage() {
  const {
    agents,
    loading,
    error,
    fetchAgents,
    getAgentStats,
  } = useAgentStore();

  // Fetch agents on mount
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const stats = getAgentStats();

  // Calculate additional analytics
  const analytics = React.useMemo(() => {
    if (agents.length === 0) {
      return {
        avgLogsPerAgent: 0,
        mostActiveProject: null,
        agentsByHour: {},
        projectDistribution: [],
        statusDistribution: [],
      };
    }

    // Average logs per agent
    const totalLogs = agents.reduce((sum, agent) => sum + agent.logs.length, 0);
    const avgLogsPerAgent = totalLogs / agents.length;

    // Most active project
    const projectGroups = groupBy(agents, agent => agent.projectPath);
    const mostActiveProject = Object.entries(projectGroups)
      .sort(([, a], [, b]) => b.length - a.length)[0];

    // Agents created by hour (last 24 hours)
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const agentsByHour = agents
      .filter(agent => new Date(agent.created) >= last24Hours)
      .reduce((acc, agent) => {
        const hour = new Date(agent.created).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

    // Project distribution
    const projectDistribution = Object.entries(projectGroups)
      .map(([project, projectAgents]) => ({
        project: project.split('/').pop() || project,
        count: projectAgents.length,
        percentage: (projectAgents.length / agents.length) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    // Status distribution with percentages
    const statusDistribution = Object.entries(stats)
      .filter(([key]) => key !== 'total')
      .map(([status, count]) => ({
        status,
        count: count as number,
        percentage: stats.total > 0 ? ((count as number) / stats.total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      avgLogsPerAgent,
      mostActiveProject,
      agentsByHour,
      projectDistribution,
      statusDistribution,
    };
  }, [agents, stats]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success-500';
      case 'error': return 'bg-error-500';
      case 'handoff': return 'bg-warning-500';
      case 'complete': return 'bg-primary-500';
      case 'idle': 
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">
          Insights and statistics about your agent ecosystem
        </p>
      </div>

      <LoadingState loading={loading} error={error}>
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Total Agents
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-primary-50">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Active Agents
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.active}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-success-50">
                  <TrendingUp className="w-6 h-6 text-success-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Avg Logs/Agent
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {analytics.avgLogsPerAgent.toFixed(1)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-warning-50">
                  <BarChart3 className="w-6 h-6 text-warning-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Error Rate
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.total > 0 ? ((stats.error / stats.total) * 100).toFixed(1) : '0.0'}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-error-50">
                  <Clock className="w-6 h-6 text-error-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Distributions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">
                Agent Status Distribution
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.statusDistribution.map(({ status, count, percentage }) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getStatusColor(status)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Project Distribution */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">
                Top Projects
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.projectDistribution.slice(0, 5).map(({ project, count, percentage }) => (
                  <div key={project} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-primary-500" />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {project}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {analytics.projectDistribution.length === 0 && (
                  <p className="text-sm text-gray-500">No projects found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Most Active Project */}
        {analytics.mostActiveProject && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">
                Most Active Project
              </h3>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {analytics.mostActiveProject[0].split('/').pop()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {analytics.mostActiveProject[0]}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">
                    {analytics.mostActiveProject[1].length}
                  </p>
                  <p className="text-sm text-gray-500">agents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity in Last 24 Hours */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">
              Agent Creation Activity (Last 24 Hours)
            </h3>
          </CardHeader>
          <CardContent>
            {Object.keys(analytics.agentsByHour).length > 0 ? (
              <div className="flex items-end space-x-1 h-32">
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="flex-1 flex items-end">
                      <div
                        className="w-full bg-primary-500 rounded-t"
                        style={{
                          height: `${(analytics.agentsByHour[i] || 0) * 10}px`,
                          minHeight: analytics.agentsByHour[i] ? '4px' : '0px',
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                      {i.toString().padStart(2, '0')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No agents created in the last 24 hours
              </p>
            )}
          </CardContent>
        </Card>
      </LoadingState>
    </div>
  );
}