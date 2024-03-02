const WebSocket = require("ws");
const getMessage = require("./servermessaage");

const socketConnect = (wss, clients) => {
  wss.on("connection", (ws) => {
    console.log("Client connected");
    ws.isAlive = true;

    ws.on("pong", () => {
      //console.log("Received pong from client");
      ws.isAlive = true;
    });

    ws.on("message", (data) => {
      if (data.toString() === "ping") {
        // If the client sends a "ping" message, respond with a "pong" message
        console.log("Received ping from client");
      } else {
        try {
          getMessage(ws, data, clients);
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      }
    });

    ws.on("close", () => {
      console.log("A client disconnected");
      // Handle client disconnection here
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
        return;
      }

      socket.isAlive = false;
      socket.ping(() => {});
    });
  }, 1000);
};

module.exports = socketConnect;
