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
              <h3 className="font-medium text-gray-900 truncate">
                Agent {agent.id.slice(-8)}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {agent.projectPath}
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