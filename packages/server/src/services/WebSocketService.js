"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
const ws_1 = require("ws");
const logger_1 = require("../utils/logger");
class WebSocketService {
    wss = null;
    clients = new Map();
    pingInterval = null;
    initialize(wss) {
        this.wss = wss;
        wss.on('connection', (socket) => {
            this.handleConnection(socket);
        });
        // Start ping interval
        this.pingInterval = setInterval(() => {
            this.pingClients();
        }, 30000); // Every 30 seconds
        logger_1.logger.info('WebSocket service initialized');
    }
    handleConnection(socket) {
        const clientId = this.generateClientId();
        const client = {
            id: clientId,
            socket,
            subscriptions: new Set(),
            lastPing: new Date()
        };
        this.clients.set(clientId, client);
        socket.on('message', (data) => {
            this.handleMessage(clientId, data);
        });
        socket.on('close', () => {
            this.clients.delete(clientId);
            logger_1.logger.debug(`Client disconnected: ${clientId}`);
        });
        socket.on('error', (error) => {
            logger_1.logger.error(`WebSocket error for client ${clientId}:`, error);
            this.clients.delete(clientId);
        });
        // Send welcome message
        this.sendToClient(clientId, {
            type: 'ping',
            data: { clientId },
            timestamp: new Date()
        });
        logger_1.logger.debug(`Client connected: ${clientId}`);
    }
    handleMessage(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        try {
            const message = JSON.parse(data.toString());
            switch (message.type) {
                case 'pong':
                    client.lastPing = new Date();
                    break;
                case 'subscribe':
                    this.handleSubscription(clientId, message.data);
                    break;
                case 'unsubscribe':
                    this.handleUnsubscription(clientId, message.data);
                    break;
                default:
                    logger_1.logger.warn(`Unknown message type: ${message.type}`);
            }
        }
        catch (error) {
            logger_1.logger.error(`Error handling message from client ${clientId}:`, error);
        }
    }
    handleSubscription(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        const { channels } = data;
        if (Array.isArray(channels)) {
            channels.forEach(channel => {
                client.subscriptions.add(channel);
            });
        }
        logger_1.logger.debug(`Client ${clientId} subscribed to: ${channels.join(', ')}`);
    }
    handleUnsubscription(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        const { channels } = data;
        if (Array.isArray(channels)) {
            channels.forEach(channel => {
                client.subscriptions.delete(channel);
            });
        }
        logger_1.logger.debug(`Client ${clientId} unsubscribed from: ${channels.join(', ')}`);
    }
    pingClients() {
        const now = new Date();
        const timeout = 60000; // 1 minute timeout
        for (const [clientId, client] of this.clients) {
            if (now.getTime() - client.lastPing.getTime() > timeout) {
                // Client timed out
                client.socket.close();
                this.clients.delete(clientId);
                logger_1.logger.debug(`Client timed out: ${clientId}`);
            }
            else {
                // Send ping
                this.sendToClient(clientId, {
                    type: 'ping',
                    data: {},
                    timestamp: new Date()
                });
            }
        }
    }
    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client || client.socket.readyState !== ws_1.WebSocket.OPEN) {
            return;
        }
        try {
            client.socket.send(JSON.stringify(message));
        }
        catch (error) {
            logger_1.logger.error(`Error sending message to client ${clientId}:`, error);
            this.clients.delete(clientId);
        }
    }
    broadcast(message, channel) {
        for (const [clientId, client] of this.clients) {
            if (channel && !client.subscriptions.has(channel)) {
                continue;
            }
            this.sendToClient(clientId, message);
        }
    }
    // Public methods for broadcasting updates
    broadcastAgentUpdate(agent) {
        this.broadcast({
            type: 'agent_update',
            data: agent,
            timestamp: new Date()
        }, `agent:${agent.id}`);
        this.broadcast({
            type: 'agent_update',
            data: agent,
            timestamp: new Date()
        }, `project:${agent.projectPath}`);
    }
    broadcastLogEntry(agentId, logEntry) {
        this.broadcast({
            type: 'log_entry',
            data: { agentId, logEntry },
            timestamp: new Date()
        }, `agent:${agentId}`);
    }
    broadcastHandoff(fromAgentId, toAgentId, context) {
        this.broadcast({
            type: 'handoff',
            data: { fromAgentId, toAgentId, context },
            timestamp: new Date()
        }, `agent:${fromAgentId}`);
        this.broadcast({
            type: 'handoff',
            data: { fromAgentId, toAgentId, context },
            timestamp: new Date()
        }, `agent:${toAgentId}`);
    }
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getConnectedClients() {
        return this.clients.size;
    }
    shutdown() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        for (const [clientId, client] of this.clients) {
            client.socket.close();
        }
        this.clients.clear();
        if (this.wss) {
            this.wss.close();
        }
        logger_1.logger.info('WebSocket service shutdown');
    }
}
exports.WebSocketService = WebSocketService;
