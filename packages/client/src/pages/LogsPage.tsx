import React, { useEffect } from 'react';
import { LogViewer } from '@/components/agent';
import { useLogStream } from '@/hooks';
import { useAgentStore } from '@/stores';

export function LogsPage() {
  const { fetchAgents } = useAgentStore();
  const { 
    logs, 
    isAutoScrollEnabled, 
    websocketState, 
    clearLogs, 
    toggleAutoScroll 
  } = useLogStream(); // Global log stream (all agents)

  // Fetch agents on mount to ensure we have agent data
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Logs</h1>
        <p className="text-gray-600 mt-1">
          Real-time log stream from all agents
        </p>
      </div>

      {/* Log Viewer */}
      <LogViewer
        logs={logs}
        title="Global Log Stream"
        maxHeight={600}
        autoScroll={isAutoScrollEnabled}
        onAutoScrollToggle={toggleAutoScroll}
        onClear={clearLogs}
        className="min-h-[400px]"
      />

      {/* WebSocket Status */}
      {!websocketState.isConnected && (
        <div className="bg-warning-50 border border-warning-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-warning-800">
                Real-time Connection Lost
              </h3>
              <div className="mt-2 text-sm text-warning-700">
                <p>
                  The real-time connection to the server has been lost. 
                  Logs may not update automatically. The connection will 
                  be restored automatically when possible.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}