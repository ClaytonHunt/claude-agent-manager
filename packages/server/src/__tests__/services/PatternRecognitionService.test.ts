import { PatternRecognitionService } from '../../services/PatternRecognitionService';
import { 
  AnalyticsEvent, 
  Pattern, 
  PatternDetectionResult,
  MLModelConfig,
  MLModelResult 
} from '@claude-agent-manager/shared';
import { Agent } from '@claude-agent-manager/shared';

// Mock ML training data generator
const generateMLTrainingData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    features: {
      responseTime: Math.random() * 1000,
      throughput: Math.random() * 100,
      errorRate: Math.random() * 0.1,
      timeOfDay: Math.floor(Math.random() * 24),
      dayOfWeek: Math.floor(Math.random() * 7)
    },
    label: Math.random() > 0.8 ? 'anomaly' : 'normal'
  }));
};

// Mock agent behavior generators
const generateNormalAgentBehavior = (count: number): Agent[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `normal-agent-${i}`,
    projectPath: `/project/${i}`,
    status: 'active',
    created: new Date(Date.now() - Math.random() * 86400000),
    lastActivity: new Date(Date.now() - Math.random() * 3600000),
    context: { 
      task: `normal-task-${i}`,
      responseTime: 200 + Math.random() * 300 // 200-500ms
    },
    logs: [],
    tags: ['normal']
  }));
};

const generateAnomalousAgentBehavior = (count: number): Agent[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `anomaly-agent-${i}`,
    projectPath: `/project/${i}`,
    status: 'error',
    created: new Date(Date.now() - Math.random() * 86400000),
    lastActivity: new Date(Date.now() - Math.random() * 3600000),
    context: { 
      task: `anomaly-task-${i}`,
      responseTime: 2000 + Math.random() * 3000 // 2-5s (anomalous)
    },
    logs: [],
    tags: ['anomaly']
  }));
};

describe('PatternRecognitionService', () => {
  let patternService: PatternRecognitionService;

  beforeEach(() => {
    patternService = new PatternRecognitionService();
  });

  describe('Pattern Detection Algorithms', () => {
    it('should achieve >75% accuracy on test data', async () => {
      const trainingData = generateMLTrainingData(1000);
      const testData = generateMLTrainingData(200);
      
      await patternService.trainModel(trainingData);
      const accuracy = await patternService.evaluateModel(testData);
      
      expect(accuracy).toBeGreaterThan(0.75);
    });

    it('should detect behavioral patterns in agent workflows', async () => {
      const normalAgents = generateNormalAgentBehavior(100);
      
      const result = await patternService.detectBehavioralPatterns(normalAgents);
      
      expect(result.patterns).toBeInstanceOf(Array);
      expect(result.patterns.length).toBeGreaterThan(0);
      
      const behavioralPatterns = result.patterns.filter(p => p.type === 'behavioral');
      expect(behavioralPatterns.length).toBeGreaterThan(0);
      
      behavioralPatterns.forEach(pattern => {
        expect(pattern.confidence).toBeGreaterThan(0.7);
        expect(pattern.description).toBeTruthy();
      });
    });

    it('should detect performance patterns and bottlenecks', async () => {
      const agents = generateNormalAgentBehavior(50);
      
      const result = await patternService.detectPerformancePatterns(agents);
      
      expect(result.patterns).toBeInstanceOf(Array);
      const performancePatterns = result.patterns.filter(p => p.type === 'performance');
      
      expect(performancePatterns.length).toBeGreaterThan(0);
      performancePatterns.forEach(pattern => {
        expect(pattern.recommendations.length).toBeGreaterThan(0);
        expect(pattern.frequency).toBeGreaterThan(0);
      });
    });
  });

  describe('Anomaly Detection', () => {
    it('should detect anomalies in agent behavior', async () => {
      const normalData = generateNormalAgentBehavior(100);
      const anomalousData = generateAnomalousAgentBehavior(10);
      const allData = [...normalData, ...anomalousData];
      
      const result = await patternService.detectAnomalies(allData);
      
      expect(result.patterns).toBeInstanceOf(Array);
      expect(result.confidence).toBeGreaterThan(0.8);
      
      const anomalyPatterns = result.patterns.filter(p => p.type === 'error');
      expect(anomalyPatterns.length).toBeGreaterThanOrEqual(2); // Should detect some anomalies
    });

    it('should calculate confidence scores for anomaly detection', async () => {
      const normalData = generateNormalAgentBehavior(50);
      const anomalousData = generateAnomalousAgentBehavior(5);
      
      const normalResult = await patternService.detectAnomalies(normalData);
      const anomalousResult = await patternService.detectAnomalies(anomalousData);
      
      expect(normalResult.confidence).toBeLessThan(anomalousResult.confidence);
    });

    it('should handle edge cases in anomaly detection', async () => {
      // Test with empty data
      const emptyResult = await patternService.detectAnomalies([]);
      expect(emptyResult.patterns).toHaveLength(0);
      expect(emptyResult.confidence).toBe(0);
      
      // Test with single data point
      const singleData = generateNormalAgentBehavior(1);
      const singleResult = await patternService.detectAnomalies(singleData);
      expect(singleResult.confidence).toBeLessThan(0.5);
    });
  });

  describe('Real-time Pattern Analysis', () => {
    it('should analyze events in real-time within 50ms', async () => {
      const event: AnalyticsEvent = {
        id: 'real-time-event',
        type: 'agent_updated',
        agentId: 'test-agent',
        timestamp: new Date(),
        data: {
          responseTime: 1500,
          throughput: 25,
          errorRate: 0.15
        }
      };
      
      const startTime = Date.now();
      const patterns = await patternService.analyzeEvent(event);
      const processingTime = Date.now() - startTime;
      
      expect(processingTime).toBeLessThan(50);
      expect(patterns).toBeInstanceOf(Array);
    });

    it('should detect error patterns from error events', async () => {
      const errorEvent: AnalyticsEvent = {
        id: 'error-event',
        type: 'error',
        agentId: 'error-agent',
        timestamp: new Date(),
        data: {
          errorType: 'timeout',
          errorMessage: 'Request timeout after 5000ms',
          stackTrace: 'Error: timeout...'
        }
      };
      
      const patterns = await patternService.analyzeEvent(errorEvent);
      
      expect(patterns.length).toBeGreaterThan(0);
      
      const errorPatterns = patterns.filter(p => p.type === 'error');
      expect(errorPatterns.length).toBeGreaterThan(0);
      
      errorPatterns.forEach(pattern => {
        expect(pattern.confidence).toBeGreaterThan(0.8);
        expect(pattern.description).toContain('timeout');
      });
    });

    it('should detect performance patterns from performance events', async () => {
      const performanceEvent: AnalyticsEvent = {
        id: 'perf-event',
        type: 'performance_metric',
        agentId: 'perf-agent',
        timestamp: new Date(),
        data: {
          responseTime: 2000,
          throughput: 10,
          memoryUsage: 0.9
        }
      };
      
      const patterns = await patternService.analyzeEvent(performanceEvent);
      
      expect(patterns.length).toBeGreaterThan(0);
      
      const performancePatterns = patterns.filter(p => p.type === 'performance');
      expect(performancePatterns.length).toBeGreaterThan(0);
      
      performancePatterns.forEach(pattern => {
        expect(pattern.confidence).toBeGreaterThan(0.7);
        expect(pattern.actionable).toBe(true);
      });
    });
  });

  describe('ML Model Management', () => {
    it('should train and update ML models', async () => {
      const trainingData = generateMLTrainingData(500);
      
      const modelConfig: MLModelConfig = {
        modelType: 'pattern_recognition',
        version: '1.0.0',
        threshold: 0.8,
        parameters: {
          learningRate: 0.01,
          epochs: 100
        }
      };
      
      const result = await patternService.trainModel(trainingData, modelConfig);
      
      expect(result.modelVersion).toBe('1.0.0');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should validate model performance before deployment', async () => {
      const trainingData = generateMLTrainingData(800);
      const validationData = generateMLTrainingData(200);
      
      await patternService.trainModel(trainingData);
      const performance = await patternService.validateModel(validationData);
      
      expect(performance.accuracy).toBeGreaterThan(0.75);
      expect(performance.precision).toBeGreaterThan(0.7);
      expect(performance.recall).toBeGreaterThan(0.7);
    });

    it('should handle model versioning and rollback', async () => {
      const trainingData = generateMLTrainingData(500);
      
      // Train version 1.0.0
      await patternService.trainModel(trainingData, {
        modelType: 'pattern_recognition',
        version: '1.0.0',
        threshold: 0.8,
        parameters: {}
      });
      
      // Train version 2.0.0
      await patternService.trainModel(trainingData, {
        modelType: 'pattern_recognition',
        version: '2.0.0',
        threshold: 0.85,
        parameters: {}
      });
      
      // Should use latest version
      const currentVersion = await patternService.getCurrentModelVersion();
      expect(currentVersion).toBe('2.0.0');
      
      // Should be able to rollback
      await patternService.rollbackToVersion('1.0.0');
      const rolledBackVersion = await patternService.getCurrentModelVersion();
      expect(rolledBackVersion).toBe('1.0.0');
    });
  });

  describe('Pattern Clustering', () => {
    it('should cluster similar patterns together', async () => {
      const agents = generateNormalAgentBehavior(100);
      
      const patterns = await patternService.detectBehavioralPatterns(agents);
      const clusters = await patternService.clusterPatterns(patterns.patterns);
      
      expect(clusters).toBeInstanceOf(Array);
      expect(clusters.length).toBeGreaterThan(0);
      
      clusters.forEach(cluster => {
        expect(cluster.patterns.length).toBeGreaterThan(0);
        expect(cluster.centroid).toBeDefined();
        expect(cluster.cohesion).toBeGreaterThan(0.5);
      });
    });

    it('should identify representative patterns from clusters', async () => {
      const agents = generateNormalAgentBehavior(50);
      
      const patterns = await patternService.detectBehavioralPatterns(agents);
      const clusters = await patternService.clusterPatterns(patterns.patterns);
      
      const representatives = await patternService.getRepresentativePatterns(clusters);
      
      expect(representatives).toBeInstanceOf(Array);
      expect(representatives.length).toBeLessThanOrEqual(clusters.length);
      
      representatives.forEach(pattern => {
        expect(pattern.confidence).toBeGreaterThan(0.8);
        expect(pattern.actionable).toBe(true);
      });
    });
  });

  describe('Pattern Validation', () => {
    it('should validate pattern accuracy against historical data', async () => {
      const historicalData = generateNormalAgentBehavior(200);
      const recentData = generateNormalAgentBehavior(50);
      
      const historicalPatterns = await patternService.detectBehavioralPatterns(historicalData);
      const validation = await patternService.validatePatterns(
        historicalPatterns.patterns, 
        recentData
      );
      
      expect(validation.accuracy).toBeGreaterThan(0.7);
      expect(validation.validPatterns.length).toBeGreaterThan(0);
      expect(validation.invalidPatterns.length).toBeLessThan(validation.validPatterns.length);
    });

    it('should identify pattern drift over time', async () => {
      const oldData = generateNormalAgentBehavior(100);
      const newData = generateAnomalousAgentBehavior(100);
      
      const oldPatterns = await patternService.detectBehavioralPatterns(oldData);
      const driftAnalysis = await patternService.detectPatternDrift(oldPatterns.patterns, newData);
      
      expect(driftAnalysis.driftDetected).toBe(true);
      expect(driftAnalysis.driftScore).toBeGreaterThan(0.5);
      expect(driftAnalysis.affectedPatterns.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Optimization', () => {
    it('should process 10K events within 2 seconds', async () => {
      const events = Array.from({ length: 10000 }, (_, i) => ({
        id: `event-${i}`,
        type: 'agent_updated',
        agentId: `agent-${i}`,
        timestamp: new Date(),
        data: { responseTime: Math.random() * 1000 }
      })) as AnalyticsEvent[];
      
      const startTime = Date.now();
      const results = await patternService.processBatchEvents(events);
      const processingTime = Date.now() - startTime;
      
      expect(processingTime).toBeLessThan(2000);
      expect(results.length).toBe(10000);
    });

    it('should maintain pattern quality under high load', async () => {
      const agents = generateNormalAgentBehavior(1000);
      
      const startTime = Date.now();
      const result = await patternService.detectBehavioralPatterns(agents);
      const processingTime = Date.now() - startTime;
      
      expect(processingTime).toBeLessThan(1000);
      expect(result.patterns.length).toBeGreaterThan(0);
      
      // Quality should remain high even under load
      const highQualityPatterns = result.patterns.filter(p => p.confidence > 0.8);
      expect(highQualityPatterns.length).toBeGreaterThan(0);
    });
  });
});