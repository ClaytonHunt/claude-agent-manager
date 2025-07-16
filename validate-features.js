#!/usr/bin/env node

const http = require('http');
const WebSocket = require('ws');

const BASE_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Test functions
async function testAgentRegistration() {
  console.log('🧪 Testing Agent Registration...');
  
  const agentData = {
    id: 'test-agent-1',
    projectPath: '/test/project',
    status: 'active',
    context: { task: 'test task' },
    tags: ['test', 'validation']
  };
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(agentData)
    });
    
    if (response.statusCode === 201) {
      console.log('✅ Agent registration: PASS');
      return JSON.parse(response.body);
    } else {
      console.log('❌ Agent registration: FAIL -', response.statusCode, response.body);
      return null;
    }
  } catch (error) {
    console.log('❌ Agent registration: FAIL -', error.message);
    return null;
  }
}

async function testAgentRetrieval() {
  console.log('🧪 Testing Agent Retrieval...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/agents`);
    
    if (response.statusCode === 200) {
      const agents = JSON.parse(response.body);
      console.log('✅ Agent retrieval: PASS -', agents.length, 'agents found');
      return agents;
    } else {
      console.log('❌ Agent retrieval: FAIL -', response.statusCode);
      return [];
    }
  } catch (error) {
    console.log('❌ Agent retrieval: FAIL -', error.message);
    return [];
  }
}

async function testAgentUpdate(agentId) {
  console.log('🧪 Testing Agent Update...');
  
  const updateData = {
    status: 'complete',
    context: { task: 'updated task', result: 'success' }
  };
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/agents/${agentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (response.statusCode === 200) {
      console.log('✅ Agent update: PASS');
      return JSON.parse(response.body);
    } else {
      console.log('❌ Agent update: FAIL -', response.statusCode, response.body);
      return null;
    }
  } catch (error) {
    console.log('❌ Agent update: FAIL -', error.message);
    return null;
  }
}

async function testLogEntry(agentId) {
  console.log('🧪 Testing Log Entry...');
  
  const logData = {
    level: 'info',
    message: 'Test log message',
    metadata: { timestamp: new Date().toISOString() }
  };
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/agents/${agentId}/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(logData)
    });
    
    if (response.statusCode === 201) {
      console.log('✅ Log entry: PASS');
      return JSON.parse(response.body);
    } else {
      console.log('❌ Log entry: FAIL -', response.statusCode, response.body);
      return null;
    }
  } catch (error) {
    console.log('❌ Log entry: FAIL -', error.message);
    return null;
  }
}

async function testWebSocketConnection() {
  console.log('🧪 Testing WebSocket Connection...');
  
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(WS_URL);
      
      ws.on('open', () => {
        console.log('✅ WebSocket connection: PASS');
        
        // Test subscription
        ws.send(JSON.stringify({
          type: 'subscribe',
          channel: 'agent-updates'
        }));
        
        setTimeout(() => {
          ws.close();
          resolve(true);
        }, 1000);
      });
      
      ws.on('error', (error) => {
        console.log('❌ WebSocket connection: FAIL -', error.message);
        resolve(false);
      });
      
      ws.on('message', (data) => {
        console.log('📨 WebSocket message received:', data.toString());
      });
      
      setTimeout(() => {
        ws.close();
        console.log('❌ WebSocket connection: TIMEOUT');
        resolve(false);
      }, 5000);
      
    } catch (error) {
      console.log('❌ WebSocket connection: FAIL -', error.message);
      resolve(false);
    }
  });
}

async function testFrontendPages() {
  console.log('🧪 Testing Frontend Pages...');
  
  const pages = [
    '/',
    '/agents',
    '/analytics',
    '/logs'
  ];
  
  let passCount = 0;
  
  for (const page of pages) {
    try {
      const response = await makeRequest(`http://localhost:3000${page}`);
      if (response.statusCode === 200 && response.body.includes('Claude Agent Manager')) {
        console.log(`✅ Frontend ${page}: PASS`);
        passCount++;
      } else {
        console.log(`❌ Frontend ${page}: FAIL - ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`❌ Frontend ${page}: FAIL - ${error.message}`);
    }
  }
  
  return passCount === pages.length;
}

async function testCleanup(agentId) {
  console.log('🧪 Testing Cleanup...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/agents/${agentId}`, {
      method: 'DELETE'
    });
    
    if (response.statusCode === 200) {
      console.log('✅ Agent cleanup: PASS');
      return true;
    } else {
      console.log('❌ Agent cleanup: FAIL -', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Agent cleanup: FAIL -', error.message);
    return false;
  }
}

// Main test runner
async function runFullValidation() {
  console.log('🚀 Starting Full Feature Validation...\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  // Test 1: Agent Registration
  const agent = await testAgentRegistration();
  if (agent) {
    testsPassed++;
    
    // Test 2: Agent Retrieval
    const agents = await testAgentRetrieval();
    if (agents.length > 0) {
      testsPassed++;
      
      // Test 3: Agent Update
      const updatedAgent = await testAgentUpdate(agent.id);
      if (updatedAgent) {
        testsPassed++;
        
        // Test 4: Log Entry
        const logResult = await testLogEntry(agent.id);
        if (logResult) {
          testsPassed++;
        } else {
          testsFailed++;
        }
        
        // Test 5: Cleanup
        const cleanupResult = await testCleanup(agent.id);
        if (cleanupResult) {
          testsPassed++;
        } else {
          testsFailed++;
        }
      } else {
        testsFailed++;
      }
    } else {
      testsFailed++;
    }
  } else {
    testsFailed++;
  }
  
  // Test 6: WebSocket
  const wsResult = await testWebSocketConnection();
  if (wsResult) {
    testsPassed++;
  } else {
    testsFailed++;
  }
  
  // Test 7: Frontend Pages
  const frontendResult = await testFrontendPages();
  if (frontendResult) {
    testsPassed++;
  } else {
    testsFailed++;
  }
  
  console.log(`\n📊 Final Results: ${testsPassed} passed, ${testsFailed} failed`);
  
  if (testsFailed === 0) {
    console.log('🎉 All features are working correctly!');
  } else {
    console.log('⚠️  Some features need attention. Check the logs above.');
  }
  
  return testsFailed === 0;
}

// Check if ws module is available
try {
  require('ws');
  runFullValidation().catch(console.error);
} catch (error) {
  console.log('⚠️  WebSocket module not available. Installing...');
  const { spawn } = require('child_process');
  const npm = spawn('npm', ['install', 'ws'], { cwd: __dirname });
  
  npm.on('close', (code) => {
    if (code === 0) {
      console.log('✅ WebSocket module installed. Running validation...');
      delete require.cache[require.resolve('ws')];
      runFullValidation().catch(console.error);
    } else {
      console.log('❌ Failed to install WebSocket module. Running validation without WebSocket tests...');
      runFullValidation().catch(console.error);
    }
  });
}