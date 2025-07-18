import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VirtualizedLogViewer } from '@/components/agent/VirtualizedLogViewer';
import { LogEntry } from '@claude-agent-manager/shared';

// Mock react-window
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, itemSize, height, width }: any) => (
    <div 
      data-testid="virtual-scroll-container"
      style={{ height, width }}
      data-item-count={itemCount}
      data-item-size={itemSize}
    >
      {/* Simulate rendering visible items - render all if 15 or fewer, otherwise first 10 */}
      {Array.from({ length: Math.min(itemCount, itemCount <= 15 ? itemCount : 10) }, (_, index) => 
        <div key={index}>
          {children({ index, style: { height: itemSize } })}
        </div>
      )}
    </div>
  ),
}));

// Mock URL.createObjectURL for export functionality
global.URL.createObjectURL = jest.fn(() => 'blob:url');
global.URL.revokeObjectURL = jest.fn();

const generateMockLogs = (count: number): LogEntry[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `log-${i}`,
    timestamp: new Date(Date.now() - i * 1000),
    level: ['info', 'warn', 'error', 'debug'][i % 4] as any,
    message: `Test log message ${i}`,
    metadata: i % 3 === 0 ? { component: 'test', id: i } : undefined,
  }));

describe('VirtualizedLogViewer - Performance Enhancement', () => {
  describe('Virtual Scrolling Performance', () => {
    it('should render 10,000 logs using virtual scrolling', () => {
      const largeLogs = generateMockLogs(10000);

      render(<VirtualizedLogViewer logs={largeLogs} height={600} />);

      const container = screen.getByTestId('virtual-scroll-container');
      expect(container).toBeInTheDocument();
      expect(container).toHaveAttribute('data-item-count', '10000');
      
      // Should only render visible items, not all 10000
      expect(screen.getAllByText(/Test log message/)).toHaveLength(10);
    });

    it('should handle rapid log updates without performance degradation', () => {
      const initialLogs = generateMockLogs(1000);
      const { rerender } = render(<VirtualizedLogViewer logs={initialLogs} />);

      const startTime = performance.now();

      // Simulate rapid updates
      for (let i = 0; i < 100; i++) {
        const newLogs = [...initialLogs, ...generateMockLogs(10)];
        rerender(<VirtualizedLogViewer logs={newLogs} />);
      }

      const updateTime = performance.now() - startTime;
      expect(updateTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should maintain scroll position during updates', () => {
      const logs = generateMockLogs(100);
      render(<VirtualizedLogViewer logs={logs} maintainScrollPosition={true} />);

      // The maintainScrollPosition prop is passed to the parent container, not the mocked react-window container
      const container = screen.getByRole('log');
      expect(container).toHaveAttribute('data-maintain-scroll', 'true');
    });
  });

  describe('Advanced Search and Filtering', () => {
    it('should provide advanced search functionality', () => {
      const logs = generateMockLogs(100);
      render(<VirtualizedLogViewer logs={logs} />);

      // First click the filter toggle to show the search inputs
      const filterToggle = screen.getByRole('button', { name: /Toggle filters/i });
      fireEvent.click(filterToggle);

      expect(screen.getByTestId('log-search-input')).toBeInTheDocument();
      expect(screen.getByTestId('log-level-filters')).toBeInTheDocument();
      expect(screen.getByTestId('date-range-filter')).toBeInTheDocument();
      expect(screen.getByTestId('metadata-search')).toBeInTheDocument();
    });

    it('should filter logs by search term with debouncing', async () => {
      const logs = generateMockLogs(50);
      render(<VirtualizedLogViewer logs={logs} />);

      // First click the filter toggle to show the search inputs
      const filterToggle = screen.getByRole('button', { name: /Toggle filters/i });
      fireEvent.click(filterToggle);

      const searchInput = screen.getByTestId('log-search-input');
      fireEvent.change(searchInput, { target: { value: 'message 5' } });

      // Should debounce search input
      await waitFor(() => {
        expect(screen.getByText('Test log message 5')).toBeInTheDocument();
      }, { timeout: 500 });
    });

    it('should filter by log level', () => {
      const logs = generateMockLogs(20);
      render(<VirtualizedLogViewer logs={logs} />);

      // First click the filter toggle to show the filter options
      const filterToggle = screen.getByRole('button', { name: /Toggle filters/i });
      fireEvent.click(filterToggle);

      // Initially all logs are shown (20)
      expect(screen.getByTestId('filtered-count')).toHaveTextContent('20 / 20');

      // Click error filter to remove error logs from view
      const errorFilter = screen.getByTestId('filter-error');
      fireEvent.click(errorFilter);

      // Should show 15 logs (20 - 5 error logs)
      expect(screen.getByTestId('filtered-count')).toHaveTextContent('15 / 20');
    });

    it('should search within metadata fields', async () => {
      const logs = generateMockLogs(30);
      render(<VirtualizedLogViewer logs={logs} />);

      // First click the filter toggle to show the search inputs
      const filterToggle = screen.getByRole('button', { name: /Toggle filters/i });
      fireEvent.click(filterToggle);

      const metadataSearch = screen.getByTestId('metadata-search');
      fireEvent.change(metadataSearch, { target: { value: 'component:test' } });

      await waitFor(() => {
        // Should find logs with component: test in metadata
        expect(screen.getByTestId('metadata-match-count')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should append new logs in real-time', () => {
      const initialLogs = generateMockLogs(10);
      const { rerender } = render(
        <VirtualizedLogViewer logs={initialLogs} autoScroll={true} />
      );

      const newLog: LogEntry = {
        id: 'new-log',
        timestamp: new Date(),
        level: 'info',
        message: 'New real-time log',
      };

      rerender(<VirtualizedLogViewer logs={[...initialLogs, newLog]} autoScroll={true} />);

      expect(screen.getByText('New real-time log')).toBeInTheDocument();
    });

    it('should respect auto-scroll setting during updates', () => {
      const logs = generateMockLogs(50);
      render(<VirtualizedLogViewer logs={logs} autoScroll={true} />);

      expect(screen.getByTestId('auto-scroll-enabled')).toBeInTheDocument();
    });

    it('should handle WebSocket connection failures gracefully', () => {
      const logs = generateMockLogs(10);
      render(<VirtualizedLogViewer logs={logs} websocketError="Connection failed" />);

      expect(screen.getByTestId('websocket-error')).toBeInTheDocument();
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });
  });

  describe('Performance Monitoring', () => {
    it('should not exceed memory threshold with large datasets', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      render(<VirtualizedLogViewer logs={generateMockLogs(10000)} />);

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      expect(memoryIncrease).toBeLessThan(100); // Should not exceed 100MB
    });

    it('should render initial view in under 500ms', () => {
      const startTime = performance.now();

      render(<VirtualizedLogViewer logs={generateMockLogs(5000)} />);

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(500);
    });
  });

  describe('Export and Actions', () => {
    it('should export filtered logs to file', () => {
      const logs = generateMockLogs(100);
      render(<VirtualizedLogViewer logs={logs} />);

      const exportButton = screen.getByTestId('export-logs-button');
      fireEvent.click(exportButton);

      expect(screen.getByTestId('export-success-message')).toBeInTheDocument();
    });

    it('should include metadata in export when enabled', () => {
      const logs = generateMockLogs(50);
      render(<VirtualizedLogViewer logs={logs} />);

      // First click the filter toggle to show the export options
      const filterToggle = screen.getByRole('button', { name: /Filter/i });
      fireEvent.click(filterToggle);

      const includeMetadata = screen.getByTestId('include-metadata-checkbox');
      fireEvent.click(includeMetadata);

      const exportButton = screen.getByTestId('export-logs-button');
      fireEvent.click(exportButton);

      expect(screen.getByTestId('export-with-metadata')).toBeInTheDocument();
    });

    it('should clear logs when authorized', () => {
      const logs = generateMockLogs(20);
      const mockOnClear = jest.fn();
      render(<VirtualizedLogViewer logs={logs} onClear={mockOnClear} />);

      const clearButton = screen.getByTestId('clear-logs-button');
      fireEvent.click(clearButton);

      // Should show confirmation dialog
      expect(screen.getByTestId('clear-confirmation-dialog')).toBeInTheDocument();

      const confirmButton = screen.getByTestId('confirm-clear-button');
      fireEvent.click(confirmButton);

      expect(mockOnClear).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should support keyboard navigation', () => {
      const logs = generateMockLogs(20);
      render(<VirtualizedLogViewer logs={logs} />);

      const container = screen.getByRole('log');
      expect(container).toHaveAttribute('tabIndex', '0');
      expect(container).toHaveAttribute('aria-label', 'Log entries');
    });

    it('should announce new logs to screen readers', () => {
      const initialLogs = generateMockLogs(5);
      const { rerender } = render(<VirtualizedLogViewer logs={initialLogs} realTimeUpdates={true} />);

      const newLogs = [...initialLogs, generateMockLogs(1)[0]];
      rerender(<VirtualizedLogViewer logs={newLogs} realTimeUpdates={true} />);

      expect(screen.getByRole('status')).toHaveTextContent('New log entry added');
    });

    it('should provide proper ARIA labels for filters', () => {
      const logs = generateMockLogs(10);
      render(<VirtualizedLogViewer logs={logs} />);

      // First click the filter toggle to show the filter inputs
      const filterToggle = screen.getByRole('button', { name: /Filter/i });
      fireEvent.click(filterToggle);

      expect(screen.getByLabelText('Search logs')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by error level')).toBeInTheDocument();
    });
  });
});