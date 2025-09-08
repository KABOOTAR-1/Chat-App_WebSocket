import React from "react";

function UserList({ users, activeUsers, reciverusername, setReceiverUsername }) {
  return (
    <div className="users-list">
      <h2>Active Users</h2>
      <div className="users-grid">
        {users.map((user) => (
          <button
            key={user._id}
            onClick={() => setReceiverUsername(user.username)}
            className={`user-btn ${reciverusername === user.username ? "active" : ""}`}
          >
            {user.username}
            {activeUsers.includes(user.username) && (
              <span className="active-status" title="Online">•</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default UserList;
