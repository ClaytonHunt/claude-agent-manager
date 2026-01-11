import React, { useState, useEffect } from 'react';
import { Agent } from '@claude-agent-manager/shared';
import { cn } from '@/utils';
import { ArrowRightLeft, X, Search, AlertCircle } from 'lucide-react';

interface HandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (toAgentId: string, reason: string, context?: Record<string, any>) => Promise<void>;
  currentAgent: Agent;
  availableAgents: Agent[];
  isLoading?: boolean;
}

export function HandoffModal({
  isOpen,
  onClose,
  onConfirm,
  currentAgent,
  availableAgents,
  isLoading = false,
}: HandoffModalProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [includeContext, setIncludeContext] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter available agents (exclude current agent and completed agents)
  const eligibleAgents = availableAgents.filter(
    (agent) =>
      agent.id !== currentAgent.id &&
      agent.status !== 'complete' &&
      (agent.status === 'idle' || agent.status === 'active')
  );

  // Filter by search query
  const filteredAgents = eligibleAgents.filter((agent) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      agent.id.toLowerCase().includes(query) ||
      agent.projectPath.toLowerCase().includes(query) ||
      agent.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedAgentId('');
      setReason('');
      setSearchQuery('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedAgentId) {
      setError('Please select a target agent');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the handoff');
      return;
    }

    try {
      const contextToTransfer = includeContext ? currentAgent.context : undefined;
      await onConfirm(selectedAgentId, reason.trim(), contextToTransfer);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate handoff');
    }
  };

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle':
        return 'bg-gray-100 text-gray-700';
      case 'active':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        data-testid="handoff-modal"
        className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <ArrowRightLeft className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Agent Handoff</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Current agent info */}
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">Handing off from:</p>
            <p className="font-medium text-gray-900 truncate">{currentAgent.id}</p>
            <p className="text-xs text-gray-500 truncate">{currentAgent.projectPath}</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Search agents */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Target Agent
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>

            {/* Agent list */}
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
              {filteredAgents.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {eligibleAgents.length === 0
                    ? 'No eligible agents available for handoff'
                    : 'No agents match your search'}
                </div>
              ) : (
                filteredAgents.map((agent) => (
                  <label
                    key={agent.id}
                    className={cn(
                      'flex items-center p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 transition-colors',
                      selectedAgentId === agent.id && 'bg-primary-50'
                    )}
                  >
                    <input
                      type="radio"
                      name="targetAgent"
                      value={agent.id}
                      checked={selectedAgentId === agent.id}
                      onChange={() => setSelectedAgentId(agent.id)}
                      className="mr-3"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm text-gray-900 truncate">
                          {agent.id.slice(0, 8)}...
                        </span>
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs rounded-full',
                            getStatusColor(agent.status)
                          )}
                        >
                          {agent.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{agent.projectPath}</p>
                      {agent.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {agent.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {agent.tags.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{agent.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Handoff <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this handoff is needed..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
              required
            />
          </div>

          {/* Context transfer option */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={includeContext}
              onChange={(e) => setIncludeContext(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Transfer current context to target agent</span>
          </label>

          {includeContext && Object.keys(currentAgent.context).length > 0 && (
            <div className="p-2 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600 mb-1">Context to transfer:</p>
              <pre className="text-xs text-gray-700 overflow-x-auto max-h-24">
                {JSON.stringify(currentAgent.context, null, 2)}
              </pre>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !selectedAgentId || !reason.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4" />
                <span>Initiate Handoff</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default HandoffModal;
