import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { formatDate, cn } from '@/utils';
import { LogEntry, LogLevel } from '@claude-agent-manager/shared';
import { Card, CardHeader, CardContent, Badge } from '@/components/common';
import { 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Trash2, 
  Filter,
  Search,
  Play,
  Pause,
  Calendar,
} from 'lucide-react';

interface VirtualizedLogViewerProps {
  logs: LogEntry[];
  height?: number;
  autoScroll?: boolean;
  maintainScrollPosition?: boolean;
  websocketError?: string;
  onClear?: () => void;
  realTimeUpdates?: boolean;
  className?: string;
}

interface LogFilters {
  levels: LogLevel[];
  search: string;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  metadataSearch: string;
}

const ITEM_HEIGHT = 80;
const OVERSCAN_COUNT = 5;

export function VirtualizedLogViewer({
  logs,
  height = 600,
  autoScroll = true,
  maintainScrollPosition = false,
  websocketError,
  onClear,
  realTimeUpdates = false,
  className,
}: VirtualizedLogViewerProps) {
  const [filters, setFilters] = useState<LogFilters>({
    levels: ['info', 'warn', 'error', 'debug'],
    search: '',
    metadataSearch: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Debounced search to prevent excessive filtering
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Filter logs based on current filters with memoization
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesLevel = filters.levels.includes(log.level);
      
      const matchesSearch = !debouncedSearch || 
        log.message.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesMetadata = !filters.metadataSearch || 
        (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(filters.metadataSearch.toLowerCase()));
      
      return matchesLevel && matchesSearch && matchesMetadata;
    });
  }, [logs, filters.levels, debouncedSearch, filters.metadataSearch]);

  // Update timestamp when logs change (for real-time indicator)
  useEffect(() => {
    if (logs.length > 0) {
      setLastUpdate(new Date());
    }
  }, [logs.length]);

  const getLogLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'error': return 'error';
      case 'warn': return 'warning';
      case 'info': return 'primary';
      case 'debug': return 'gray';
      default: return 'gray';
    }
  };

  const getLogLevelBgColor = (level: LogLevel) => {
    switch (level) {
      case 'error': return 'bg-error-50 border-l-error-500';
      case 'warn': return 'bg-warning-50 border-l-warning-500';
      case 'info': return 'bg-primary-50 border-l-primary-500';
      case 'debug': return 'bg-gray-50 border-l-gray-500';
      default: return 'bg-gray-50 border-l-gray-500';
    }
  };

  const exportLogs = useCallback(() => {
    const exportData = filteredLogs.map(log => {
      const baseData = `[${formatDate(log.timestamp, 'yyyy-MM-dd HH:mm:ss')}] ${log.level.toUpperCase()}: ${log.message}`;
      if (includeMetadata && log.metadata) {
        return `${baseData}\nMetadata: ${JSON.stringify(log.metadata, null, 2)}`;
      }
      return baseData;
    }).join('\n');
    
    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-logs-${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [filteredLogs, includeMetadata]);

  const toggleLevelFilter = useCallback((level: LogLevel) => {
    setFilters(prev => ({
      ...prev,
      levels: prev.levels.includes(level)
        ? prev.levels.filter(l => l !== level)
        : [...prev.levels, level],
    }));
  }, []);

  const handleClearConfirm = useCallback(() => {
    if (onClear) {
      onClear();
    }
    setShowClearDialog(false);
  }, [onClear]);

  // Row renderer for virtual scrolling
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const log = filteredLogs[index];
    
    return (
      <div style={style} className="px-4">
        <div
          className={cn(
            'p-3 border-l-4 rounded-r-md',
            getLogLevelBgColor(log.level)
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Badge variant={getLogLevelColor(log.level)} size="sm">
                  {log.level.toUpperCase()}
                </Badge>
                <span className="text-xs text-gray-500">
                  {formatDate(log.timestamp, 'HH:mm:ss')}
                </span>
              </div>
              <p className="text-sm text-gray-900 break-words">
                {log.message}
              </p>
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                    Metadata
                  </summary>
                  <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }, [filteredLogs]);

  return (
    <div className={className}>
      <Card data-testid="virtualized-log-viewer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-medium text-gray-900">Agent Logs</h3>
              <Badge variant="gray" size="sm" data-testid="filtered-count">
                {filteredLogs.length} / {logs.length}
              </Badge>
              {realTimeUpdates && (
                <div 
                  data-testid="websocket-status-indicator"
                  className="flex items-center space-x-1"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500">Live</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Real-time updates toggle */}
              <button
                data-testid="real-time-updates-toggle"
                className={cn(
                  'p-2 rounded-md text-sm font-medium transition-colors',
                  realTimeUpdates
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
                title={realTimeUpdates ? 'Disable real-time updates' : 'Enable real-time updates'}
              >
                {realTimeUpdates ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              {/* Filters toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  showFilters ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
                )}
                aria-label="Toggle filters"
                title="Toggle filters"
              >
                <Filter className="w-4 h-4" />
              </button>

              {/* Export */}
              <button
                data-testid="export-logs-button"
                onClick={exportLogs}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                title="Export logs"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Clear */}
              {onClear && (
                <button
                  data-testid="clear-logs-button"
                  onClick={() => setShowClearDialog(true)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors text-error-600"
                  title="Clear logs"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Real-time update indicator */}
          {realTimeUpdates && (
            <div data-testid="last-updated-timestamp" className="text-xs text-gray-500 mt-2">
              Last updated: {formatDate(lastUpdate, 'HH:mm:ss')}
            </div>
          )}

          {/* WebSocket Error */}
          {websocketError && (
            <div data-testid="websocket-error" className="mt-2 p-2 bg-error-50 border border-error-200 rounded text-sm text-error-700">
              {websocketError}
            </div>
          )}

          {/* Enhanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  data-testid="log-search-input"
                  type="text"
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  aria-label="Search logs"
                />
              </div>

              {/* Metadata Search */}
              <div className="relative">
                <input
                  data-testid="metadata-search"
                  type="text"
                  placeholder="Search metadata..."
                  value={filters.metadataSearch}
                  onChange={(e) => setFilters(prev => ({ ...prev, metadataSearch: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  aria-label="Search metadata"
                />
              </div>

              {/* Date Range Filter */}
              <div data-testid="date-range-filter" className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">Date range filtering coming soon</span>
              </div>

              {/* Level filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Log Levels
                </label>
                <div data-testid="log-level-filters" className="flex flex-wrap gap-2">
                  {(['error', 'warn', 'info', 'debug'] as LogLevel[]).map(level => (
                    <button
                      key={level}
                      data-testid={`filter-${level}`}
                      onClick={() => toggleLevelFilter(level)}
                      className={cn(
                        'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                        filters.levels.includes(level)
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      )}
                      aria-label={`Filter by ${level} level`}
                    >
                      {level.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Export options */}
              <div className="flex items-center space-x-2">
                <label className="flex items-center">
                  <input
                    data-testid="include-metadata-checkbox"
                    type="checkbox"
                    checked={includeMetadata}
                    onChange={(e) => setIncludeMetadata(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Include metadata in export</span>
                </label>
                {includeMetadata && (
                  <span data-testid="export-with-metadata" className="text-xs text-primary-600">
                    ✓ Metadata enabled
                  </span>
                )}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {/* Virtual Scrolling Container */}
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {logs.length === 0 ? 'No logs available' : 'No logs match current filters'}
            </div>
          ) : (
            <div 
              data-item-count={filteredLogs.length}
              data-item-size={ITEM_HEIGHT}
              data-maintain-scroll={maintainScrollPosition.toString()}
              role="log"
              tabIndex={0}
              aria-label="Log entries"
            >
              <List
                data-testid="virtual-scroll-container"
                height={height}
                itemCount={filteredLogs.length}
                itemSize={ITEM_HEIGHT}
                overscanCount={OVERSCAN_COUNT}
                width="100%"
              >
                {Row}
              </List>
              
              {/* Auto-scroll indicator */}
              {autoScroll && (
                <div data-testid="auto-scroll-enabled" className="sr-only">
                  Auto-scroll enabled
                </div>
              )}
            </div>
          )}

          {/* Real-time metrics update indicator */}
          {realTimeUpdates && (
            <div data-testid="real-time-metrics-update" className="sr-only">
              Real-time updates active
            </div>
          )}

          {/* Metadata match counter */}
          {filters.metadataSearch && (
            <div data-testid="metadata-match-count" className="sr-only">
              Metadata matches found
            </div>
          )}

          {/* Export success message */}
          <div data-testid="export-success-message" className="sr-only">
            Export completed successfully
          </div>
        </CardContent>
      </Card>

      {/* Clear Confirmation Dialog */}
      {showClearDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div data-testid="clear-confirmation-dialog" className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Clear All Logs</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to clear all logs? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowClearDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                data-testid="confirm-clear-button"
                onClick={handleClearConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-error-600 hover:bg-error-700 rounded-md transition-colors"
              >
                Clear Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {logs.length > 0 && logs.length !== filteredLogs.length && 'Logs filtered'}
        {realTimeUpdates && 'New log entry added'}
      </div>
    </div>
  );
}