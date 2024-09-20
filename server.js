const WebSocket = require('ws');
const url = require('url');

const server = new WebSocket.Server({ port: 8080 });

let sessions = {};  // Store carts for each session
let clients = {};   // Store clients for each session

server.on('connection', (ws, req) => {
  // Parse sessionId from URL query parameters
  const query = url.parse(req.url, true).query;
  const sessionId = query.sessionId || generateSessionId();

  // If no cart exists for the sessionId, initialize one
  if (!sessions[sessionId]) {
    sessions[sessionId] = {};  // Create a new cart for the session
  }

  // If no clients list exists for the sessionId, initialize it
  if (!clients[sessionId]) {
    clients[sessionId] = [];
  }

  // Add the new client to the session's client list
  clients[sessionId].push(ws);

  // Send the initial cart data to the new client
  ws.send(JSON.stringify({ type: 'cart', cart: sessions[sessionId] }));

  // Handle incoming messages from the client
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    // Handle cart updates
    if (data.type === 'update_cart') {
      // Update the session's cart with the new data
      sessions[sessionId] = { ...sessions[sessionId], ...data.cart };

      // Broadcast the updated cart to all clients in the same session
      clients[sessionId].forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'cart', cart: sessions[sessionId] }));
        }
      });
    }

    // Handle cart finalization
    if (data.type === 'finalize_cart') {
      console.log(`Cart finalized for session ${sessionId}:`, sessions[sessionId]);

      // Notify all clients in the session that the cart is finalized
      clients[sessionId].forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'finalized', cart: sessions[sessionId] }));
        }
      });
    }
  });

  // Remove the client from the session when disconnected
  ws.on('close', () => {
    clients[sessionId] = clients[sessionId].filter(client => client !== ws);
  });
});

console.log('WebSocket server running on ws://localhost:8080');

// Generate a unique session ID
function generateSessionId() {
  return Math.random().toString(36).substring(2, 9);
}
