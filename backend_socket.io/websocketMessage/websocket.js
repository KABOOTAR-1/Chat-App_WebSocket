const WebSocket = require("ws");
const getMessage = require("./servermessaage");

// Helper function to broadcast active users to all clients
const broadcastActiveUsers = (clients) => {
  // Create an array of active usernames
  const activeUsers = Array.from(clients.keys());
  
  // Broadcast to all connected clients
  clients.forEach((socket) => {
    const statusUpdate = {
      type: "status_update",
      activeUsers: activeUsers
    };
    socket.send(JSON.stringify(statusUpdate));
  });
};

const socketConnect = (wss, clients) => {
  wss.on("connection", (ws) => {  // Removed req parameter
    console.log("Client connected");
    ws.isAlive = true;

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", (data) => {
      if (data.toString() === "ping") {
        // If the client sends a "ping" message, respond with a "pong" message
      } else {
        try {
          getMessage(ws, data, clients);
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      }
    });

    // Store username for this connection to handle disconnection later
    ws.username = null;
    
    ws.on("close", () => {
      console.log("A client disconnected");
      // Find and remove the disconnected client
      clients.forEach((socket, username) => {
        if (socket === ws) {
          console.log(`User ${username} disconnected`);
          clients.delete(username);
          // Broadcast updated active users to all remaining clients
          broadcastActiveUsers(clients);
          return;
        }
      });
    });
  });

  setInterval(() => {
    clients.forEach((socket, username) => {
      if (!socket.isAlive) {
        console.log(
          `Terminating connection for ${username} due to unresponsiveness`
        );
        socket.terminate(); // Terminating the WebSocket connection
        clients.delete(username); // Removing the client from the set
        
        // Broadcast updated active users list after removing inactive client
        broadcastActiveUsers(clients);
        return;
      }

      socket.isAlive = false;
      socket.ping(() => {});
    });
  }, 1000);
};

module.exports = socketConnect;
