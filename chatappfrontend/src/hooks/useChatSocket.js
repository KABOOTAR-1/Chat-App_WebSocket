import { useState, useRef, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export function useChatSocket({ username, password, onStatusUpdate }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [myUserName, setMyUserName] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const tokenRef = useRef(null);

  const handleSocketConnection = () => {
    const newSocket = new WebSocket("wss://chat-app-websocket-g3uh.onrender.com/");

    newSocket.onopen = () => {
      const combinedCredentials = `${username}:${password}`;
      newSocket.send(JSON.stringify({ type: "username", UserName: combinedCredentials }));
    };

    newSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "auth") {
        const { username } = jwtDecode(message.token);
        tokenRef.current = message.token;
        setMyUserName(username);
        setIsLoadingHistory(true);
      } else if (message.type === "error") {
        handleLogout();
      } else if (message.type === "status_update") {
        onStatusUpdate?.(message.isNewUSer, message.activeUsers);
      } else if (message.type === "history_message") {
        setMessages((prev) => {
          const exists = prev.some(
            (msg) =>
              msg.message === message.message &&
              msg.UserName === message.UserName &&
              msg.receiver === message.receiver &&
              msg.messageType === "history"
          );
          return exists
            ? prev
            : [...prev, { ...message, messageType: "history", timestamp: message.timestamp || new Date().toISOString() }];
        });
      } else if (message.type === "history_complete") {
        setIsLoadingHistory(false);
      } else if (message.type === "message") {
        setMessages((prev) => {
          const exists = prev.some(
            (msg) =>
              msg.message === message.message &&
              msg.UserName === message.UserName &&
              msg.receiver === message.receiver &&
              msg.messageType === "live"
          );
          return exists
            ? prev
            : [...prev, { ...message, messageType: "live", timestamp: message.timestamp || new Date().toISOString() }];
        });
      }
    };

    // Ping every 30s
    const pingInterval = setInterval(() => {
      if (newSocket.readyState === WebSocket.OPEN) {
        newSocket.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    newSocket.pingInterval = pingInterval;
    setSocket(newSocket);
  };

  const sendMessage = (receiver, message) => {
    if (!receiver || !tokenRef.current) return;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "message",
          UserName: myUserName,
          receiver,
          message,
          token: tokenRef.current,
        })
      );
    }
  };

  const handleLogout = () => {
    tokenRef.current = null;
    setMyUserName("");
    setMessages([]);
    if (socket?.pingInterval) clearInterval(socket.pingInterval);
    socket?.close();
    setSocket(null);
  };

  useEffect(() => {
    return () => {
      handleLogout();
    };
  }, []);

  return {
    myUserName,
    messages,
    isLoadingHistory,
    handleSocketConnection,
    sendMessage,
    handleLogout,
    setMessages, // if needed
  };
}
