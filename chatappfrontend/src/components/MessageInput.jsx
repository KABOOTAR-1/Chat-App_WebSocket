import React from "react";

function MessageInput({ inputMessage, setInputMessage, onSend }) {
  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div className="message-input">
      <input
        type="text"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type your message..."
        className="input-field"
      />
      <button className="btn send" onClick={onSend}>
        Send
      </button>
    </div>
  );
}

export default MessageInput;
