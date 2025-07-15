import { Router } from 'express';
import { AgentService } from '../services/AgentService';
import { WebSocketService } from '../services/WebSocketService';
export declare function hookRoutes(agentService: AgentService, wsService: WebSocketService): Router;
