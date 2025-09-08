import React, { useRef, useEffect } from "react";
import "./ChatBox.css";

const ChatBox = ({ messages, myUserName, selectedUser }) => {
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedUser]);

  // Format timestamp to a readable time
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    // Format: Today at HH:MM or MM/DD/YYYY at HH:MM
    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  // Filter and sort messages for the selected user conversation
  const filteredMessages = messages
    .filter(
      (msg) =>
        (msg.UserName === selectedUser && msg.receiver === myUserName) ||
        (msg.UserName === myUserName && msg.receiver === selectedUser)
    )
    .sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));

  return (
    <div className="chat-messages">
      {selectedUser ? (
        filteredMessages.length > 0 ? (
          filteredMessages.map((msg, index) => (
            <div
              key={index}
              className={`message-container ${
                msg.UserName === myUserName ? "sent" : "received"
              }`}
            >
              <div
                className={`message-username ${
                  msg.UserName === myUserName ? "sender" : ""
                }`}
              >
                {msg.UserName}
              </div>
              <div className="message-bubble">{msg.message}</div>
              <div className="message-timestamp">{formatTime(msg.timestamp)}</div>
            </div>
          ))
        ) : (
          <div className="no-messages">No messages yet</div>
        )
      ) : (
        <div className="no-chat-selected">Select a user to start chatting</div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatBox;
