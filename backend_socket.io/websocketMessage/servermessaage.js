const MsgSC = require("../dbschema/MessageSchema");
const UserS = require("../dbschema/UserSchema");
const { generateToken, verifyToken } = require("../middleware/auth");
const bcrypt = require('bcrypt');

// Helper function to broadcast active users to all clients
const broadcastActiveUsers = (clients,isNewUSer) => {
  // Create an array of active usernames
  const activeUsers = Array.from(clients.keys());
  
  // Broadcast to all connected clients
  clients.forEach((socket) => {
    const statusUpdate = {
      type: "status_update",
      activeUsers: activeUsers,
      isNewUSer: isNewUSer,
    };
    socket.send(JSON.stringify(statusUpdate));
  });
};

const setUserName = async (clients, message, player, ws) => {
  // Split username and password
  const [username, password] = message.UserName.split(':');
  console.log(username, password);
  let isNewUSer=false;
  // Check if username and password are provided
  try {
    // Check if user exists
    if (player) {
      // Verify password
      const isValidPassword = await bcrypt.compare(password, player.password);
      if (!isValidPassword) {
        ws.send(JSON.stringify({
          type: "error",
          message: "Invalid password"
        }));
        return;
      }
    } else {
      // New user - hash password and create account
      const hashedPassword = await bcrypt.hash(password, 10);
      player = new UserS({
        username: username,
        password: hashedPassword
      });
      isNewUSer=true;
      await player.save();
    }

    const token = generateToken(username);
    ws.userToken = token;
    clients.set(username, ws);
    
    // Send token to client
    ws.send(JSON.stringify({
      type: "auth",
      token: token
    }));
    
    // Broadcast updated active users
    broadcastActiveUsers(clients,isNewUSer);
    
    // Fetch all offline messages for this user
    const offlineMessages = await MsgSC.find({ 
      receiver: username,
      OfflineMessage: { $exists: true, $ne: [] }
    });

    // Send offline messages
    for (const msgDoc of offlineMessages) {
      for (const msg of msgDoc.OfflineMessage) {
        const newMessage = {
          type: "message",
          UserName: msgDoc.sender,
          receiver: msgDoc.receiver,
          message: msg
        };
        ws.send(JSON.stringify(newMessage));
      }
      msgDoc.OfflineMessage = [];
      await msgDoc.save();
    }
    
    console.log(`${username} connected`);
    
  } catch (error) {
    console.error('Authentication error:', error);
    ws.send(JSON.stringify({
      type: "error",
      message: "Authentication failed"
    }));
  }
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
    const [username] = message.UserName.split(':');
    const player = await UserS.findOne({ username: username });
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
