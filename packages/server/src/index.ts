import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { config } from 'dotenv';
import { AgentService } from './services/AgentService';
import { WebSocketService } from './services/WebSocketService';
import { RedisService } from './services/RedisService';
import { agentRoutes } from './routes/agents';
import { hookRoutes } from './routes/hooks';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Load environment variables
config();

const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function startServer() {
  try {
    // Initialize services
    const redisService = new RedisService(REDIS_URL);
    await redisService.connect();
    
    const agentService = new AgentService(redisService);
    const wsService = new WebSocketService();
    
    // Create Express app
    const app = express();
    
    // Security middleware
    app.use(helmet());
    app.use(cors({
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true
    }));
    
    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    
    // Routes
    app.use('/api/agents', agentRoutes(agentService, wsService));
    app.use('/api/hooks', hookRoutes(agentService, wsService));
    
    // Health check
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '0.1.0'
      });
    });
    
    // Error handling
    app.use(errorHandler);
    
    // Create HTTP server
    const server = createServer(app);
    
    // Create WebSocket server
    const wss = new WebSocketServer({ server });
    wsService.initialize(wss);
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`WebSocket server ready`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await redisService.disconnect();
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();