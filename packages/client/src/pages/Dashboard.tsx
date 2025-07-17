import React, { useEffect } from 'react';
import { AgentCard } from '@/components/agent';
import { Card, CardHeader, CardContent, LoadingState } from '@/components/common';
import { useAgentStore, useUiStore } from '@/stores';
import { useWebSocket, useAgentUpdates } from '@/hooks';
import { PROJECT_PATH } from '@/utils/constants';
import { BarChart3, TrendingUp, Users, AlertTriangle } from 'lucide-react';

export function Dashboard() {
  const {
    agents,
    loading,
    error,
    fetchAgents,
    getFilteredAgents,
    getAgentStats,
    updateAgent,
    addLogToAgent,
  } = useAgentStore();
  
  const { addNotification } = useUiStore();
  const { state: wsState, on, off, subscribe } = useWebSocket({ autoConnect: true });

  // Real-time agent updates
  useEffect(() => {
    const handleAgentUpdate = (message: any) => {
      if (message.type === 'agent_update' && message.data) {
        updateAgent(message.data);
      }
    };

    const handleAgentCreated = (message: any) => {
      if (message.type === 'agent_created' && message.data) {
        // Refresh agents list to include new agent
        fetchAgents();
        addNotification({
          type: 'success',
          title: 'New Agent Created',
          message: `Agent ${message.data.id.slice(-8)} created`,
        });
      }
    };

    const handleAgentDeleted = (message: any) => {
      if (message.type === 'agent_deleted' && message.data) {
        // Refresh agents list to remove deleted agent
        fetchAgents();
        addNotification({
          type: 'info',
          title: 'Agent Deleted',
          message: `Agent ${message.data.agentId.slice(-8)} removed`,
        });
      }
    };

    const handleLogEntry = (message: any) => {
      if (message.type === 'log_entry' && message.data) {
        const { agentId, logEntry } = message.data;
        addLogToAgent(agentId, logEntry);
        
        // Show notification for error logs
        if (logEntry.level === 'error') {
          addNotification({
            type: 'error',
            title: 'Agent Error',
            message: `Agent ${agentId.slice(-8)}: ${logEntry.message}`,
          });
        }
      }
    };

    const handleAgentError = (message: any) => {
      if (message.type === 'agent_error' && message.data) {
        const { agentId, error, timestamp } = message.data;
        
        // Add error log to agent
        addLogToAgent(agentId, {
          id: `error_${Date.now()}`,
          timestamp: new Date(timestamp),
          level: 'error',
          message: error,
          metadata: { source: 'agent_error_event' }
        });
        
        // Show prominent error notification
        addNotification({
          type: 'error',
          title: 'Agent Error',
          message: `Agent ${agentId.slice(-8)} encountered an error: ${error}`,
        });
        
        // Update agent status to error if needed
        updateAgent({ 
          id: agentId, 
          status: 'error', 
          lastActivity: new Date(timestamp) 
        });
      }
    };

    const handleHandoff = (message: any) => {
      if (message.type === 'handoff' && message.data) {
        const { fromAgentId, toAgentId, context, timestamp } = message.data;
        
        // Add handoff logs to both agents
        const handoffMessage = `Handoff: ${fromAgentId.slice(-8)} → ${toAgentId.slice(-8)}`;
        const handoffTimestamp = new Date(timestamp);
        
        addLogToAgent(fromAgentId, {
          id: `handoff_from_${Date.now()}`,
          timestamp: handoffTimestamp,
          level: 'info',
          message: `Handed off to agent ${toAgentId.slice(-8)}`,
          metadata: { source: 'handoff_event', toAgentId, context }
        });
        
        addLogToAgent(toAgentId, {
          id: `handoff_to_${Date.now()}`,
          timestamp: handoffTimestamp,
          level: 'info',
          message: `Received handoff from agent ${fromAgentId.slice(-8)}`,
          metadata: { source: 'handoff_event', fromAgentId, context }
        });
        
        // Show handoff notification
        addNotification({
          type: 'info',
          title: 'Agent Handoff',
          message: handoffMessage,
        });
        
        // Update agent statuses
        updateAgent({ 
          id: fromAgentId, 
          status: 'handoff', 
          lastActivity: handoffTimestamp 
        });
        updateAgent({ 
          id: toAgentId, 
          status: 'active', 
          lastActivity: handoffTimestamp 
        });
      }
    };

    on('agent_update', handleAgentUpdate);
    on('agent_created', handleAgentCreated);
    on('agent_deleted', handleAgentDeleted);
    on('log_entry', handleLogEntry);
    on('agent_error', handleAgentError);
    on('handoff', handleHandoff);

    return () => {
      off('agent_update', handleAgentUpdate);
      off('agent_created', handleAgentCreated);
      off('agent_deleted', handleAgentDeleted);
      off('log_entry', handleLogEntry);
      off('agent_error', handleAgentError);
      off('handoff', handleHandoff);
    };
  }, [updateAgent, addLogToAgent, addNotification, fetchAgents, on, off]);

  // Fetch agents on mount
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Subscribe to project channels for real-time updates
  useEffect(() => {
    // Get unique project paths from current agents
    const projectPaths = [...new Set(agents.map(a => a.projectPath))];
    
    // If no agents yet, subscribe to current project path
    if (projectPaths.length === 0) {
      // Use configured project path or fallback to current pathname
      const currentProjectPath = PROJECT_PATH !== '/default/project' ? PROJECT_PATH : window.location.pathname;
      projectPaths.push(currentProjectPath);
    }
    
    // Subscribe to project channels for broader coverage
    const projectChannels = projectPaths.map(path => `project:${path}`);
    
    // Also subscribe to individual agent channels for existing agents
    const agentChannels = agents.map(agent => `agent:${agent.id}`);
    
    // Subscribe to all relevant channels
    const allChannels = [...projectChannels, ...agentChannels];
    subscribe(allChannels);
    
    console.log('Dashboard subscribed to channels:', allChannels);
  }, [agents, subscribe]);

  const filteredAgents = getFilteredAgents();
  
  // Filter to show only agents active in the last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentlyActiveAgents = filteredAgents.filter(agent => 
    agent.lastActivity > fiveMinutesAgo
  );
  
  const stats = getAgentStats();

  const statCards = [
    {
      title: 'Total Agents',
      value: stats.total,
      icon: Users,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Active',
      value: stats.active,
      icon: TrendingUp,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
    {
      title: 'Errors',
      value: stats.error,
      icon: AlertTriangle,
      color: 'text-error-600',
      bgColor: 'bg-error-50',
    },
    {
      title: 'Handoffs',
      value: stats.handoff,
      icon: BarChart3,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor your Claude Code agents in real-time
          </p>
        </div>
        
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Agents Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recently Active Agents
          </h2>
          <div className="text-sm text-gray-500">
            Showing {recentlyActiveAgents.length} agents active in last 5 minutes
          </div>
        </div>

        <LoadingState loading={loading} error={error}>
          {recentlyActiveAgents.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No recently active agents
                </h3>
                <p className="text-gray-600">
                  No agents have been active in the last 5 minutes.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recentlyActiveAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onClick={() => {
                    // TODO: Navigate to agent details
                    console.log('Navigate to agent:', agent.id);
                  }}
                />
              ))}
            </div>
          )}
        </LoadingState>
      </div>

      {/* WebSocket Status */}
      {wsState.error && (
        <Card className="border-error-200 bg-error-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-error-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-error-800">
                  WebSocket Connection Error
                </p>
                <p className="text-sm text-error-600 mt-1">
                  {wsState.error}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}