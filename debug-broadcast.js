const WebSocket = require('ws');
const axios = require('axios');

// Debug WebSocket broadcasting issue
async function debugBroadcasting() {
  console.log('🔧 Debug: Testing hook broadcasting with detailed logging...');
  
  // Create WebSocket connection
  const ws = new WebSocket('ws://localhost:3001');
  
  let connectedClients = 0;
  
  ws.on('open', function open() {
    console.log('✅ WebSocket connected successfully!');
    
    // Subscribe to ALL channels to see what's happening
    ws.send(JSON.stringify({
      type: 'subscribe',
      data: { channels: ['agent:test-agent', 'project:/test/project'] },
      timestamp: new Date()
    }));
    
    console.log('📡 Subscribed to test channels');
  });

  ws.on('message', function message(data) {
    const msg = JSON.parse(data.toString());
    console.log('📥 Received WebSocket message:', JSON.stringify(msg, null, 2));
    
    if (msg.type === 'ping') {
      ws.send(JSON.stringify({
        type: 'pong',
        data: {},
        timestamp: new Date()
      }));
      console.log('🏓 Sent pong response');
    }
  });

  ws.on('close', function close() {
    console.log('❌ WebSocket connection closed');
  });

  ws.on('error', function error(err) {
    console.error('💥 WebSocket error:', err);
  });

  // Wait for connection to establish
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 1: Check agent list first
  try {
    console.log('\n🔍 Step 1: Checking current agents...');
    const agentsResponse = await axios.get('http://localhost:3001/api/agents');
    console.log('📊 Current agents:', agentsResponse.data.length);
    
    for (const agent of agentsResponse.data) {
      console.log(`  - ${agent.id}: ${agent.status} (${agent.projectPath})`);
    }
  } catch (error) {
    console.error('❌ Error getting agents:', error.message);
  }
  
  // Test 2: Send hook to register agent
  try {
    console.log('\n🔍 Step 2: Sending agent.started hook...');
    
    const hookData = {
      type: 'agent.started',
      agentId: 'test-agent',
      timestamp: new Date().toISOString(),
      data: {
        projectPath: '/test/project',
        context: { test: true }
      }
    };
    
    console.log('📤 Sending hook data:', JSON.stringify(hookData, null, 2));
    
    const response = await axios.post('http://localhost:3001/api/hooks/claude-code', hookData);
    console.log('✅ Hook sent successfully:', response.status);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error('❌ Error sending hook:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
  
  // Test 3: Check agents again
  try {
    console.log('\n🔍 Step 3: Checking agents after hook...');
    const agentsResponse = await axios.get('http://localhost:3001/api/agents');
    console.log('📊 Current agents:', agentsResponse.data.length);
    
    for (const agent of agentsResponse.data) {
      console.log(`  - ${agent.id}: ${agent.status} (${agent.projectPath})`);
    }
  } catch (error) {
    console.error('❌ Error getting agents:', error.message);
  }
  
  // Test 4: Test direct WebSocket connection count
  try {
    console.log('\n🔍 Step 4: Checking WebSocket connection count...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('🏥 Health check response:', healthResponse.data);
  } catch (error) {
    console.error('❌ Error checking health:', error.message);
  }
  
  // Wait and close
  await new Promise(resolve => setTimeout(resolve, 2000));
  ws.close();
  
  console.log('\n📊 Debug complete');
}

debugBroadcasting().catch(console.error);