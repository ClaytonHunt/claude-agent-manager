import React, { useEffect, useRef, useState } from 'react';
import { formatDate, cn } from '@/utils';
import { LogEntry, LogLevel } from '@/types';
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
} from 'lucide-react';

interface LogViewerProps {
  logs: LogEntry[];
  title?: string;
  maxHeight?: number;
  autoScroll?: boolean;
  onAutoScrollToggle?: () => void;
  onClear?: () => void;
  className?: string;
}

interface LogFilters {
  levels: LogLevel[];
  search: string;
}

export function LogViewer({
  logs,
  title = 'Logs',
  maxHeight = 400,
  autoScroll = true,
  onAutoScrollToggle,
  onClear,
  className,
}: LogViewerProps) {
  const [filters, setFilters] = useState<LogFilters>({
    levels: ['info', 'warn', 'error', 'debug'],
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Filter logs based on current filters
  const filteredLogs = logs.filter(log => {
    const matchesLevel = filters.levels.includes(log.level);
    const matchesSearch = !filters.search || 
      log.message.toLowerCase().includes(filters.search.toLowerCase()) ||
      (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(filters.search.toLowerCase()));
    
    return matchesLevel && matchesSearch;
  });

  const getLogLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return 'error';
      case 'warn':
        return 'warning';
      case 'info':
        return 'primary';
      case 'debug':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getLogLevelBgColor = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return 'bg-error-50 border-l-error-500';
      case 'warn':
        return 'bg-warning-50 border-l-warning-500';
      case 'info':
        return 'bg-primary-50 border-l-primary-500';
      case 'debug':
        return 'bg-gray-50 border-l-gray-500';
      default:
        return 'bg-gray-50 border-l-gray-500';
    }
  };

  const exportLogs = () => {
    const logText = filteredLogs
      .map(log => `[${formatDate(log.timestamp, 'yyyy-MM-dd HH:mm:ss')}] ${log.level.toUpperCase()}: ${log.message}`)
      .join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleLevelFilter = (level: LogLevel) => {
    setFilters(prev => ({
      ...prev,
      levels: prev.levels.includes(level)
        ? prev.levels.filter(l => l !== level)
        : [...prev.levels, level],
    }));
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <Badge variant="gray" size="sm">
              {filteredLogs.length} / {logs.length}
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            {/* Auto-scroll toggle */}
            {onAutoScrollToggle && (
              <button
                onClick={onAutoScrollToggle}
                className={cn(
                  'p-2 rounded-md text-sm font-medium transition-colors',
                  autoScroll
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
                title={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
              >
                {autoScroll ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'p-2 rounded-md transition-colors',
                showFilters ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
              )}
            >
              <Filter className="w-4 h-4" />
            </button>

            {/* Export */}
            <button
              onClick={exportLogs}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="Export logs"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Clear */}
            {onClear && (
              <button
                onClick={onClear}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors text-error-600"
                title="Clear logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Level filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Log Levels
              </label>
              <div className="flex flex-wrap gap-2">
                {(['error', 'warn', 'info', 'debug'] as LogLevel[]).map(level => (
                  <button
                    key={level}
                    onClick={() => toggleLevelFilter(level)}
                    className={cn(
                      'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                      filters.levels.includes(level)
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    )}
                  >
                    {level.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          <div
            ref={logContainerRef}
            className="overflow-y-auto scrollbar-thin"
            style={{ maxHeight }}
          >
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {logs.length === 0 ? 'No logs available' : 'No logs match current filters'}
              </div>
            ) : (
              <div className="space-y-1 p-4">
                {filteredLogs.map((log, index) => (
                  <div
                    key={log.id || index}
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
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}