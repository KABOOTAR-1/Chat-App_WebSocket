const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());

const router = require("./routes/chat");
const WebSocket = require("ws");
const http = require("http");
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const db = require("./database/mongodb");
const socketConnect = require("./websocketMessage/websocket");

require("dotenv").config();

app.use(express.json());
app.use(router);

const clients = new Map();

const port = process.env.PORT || 4001;
const start = async () => {
  try {
    await db(process.env.MONGO_URI);
    server.listen(port, () => {
      console.log(`Express server is listening on port ${port}`);
    });
    wss.on("listening", () => {
      console.log(`WebSocket server listening on port ${port}`);
      socketConnect(wss, clients);
    });
  } catch (err) {
    console.log(err);
  }
};

start();
