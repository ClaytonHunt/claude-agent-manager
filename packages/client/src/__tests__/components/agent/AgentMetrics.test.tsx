import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentMetrics } from '@/components/agent/AgentMetrics';
import { Agent } from '@claude-agent-manager/shared';

// Mock chart library
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="chart-line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="chart-grid" />,
  Tooltip: () => <div data-testid="chart-tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

const mockAgent: Agent = {
  id: 'test-agent-123',
  status: 'active',
  projectPath: '/test/project',
  created: new Date('2024-01-01T10:00:00Z'),
  lastActivity: new Date('2024-01-01T12:00:00Z'),
  context: {},
  logs: [],
  tags: [],
};

const mockMetrics = {
  performance: {
    cpuUsage: 45.6,
    memoryUsage: 78.2,
    responseTime: 125,
  },
  operational: {
    uptime: 3600000, // 1 hour in milliseconds
    errorRate: 2.5,
    requestCount: 1250,
  },
  realtime: {
    status: 'active' as const,
    lastActivity: new Date(),
    connectedClients: 3,
  },
};

// Mock the useAgentMetrics hook
jest.mock('@/hooks/useAgentMetrics', () => ({
  useAgentMetrics: jest.fn(),
}));

describe('AgentMetrics - Performance Dashboard', () => {
  beforeEach(() => {
    const { useAgentMetrics } = require('@/hooks/useAgentMetrics');
    useAgentMetrics.mockReturnValue({
      metrics: mockMetrics,
      loading: false,
      error: null,
      refreshMetrics: jest.fn(),
    });
  });

  describe('Performance Metrics Display', () => {
    it('should display CPU usage with proper formatting', () => {
      render(<AgentMetrics agent={mockAgent} />);

      expect(screen.getByTestId('cpu-usage-metric')).toBeInTheDocument();
      expect(screen.getByText('45.6%')).toBeInTheDocument();
      expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    });

    it('should show memory consumption with trends', () => {
      render(<AgentMetrics agent={mockAgent} />);

      expect(screen.getByTestId('memory-usage-metric')).toBeInTheDocument();
      expect(screen.getByText('78.2%')).toBeInTheDocument();
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByTestId('memory-trend-chart')).toBeInTheDocument();
    });

    it('should render response time charts', () => {
      render(<AgentMetrics agent={mockAgent} />);

      expect(screen.getByTestId('response-time-metric')).toBeInTheDocument();
      expect(screen.getByText('125ms')).toBeInTheDocument();
      expect(screen.getByTestId('response-time-chart')).toBeInTheDocument();
    });

    it('should update metrics via WebSocket', async () => {
      const { useAgentMetrics } = require('@/hooks/useAgentMetrics');
      const mockRefresh = jest.fn();
      
      useAgentMetrics.mockReturnValue({
        metrics: mockMetrics,
        loading: false,
        error: null,
        refreshMetrics: mockRefresh,
      });

      render(<AgentMetrics agent={mockAgent} realTimeUpdates={true} />);

      expect(screen.getByTestId('websocket-metrics-connection')).toBeInTheDocument();
      
      // Simulate real-time update
      await waitFor(() => {
        expect(screen.getByTestId('last-updated-timestamp')).toBeInTheDocument();
      });
    });

    it('should handle missing metrics gracefully', () => {
      const { useAgentMetrics } = require('@/hooks/useAgentMetrics');
      useAgentMetrics.mockReturnValue({
        metrics: null,
        loading: false,
        error: null,
        refreshMetrics: jest.fn(),
      });

      render(<AgentMetrics agent={mockAgent} />);

      expect(screen.getByTestId('metrics-unavailable')).toBeInTheDocument();
      expect(screen.getByText('Metrics not available')).toBeInTheDocument();
    });
  });

  describe('Operational Metrics', () => {
    it('should display agent uptime', () => {
      render(<AgentMetrics agent={mockAgent} />);

      expect(screen.getByTestId('uptime-metric')).toBeInTheDocument();
      expect(screen.getByText('1h 0m')).toBeInTheDocument(); // 1 hour formatted
    });

    it('should show error rate with visual indicators', () => {
      render(<AgentMetrics agent={mockAgent} />);

      expect(screen.getByTestId('error-rate-metric')).toBeInTheDocument();
      expect(screen.getByText('2.5%')).toBeInTheDocument();
      
      // Should show visual indicator based on error rate
      expect(screen.getByTestId('error-rate-indicator')).toHaveClass('text-warning-600');
    });

    it('should display request count and throughput', () => {
      render(<AgentMetrics agent={mockAgent} />);

      expect(screen.getByTestId('request-count-metric')).toBeInTheDocument();
      expect(screen.getByText('1,250')).toBeInTheDocument();
      expect(screen.getByTestId('throughput-calculation')).toBeInTheDocument();
    });
  });

  describe('Real-time Status Indicators', () => {
    it('should show current agent status', () => {
      render(<AgentMetrics agent={mockAgent} />);

      expect(screen.getByTestId('current-status-indicator')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByTestId('status-indicator-active')).toBeInTheDocument();
    });

    it('should display last activity timestamp', () => {
      render(<AgentMetrics agent={mockAgent} />);

      expect(screen.getByTestId('last-activity-metric')).toBeInTheDocument();
      expect(screen.getByText(/Last Activity:/)).toBeInTheDocument();
    });

    it('should show connected clients count', () => {
      render(<AgentMetrics agent={mockAgent} />);

      expect(screen.getByTestId('connected-clients-metric')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Connected Clients')).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    it('should debounce rapid metric updates', async () => {
      const { useAgentMetrics } = require('@/hooks/useAgentMetrics');
      const mockRefresh = jest.fn();
      
      useAgentMetrics.mockReturnValue({
        metrics: mockMetrics,
        loading: false,
        error: null,
        refreshMetrics: mockRefresh,
      });

      render(<AgentMetrics agent={mockAgent} updateInterval={100} />);

      // Should debounce rapid updates
      expect(screen.getByTestId('update-debouncer')).toBeInTheDocument();
    });

    it('should cache computed metric aggregations', () => {
      render(<AgentMetrics agent={mockAgent} />);

      // Should use memoized calculations
      expect(screen.getByTestId('cached-aggregations')).toBeInTheDocument();
    });

    it('should render charts without blocking UI', async () => {
      const startTime = performance.now();
      
      render(<AgentMetrics agent={mockAgent} />);

      await waitFor(() => {
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      });

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(100); // Should render quickly
    });
  });

  describe('Error Handling', () => {
    it('should handle metrics loading errors', () => {
      const { useAgentMetrics } = require('@/hooks/useAgentMetrics');
      useAgentMetrics.mockReturnValue({
        metrics: null,
        loading: false,
        error: 'Failed to load metrics',
        refreshMetrics: jest.fn(),
      });

      render(<AgentMetrics agent={mockAgent} />);

      expect(screen.getByTestId('metrics-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load metrics')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should show loading state', () => {
      const { useAgentMetrics } = require('@/hooks/useAgentMetrics');
      useAgentMetrics.mockReturnValue({
        metrics: null,
        loading: true,
        error: null,
        refreshMetrics: jest.fn(),
      });

      render(<AgentMetrics agent={mockAgent} />);

      expect(screen.getByTestId('metrics-loading')).toBeInTheDocument();
      expect(screen.getAllByTestId('metric-skeleton')).toHaveLength(6); // 6 metric cards
    });
  });

  describe('Historical Data', () => {
    it('should display metrics history charts', () => {
      render(<AgentMetrics agent={mockAgent} showHistory={true} />);

      expect(screen.getByTestId('metrics-history-section')).toBeInTheDocument();
      expect(screen.getByTestId('cpu-history-chart')).toBeInTheDocument();
      expect(screen.getByTestId('memory-history-chart')).toBeInTheDocument();
      expect(screen.getByTestId('response-time-history-chart')).toBeInTheDocument();
    });

    it('should allow selecting different time ranges', () => {
      render(<AgentMetrics agent={mockAgent} showHistory={true} />);

      expect(screen.getByTestId('time-range-selector')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /1h/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /24h/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /7d/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should provide proper ARIA labels for metrics', () => {
      render(<AgentMetrics agent={mockAgent} />);

      expect(screen.getByLabelText('CPU usage percentage')).toBeInTheDocument();
      expect(screen.getByLabelText('Memory usage percentage')).toBeInTheDocument();
      expect(screen.getByLabelText('Average response time')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<AgentMetrics agent={mockAgent} />);

      const refreshButton = screen.getByRole('button', { name: /refresh metrics/i });
      expect(refreshButton).toHaveAttribute('tabIndex', '0');
    });

    it('should announce metric updates to screen readers', () => {
      const { rerender } = render(<AgentMetrics agent={mockAgent} />);

      const updatedMetrics = {
        ...mockMetrics,
        performance: { ...mockMetrics.performance, cpuUsage: 55.2 },
      };

      const { useAgentMetrics } = require('@/hooks/useAgentMetrics');
      useAgentMetrics.mockReturnValue({
        metrics: updatedMetrics,
        loading: false,
        error: null,
        refreshMetrics: jest.fn(),
      });

      rerender(<AgentMetrics agent={mockAgent} />);

      expect(screen.getByRole('status')).toHaveTextContent('Metrics updated');
    });
  });
});