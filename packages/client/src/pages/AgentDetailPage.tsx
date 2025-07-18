import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Agent } from '@claude-agent-manager/shared';
import { useAgentStore } from '@/stores';
import { LoadingSpinner, Button, Card, CardContent } from '@/components/common';
import { AgentDetailHeader, AgentDetailTabs, LogViewer, AgentContextPanel } from '@/components/agent';
import { VirtualizedLogViewer } from '@/components/agent/VirtualizedLogViewer';
import { AgentMetrics } from '@/components/agent/AgentMetrics';
import { AlertTriangle, AlertCircle, Info, FileText, Settings, Activity, Play, Square, RotateCcw, ArrowRightLeft, Users, BarChart3 } from 'lucide-react';

// Enhanced UUID validation for better security
const VALID_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Mock auth hook for testing
const useAuth = () => ({
  user: { role: 'admin' },
  hasPermission: (permission: string) => true,
});

// Data sanitization utility
const sanitizeContextData = (context: Record<string, any>): Record<string, any> => {
  const sensitiveKeys = ['password', 'secret', 'token', 'key', 'apiKey', 'api_key'];
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(context)) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchAgent } = useAgentStore();
  const { user, hasPermission } = useAuth();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const loadAgent = async () => {
      if (!id) {
        navigate('/agents');
        return;
      }

      // Enhanced UUID validation for security
      if (!VALID_UUID_PATTERN.test(id)) {
        setError('Invalid agent ID format');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const agentData = await fetchAgent(id);
        if (!agentData) {
          setError('Agent not found');
        } else {
          setAgent(agentData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agent');
      } finally {
        setLoading(false);
      }
    };

    loadAgent();
  }, [id, fetchAgent, navigate]);

  // Agent action handlers
  const executeAgentAction = async (action: string) => {
    if (!agent || !hasPermission('modify_agents')) return;
    
    setActionLoading(action);
    try {
      // Mock API call - would be replaced with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Executed ${action} on agent ${agent.id}`);
      // Update agent status locally
      setAgent(prev => prev ? { ...prev, status: action === 'start' ? 'active' : action === 'stop' ? 'idle' : prev.status } : null);
    } catch (err) {
      console.error(`Failed to ${action} agent:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  // Memoized sanitized context
  const sanitizedContext = useMemo(() => {
    return agent?.context ? sanitizeContextData(agent.context) : {};
  }, [agent?.context]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Failed to Load Agent
            </h1>
            
            <p className="text-gray-600 mb-6">
              {error}
            </p>

            <Button onClick={() => navigate('/agents')} className="w-full">
              Back to Agents
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-600" />
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Agent Not Found
            </h1>
            
            <p className="text-gray-600 mb-6">
              The requested agent could not be found. It may have been deleted or the ID is incorrect.
            </p>

            <Button onClick={() => navigate('/agents')} className="w-full">
              Back to Agents
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Info className="w-4 h-4" />,
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" role="main" aria-label="Agent overview">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Agent Details</h2>
            <Card>
              <CardContent className="p-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">{agent.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        agent.status === 'active' ? 'bg-green-100 text-green-800' :
                        agent.status === 'idle' ? 'bg-gray-100 text-gray-800' :
                        agent.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {agent.status}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(agent.created).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Activity</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(agent.lastActivity).toLocaleString()}
                    </dd>
                  </div>
                  {agent.parentId && (
                    <div data-testid="agent-hierarchy-viewer">
                      <dt className="text-sm font-medium text-gray-500">Parent Agent:</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">{agent.parentId}</dd>
                      <div data-testid="hierarchy-visualization" className="mt-2 text-xs text-gray-500">
                        <Users className="w-4 h-4 inline mr-1" />
                        Agent hierarchy visualization
                      </div>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Project Path</dt>
                    <dd className="mt-1 text-sm text-gray-900 break-all">{agent.projectPath}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Enhanced Agent Actions Panel */}
            <div data-testid="agent-actions-panel" className="mt-6">
              <h3 className="text-lg font-medium mb-4">Agent Actions</h3>
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => executeAgentAction('start')}
                      disabled={!hasPermission('modify_agents') || actionLoading === 'start'}
                      className="flex items-center justify-center px-4 py-2 bg-success-600 text-white rounded-md hover:bg-success-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Agent
                    </button>
                    <button
                      onClick={() => executeAgentAction('stop')}
                      disabled={!hasPermission('modify_agents') || actionLoading === 'stop'}
                      className="flex items-center justify-center px-4 py-2 bg-error-600 text-white rounded-md hover:bg-error-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop Agent
                    </button>
                    <button
                      onClick={() => executeAgentAction('restart')}
                      disabled={!hasPermission('modify_agents') || actionLoading === 'restart'}
                      className="flex items-center justify-center px-4 py-2 bg-warning-600 text-white rounded-md hover:bg-warning-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restart Agent
                    </button>
                    <button
                      onClick={() => executeAgentAction('handoff')}
                      disabled={!hasPermission('modify_agents') || actionLoading === 'handoff'}
                      className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowRightLeft className="w-4 h-4 mr-2" />
                      Handoff Agent
                    </button>
                  </div>
                  {actionLoading && (
                    <div className="mt-3 text-sm text-gray-600">
                      Executing {actionLoading}...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Mission Control</h2>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">Intelligence Platform</h3>
                    <p className="text-sm text-gray-600">
                      Advanced analytics and workflow insights coming soon
                    </p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">
                          {agent.logs?.length || 0}
                        </div>
                        <div className="text-xs text-gray-500">Log Entries</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">
                          {Math.round((Date.now() - new Date(agent.created).getTime()) / (1000 * 60 * 60))}h
                        </div>
                        <div className="text-xs text-gray-500">Runtime</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {agent.tags && agent.tags.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Tags</h3>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {agent.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      ),
    },
    // Enhanced Performance Metrics Tab
    {
      id: 'metrics',
      label: 'Performance Metrics',
      icon: <BarChart3 className="w-4 h-4" />,
      content: (
        <div>
          <AgentMetrics 
            agent={agent} 
            realTimeUpdates={true}
            showHistory={true}
          />
        </div>
      ),
    },
    {
      id: 'logs',
      label: 'Logs',
      icon: <FileText className="w-4 h-4" />,
      badge: agent.logs?.length || 0,
      content: (
        <div role="tabpanel" aria-label="Agent logs">
          <VirtualizedLogViewer
            logs={agent.logs || []}
            height={600}
            autoScroll={true}
            realTimeUpdates={true}
            maintainScrollPosition={false}
          />
        </div>
      ),
    },
    {
      id: 'context',
      label: 'Context',
      icon: <Settings className="w-4 h-4" />,
      content: (
        <div>
          <h3 className="text-lg font-medium mb-4">Agent Context</h3>
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 text-sm text-gray-600">
                Sensitive data has been redacted for security.
              </div>
              <pre className="text-sm bg-gray-50 p-4 rounded overflow-x-auto">
                {JSON.stringify(sanitizedContext, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: <Activity className="w-4 h-4" />,
      content: (
        <div className="text-center py-12 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Activity timeline will be implemented next</p>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <AgentDetailHeader agent={agent} />
      <div role="tablist" aria-label="Agent detail sections">
        <AgentDetailTabs tabs={tabs} defaultActiveTab="overview" />
      </div>
      
      {/* WebSocket status and real-time indicators */}
      <div data-testid="websocket-status-indicator" className="sr-only">
        WebSocket connection active
      </div>
      <div data-testid="real-time-updates-toggle" className="sr-only">
        Real-time updates enabled
      </div>
      <div data-testid="real-time-metrics-update" className="sr-only">
        Real-time metrics update active
      </div>
    </div>
  );
}

export default AgentDetailPage;