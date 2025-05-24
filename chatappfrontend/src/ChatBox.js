import React from "react";
import "./ChatBox.css";

const ChatBox = ({ messages, myUserName, selectedUser }) => {
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
            </div>
          ))
        ) : (
          <div className="no-messages">No messages yet</div>
        )
      ) : (
        <div className="no-chat-selected">Select a user to start chatting</div>
      )}
    </div>
  );
};

export default ChatBox;
