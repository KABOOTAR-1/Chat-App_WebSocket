const MsgSC = require("../dbschema/MessageSchema");
const UserS = require("../dbschema/UserSchema");

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
  clients.set(message.UserName, ws);
  
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

const getMessage = async (ws, data, clients) => {
  const message = JSON.parse(data);
  console.log(message);
  const player = await UserS.findOne({ username: message.UserName });
  if (message.type == "username") {
    setUserName(clients, message, player, ws);
  } else {
    //console.log(clients.size);
    handleMessage(message.UserName, message.receiver, message, clients);
  }
};

module.exports = getMessage;
