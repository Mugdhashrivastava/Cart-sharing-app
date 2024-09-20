const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

let cart = {};  // Shared cart
let clients = [];

server.on('connection', (ws) => {
  clients.push(ws);

  // Send the initial cart data to the new client
  ws.send(JSON.stringify({ type: 'cart', cart }));

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    // Handle cart updates
    if (data.type === 'update_cart') {
      cart = { ...cart, ...data.cart };

      // Broadcast updated cart to all clients
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'cart', cart }));
        }
      });
    }

    // Handle cart finalization
    if (data.type === 'finalize_cart') {
      console.log('Cart finalized:', cart);
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'finalized', cart }));
        }
      });
    }
  });

  // Remove client from list when disconnected
  ws.on('close', () => {
    clients = clients.filter(client => client !== ws);
  });
});

console.log('WebSocket server running on ws://localhost:8080');
