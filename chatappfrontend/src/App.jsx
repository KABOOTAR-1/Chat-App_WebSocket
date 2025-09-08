import React, { useState } from "react";
import "./App.css";
import LoginForm from "./components/LoginForm";
import ChatInterface from "./components/ChatInterface";
import { useChatSocket } from "./hooks/useChatSocket";
import { useUsers } from "./hooks/useUsers";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [reciverusername, setReceiverUsername] = useState("");
  const [inputMessage, setInputMessage] = useState("");

  const { users, activeUsers, fetchUsers } = useUsers(username);

  const {
    myUserName,
    messages,
    isLoadingHistory,
    handleSocketConnection,
    sendMessage,
    handleLogout,
  } = useChatSocket({
    username,
    password,
    onStatusUpdate: fetchUsers,
  });

  const handleJoin = () => {
    if (!username.trim() || !password.trim()) return;
    fetchUsers();
    handleSocketConnection();
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !reciverusername) return;
    sendMessage(reciverusername, inputMessage);
    setInputMessage("");
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
        {!myUserName ? (
          <LoginForm
            username={username}
            password={password}
            setUsername={setUsername}
            setPassword={setPassword}
            onJoin={handleJoin}
          />
        ) : (
          <ChatInterface
            users={users}
            activeUsers={activeUsers}
            reciverusername={reciverusername}
            setReceiverUsername={setReceiverUsername}
            messages={messages}
            myUserName={myUserName}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            onSend={handleSendMessage}
            isLoadingHistory={isLoadingHistory}
          />
        )}
      </div>
    </div>
  );
}

export default App;
