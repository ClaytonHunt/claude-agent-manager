import React from 'react';
import { formatRelativeTime, getStatusColor, cn } from '@/utils';
import { Agent } from '@/types';
import { Card, CardContent, Badge, StatusIndicator } from '@/components/common';
import { Clock, MapPin, Tag, ExternalLink } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
  className?: string;
}

export function AgentCard({ agent, onClick, className }: AgentCardProps) {
  const statusColor = getStatusColor(agent.status);
  
  // Generate a descriptive name for the agent
  const getAgentDisplayName = (agent: Agent): string => {
    // Check if agent has task description in context
    const taskDescription = agent.context?.taskDescription;
    const specialist = agent.context?.specialist;
    const toolName = agent.context?.toolName;
    
    if (taskDescription) {
      // For specialist subagents, use a more readable format
      if (specialist && agent.tags.includes('specialist-subagent')) {
        const specialistType = specialist.replace('-specialist', '').replace('-', ' ');
        return `${specialistType.charAt(0).toUpperCase() + specialistType.slice(1)} Specialist`;
      }
      // For other task agents, use the description (truncated)
      return taskDescription.length > 30 
        ? `${taskDescription.substring(0, 30)}...`
        : taskDescription;
    }
    
    // Check agent tags for context
    if (agent.tags.includes('main-agent')) {
      return 'Main Session Agent';
    }
    
    if (agent.tags.includes('conversation-agent')) {
      return 'Interactive Session';
    }
    
    if (agent.tags.includes('specialist-subagent')) {
      if (specialist) {
        const specialistType = specialist.replace('-specialist', '').replace('-', ' ');
        return `${specialistType.charAt(0).toUpperCase() + specialistType.slice(1)} Specialist`;
      }
      return 'Specialist Agent';
    }
    
    // Check tool context for Task agents
    if (toolName === 'Task' || agent.context?.createdFrom === 'Task tool call') {
      return 'Task Agent';
    }
    
    // Check if it's a main project agent (fallback for known patterns)
    if (agent.id === 'claude-agent-manager' || (!agent.id.includes('-') && agent.id.length < 16)) {
      return 'Main Agent';
    }
    
    // Try to create a meaningful name from project path
    if (agent.projectPath && agent.projectPath !== '/' && agent.projectPath !== process.cwd()) {
      const projectName = agent.projectPath.split('/').pop() || 'Unknown Project';
      return `${projectName} Agent`;
    }
    
    // Fallback to agent ID with better formatting
    const shortId = agent.id.slice(-8);
    return `Agent ${shortId}`;
  };
  
  const displayName = getAgentDisplayName(agent);
  
  return (
    <Card 
      className={cn(
        'transition-all duration-200 hover:shadow-md cursor-pointer',
        onClick && 'hover:border-primary-300',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <StatusIndicator status={agent.status} size="md" />
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-900 truncate" title={agent.context?.taskDescription || displayName}>
                {displayName}
              </h3>
              <p className="text-sm text-gray-500 truncate" title={agent.id}>
                {agent.id.length > 20 ? `ID: ${agent.id.slice(-8)}` : agent.id}
              </p>
            </div>
          </div>
          
          <Badge variant={statusColor} size="sm">
            {agent.status}
          </Badge>
        </div>

        {/* Metadata */}
        <div className="space-y-2">
          {/* Project Path */}
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{agent.projectPath}</span>
          </div>

          {/* Last Activity */}
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>
              Active {formatRelativeTime(agent.lastActivity)}
            </span>
          </div>

          {/* Tags */}
          {agent.tags && agent.tags.length > 0 && (
            <div className="flex items-center text-sm text-gray-600">
              <Tag className="w-4 h-4 mr-2 flex-shrink-0" />
              <div className="flex flex-wrap gap-1 min-w-0">
                {agent.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="gray" size="sm">
                    {tag}
                  </Badge>
                ))}
                {agent.tags.length > 3 && (
                  <Badge variant="gray" size="sm">
                    +{agent.tags.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            {agent.logs.length} log{agent.logs.length !== 1 ? 's' : ''}
          </div>
          
          {agent.parentId && (
            <div className="flex items-center text-sm text-gray-600">
              <ExternalLink className="w-3 h-3 mr-1" />
              Child agent
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}