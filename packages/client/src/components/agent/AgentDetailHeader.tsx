import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Agent } from '@claude-agent-manager/shared';
import { Button } from '@/components/common/Button';
import { StatusIndicator } from '@/components/common/StatusIndicator';
import { Badge } from '@/components/common/Badge';

interface AgentDetailHeaderProps {
  agent: Agent;
  className?: string;
}

export function AgentDetailHeader({ agent, className = '' }: AgentDetailHeaderProps) {
  const navigate = useNavigate();

  const getStatusVariant = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'error':
        return 'error';
      case 'handoff':
        return 'warning';
      case 'complete':
        return 'primary';
      default:
        return 'gray';
    }
  };

  const formatPath = (path: string) => {
    // Show only the last 3 parts of the path for better readability
    const parts = path.split('/');
    if (parts.length > 3) {
      return '.../' + parts.slice(-3).join('/');
    }
    return path;
  };

  return (
    <div className={`mb-6 ${className}`}>
      {/* Breadcrumb Navigation */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/agents')}
          className="text-blue-600 hover:text-blue-800 p-0 hover:bg-transparent"
        >
          ← Back to Agents
        </Button>
      </div>

      {/* Agent Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Agent {agent.id.slice(-8)}
            </h1>
            <StatusIndicator 
              status={agent.status} 
              size="lg" 
              showLabel={false}
            />
            <Badge 
              variant={getStatusVariant(agent.status)}
              size="md"
            >
              {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
            </Badge>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="font-medium">Project:</span>
              <span className="font-mono" title={agent.projectPath}>
                {formatPath(agent.projectPath)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Created:</span>
                <span>{new Date(agent.created).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Last Activity:</span>
                <span>
                  {new Date(agent.lastActivity).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Status Info */}
        <div className="flex flex-col sm:items-end space-y-2">
          {agent.parentId && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Parent:</span>
              <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                {agent.parentId.slice(-8)}
              </span>
            </div>
          )}
          
          {agent.tags && agent.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end">
              {agent.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="gray"
                  size="sm"
                >
                  {tag}
                </Badge>
              ))}
              {agent.tags.length > 3 && (
                <Badge variant="gray" size="sm">
                  +{agent.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full Agent ID (collapsed by default, can be expanded) */}
      <details className="mt-3">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
          Show full agent ID
        </summary>
        <div className="mt-1 text-xs font-mono text-gray-600 bg-gray-50 p-2 rounded border">
          {agent.id}
        </div>
      </details>
    </div>
  );
}