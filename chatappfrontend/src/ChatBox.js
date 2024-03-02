import React from "react";

const ChatBox = ({ messages, myUserName }) => {
  return (
    <div style={{ height: "80vh" }}>
      <br />
      {messages.map((msg, index) => (
        <div
          key={index}
          style={{
            textAlign: msg.UserName === myUserName ? "left" : "right",
            marginBottom: "13px",
          }}
        >
          <span
            style={{
              padding: "5px",
              borderRadius: "5px",
              backgroundColor:
                msg.UserName === myUserName ? "#f0f0f0" : "#007bff",
              color: msg.UserName === myUserName ? "#000" : "#fff",
            }}
          >
            {msg.message}
          </span>
          {/* Line break added within each message wrapper */}
        </div>
      ))}
    </div>
  );
};

export default ChatBox;
