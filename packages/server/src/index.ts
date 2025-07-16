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
    
    const agentService = new AgentService(redisService);
    await agentService.initialize(); // This will handle Redis connection + fallback
    
    const wsService = new WebSocketService();
    agentService.setWebSocketService(wsService); // Inject WebSocket service
    
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
    
    // Increase EventEmitter max listeners to prevent warnings
    process.setMaxListeners(15);
    
    // Graceful shutdown for multiple signals
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      
      // Close WebSocket service first
      try {
        wsService.shutdown();
        logger.info('WebSocket service closed');
      } catch (error) {
        logger.warn('Error during WebSocket shutdown:', error);
      }
      
      // Close Redis connection
      try {
        await redisService.disconnect();
        logger.info('Redis disconnected');
      } catch (error) {
        logger.warn('Error during Redis disconnect:', error);
      }
      
      // Close HTTP server
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
      
      // Force exit after 5 seconds if graceful shutdown fails
      setTimeout(() => {
        logger.warn('Force exiting after timeout');
        process.exit(1);
      }, 5000);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // tsx uses this
    process.on('SIGHUP', () => gracefulShutdown('SIGHUP')); // terminal hang up
    
    // Handle uncaught exceptions and unhandled rejections
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();