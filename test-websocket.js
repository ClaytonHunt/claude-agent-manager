const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', function open() {
  console.log('✅ WebSocket connected successfully!');
  
  // Subscribe to agent updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    data: { channels: ['agent:claude-agent-manager', 'project:/home/clayton/projects/claude-agent-manager'] },
    timestamp: new Date()
  }));
  
  console.log('📡 Subscribed to agent and project channels');
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
});

ws.on('close', function close() {
  console.log('❌ WebSocket connection closed');
});

ws.on('error', function error(err) {
  console.error('💥 WebSocket error:', err);
});

// Keep the script running for 30 seconds
setTimeout(() => {
  console.log('⏰ Closing WebSocket connection after 30 seconds');
  ws.close();
  process.exit(0);
}, 30000);