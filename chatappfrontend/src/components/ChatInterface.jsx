import React from "react";
import UserList from "./UserList";
import ChatBox from "./ChatBox";
import MessageInput from "./MessageInput";

function ChatInterface({
  users,
  activeUsers,
  reciverusername,
  setReceiverUsername,
  messages,
  myUserName,
  inputMessage,
  setInputMessage,
  onSend,
  isLoadingHistory,
}) {
  return (
    <div className="chat-interface">
      <UserList
        users={users}
        activeUsers={activeUsers}
        reciverusername={reciverusername}
        setReceiverUsername={setReceiverUsername}
      />

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
        <MessageInput
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          onSend={onSend}
        />
      </div>
    </div>
  );
}

export default ChatInterface;
