const axios = require('axios');

/**
 * Resilient HTTP client for sending hook events to the backend
 * Includes retry logic, circuit breaker, and error handling
 */
class EventSender {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    
    // Handle both Config instance and plain config object
    this.configObj = config.config || config;
    
    this.client = this.createHttpClient();
    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: null,
      state: 'closed', // closed, open, half-open
      threshold: 5,
      timeout: 30000 // 30 seconds
    };
  }

  createHttpClient(baseURL = null) {
    return axios.create({
      baseURL: baseURL || this.configObj.server.url,
      timeout: this.configObj.server.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Claude-Agent-Manager-Hooks/1.0.0'
      }
    });
  }

  async getClient() {
    // Use dynamic service discovery if available
    if (this.config.getServerUrl && typeof this.config.getServerUrl === 'function') {
      try {
        const serverUrl = await this.config.getServerUrl();
        if (serverUrl && serverUrl !== this.configObj.server.url) {
          // Create new client with discovered URL
          return this.createHttpClient(serverUrl);
        }
      } catch (error) {
        // Fall back to existing client if discovery fails
        this.logger?.debug('Service discovery failed, using configured URL', { error: error.message });
      }
    }
    
    // Return existing client
    return this.client;
  }

  async sendEvent(eventType, eventData) {
    const startTime = Date.now();
    
    try {
      // Check circuit breaker
      if (this.isCircuitOpen()) {
        throw new Error('Circuit breaker is open');
      }

      // Prepare event payload
      const payload = this.prepareEventPayload(eventType, eventData);
      
      // Send event with retry logic
      const response = await this.sendWithRetry(payload);
      
      // Record success
      this.recordSuccess();
      
      const responseTime = Date.now() - startTime;
      this.logger.logHttpRequest('POST', '/api/hooks/claude-code', response.status, responseTime);
      
      return response.data;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordFailure();
      this.logger.logHttpRequest('POST', '/api/hooks/claude-code', null, responseTime, error);
      
      // Don't throw error to prevent blocking Claude Code
      this.logger.error('Failed to send hook event', {
        eventType,
        error: error.message,
        circuitBreakerState: this.circuitBreaker.state
      });
      
      return null;
    }
  }

  prepareEventPayload(eventType, eventData) {
    const timestamp = new Date().toISOString();
    
    return {
      type: eventType,
      agentId: this.config.getAgentId ? this.config.getAgentId() : 'unknown',
      sessionId: this.config.getSessionId ? this.config.getSessionId() : 'unknown',
      timestamp,
      data: {
        projectPath: this.config.getProjectPath ? this.config.getProjectPath() : process.cwd(),
        pid: process.pid,
        ...eventData
      }
    };
  }

  async sendWithRetry(payload, endpoint = '/api/hooks/claude-code') {
    let lastError;
    const maxRetries = this.configObj.server.retries;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const client = await this.getClient();
        const response = await client.post(endpoint, payload);
        return response;
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          this.logger.debug(`Retry attempt ${attempt + 1} after ${delay}ms`, {
            error: error.message,
            attempt: attempt + 1,
            maxRetries
          });
          
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  calculateRetryDelay(attempt) {
    const baseDelay = this.configObj.server.retryDelay;
    const multiplier = this.configObj.server.retryDelayMultiplier || 2;
    const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter
    
    return Math.min(baseDelay * Math.pow(multiplier, attempt) + jitter, 30000); // Max 30 seconds
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isCircuitOpen() {
    if (this.circuitBreaker.state === 'closed') {
      return false;
    }
    
    if (this.circuitBreaker.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailureTime;
      if (timeSinceLastFailure > this.circuitBreaker.timeout) {
        this.circuitBreaker.state = 'half-open';
        return false;
      }
      return true;
    }
    
    // half-open state
    return false;
  }

  recordSuccess() {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = 'closed';
    this.circuitBreaker.lastFailureTime = null;
  }

  recordFailure() {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();
    
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.state = 'open';
      this.logger.warn('Circuit breaker opened due to repeated failures', {
        failures: this.circuitBreaker.failures,
        threshold: this.circuitBreaker.threshold
      });
    }
  }

  async sendBatch(events) {
    if (!events || events.length === 0) {
      return;
    }

    const startTime = Date.now();
    
    try {
      if (this.isCircuitOpen()) {
        throw new Error('Circuit breaker is open');
      }

      const payload = {
        events: events.map(event => this.prepareEventPayload(event.type, event.data))
      };
      
      const response = await this.sendWithRetry(payload, '/api/hooks/claude-code/batch');
      
      this.recordSuccess();
      
      const responseTime = Date.now() - startTime;
      this.logger.logHttpRequest('POST', '/api/hooks/claude-code/batch', response.status, responseTime);
      
      return response.data;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordFailure();
      this.logger.logHttpRequest('POST', '/api/hooks/claude-code/batch', null, responseTime, error);
      
      this.logger.error('Failed to send batch hook events', {
        eventCount: events.length,
        error: error.message
      });
      
      return null;
    }
  }

  async testConnection() {
    try {
      const client = await this.getClient();
      const response = await client.get('/api/hooks/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  getCircuitBreakerState() {
    return {
      state: this.circuitBreaker.state,
      failures: this.circuitBreaker.failures,
      lastFailureTime: this.circuitBreaker.lastFailureTime
    };
  }
}

module.exports = EventSender;