import { useAgentStore } from '../../stores/agentStore';
import { Agent } from '../../types';

describe('AgentStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAgentStore.setState({
      agents: [],
      selectedAgent: null,
      loading: false,
      error: null,
    });
  });

  describe('getAgentStats', () => {
    it('should handle unknown agent statuses without creating NaN values', () => {
      // Arrange: Create agents with unknown status
      const agentsWithUnknownStatus: Agent[] = [
        {
          id: 'agent-1',
          status: 'pending', // Unknown status not in predefined list
          projectPath: '/test/project',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          context: {},
          tags: [],
          logs: [],
        },
        {
          id: 'agent-2', 
          status: 'unknown_status', // Another unknown status
          projectPath: '/test/project',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          context: {},
          tags: [],
          logs: [],
        },
        {
          id: 'agent-3',
          status: 'active', // Known status
          projectPath: '/test/project',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          context: {},
          tags: [],
          logs: [],
        },
      ];

      // Act: Set agents and get stats
      useAgentStore.setState({ agents: agentsWithUnknownStatus });
      const stats = useAgentStore.getState().getAgentStats();

      // Assert: All stat values should be numbers, not NaN or undefined
      Object.entries(stats).forEach(([key, value]) => {
        expect(typeof value).toBe('number');
        expect(value).not.toBeNaN();
        expect(value).toBeDefined();
      });

      // Verify expected values
      expect(stats.total).toBe(3);
      expect(stats.active).toBe(1);
      expect(stats.idle).toBe(0);
      expect(stats.error).toBe(0);
      expect(stats.handoff).toBe(0);
      expect(stats.complete).toBe(0);
      
      // Unknown statuses should not create NaN values
      expect(Object.values(stats).every(val => !isNaN(val))).toBe(true);
    });

    it('should handle empty agents array', () => {
      // Arrange: Empty agents array
      useAgentStore.setState({ agents: [] });

      // Act: Get stats
      const stats = useAgentStore.getState().getAgentStats();

      // Assert: All values should be 0
      expect(stats).toEqual({
        total: 0,
        idle: 0,
        active: 0,
        error: 0,
        handoff: 0,
        complete: 0,
      });
    });

    it('should correctly count known agent statuses', () => {
      // Arrange: Agents with known statuses
      const knownStatusAgents: Agent[] = [
        { id: '1', status: 'active', projectPath: '/test', created: '', updated: '', context: {}, tags: [], logs: [] },
        { id: '2', status: 'active', projectPath: '/test', created: '', updated: '', context: {}, tags: [], logs: [] },
        { id: '3', status: 'error', projectPath: '/test', created: '', updated: '', context: {}, tags: [], logs: [] },
        { id: '4', status: 'complete', projectPath: '/test', created: '', updated: '', context: {}, tags: [], logs: [] },
        { id: '5', status: 'idle', projectPath: '/test', created: '', updated: '', context: {}, tags: [], logs: [] },
      ];

      // Act
      useAgentStore.setState({ agents: knownStatusAgents });
      const stats = useAgentStore.getState().getAgentStats();

      // Assert
      expect(stats.total).toBe(5);
      expect(stats.active).toBe(2);
      expect(stats.error).toBe(1);
      expect(stats.complete).toBe(1);
      expect(stats.idle).toBe(1);
      expect(stats.handoff).toBe(0);
    });
  });
});