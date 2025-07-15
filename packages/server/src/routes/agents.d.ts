import { Router } from 'express';
import { AgentService } from '../services/AgentService';
import { WebSocketService } from '../services/WebSocketService';
export declare function agentRoutes(agentService: AgentService, wsService: WebSocketService): Router;
