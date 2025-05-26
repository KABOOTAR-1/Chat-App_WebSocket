import React, { useEffect, useState, useRef } from "react";
import ChatBox from "./ChatBox"; // Import the ChatBox component
import axios from "axios";
import "./App.css"; // Import the CSS file for styling
import { jwtDecode } from "jwt-decode"; // Import the JWT library

function App() {
  const [socket, setSocket] = useState(null);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [username, setUsername] = useState("");
  const [reciverusername, setReceiverUsername] = useState("");
  const [myUserName, setMyUserName] = useState("");
  const [users, setUsers] = useState([]); // State to store the current username
  const [activeUsers, setActiveUsers] = useState([]); // State to store active users
  const tokenRef = useRef(null);
  const [password, setPassword] = useState(""); // Add password state
  const fetchData = async (shouldFetchData = true,activeUsers=null) => {
    if (shouldFetchData) {
      try {
        const response = await axios.get("http://localhost:4000"); // Replace with your backend URL
        const players = response.data.filter(
          (user) => user.username !== username
        );
        console.log(players);
        setUsers(players);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    if(activeUsers!=null)
    setActiveUsers(activeUsers);
  };

  const handleSocketConnection = () => {
    const newSocket = new WebSocket("ws://localhost:4000");

    // Event listeners
    newSocket.onopen = () => {
      console.log("Connected to server");
      const combinedCredentials = `${username}:${password}`;
      newSocket.send(
        JSON.stringify({ type: "username", UserName: combinedCredentials })
      );
      // If we have saved credentials, authenticate immediately
    };

    newSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("Received message:", message);

      if (message.type === "auth") {
        const { username } = jwtDecode(message.token);
        tokenRef.current = message.token;
        setMyUserName(username);
        setIsLoadingHistory(true); // Start loading history
      } else if (message.type === "error") {
        // Handle token expiry
        handleLogout();
      } else if (message.type === "status_update") {
        fetchData(message.isNewUSer, message.activeUsers);
      } else if (message.type === "history_message") {
        // Handle historical messages
        setMessages((prevMessages) => {
          // Check if message already exists to avoid duplicates
          const exists = prevMessages.some(
            (msg) =>
              msg.message === message.message &&
              msg.UserName === message.UserName &&
              msg.receiver === message.receiver &&
              msg.messageType === "history"
          );
          if (!exists) {
            return [
              ...prevMessages,
              {
                ...message,
                messageType: "history",
                timestamp: message.timestamp || new Date().toISOString(),
              },
            ];
          }
          return prevMessages;
        });
      } else if (message.type === "history_complete") {
        // History loading is complete
        setIsLoadingHistory(false);
        console.log("Message history loading complete");
      } else if (message.type === "message") {
        // Handle new live messages
        setMessages((prevMessages) => {
          // Check if message already exists to avoid duplicates
          const exists = prevMessages.some(
            (msg) =>
              msg.message === message.message &&
              msg.UserName === message.UserName &&
              msg.receiver === message.receiver &&
              msg.messageType === "live"
          );
          if (!exists) {
            return [
              ...prevMessages,
              {
                ...message,
                messageType: "live",
                timestamp: message.timestamp || new Date().toISOString(),
              },
            ];
          }
          return prevMessages;
        });
      } else if (message.type === "pong") {
        // Received pong from server
        console.log("Received pong from server");
      }
    };

    newSocket.onclose = () => {
      console.log("Disconnected from server");
    };

    // Start the ping-pong mechanism
    const pingInterval = startPingPong(newSocket);
    
    // Store the interval ID for cleanup
    newSocket.pingInterval = pingInterval;
    setSocket(newSocket);
  };

  useEffect(() => {
    // Check for existing token in localStorage

    // Connect to WebSocket server

    return () => {
      if (socket) {
        // Clear the ping interval if it exists
        if (socket.pingInterval) {
          clearInterval(socket.pingInterval);
        }
        socket.close();
      }
      handleLogout();
    };
  }, []);

  const handleLogout = () => {
    tokenRef.current = null;
    setMyUserName("");
    setUsername("");
    setMessages([]);
    setActiveUsers([]);
    socket?.close();
    setSocket(null);
  };

  const handleInputChange = (event) => {
    setInputMessage(event.target.value);
  };

  const setUsernameAndSendMessage = () => {
    if (!username.trim() || !password.trim()) return; // Check both username and password

    fetchData();
    handleSocketConnection();
  };

  const sendMessage = () => {
    if (reciverusername === "" || !tokenRef.current) return;

    const myMessage = inputMessage;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "message",
          UserName: myUserName,
          receiver: reciverusername,
          message: myMessage,
          token: tokenRef.current,
        })
      );
      setInputMessage("");
    }
  };

  const handleUserName = (event) => {
    setUsername(event.target.value); // Only update the input field value
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  };

  // Function to start the ping-pong mechanism for idle detection
  const startPingPong = (socket) => {
    const pingInterval = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        // Send a ping message to the server
        console.log("Sending ping to server");
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000); // Send ping every 30 seconds

    return pingInterval;
  };

  return (
    <div className="chat-app">
      <div className="header">
        <h1>WebSocket Chat</h1>
        {myUserName && (
          <button className="btn logout" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>

      <div className="main-container">
        <div className="login-section">
          {!myUserName ? (
            <div className="username-input">
              <input
                type="text"
                value={username}
                onChange={handleUserName}
                placeholder="Enter your username"
                className="input-field"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input-field"
              />
              <button
                className="btn primary"
                onClick={setUsernameAndSendMessage}
              >
                Join Chat
              </button>
            </div>
          ) : (
            <div className="chat-interface">
              <div className="users-list">
                <h2>Active Users</h2>
                <div className="users-grid">
                  {users.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => setReceiverUsername(user.username)}
                      className={`user-btn ${
                        reciverusername === user.username ? "active" : ""
                      }`}
                    >
                      {user.username}
                      {activeUsers.includes(user.username) && (
                        <span className="active-status" title="Online">
                          •
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="message-section">
                {isLoadingHistory ? (
                  <div className="loading-history">Loading message history...</div>
                ) : (
                  <ChatBox
                    messages={messages}
                    myUserName={myUserName}
                    selectedUser={reciverusername}
                  />
                )}
                <div className="message-input">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="input-field"
                  />
                  <button className="btn send" onClick={sendMessage}>
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
