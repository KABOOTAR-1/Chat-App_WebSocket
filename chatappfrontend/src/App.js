import React, { useEffect, useState, useRef } from "react";
import ChatBox from "./ChatBox"; // Import the ChatBox component
import axios from "axios";
import "./App.css"; // Import the CSS file for styling
import { jwtDecode } from "jwt-decode"; // Import the JWT library

function App() {
  const [socket, setSocket] = useState(null);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [reciverusername, setReceiverUsername] = useState("");
  const [myUserName, setMyUserName] = useState("");
  const [users, setUsers] = useState([]); // State to store the current username
  const [activeUsers, setActiveUsers] = useState([]); // State to store active users
  const tokenRef = useRef(null);
  const [password, setPassword] = useState(""); // Add password state
  const fetchData = async () => {
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
  };

  useEffect(() => {
    // Check for existing token in localStorage

    // Connect to WebSocket server
    const newSocket = new WebSocket("ws://localhost:4000");

    // Event listeners
    newSocket.onopen = () => {
      console.log("Connected to server");
      // If we have saved credentials, authenticate immediately
    };

    newSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("Received message:", message);
      
      if (message.type === "auth") {
        //console.log("Message ",username)
        const {username} = jwtDecode(message.token);
        tokenRef.current = message.token;
            setMyUserName(username);
      } else if (message.type === "error") {
        // Handle token expiry
        handleLogout();
      } else if (message.type === "status_update") {
        setActiveUsers(message.activeUsers);
      } else if (message.type === "message") {
        setMessages(prevMessages => {
          // Check if message already exists to avoid duplicates
          const exists = prevMessages.some(msg => 
            msg.message === message.message && 
            msg.UserName === message.UserName &&
            msg.receiver === message.receiver
          );
          if (!exists) {
            return [...prevMessages, {
              ...message,
              timestamp: message.timestamp || new Date().toISOString()
            }];
          }
          return prevMessages;
        });
      }
    };

    newSocket.onclose = () => {
      console.log("Disconnected from server");
    };

    // Event listener to handle pong messages from the server
    newSocket.addEventListener("pong", () => {
      console.log("Received pong from server");

      // You can add further handling if needed
    });
    //startPingPong(newSocket); // Start the ping-pong mechanism
    setSocket(newSocket);

    return () => {
      newSocket.close();
      handleLogout();
    };
  }, []);

  const handleLogout = () => {
    tokenRef.current = null;
    setMyUserName('');
    setUsername('');
    setMessages([]);
    setActiveUsers([]);
  };

  const handleInputChange = (event) => {
    setInputMessage(event.target.value);
  };

  const setUsernameAndSendMessage = () => {
    if (!username.trim() || !password.trim()) return; // Check both username and password
    
    fetchData();

    
    if (socket && socket.readyState === WebSocket.OPEN) {
      // Combine username and password with a delimiter
      const combinedCredentials = `${username}:${password}`;
      socket.send(JSON.stringify({ type: "username", UserName: combinedCredentials }));
    }
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
          token: tokenRef.current
        })
      );
      setInputMessage("");
    }
  };

  const handleUserName = (event) => {
    setUsername(event.target.value); // Only update the input field value
  };

  //Function to start the ping-pong mechanism
  // const startPingPong = (socket) => {
  //   // Start the ping-pong mechanism
  //   setInterval(() => {
  //     if (socket.readyState === WebSocket.OPEN) {
  //       // Send a ping message to the server
  //       console.log("We are sending a ping message");
  //       socket.send("ping");
  //     }
  //   }, 90);
  // };

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
              <button className="btn primary" onClick={setUsernameAndSendMessage}>
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
                      className={`user-btn ${reciverusername === user.username ? 'active' : ''}`}
                    >
                      {user.username}
                      {activeUsers.includes(user.username) && (
                        <span className="active-status" title="Online">•</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="message-section">
                <ChatBox 
                  messages={messages} 
                  myUserName={myUserName} 
                  selectedUser={reciverusername} 
                />
                <div className="message-input">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={handleInputChange}
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
