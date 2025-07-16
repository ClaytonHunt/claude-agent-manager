import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Agent } from '@claude-agent-manager/shared';
import { useAgentStore } from '@/stores';
import { LoadingSpinner, Button, Card, CardContent } from '@/components/common';
import { AgentDetailHeader, AgentDetailTabs, LogViewer, AgentContextPanel } from '@/components/agent';
import { AlertTriangle, AlertCircle, Info, FileText, Settings, Activity } from 'lucide-react';

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchAgent } = useAgentStore();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAgent = async () => {
      if (!id) {
        navigate('/agents');
        return;
      }

      // Validate agent ID format (basic UUID-like pattern)
      const idPattern = /^[a-zA-Z0-9-_]+$/;
      if (!idPattern.test(id)) {
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Parent Agent</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">{agent.parentId}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Project Path</dt>
                    <dd className="mt-1 text-sm text-gray-900 break-all">{agent.projectPath}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-green-500 hover:bg-green-600"
                    disabled={agent.status === 'active'}
                  >
                    Start Agent
                  </Button>
                  <Button 
                    className="w-full bg-yellow-500 hover:bg-yellow-600"
                    disabled={agent.status !== 'active'}
                  >
                    Pause Agent
                  </Button>
                  <Button 
                    variant="danger"
                    className="w-full"
                    disabled={agent.status === 'complete'}
                  >
                    Stop Agent
                  </Button>
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
    {
      id: 'logs',
      label: 'Logs',
      icon: <FileText className="w-4 h-4" />,
      badge: agent.logs?.length || 0,
      content: (
        <LogViewer
          logs={agent.logs || []}
          title={`Agent Logs (${agent.logs?.length || 0})`}
          maxHeight={600}
          autoScroll={true}
          className="border-none shadow-none"
        />
      ),
    },
    {
      id: 'context',
      label: 'Context',
      icon: <Settings className="w-4 h-4" />,
      content: (
        <AgentContextPanel agent={agent} />
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
      <AgentDetailTabs tabs={tabs} defaultActiveTab="overview" />
    </div>
  );
}

export default AgentDetailPage;