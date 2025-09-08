import React from "react";

function LoginForm({ username, password, setUsername, setPassword, onJoin }) {
  return (
    <div className="username-input">
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter your username"
        className="input-field"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        className="input-field"
      />
      <button className="btn primary" onClick={onJoin}>
        Join Chat
      </button>
    </div>
  );
}

export default LoginForm;
