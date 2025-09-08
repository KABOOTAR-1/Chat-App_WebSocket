import { useState } from "react";
import axios from "axios";

export function useUsers(currentUsername) {
  const [users, setUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);

  const fetchUsers = async (shouldFetchData = true, activeUsersList = null) => {
    if (shouldFetchData) {
      try {
        const response = await axios.get("https://chat-app-websocket-g3uh.onrender.com/");
        const players = response.data.filter((u) => u.username !== currentUsername);
        setUsers(players);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    }
    if (activeUsersList) setActiveUsers(activeUsersList);
  };

  return { users, activeUsers, fetchUsers };
}
