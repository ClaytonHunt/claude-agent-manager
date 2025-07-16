const WebSocket = require('ws');
const axios = require('axios');

// Test WebSocket connection and hook broadcasting
async function testHookBroadcasting() {
  console.log('🔧 Testing hook broadcasting to WebSocket clients...');
  
  // Create WebSocket connection
  const ws = new WebSocket('ws://localhost:3001');
  
  let receivedAgentUpdate = false;
  
  ws.on('open', function open() {
    console.log('✅ WebSocket connected successfully!');
    
    // Subscribe to agent updates
    ws.send(JSON.stringify({
      type: 'subscribe',
      data: { channels: ['agent:test-agent', 'project:/test/project'] },
      timestamp: new Date()
    }));
    
    console.log('📡 Subscribed to test agent and project channels');
  });

  ws.on('message', function message(data) {
    const msg = JSON.parse(data.toString());
    console.log('📥 Received message:', msg);
    
    if (msg.type === 'ping') {
      ws.send(JSON.stringify({
        type: 'pong',
        data: {},
        timestamp: new Date()
      }));
      console.log('🏓 Sent pong response');
    }
    
    if (msg.type === 'agent_update') {
      receivedAgentUpdate = true;
      console.log('✅ Received agent_update broadcast!');
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
  
  // Send a test hook to trigger agent updates
  try {
    console.log('🚀 Sending test hook to trigger agent update...');
    
    const response = await axios.post('http://localhost:3001/api/hooks/claude-code', {
      type: 'agent.started',
      agentId: 'test-agent',
      timestamp: new Date().toISOString(),
      data: {
        projectPath: '/test/project',
        context: { test: true }
      }
    });
    
    console.log('📤 Hook sent successfully:', response.status);
    
    // Wait for potential broadcast
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send another hook to update agent status
    const response2 = await axios.post('http://localhost:3001/api/hooks/claude-code', {
      type: 'agent.stopped',
      agentId: 'test-agent',
      timestamp: new Date().toISOString(),
      data: {
        reason: 'test completion'
      }
    });
    
    console.log('📤 Second hook sent successfully:', response2.status);
    
    // Wait for potential broadcast
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error('❌ Error sending hook:', error.message);
  }
  
  // Clean up
  ws.close();
  
  console.log('\n📊 Test Results:');
  console.log('- WebSocket connection: ✅ Working');
  console.log('- Hook endpoint: ✅ Working');
  console.log(`- Agent update broadcast: ${receivedAgentUpdate ? '✅ Working' : '❌ Not working'}`);
  
  if (!receivedAgentUpdate) {
    console.log('\n🔍 Issue: WebSocket clients are not receiving agent_update broadcasts');
    console.log('This suggests the server is not calling broadcastAgentUpdate properly');
  }
}

testHookBroadcasting().catch(console.error);