const MsgSC = require("../dbschema/MessageSchema");
const UserS = require("../dbschema/UserSchema");
const { generateToken, verifyToken } = require("../middleware/auth");

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

const setUserName = async (clients, message, player, ws) => {
  const token = generateToken(message.UserName);
  ws.userToken = token; // Store token in ws object
  clients.set(message.UserName, ws);
  
  // Send token once during authentication
  ws.send(JSON.stringify({
    type: "auth",
    token: token
  }));
  
  // Broadcast updated active users to all clients
  broadcastActiveUsers(clients);
  
  const offlinemessage = await MsgSC.findOne({ receiver: message.UserName });
  if (offlinemessage) {
    if (offlinemessage.OfflineMessage.length > 0) {
      offlinemessage.OfflineMessage.forEach(async (message) => {
        const newMessage = {
          type: "message",
          UserName: offlinemessage.sender,
          message: message,
        };
        ws.send(JSON.stringify(newMessage));
        offlinemessage.OfflineMessage = [];
      });
      await offlinemessage.save();
    }
  }
  if (player != null) return;
  player = new UserS({ username: message.UserName });
  await player.save();
  console.log(`${message.UserName} connected`);
  return;
};

const handleMessage = (sender, recipient, message, clients) => {
  const sendersocket = clients.get(sender);
  sendersocket.send(JSON.stringify(message));
  const recipientSocket = clients.get(recipient);
  if (recipientSocket) {
    recipientSocket.send(JSON.stringify(message));
  } else {
    storeOfflineMessage(sender, recipient, message);
  }
};

const storeOfflineMessage = async (sender, recipient, message) => {
  // Store the message in the database or another storage solution

  let offlineMessage = await MsgSC.findOne({
    sender: sender,
    receiver: recipient,
  });
  console.log(offlineMessage);
  if (offlineMessage) {
    offlineMessage.OfflineMessage.push(message.message);
  } else {
    offlineMessage = new MsgSC({
      sender: sender,
      receiver: recipient,
      message: [],
    });
    offlineMessage.OfflineMessage.push(message.message);
  }
  await offlineMessage
    .save()
    .then((savedMessage) => {
      console.log(`Message for ${recipient} saved offline:`, savedMessage);
    })
    .catch((error) => {
      console.error("Error saving offline message:", error);
    });
};

const sanitizeMessage = (message) => {
  const { token, ...cleanMessage } = message;
  return cleanMessage;
};

const getMessage = async (ws, data, clients) => {
  const message = JSON.parse(data);
  
  if (message.type === "username") {
    const player = await UserS.findOne({ username: message.UserName });
    setUserName(clients, message, player, ws);
  } else {
    // Verify token from message matches stored token
    if (!ws.userToken || message.token !== ws.userToken || 
        !verifyToken(message.token) || 
        verifyToken(message.token).username !== message.UserName) {
      ws.send(JSON.stringify({
        type: "error",
        message: "Unauthorized"
      }));
      return;
    }
    const cleanMessage = sanitizeMessage(message);
    handleMessage(message.UserName, message.receiver, cleanMessage, clients);
  }
};

module.exports = getMessage;
