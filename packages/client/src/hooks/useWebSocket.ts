import { useEffect, useState, useCallback, useRef } from 'react';
import { WebSocketMessage, WebSocketState } from '@/types';
import { wsClient, WebSocketEventHandler, WebSocketStatusHandler } from '@/utils/websocket';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  subscriptions?: string[];
}

interface UseWebSocketReturn {
  state: WebSocketState;
  connect: () => void;
  disconnect: () => void;
  subscribe: (channels: string[]) => void;
  unsubscribe: (channels: string[]) => void;
  on: (event: string, handler: WebSocketEventHandler) => void;
  off: (event: string, handler: WebSocketEventHandler) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { autoConnect = true, subscriptions = [] } = options;
  
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectCount: 0,
    lastConnected: null,
  });

  const handlersRef = useRef<Map<string, WebSocketEventHandler>>(new Map());
  const statusHandlerRef = useRef<WebSocketStatusHandler | null>(null);

  // Status handler to update state
  const handleStatusChange = useCallback<WebSocketStatusHandler>((connected, error) => {
    setState(prev => ({
      ...prev,
      isConnected: connected,
      isConnecting: false,
      error: error || null,
      reconnectCount: wsClient.getReconnectAttempts(),
      lastConnected: connected ? new Date() : prev.lastConnected,
    }));
  }, []);

  // Connection management
  const connect = useCallback(() => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    wsClient.connect();
  }, []);

  const disconnect = useCallback(() => {
    wsClient.disconnect();
    setState(prev => ({ ...prev, isConnected: false, isConnecting: false }));
  }, []);

  // Subscription management
  const subscribe = useCallback((channels: string[]) => {
    wsClient.subscribe(channels);
  }, []);

  const unsubscribe = useCallback((channels: string[]) => {
    wsClient.unsubscribe(channels);
  }, []);

  // Event handler management
  const on = useCallback((event: string, handler: WebSocketEventHandler) => {
    const wrappedHandler = (message: WebSocketMessage) => {
      try {
        handler(message);
      } catch (error) {
        console.error(`Error in WebSocket event handler for ${event}:`, error);
      }
    };
    
    handlersRef.current.set(`${event}_${handler.toString()}`, wrappedHandler);
    wsClient.on(event, wrappedHandler);
  }, []);

  const off = useCallback((event: string, handler: WebSocketEventHandler) => {
    const key = `${event}_${handler.toString()}`;
    const wrappedHandler = handlersRef.current.get(key);
    
    if (wrappedHandler) {
      wsClient.off(event, wrappedHandler);
      handlersRef.current.delete(key);
    }
  }, []);

  // Setup and cleanup
  useEffect(() => {
    // Register status handler
    statusHandlerRef.current = handleStatusChange;
    wsClient.onStatus(handleStatusChange);

    // Auto-connect if enabled
    if (autoConnect) {
      connect();
    }

    // Auto-subscribe to specified channels
    if (subscriptions.length > 0) {
      subscribe(subscriptions);
    }

    // Cleanup on unmount
    return () => {
      if (statusHandlerRef.current) {
        wsClient.offStatus(statusHandlerRef.current);
      }
      
      // Remove all event handlers registered by this hook
      handlersRef.current.forEach((wrappedHandler, key) => {
        const [event] = key.split('_');
        wsClient.off(event, wrappedHandler);
      });
      handlersRef.current.clear();
      
      // Don't disconnect on unmount as other components might be using it
    };
  }, [autoConnect, connect, subscribe, handleStatusChange]);

  // Update subscriptions when they change
  useEffect(() => {
    if (subscriptions.length > 0 && state.isConnected) {
      subscribe(subscriptions);
    }
  }, [subscriptions, state.isConnected, subscribe]);

  return {
    state,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    on,
    off,
  };
}

// Specialized hooks for common use cases
export function useAgentUpdates(agentIds: string[] = []) {
  const [agents, setAgents] = useState<Map<string, any>>(new Map());
  
  const { state, connect, disconnect } = useWebSocket({
    autoConnect: true,
    subscriptions: agentIds.map(id => `agent:${id}`),
  });

  const handleAgentUpdate = useCallback((message: WebSocketMessage) => {
    if (message.type === 'agent_update' && message.data) {
      setAgents(prev => new Map(prev.set(message.data.id, message.data)));
    }
  }, []);

  useEffect(() => {
    wsClient.on('agent_update', handleAgentUpdate);
    return () => wsClient.off('agent_update', handleAgentUpdate);
  }, [handleAgentUpdate]);

  return {
    agents: Array.from(agents.values()),
    agentsMap: agents,
    websocketState: state,
    connect,
    disconnect,
  };
}

export function useProjectUpdates(projectPaths: string[] = []) {
  const [projectData, setProjectData] = useState<Map<string, any>>(new Map());
  
  const { state, connect, disconnect } = useWebSocket({
    autoConnect: true,
    subscriptions: projectPaths.map(path => `project:${path}`),
  });

  const handleProjectUpdate = useCallback((message: WebSocketMessage) => {
    if (message.type === 'agent_update' && message.data?.projectPath) {
      const projectPath = message.data.projectPath;
      setProjectData(prev => {
        const updated = new Map(prev);
        const current = updated.get(projectPath) || { agents: [], lastUpdate: null };
        
        // Update or add agent to project
        const agentIndex = current.agents.findIndex((a: any) => a.id === message.data.id);
        if (agentIndex >= 0) {
          current.agents[agentIndex] = message.data;
        } else {
          current.agents.push(message.data);
        }
        
        current.lastUpdate = new Date();
        updated.set(projectPath, current);
        return updated;
      });
    }
  }, []);

  useEffect(() => {
    wsClient.on('agent_update', handleProjectUpdate);
    return () => wsClient.off('agent_update', handleProjectUpdate);
  }, [handleProjectUpdate]);

  return {
    projects: Array.from(projectData.entries()).map(([path, data]) => ({
      projectPath: path,
      ...data,
    })),
    projectsMap: projectData,
    websocketState: state,
    connect,
    disconnect,
  };
}

export function useLogStream(agentId?: string) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  
  const subscriptions = agentId ? [`agent:${agentId}`] : [];
  
  const { state, connect, disconnect } = useWebSocket({
    autoConnect: true,
    subscriptions,
  });

  const handleLogEntry = useCallback((message: WebSocketMessage) => {
    if (message.type === 'log_entry' && message.data) {
      const { agentId: logAgentId, logEntry } = message.data;
      
      // If we're filtering by agent ID, only show logs for that agent
      if (agentId && logAgentId !== agentId) {
        return;
      }
      
      setLogs(prev => {
        const updated = [...prev, { ...logEntry, agentId: logAgentId }];
        // Keep only last 1000 logs for performance
        return updated.slice(-1000);
      });
    }
  }, [agentId]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const toggleAutoScroll = useCallback(() => {
    setIsAutoScrollEnabled(prev => !prev);
  }, []);

  useEffect(() => {
    wsClient.on('log_entry', handleLogEntry);
    return () => wsClient.off('log_entry', handleLogEntry);
  }, [handleLogEntry]);

  return {
    logs,
    isAutoScrollEnabled,
    websocketState: state,
    connect,
    disconnect,
    clearLogs,
    toggleAutoScroll,
  };
}