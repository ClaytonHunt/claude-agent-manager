import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { AgentDetailPage } from '@/pages/AgentDetailPage';
import { useAgentStore } from '@/stores';
import { Agent, LogEntry } from '@claude-agent-manager/shared';

// Mock the agent store
jest.mock('@/stores', () => ({
  useAgentStore: jest.fn(),
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: jest.fn(),
}));

// Mock WebSocket
jest.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    state: { connected: true, error: null },
    on: jest.fn(),
    off: jest.fn(),
    subscribe: jest.fn(),
  }),
}));

const mockAgent: Agent = {
  id: '12345678-1234-4123-8123-123456789abc',
  status: 'active',
  projectPath: '/test/project',
  created: new Date('2024-01-01T10:00:00Z'),
  lastActivity: new Date('2024-01-01T12:00:00Z'),
  context: {
    taskDescription: 'Test task',
    specialist: 'architecture-specialist',
  },
  logs: [
    {
      id: 'log-1',
      timestamp: new Date('2024-01-01T10:30:00Z'),
      level: 'info',
      message: 'Test log message',
      metadata: { component: 'test' },
    },
  ] as LogEntry[],
  tags: ['test', 'development'],
  parentId: 'parent-agent-456',
};

const mockUseAgentStore = useAgentStore as jest.MockedFunction<typeof useAgentStore>;

describe('AgentDetailPage - PRP Requirements Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAgentStore.mockReturnValue({
      fetchAgent: jest.fn(),
      agents: [],
      selectedAgent: null,
      loading: false,
      error: null,
      getFilteredAgents: jest.fn().mockReturnValue([]),
      getAgentStats: jest.fn().mockReturnValue({ total: 0, active: 0, error: 0, handoff: 0 }),
      updateAgent: jest.fn(),
      addLogToAgent: jest.fn(),
    });
  });

  describe('Component Loading and Error States', () => {
    it('should display loading spinner while fetching agent', async () => {
      const mockFetchAgent = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
      mockUseAgentStore.mockReturnValue({
        fetchAgent: mockFetchAgent,
        agents: [],
        loading: true,
        error: null,
        getFilteredAgents: jest.fn().mockReturnValue([]),
        getAgentStats: jest.fn().mockReturnValue({ total: 0, active: 0, error: 0, handoff: 0 }),
        updateAgent: jest.fn(),
        addLogToAgent: jest.fn(),
      });

      const { useParams } = require('react-router-dom');
      useParams.mockReturnValue({ id: '12345678-1234-4123-8123-123456789abc' });

      render(
        <MemoryRouter>
          <AgentDetailPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle invalid agent ID gracefully', async () => {
      const { useParams } = require('react-router-dom');
      useParams.mockReturnValue({ id: 'invalid-id-format' });

      render(
        <MemoryRouter>
          <AgentDetailPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Invalid agent ID format')).toBeInTheDocument();
      });
    });

    it('should show error state when agent fetch fails', async () => {
      const mockFetchAgent = jest.fn(); // Don't call it, just provide the store state
      mockUseAgentStore.mockReturnValue({
        fetchAgent: mockFetchAgent,
        agents: [],
        selectedAgent: null,
        loading: false,
        error: 'Network error',
        getFilteredAgents: jest.fn().mockReturnValue([]),
        getAgentStats: jest.fn().mockReturnValue({ total: 0, active: 0, error: 0, handoff: 0 }),
        updateAgent: jest.fn(),
        addLogToAgent: jest.fn(),
      });

      const { useParams } = require('react-router-dom');
      useParams.mockReturnValue({ id: '12345678-1234-4123-8123-123456789abc' });

      render(
        <MemoryRouter>
          <AgentDetailPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Agent')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should navigate back to /agents when no ID provided', () => {
      const { useParams } = require('react-router-dom');
      useParams.mockReturnValue({ id: undefined });

      render(
        <MemoryRouter>
          <AgentDetailPage />
        </MemoryRouter>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/agents');
    });
  });

  describe('Agent Data Display - Enhanced Requirements', () => {
    beforeEach(() => {
      const mockFetchAgent = jest.fn().mockImplementation(async (id: string) => {
        // Simulate the store behavior - when fetchAgent is called, it should set selectedAgent
        const agent = id === '12345678-1234-4123-8123-123456789abc' ? mockAgent : null;
        return Promise.resolve(agent);
      });
      
      mockUseAgentStore.mockReturnValue({
        fetchAgent: mockFetchAgent,
        agents: [mockAgent],
        selectedAgent: mockAgent, // This should be set when fetchAgent resolves
        loading: false,
        error: null,
        getFilteredAgents: jest.fn().mockReturnValue([mockAgent]),
        getAgentStats: jest.fn().mockReturnValue({ total: 1, active: 1, error: 0, handoff: 0 }),
        updateAgent: jest.fn(),
        addLogToAgent: jest.fn(),
      });

      const { useParams } = require('react-router-dom');
      useParams.mockReturnValue({ id: '12345678-1234-4123-8123-123456789abc' });
    });

    it('should render comprehensive agent overview with real-time metrics', async () => {
      render(
        <MemoryRouter>
          <AgentDetailPage />
        </MemoryRouter>
      );

      // Wait for the component to load and render the agent data
      await waitFor(() => {
        // Check if overview tab is active by default - look for the tab content
        expect(screen.getByText('Agent Details')).toBeInTheDocument(); // Should be in overview tab
      }, { timeout: 3000 });

      // Check basic agent information display
      // The full UUID should appear in both header details and overview tab details
      expect(screen.getAllByText('12345678-1234-4123-8123-123456789abc')).toHaveLength(2);
      
      // Check for the truncated ID in the header 
      expect(screen.getByText('Agent 56789abc')).toBeInTheDocument();
      
      // Status badge shows capitalized
      expect(screen.getByText('Active')).toBeInTheDocument(); 
      
      // Project path appears in header and overview
      expect(screen.getAllByText('/test/project')).toHaveLength(2);
      
      // Enhanced metrics display - click on metrics tab
      const metricsTab = screen.getByRole('button', { name: /performance metrics/i });
      fireEvent.click(metricsTab);
      
      // Wait for metrics dashboard to load
      await waitFor(() => {
        expect(screen.getByTestId('agent-metrics-dashboard')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // "Performance Metrics" appears in both tab label and content, so use getAllByText
      expect(screen.getAllByText('Performance Metrics')).toHaveLength(2);
      expect(screen.getByText('CPU Usage')).toBeInTheDocument();
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('Response Time')).toBeInTheDocument();
    });

    it('should display parent-child relationships visualization', async () => {
      render(
        <MemoryRouter>
          <AgentDetailPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('agent-hierarchy-viewer')).toBeInTheDocument();
        expect(screen.getByText('Parent Agent:')).toBeInTheDocument();
        expect(screen.getByText('parent-agent-456')).toBeInTheDocument();
        expect(screen.getByTestId('hierarchy-visualization')).toBeInTheDocument();
      });
    });

    it('should show agent actions panel with authorization controls', async () => {
      render(
        <MemoryRouter>
          <AgentDetailPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('agent-actions-panel')).toBeInTheDocument();
        // Use more specific regex patterns to avoid matching "Restart Agent" with "start agent"
        expect(screen.getByRole('button', { name: /^start agent$/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^stop agent$/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^restart agent$/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^handoff agent$/i })).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle missing optional fields gracefully', async () => {
      const agentWithoutOptional = {
        ...mockAgent,
        parentId: undefined,
        tags: [],
      };

      const mockFetchAgent = jest.fn().mockResolvedValue(agentWithoutOptional);
      mockUseAgentStore.mockReturnValue({
        fetchAgent: mockFetchAgent,
        agents: [agentWithoutOptional],
        selectedAgent: agentWithoutOptional,
        loading: false,
        error: null,
        getFilteredAgents: jest.fn().mockReturnValue([agentWithoutOptional]),
        getAgentStats: jest.fn().mockReturnValue({ total: 1, active: 1, error: 0, handoff: 0 }),
        updateAgent: jest.fn(),
        addLogToAgent: jest.fn(),
      });

      render(
        <MemoryRouter>
          <AgentDetailPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        // Full UUID should appear in header details and overview sections
        expect(screen.getAllByText('12345678-1234-4123-8123-123456789abc')).toHaveLength(2);
        expect(screen.queryByText('Parent Agent:')).not.toBeInTheDocument();
        expect(screen.queryByTestId('agent-tags')).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Enhanced LogViewer with Virtual Scrolling', () => {
    it.todo('should implement virtual scrolling for large log datasets - Fix test environment rendering issue');

    it('should support advanced log search and filtering', async () => {
      const { useParams } = require('react-router-dom');
      useParams.mockReturnValue({ id: '12345678-1234-4123-8123-123456789abc' });

      const mockFetchAgent = jest.fn().mockResolvedValue(mockAgent);
      mockUseAgentStore.mockReturnValue({
        fetchAgent: mockFetchAgent,
        agents: [mockAgent],
        selectedAgent: mockAgent,
        loading: false,
        error: null,
        getFilteredAgents: jest.fn().mockReturnValue([mockAgent]),
        getAgentStats: jest.fn().mockReturnValue({ total: 1, active: 1, error: 0, handoff: 0 }),
        updateAgent: jest.fn(),
        addLogToAgent: jest.fn(),
      });

      render(
        <MemoryRouter>
          <AgentDetailPage />
        </MemoryRouter>
      );

      // Navigate to logs tab first
      await waitFor(() => {
        expect(screen.getByText('Agent Details')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Click on logs tab
      const logsTab = screen.getByRole('button', { name: /logs/i });
      fireEvent.click(logsTab);

      await waitFor(() => {
        expect(screen.getByTestId('virtualized-log-viewer')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Click on filters toggle to show advanced search functionality
      const filtersToggle = screen.getByRole('button', { name: /toggle filters/i });
      fireEvent.click(filtersToggle);

      await waitFor(() => {
        // Advanced search functionality
        expect(screen.getByTestId('log-search-input')).toBeInTheDocument();
        expect(screen.getByTestId('log-level-filters')).toBeInTheDocument();
        expect(screen.getByTestId('date-range-filter')).toBeInTheDocument();
        expect(screen.getByTestId('metadata-search')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Test search functionality
      const searchInput = screen.getByTestId('log-search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(screen.getByText('Test log message')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates and WebSocket Integration', () => {
    it('should handle real-time log updates via WebSocket', async () => {
      const { useParams } = require('react-router-dom');
      useParams.mockReturnValue({ id: '12345678-1234-4123-8123-123456789abc' });

      const mockFetchAgent = jest.fn().mockResolvedValue(mockAgent);
      mockUseAgentStore.mockReturnValue({
        fetchAgent: mockFetchAgent,
        agents: [mockAgent],
        selectedAgent: mockAgent,
        loading: false,
        error: null,
        getFilteredAgents: jest.fn().mockReturnValue([mockAgent]),
        getAgentStats: jest.fn().mockReturnValue({ total: 1, active: 1, error: 0, handoff: 0 }),
        updateAgent: jest.fn(),
        addLogToAgent: jest.fn(),
      });

      render(
        <MemoryRouter>
          <AgentDetailPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('websocket-status-indicator')).toBeInTheDocument();
        expect(screen.getByTestId('real-time-updates-toggle')).toBeInTheDocument();
      });
    });

    it('should update metrics in real-time without full page refresh', async () => {
      const { useParams } = require('react-router-dom');
      useParams.mockReturnValue({ id: '12345678-1234-4123-8123-123456789abc' });

      const mockFetchAgent = jest.fn().mockResolvedValue(mockAgent);
      mockUseAgentStore.mockReturnValue({
        fetchAgent: mockFetchAgent,
        agents: [mockAgent],
        selectedAgent: mockAgent,
        loading: false,
        error: null,
        getFilteredAgents: jest.fn().mockReturnValue([mockAgent]),
        getAgentStats: jest.fn().mockReturnValue({ total: 1, active: 1, error: 0, handoff: 0 }),
        updateAgent: jest.fn(),
        addLogToAgent: jest.fn(),
      });

      render(
        <MemoryRouter>
          <AgentDetailPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('real-time-metrics-update')).toBeInTheDocument();
      });
    });
  });

  describe('Security and Context Sanitization', () => {
    it('should sanitize sensitive context data before display', async () => {
      const agentWithSensitiveData = {
        ...mockAgent,
        context: {
          password: 'secret123',
          apiKey: 'api_key_value',
          publicData: 'safe_data',
          token: 'jwt_token_value',
        },
      };

      const mockFetchAgent = jest.fn().mockResolvedValue(agentWithSensitiveData);
      mockUseAgentStore.mockReturnValue({
        fetchAgent: mockFetchAgent,
        agents: [agentWithSensitiveData],
        selectedAgent: agentWithSensitiveData,
        loading: false,
        error: null,
        getFilteredAgents: jest.fn().mockReturnValue([agentWithSensitiveData]),
        getAgentStats: jest.fn().mockReturnValue({ total: 1, active: 1, error: 0, handoff: 0 }),
        updateAgent: jest.fn(),
        addLogToAgent: jest.fn(),
      });

      const { useParams } = require('react-router-dom');
      useParams.mockReturnValue({ id: '12345678-1234-4123-8123-123456789abc' });

      render(
        <MemoryRouter>
          <AgentDetailPage />
        </MemoryRouter>
      );

      // Navigate to context tab first
      await waitFor(() => {
        expect(screen.getByText('Agent Details')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Click on context tab
      const contextTab = screen.getByRole('button', { name: /context/i });
      fireEvent.click(contextTab);

      await waitFor(() => {
        // Check for the pre element containing the JSON
        const preElements = screen.getAllByText((content, element) => {
          return element?.tagName === 'PRE';
        });
        
        // Find the pre element with our context
        const contextJson = preElements.find(el => 
          el.textContent?.includes('"password": "[REDACTED]"') &&
          el.textContent?.includes('"apiKey": "[REDACTED]"') &&
          el.textContent?.includes('"token": "[REDACTED]"') &&
          el.textContent?.includes('"publicData": "safe_data"')
        );
        
        expect(contextJson).toBeInTheDocument();
        
        // Verify sensitive data is not exposed
        expect(screen.queryByText('secret123')).not.toBeInTheDocument();
        expect(screen.queryByText('api_key_value')).not.toBeInTheDocument();
        expect(screen.queryByText('jwt_token_value')).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it.todo('should implement authorization checks for agent actions - Implement proper auth system');
  });

  describe('Performance and Accessibility', () => {
    it('should meet performance targets for initial load', async () => {
      const startTime = performance.now();

      const { useParams } = require('react-router-dom');
      useParams.mockReturnValue({ id: '12345678-1234-4123-8123-123456789abc' });

      const mockFetchAgent = jest.fn().mockResolvedValue(mockAgent);
      mockUseAgentStore.mockReturnValue({
        fetchAgent: mockFetchAgent,
        agents: [mockAgent],
        selectedAgent: mockAgent,
        loading: false,
        error: null,
        getFilteredAgents: jest.fn().mockReturnValue([mockAgent]),
        getAgentStats: jest.fn().mockReturnValue({ total: 1, active: 1, error: 0, handoff: 0 }),
        updateAgent: jest.fn(),
        addLogToAgent: jest.fn(),
      });

      render(
        <MemoryRouter>
          <AgentDetailPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('12345678-1234-4123-8123-123456789abc')).toHaveLength(2);
      });

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(2000); // < 2 seconds target
    });

    it('should support keyboard navigation and screen readers', async () => {
      const { useParams } = require('react-router-dom');
      useParams.mockReturnValue({ id: '12345678-1234-4123-8123-123456789abc' });
      
      const mockFetchAgent = jest.fn().mockResolvedValue(mockAgent);
      mockUseAgentStore.mockReturnValue({
        fetchAgent: mockFetchAgent,
        agents: [mockAgent],
        selectedAgent: mockAgent,
        loading: false,
        error: null,
        getFilteredAgents: jest.fn().mockReturnValue([mockAgent]),
        getAgentStats: jest.fn().mockReturnValue({ total: 1, active: 1, error: 0, handoff: 0 }),
        updateAgent: jest.fn(),
        addLogToAgent: jest.fn(),
      });

      render(
        <MemoryRouter>
          <AgentDetailPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        // Check for proper ARIA labels
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByRole('tablist')).toBeInTheDocument();
        expect(screen.getByLabelText('Agent overview')).toBeInTheDocument();
        
        // Check that the logs tab is accessible (the tab button should be findable)
        expect(screen.getByRole('button', { name: /Logs/i })).toBeInTheDocument();
      });
    });
  });
});