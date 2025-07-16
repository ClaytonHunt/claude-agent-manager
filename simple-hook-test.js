const axios = require('axios');

async function testHook() {
  try {
    console.log('🚀 Sending simple hook...');
    
    const response = await axios.post('http://localhost:3001/api/hooks/claude-code', {
      type: 'agent.started',
      agentId: 'simple-test-agent',
      timestamp: new Date().toISOString(),
      data: {
        projectPath: '/simple/test',
        context: { simple: true }
      }
    });
    
    console.log('✅ Response:', response.status, response.data);
    
    // Check if agent was created
    const agentsResponse = await axios.get('http://localhost:3001/api/agents');
    console.log('📊 Total agents:', agentsResponse.data.length);
    
    const testAgent = agentsResponse.data.find(a => a.id === 'simple-test-agent');
    if (testAgent) {
      console.log('✅ Test agent found:', testAgent.status);
    } else {
      console.log('❌ Test agent not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testHook();