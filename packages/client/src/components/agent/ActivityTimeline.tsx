import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { formatDate, cn } from '@/utils';
import { ActivityEvent, ActivityEventType } from '@claude-agent-manager/shared';
import { Card, CardHeader, CardContent, Badge } from '@/components/common';
import {
  Activity,
  Play,
  Square,
  Wrench,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowRightLeft,
  FileText,
  Filter,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface ActivityTimelineProps {
  agentId: string;
  activities?: ActivityEvent[];
  height?: number;
  realTimeUpdates?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
  className?: string;
}

interface ActivityFilters {
  types: ActivityEventType[];
  search: string;
}

const ITEM_HEIGHT = 72;
const OVERSCAN_COUNT = 5;

const EVENT_ICONS: Record<ActivityEventType, React.ReactNode> = {
  agent_started: <Play className="w-4 h-4" />,
  agent_stopped: <Square className="w-4 h-4" />,
  tool_started: <Wrench className="w-4 h-4" />,
  tool_completed: <CheckCircle className="w-4 h-4" />,
  status_change: <RefreshCw className="w-4 h-4" />,
  context_update: <FileText className="w-4 h-4" />,
  handoff: <ArrowRightLeft className="w-4 h-4" />,
  error: <AlertCircle className="w-4 h-4" />,
  log: <Activity className="w-4 h-4" />,
};

const EVENT_COLORS: Record<ActivityEventType, string> = {
  agent_started: 'bg-green-100 text-green-700 border-green-300',
  agent_stopped: 'bg-gray-100 text-gray-700 border-gray-300',
  tool_started: 'bg-blue-100 text-blue-700 border-blue-300',
  tool_completed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  status_change: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  context_update: 'bg-purple-100 text-purple-700 border-purple-300',
  handoff: 'bg-orange-100 text-orange-700 border-orange-300',
  error: 'bg-red-100 text-red-700 border-red-300',
  log: 'bg-gray-100 text-gray-700 border-gray-300',
};

const STATUS_COLORS: Record<string, string> = {
  success: 'text-green-600',
  error: 'text-red-600',
  pending: 'text-yellow-600',
  info: 'text-blue-600',
};

export function ActivityTimeline({
  agentId,
  activities = [],
  height = 600,
  realTimeUpdates = false,
  onLoadMore,
  isLoading = false,
  className,
}: ActivityTimelineProps) {
  const [filters, setFilters] = useState<ActivityFilters>({
    types: [],
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Update timestamp when activities change
  useEffect(() => {
    if (activities.length > 0) {
      setLastUpdate(new Date());
    }
  }, [activities.length]);

  // Filter activities based on current filters
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      // Type filter
      if (filters.types.length > 0 && !filters.types.includes(activity.type)) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          activity.title.toLowerCase().includes(searchLower) ||
          activity.description.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [activities, filters]);

  const toggleEventType = useCallback((type: ActivityEventType) => {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  }, []);

  const toggleExpanded = useCallback((eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }, []);

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    if (seconds > 0) return `${seconds}s ago`;
    return 'just now';
  };

  // Row renderer for virtual scrolling
  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const activity = filteredActivities[index];
      const isExpanded = expandedEvents.has(activity.id);

      return (
        <div style={style} className="px-4">
          <div
            className={cn(
              'flex items-start space-x-3 p-3 rounded-lg border transition-colors hover:bg-gray-50',
              EVENT_COLORS[activity.type]
            )}
          >
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  activity.status === 'error' ? 'bg-red-200' : 'bg-white border'
                )}
              >
                {EVENT_ICONS[activity.type]}
              </div>
              {index < filteredActivities.length - 1 && (
                <div className="w-px h-full bg-gray-200 mt-1" />
              )}
            </div>

            {/* Event content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm text-gray-900 truncate">
                    {activity.title}
                  </span>
                  {activity.status && (
                    <span
                      className={cn(
                        'text-xs font-medium',
                        STATUS_COLORS[activity.status]
                      )}
                    >
                      {activity.status}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  {activity.duration && (
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDuration(activity.duration)}
                    </span>
                  )}
                  <span title={formatDate(activity.timestamp, 'yyyy-MM-dd HH:mm:ss')}>
                    {getRelativeTime(activity.timestamp)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                {activity.description}
              </p>

              {/* Expandable metadata */}
              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                <button
                  onClick={() => toggleExpanded(activity.id)}
                  className="flex items-center text-xs text-gray-500 mt-1 hover:text-gray-700"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 mr-1" />
                  ) : (
                    <ChevronRight className="w-3 h-3 mr-1" />
                  )}
                  {isExpanded ? 'Hide details' : 'Show details'}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    },
    [filteredActivities, expandedEvents, toggleExpanded]
  );

  const eventTypeLabels: Record<ActivityEventType, string> = {
    agent_started: 'Started',
    agent_stopped: 'Stopped',
    tool_started: 'Tool Start',
    tool_completed: 'Tool Done',
    status_change: 'Status',
    context_update: 'Context',
    handoff: 'Handoff',
    error: 'Error',
    log: 'Log',
  };

  return (
    <div className={className}>
      <Card data-testid="activity-timeline">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-medium text-gray-900">Activity Timeline</h3>
              <Badge variant="gray" size="sm" data-testid="activity-count">
                {filteredActivities.length} / {activities.length}
              </Badge>
              {realTimeUpdates && (
                <div
                  data-testid="realtime-indicator"
                  className="flex items-center space-x-1"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-500">Live</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'p-2 rounded-md transition-colors',
                showFilters ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
              )}
              aria-label="Toggle filters"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {realTimeUpdates && (
            <div className="text-xs text-gray-500 mt-1">
              Last updated: {formatDate(lastUpdate, 'HH:mm:ss')}
            </div>
          )}

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md space-y-3">
              {/* Search */}
              <input
                type="text"
                placeholder="Search activities..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />

              {/* Event type filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(EVENT_ICONS) as ActivityEventType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleEventType(type)}
                      className={cn(
                        'flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors',
                        filters.types.includes(type)
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      )}
                    >
                      {EVENT_ICONS[type]}
                      <span>{eventTypeLabels[type]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear filters */}
              {(filters.types.length > 0 || filters.search) && (
                <button
                  onClick={() => setFilters({ types: [], search: '' })}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p>Loading activity...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>
                {activities.length === 0
                  ? 'No activity recorded yet'
                  : 'No activities match current filters'}
              </p>
            </div>
          ) : (
            <List
              data-testid="activity-list"
              height={height}
              itemCount={filteredActivities.length}
              itemSize={ITEM_HEIGHT}
              overscanCount={OVERSCAN_COUNT}
              width="100%"
            >
              {Row}
            </List>
          )}

          {/* Load more button */}
          {onLoadMore && activities.length > 0 && (
            <div className="p-4 text-center border-t">
              <button
                onClick={onLoadMore}
                disabled={isLoading}
                className="text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
              >
                Load more activities
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ActivityTimeline;
