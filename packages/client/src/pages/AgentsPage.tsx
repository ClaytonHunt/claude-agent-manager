import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Grid, List, RefreshCw } from 'lucide-react';
import { AgentCard } from '@/components/agent';
import { Card, CardContent, Button, Badge, LoadingState } from '@/components/common';
import { useAgentStore } from '@/stores';
import { cn } from '@/utils';
import { AgentStatus } from '@/types';

export function AgentsPage() {
  const navigate = useNavigate();
  const {
    agents,
    loading,
    error,
    filters,
    fetchAgents,
    setFilters,
    getFilteredAgents,
    refreshAgents,
  } = useAgentStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch agents on mount
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const filteredAgents = getFilteredAgents();

  const statusOptions: AgentStatus[] = ['idle', 'active', 'error', 'handoff', 'complete'];
  
  const handleStatusFilter = (status: AgentStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    setFilters({ status: newStatuses });
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      projectPath: '',
      tags: [],
      search: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor all your Claude Code agents
          </p>
        </div>
        
        <Button onClick={refreshAgents} loading={loading}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search agents by ID, project path, or tags..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* View toggle */}
            <div className="flex items-center space-x-2">
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'px-3 py-2 text-sm font-medium transition-colors',
                    viewMode === 'grid'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'px-3 py-2 text-sm font-medium transition-colors',
                    viewMode === 'list'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Filters toggle */}
              <Button
                variant="ghost"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-primary-100 text-primary-700' : ''}
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusFilter(status)}
                      className={cn(
                        'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                        (filters.status || []).includes(status)
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project Path Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Path
                </label>
                <input
                  type="text"
                  placeholder="Filter by project path..."
                  value={filters.projectPath || ''}
                  onChange={(e) => setFilters({ projectPath: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Clear Filters */}
              <div className="flex justify-end">
                <Button variant="ghost" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Agents
          </h2>
          <Badge variant="gray">
            {filteredAgents.length} of {agents.length}
          </Badge>
        </div>
      </div>

      {/* Agents List/Grid */}
      <LoadingState loading={loading} error={error}>
        {filteredAgents.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No agents found
              </h3>
              <p className="text-gray-600">
                {agents.length === 0
                  ? 'No agents are currently registered.'
                  : 'No agents match your current filters.'}
              </p>
              {agents.length > 0 && (
                <Button onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            )}
          >
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onClick={() => navigate(`/agents/${agent.id}`)}
                className={viewMode === 'list' ? 'w-full' : ''}
              />
            ))}
          </div>
        )}
      </LoadingState>
    </div>
  );
}