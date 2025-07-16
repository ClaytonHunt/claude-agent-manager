import React, { useState, useMemo } from 'react';
import { Agent } from '@claude-agent-manager/shared';
import { Card, CardContent, Badge } from '@/components/common';
import { cn } from '@/utils';
import { 
  ChevronRight, 
  ChevronDown, 
  Copy, 
  Download, 
  Search,
  RotateCcw,
  Settings,
} from 'lucide-react';

interface AgentContextPanelProps {
  agent: Agent;
  className?: string;
}

interface JsonViewerProps {
  data: any;
  name?: string;
  isRoot?: boolean;
  level?: number;
  searchTerm?: string;
}

function JsonViewer({ 
  data, 
  name, 
  isRoot = false, 
  level = 0, 
  searchTerm = '' 
}: JsonViewerProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  
  const isExpandable = data && typeof data === 'object' && data !== null;
  const isArray = Array.isArray(data);
  const isEmpty = isExpandable && Object.keys(data).length === 0;

  const getValueType = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const getValueColor = (value: any): string => {
    const type = getValueType(value);
    switch (type) {
      case 'string': return 'text-green-600';
      case 'number': return 'text-blue-600';
      case 'boolean': return 'text-purple-600';
      case 'null': return 'text-gray-500';
      case 'undefined': return 'text-gray-500';
      default: return 'text-gray-900';
    }
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'string') return `"${value}"`;
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    return String(value);
  };

  const highlightSearchTerm = (text: string, term: string): JSX.Element => {
    if (!term.trim()) return <span>{text}</span>;
    
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <span>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <mark key={index} className="bg-yellow-200 px-1 rounded">
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </span>
    );
  };

  const matchesSearch = (key: string, value: any, term: string): boolean => {
    if (!term.trim()) return true;
    const searchLower = term.toLowerCase();
    const keyMatch = key.toLowerCase().includes(searchLower);
    const valueMatch = String(value).toLowerCase().includes(searchLower);
    return keyMatch || valueMatch;
  };

  const renderValue = (value: any, key?: string) => {
    if (!isExpandable) {
      return (
        <span className={getValueColor(value)}>
          {highlightSearchTerm(formatValue(value), searchTerm)}
        </span>
      );
    }

    if (isEmpty) {
      return (
        <span className="text-gray-500">
          {isArray ? '[]' : '{}'}
        </span>
      );
    }

    const entries = Object.entries(data);
    const filteredEntries = searchTerm 
      ? entries.filter(([k, v]) => matchesSearch(k, v, searchTerm))
      : entries;

    return (
      <div className="ml-4">
        {filteredEntries.map(([key, value], index) => (
          <div key={key} className="py-1">
            <JsonViewer
              data={value}
              name={key}
              level={level + 1}
              searchTerm={searchTerm}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={cn('font-mono text-sm', level === 0 && 'border rounded p-2')}>
      <div className="flex items-center gap-1">
        {isExpandable && !isEmpty && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-gray-100 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        )}
        
        {name && (
          <span className="text-blue-800 font-medium">
            {highlightSearchTerm(`"${name}"`, searchTerm)}:
          </span>
        )}
        
        {isExpandable && (
          <span className="text-gray-500 text-xs">
            {isArray ? `Array(${Object.keys(data).length})` : 'Object'}
            {!isExpanded && !isEmpty && ' {...}'}
          </span>
        )}
        
        {(!isExpandable || !isExpanded) && renderValue(data, name)}
      </div>
      
      {isExpandable && isExpanded && !isEmpty && renderValue(data, name)}
    </div>
  );
}

export function AgentContextPanel({ agent, className }: AgentContextPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'pretty' | 'raw'>('pretty');

  const contextSize = useMemo(() => {
    return JSON.stringify(agent.context).length;
  }, [agent.context]);

  const contextEntries = useMemo(() => {
    return Object.keys(agent.context).length;
  }, [agent.context]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(agent.context, null, 2));
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const downloadContext = () => {
    const contextText = JSON.stringify(agent.context, null, 2);
    const blob = new Blob([contextText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-${agent.id.slice(-8)}-context.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className={className}>
      {/* Header Controls */}
      <div className="mb-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Agent Context</h3>
            <div className="flex items-center gap-2">
              <Badge variant="gray" size="sm">
                {contextEntries} {contextEntries === 1 ? 'key' : 'keys'}
              </Badge>
              <Badge variant="gray" size="sm">
                {(contextSize / 1024).toFixed(1)} KB
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex rounded-md border border-gray-300 overflow-hidden">
              <button
                onClick={() => setView('pretty')}
                className={cn(
                  'px-3 py-1 text-sm font-medium transition-colors',
                  view === 'pretty'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                )}
              >
                Pretty
              </button>
              <button
                onClick={() => setView('raw')}
                className={cn(
                  'px-3 py-1 text-sm font-medium transition-colors',
                  view === 'raw'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                )}
              >
                Raw
              </button>
            </div>

            {/* Actions */}
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={downloadContext}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="Download as JSON"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        {view === 'pretty' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search context keys and values..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                title="Clear search"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Context Display */}
      <Card>
        <CardContent className="p-4">
          {Object.keys(agent.context).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No context data available</p>
            </div>
          ) : view === 'pretty' ? (
            <div className="max-h-96 overflow-auto">
              <JsonViewer 
                data={agent.context} 
                isRoot={true}
                searchTerm={searchTerm}
              />
            </div>
          ) : (
            <pre className="max-h-96 overflow-auto text-xs bg-gray-50 p-4 rounded border">
              {JSON.stringify(agent.context, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}