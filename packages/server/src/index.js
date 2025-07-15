"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const ws_1 = require("ws");
const dotenv_1 = require("dotenv");
const AgentService_1 = require("./services/AgentService");
const WebSocketService_1 = require("./services/WebSocketService");
const RedisService_1 = require("./services/RedisService");
const agents_1 = require("./routes/agents");
const hooks_1 = require("./routes/hooks");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
// Load environment variables
(0, dotenv_1.config)();
const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
async function startServer() {
    try {
        // Initialize services
        const redisService = new RedisService_1.RedisService(REDIS_URL);
        await redisService.connect();
        const agentService = new AgentService_1.AgentService(redisService);
        const wsService = new WebSocketService_1.WebSocketService();
        // Create Express app
        const app = (0, express_1.default)();
        // Security middleware
        app.use((0, helmet_1.default)());
        app.use((0, cors_1.default)({
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            credentials: true
        }));
        // Body parsing middleware
        app.use(express_1.default.json({ limit: '10mb' }));
        app.use(express_1.default.urlencoded({ extended: true }));
        // Routes
        app.use('/api/agents', (0, agents_1.agentRoutes)(agentService, wsService));
        app.use('/api/hooks', (0, hooks_1.hookRoutes)(agentService, wsService));
        // Health check
        app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '0.1.0'
            });
        });
        // Error handling
        app.use(errorHandler_1.errorHandler);
        // Create HTTP server
        const server = (0, http_1.createServer)(app);
        // Create WebSocket server
        const wss = new ws_1.WebSocketServer({ server });
        wsService.initialize(wss);
        // Start server
        server.listen(PORT, () => {
            logger_1.logger.info(`Server running on port ${PORT}`);
            logger_1.logger.info(`WebSocket server ready`);
        });
        // Graceful shutdown
        process.on('SIGTERM', async () => {
            logger_1.logger.info('Received SIGTERM, shutting down gracefully...');
            await redisService.disconnect();
            server.close(() => {
                logger_1.logger.info('Server closed');
                process.exit(0);
            });
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
