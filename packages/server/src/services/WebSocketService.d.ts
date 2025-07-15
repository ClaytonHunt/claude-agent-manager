import { WebSocketServer } from 'ws';
import { Agent, LogEntry } from '@claude-agent-manager/shared';
export declare class WebSocketService {
    private wss;
    private clients;
    private pingInterval;
    initialize(wss: WebSocketServer): void;
    private handleConnection;
    private handleMessage;
    private handleSubscription;
    private handleUnsubscription;
    private pingClients;
    private sendToClient;
    private broadcast;
    broadcastAgentUpdate(agent: Agent): void;
    broadcastLogEntry(agentId: string, logEntry: LogEntry): void;
    broadcastHandoff(fromAgentId: string, toAgentId: string, context: any): void;
    private generateClientId;
    getConnectedClients(): number;
    shutdown(): void;
}
