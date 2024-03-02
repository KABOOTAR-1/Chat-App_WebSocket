import React, { useEffect, useState } from "react";
import ChatBox from "./ChatBox"; // Import the ChatBox component
import axios from "axios";

function App() {
  const [socket, setSocket] = useState(null);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [reciverusername, setReceiverUsername] = useState("");
  const [myUserName, setMyUserName] = useState("");
  const [users, setUsers] = useState([]); // State to store the current username
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
      // Add the received message to the list of messages
      setMessages((prevMessages) => [...prevMessages, message]);
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
    // Update the myUserName state
    fetchData();
    setMyUserName(username);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "username", UserName: myUserName }));
    }
    setUsername("");
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
    setMessages([]);
    setMyUserName(event.target.value);
    setUsername(event.target.value);
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
    <div>
      <h1>WebSocket Chat Bot</h1>
      <div>
        <input
          type="text"
          value={username}
          onChange={handleUserName}
          placeholder="Enter user name"
        />
        <button onClick={setUsernameAndSendMessage}>Set Username</button>
        <div>
          <input
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            placeholder="Enter text"
          />
          <button onClick={sendMessage}>Send Message</button>
        </div>
      </div>
      <div>
        <h1>Users</h1>
        {users.map((user) => (
          <button
            key={user._id}
            onClick={() => setReceiverUsername(() => user.username)}
          >
            {user.username}
          </button>
        ))}
      </div>
      <ChatBox messages={messages} myUserName={myUserName} />{" "}
      {/* Render the ChatBox component */}
    </div>
  );
}

export default App;
