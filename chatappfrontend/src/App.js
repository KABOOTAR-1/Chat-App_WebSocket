import React, { useEffect, useState } from "react";
import ChatBox from "./ChatBox"; // Import the ChatBox component
import axios from "axios";
import "./App.css"; // Import the CSS file for styling

function App() {
  const [socket, setSocket] = useState(null);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [reciverusername, setReceiverUsername] = useState("");
  const [myUserName, setMyUserName] = useState("");
  const [users, setUsers] = useState([]); // State to store the current username
  const [activeUsers, setActiveUsers] = useState([]); // State to store active users
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
    // Connect to WebSocket server
    const newSocket = new WebSocket("ws://localhost:4000");

    // Event listeners
    newSocket.onopen = () => {
      console.log("Connected to server");

      // Start the ping-pong mechanism after the connection is established
      // startPingPong(newSocket);
    };

    newSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("Received message:", message);
      
      // Handle different message types
      if (message.type === "status_update") {
        // Update the active users list
        setActiveUsers(message.activeUsers);
        console.log("Active users updated:", message.activeUsers);
      } else {
        // Add regular messages to the list of messages
        setMessages((prevMessages) => [...prevMessages, message]);
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

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const handleInputChange = (event) => {
    setInputMessage(event.target.value);
  };

  const setUsernameAndSendMessage = () => {
    if (!username.trim()) return; // Don't set empty usernames
    
    fetchData();
    setMyUserName(username); // Set the myUserName only when button is clicked
    
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "username", UserName: username }));
    }
    // Don't clear the username here since we need it for display
  };

  const sendMessage = () => {
    if (reciverusername === "") return;

    const myMessage = inputMessage;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "message",
          UserName: myUserName,
          receiver: reciverusername,
          message: myMessage,
        })
      );
      setInputMessage("");
    }
  };

  const handleUserName = (event) => {
    setUsername(event.target.value); // Only update the input field value
  };

  // Function to start the ping-pong mechanism
  // const startPingPong = (socket) => {
  //   // Start the ping-pong mechanism
  //   setInterval(() => {
  //     if (socket.readyState === WebSocket.OPEN) {
  //       // Send a ping message to the server
  //       console.log("We are sending a ping message");
  //       socket.send("ping");
  //     }
  //   }, 10000);
  // };

  return (
    <div className="chat-app">
      <div className="header">
        <h1>WebSocket Chat</h1>
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
                <ChatBox messages={messages} myUserName={myUserName} />
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
