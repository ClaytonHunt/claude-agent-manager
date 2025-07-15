import { HookConfig, HookEvent, generateId } from '@claude-agent-manager/shared';

interface ClaudeCodeHook {
  id: string;
  projectPath: string;
  serverUrl: string;
  events: string[];
  authentication?: {
    type: 'bearer' | 'apikey';
    token: string;
  };
}

export class ClaudeCodeHookManager {
  private hooks: Map<string, ClaudeCodeHook> = new Map();
  private agentId: string;

  constructor(agentId: string = generateId()) {
    this.agentId = agentId;
  }

  async registerHook(config: HookConfig): Promise<string> {
    const hookId = generateId();
    const hook: ClaudeCodeHook = {
      id: hookId,
      projectPath: process.cwd(),
      serverUrl: config.serverUrl,
      events: config.events,
      authentication: config.authentication
    };

    this.hooks.set(hookId, hook);

    // Register agent with server
    await this.registerAgent(hook);

    return hookId;
  }

  async unregisterHook(hookId: string): Promise<void> {
    this.hooks.delete(hookId);
  }

  async emitEvent(type: string, data: Record<string, any>): Promise<void> {
    const event: HookEvent = {
      type,
      agentId: this.agentId,
      timestamp: new Date(),
      data
    };

    for (const [_, hook] of this.hooks) {
      if (hook.events.includes(type) || hook.events.includes('*')) {
        await this.sendEvent(hook, event);
      }
    }
  }

  private async registerAgent(hook: ClaudeCodeHook): Promise<void> {
    try {
      const response = await fetch(`${hook.serverUrl}/api/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(hook)
        },
        body: JSON.stringify({
          id: this.agentId,
          projectPath: hook.projectPath,
          context: {
            hookId: hook.id,
            nodeVersion: process.version,
            platform: process.platform
          },
          tags: ['claude-code', 'hook-managed']
        })
      });

      if (!response.ok) {
        console.warn(`Failed to register agent: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Failed to register agent:', error);
    }
  }

  private async sendEvent(hook: ClaudeCodeHook, event: HookEvent): Promise<void> {
    try {
      const response = await fetch(`${hook.serverUrl}/api/hooks/claude-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(hook)
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        console.warn(`Failed to send event ${event.type}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn(`Failed to send event ${event.type}:`, error);
    }
  }

  private getAuthHeaders(hook: ClaudeCodeHook): Record<string, string> {
    if (!hook.authentication) return {};

    switch (hook.authentication.type) {
      case 'bearer':
        return { 'Authorization': `Bearer ${hook.authentication.token}` };
      case 'apikey':
        return { 'X-API-Key': hook.authentication.token };
      default:
        return {};
    }
  }

  getAgentId(): string {
    return this.agentId;
  }
}

// Global instance for easy use
let globalHookManager: ClaudeCodeHookManager | null = null;

export function getGlobalHookManager(): ClaudeCodeHookManager {
  if (!globalHookManager) {
    globalHookManager = new ClaudeCodeHookManager();
  }
  return globalHookManager;
}

// Convenience functions
export async function registerClaudeCodeHook(config: HookConfig): Promise<string> {
  return await getGlobalHookManager().registerHook(config);
}

export async function emitClaudeCodeEvent(type: string, data: Record<string, any>): Promise<void> {
  await getGlobalHookManager().emitEvent(type, data);
}

export function getClaudeCodeAgentId(): string {
  return getGlobalHookManager().getAgentId();
}

// Hook helper functions for common events
export const ClaudeCodeEvents = {
  agentStarted: (data: Record<string, any> = {}) => 
    emitClaudeCodeEvent('agent.started', data),
    
  agentStopped: (data: Record<string, any> = {}) => 
    emitClaudeCodeEvent('agent.stopped', data),
    
  agentError: (error: Error, data: Record<string, any> = {}) => 
    emitClaudeCodeEvent('agent.error', { error: error.message, stack: error.stack, ...data }),
    
  toolCalled: (tool: string, params: any, data: Record<string, any> = {}) => 
    emitClaudeCodeEvent('tool.called', { tool, params, ...data }),
    
  toolCompleted: (tool: string, result: any, data: Record<string, any> = {}) => 
    emitClaudeCodeEvent('tool.completed', { tool, result, ...data }),
    
  contextUpdated: (context: Record<string, any>, data: Record<string, any> = {}) => 
    emitClaudeCodeEvent('context.updated', { context, ...data }),
    
  taskStarted: (task: string, data: Record<string, any> = {}) => 
    emitClaudeCodeEvent('task.started', { task, ...data }),
    
  taskCompleted: (task: string, result: any, data: Record<string, any> = {}) => 
    emitClaudeCodeEvent('task.completed', { task, result, ...data })
};