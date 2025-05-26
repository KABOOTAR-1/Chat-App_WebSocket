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
    
    // 1. Fetch and send message history (all messages, not just offline ones)
    await sendMessageHistory(username, ws);
    
    // 2. Also fetch and send offline messages for backward compatibility
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
      // Keep offline messages for now as we transition to the new system
      // This can be removed later once we verify the new system works well
      // msgDoc.OfflineMessage = [];
      // await msgDoc.save();
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

// Function to send message history to a user when they connect
const sendMessageHistory = async (username, ws) => {
  try {
    // Get all conversations where this user is either the sender or receiver
    const sentMessages = await MsgSC.find({ sender: username });
    const receivedMessages = await MsgSC.find({ receiver: username });
    
    // Combine and sort all messages by timestamp
    const allConversations = [...sentMessages, ...receivedMessages];
    
    // Process each conversation
    for (const conversation of allConversations) {
      // Send each message in the conversation
      for (const msg of conversation.messages) {
        const newMessage = {
          type: "history_message",
          UserName: conversation.sender,
          receiver: conversation.receiver,
          message: msg.content,
          timestamp: msg.timestamp,
          delivered: msg.delivered
        };
        ws.send(JSON.stringify(newMessage));
        
        // Mark as delivered if the current user is the recipient
        if (conversation.receiver === username && !msg.delivered) {
          msg.delivered = true;
        }
      }
      
      // Save the updated delivery status
      if (conversation.messages.some(m => m.delivered)) {
        await conversation.save();
      }
    }
    
    // Send an event to indicate history loading is complete
    ws.send(JSON.stringify({
      type: "history_complete"
    }));
    
  } catch (error) {
    console.error('Error sending message history:', error);
    ws.send(JSON.stringify({
      type: "error",
      message: "Failed to load message history"
    }));
  }
};

const handleMessage = async (sender, recipient, message, clients) => {
  // Store message in database (all messages, not just offline ones)
  await storeMessage(sender, recipient, message);
  
  // Send to sender
  const sendersocket = clients.get(sender);
  sendersocket.send(JSON.stringify(message));
  
  // Send to recipient if online
  const recipientSocket = clients.get(recipient);
  if (recipientSocket) {
    recipientSocket.send(JSON.stringify(message));
    await markMessageAsDelivered(sender, recipient, message);
  } else {
    // If recipient is offline, also store as offline message for backward compatibility
    await storeOfflineMessage(sender, recipient, message);
  }
};

// Store message in the database (both online and offline messages)
const storeMessage = async (sender, recipient, message) => {
  try {
    // Find or create conversation document
    let conversation = await MsgSC.findOne({
      sender: sender,
      receiver: recipient,
    });
    
    if (!conversation) {
      conversation = new MsgSC({
        sender: sender,
        receiver: recipient,
        messages: [],
      });
    }
    
    // Add message to conversation history
    conversation.messages.push({
      content: message.message,
      timestamp: new Date(),
      delivered: false
    });
    
    await conversation.save();
    console.log(`Message from ${sender} to ${recipient} stored in history`);
    
    return conversation;
  } catch (error) {
    console.error("Error storing message:", error);
  }
};

// Mark messages as delivered when recipient is online
const markMessageAsDelivered = async (sender, recipient, message) => {
  try {
    const conversation = await MsgSC.findOne({
      sender: sender,
      receiver: recipient
    });
    
    if (conversation && conversation.messages.length > 0) {
      // Mark the latest message as delivered
      const lastIndex = conversation.messages.length - 1;
      conversation.messages[lastIndex].delivered = true;
      await conversation.save();
    }
  } catch (error) {
    console.error("Error marking message as delivered:", error);
  }
};

// Store offline message for backward compatibility
const storeOfflineMessage = async (sender, recipient, message) => {
  try {
    // Find or create conversation document
    let offlineMessage = await MsgSC.findOne({
      sender: sender,
      receiver: recipient,
    });
    
    if (offlineMessage) {
      offlineMessage.OfflineMessage.push(message.message);
    } else {
      offlineMessage = new MsgSC({
        sender: sender,
        receiver: recipient,
        messages: [],
      });
      offlineMessage.OfflineMessage.push(message.message);
    }
    
    await offlineMessage.save();
    console.log(`Message for ${recipient} saved offline:`, message.message);
  } catch (error) {
    console.error("Error saving offline message:", error);
  }
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
  } else if (message.type === "ping") {
    // Handle ping message for keeping connection alive
    ws.send(JSON.stringify({
      type: "pong"
    }));
    
    // Update last activity timestamp (handled by the websocket.js file)
    ws.lastActivity = Date.now();
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
    await handleMessage(message.UserName, message.receiver, cleanMessage, clients);
  }
};

module.exports = getMessage;
