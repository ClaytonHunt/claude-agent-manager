import React, { useEffect } from 'react';
import { FolderOpen, Users, Activity, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardContent, LoadingState } from '@/components/common';
import { useAgentStore } from '@/stores';
import { formatRelativeTime, groupBy } from '@/utils';

export function ProjectsPage() {
  const {
    agents,
    loading,
    error,
    fetchAgents,
    getAgentsByProject,
  } = useAgentStore();

  // Fetch agents on mount
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const projectGroups = getAgentsByProject();
  const projects = Object.entries(projectGroups).map(([projectPath, projectAgents]) => {
    const stats = projectAgents.reduce(
      (acc, agent) => {
        acc.total++;
        acc[agent.status]++;
        return acc;
      },
      {
        total: 0,
        idle: 0,
        active: 0,
        error: 0,
        handoff: 0,
        complete: 0,
      }
    );

    const lastActivity = projectAgents.reduce((latest, agent) => {
      return new Date(agent.lastActivity) > new Date(latest) 
        ? agent.lastActivity 
        : latest;
    }, projectAgents[0]?.lastActivity || new Date());

    return {
      projectPath,
      agents: projectAgents,
      stats,
      lastActivity,
    };
  });

  // Sort projects by last activity
  const sortedProjects = projects.sort(
    (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <p className="text-gray-600 mt-1">
          View agent activity grouped by project
        </p>
      </div>

      {/* Projects Grid */}
      <LoadingState loading={loading} error={error}>
        {sortedProjects.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No projects found
              </h3>
              <p className="text-gray-600">
                No agents are currently registered in any projects.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedProjects.map((project) => (
              <Card key={project.projectPath} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <FolderOpen className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {project.projectPath.split('/').pop() || project.projectPath}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {project.projectPath}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {project.stats.total} agent{project.stats.total !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formatRelativeTime(project.lastActivity)}
                      </span>
                    </div>
                  </div>

                  {/* Status breakdown */}
                  <div className="space-y-2">
                    {project.stats.active > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-success-600">Active</span>
                        <span className="font-medium">{project.stats.active}</span>
                      </div>
                    )}
                    {project.stats.idle > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Idle</span>
                        <span className="font-medium">{project.stats.idle}</span>
                      </div>
                    )}
                    {project.stats.error > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-error-600 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Error
                        </span>
                        <span className="font-medium">{project.stats.error}</span>
                      </div>
                    )}
                    {project.stats.handoff > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-warning-600">Handoff</span>
                        <span className="font-medium">{project.stats.handoff}</span>
                      </div>
                    )}
                    {project.stats.complete > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-primary-600">Complete</span>
                        <span className="font-medium">{project.stats.complete}</span>
                      </div>
                    )}
                  </div>

                  {/* Recent agents */}
                  {project.agents.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Recent Agents</p>
                      <div className="space-y-1">
                        {project.agents
                          .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
                          .slice(0, 3)
                          .map((agent) => (
                            <div key={agent.id} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 truncate">
                                {agent.id.slice(-8)}
                              </span>
                              <div className="flex items-center space-x-1">
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    agent.status === 'active'
                                      ? 'bg-success-500'
                                      : agent.status === 'error'
                                      ? 'bg-error-500'
                                      : agent.status === 'handoff'
                                      ? 'bg-warning-500'
                                      : agent.status === 'complete'
                                      ? 'bg-primary-500'
                                      : 'bg-gray-400'
                                  }`}
                                />
                                <span className="text-gray-500">
                                  {agent.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        {project.agents.length > 3 && (
                          <div className="text-xs text-gray-500 text-center pt-1">
                            +{project.agents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </LoadingState>
    </div>
  );
}