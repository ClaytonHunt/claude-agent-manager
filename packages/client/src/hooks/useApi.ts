import { useState, useEffect, useCallback } from 'react';
import { Agent, AgentQuery, LogEntry } from '@/types';
import { agentApi } from '@/utils/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
  mutate: (newData: T) => void;
}

// Generic API hook
export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({ data: null, loading: false, error: errorMessage });
    }
  }, dependencies);

  const mutate = useCallback((newData: T) => {
    setState(prev => ({ ...prev, data: newData }));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
    mutate,
  };
}

// Specialized hooks for agents
export function useAgents(query: AgentQuery = {}) {
  return useApi(
    () => agentApi.getAgents(query),
    [JSON.stringify(query)]
  );
}

export function useAgent(id: string) {
  return useApi(
    () => agentApi.getAgent(id),
    [id]
  );
}

export function useAgentLogs(id: string, limit = 100) {
  return useApi(
    () => agentApi.getAgentLogs(id, limit),
    [id, limit]
  );
}

export function useProjectStats(projectPath: string) {
  return useApi(
    () => agentApi.getProjectStats(projectPath),
    [projectPath]
  );
}

export function useAgentHierarchy(rootId?: string) {
  return useApi(
    () => agentApi.getAgentHierarchy(rootId),
    [rootId]
  );
}

// Hook for agent mutations
export function useAgentMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeWithState = async <T>(operation: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  };

  const updateAgentStatus = useCallback(async (id: string, status: string) => {
    return executeWithState(() => agentApi.updateAgentStatus(id, status));
  }, []);

  const addLogEntry = useCallback(async (id: string, logEntry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    return executeWithState(() => agentApi.addLogEntry(id, logEntry));
  }, []);

  const updateAgentContext = useCallback(async (id: string, context: Record<string, any>) => {
    return executeWithState(() => agentApi.updateAgentContext(id, context));
  }, []);

  const deleteAgent = useCallback(async (id: string) => {
    return executeWithState(() => agentApi.deleteAgent(id));
  }, []);

  const handoffAgent = useCallback(async (handoff: {
    fromAgentId: string;
    toAgentId: string;
    context: Record<string, any>;
    reason: string;
  }) => {
    return executeWithState(() => agentApi.handoffAgent(handoff));
  }, []);

  return {
    loading,
    error,
    updateAgentStatus,
    addLogEntry,
    updateAgentContext,
    deleteAgent,
    handoffAgent,
  };
}

// Hook for search functionality
export function useAgentSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const searchResults = await agentApi.searchAgents(searchQuery);
      setResults(searchResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    search,
    clearSearch,
  };
}

// Hook for pagination
export function usePagination<T>(
  items: T[],
  itemsPerPage: number = 10
) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // Reset to first page when items change
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  return {
    currentPage,
    totalPages,
    currentItems,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}