import { useState } from "react";
import API_BASE_URL from "../api";

function Signup({ setPage }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignup = async () => {
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "User created successfully!");
        setTimeout(() => setPage("login"), 800);
      } else {
        setMessage(data.message || data.error || "Signup failed.");
      }
    } catch (error) {
      setMessage("Could not connect to the server.");
    }
  };

  return (
    <div className="auth-container">
      {/* SIGNUP CARD */}
      <div id="signup-card" className="card">
        <h3>Create Account ✨</h3>

        <div className="input-group">
          <input
            type="text"
            id="username"
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />

          <input
            type="email"
            id="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <input
            type="password"
            id="password"
            placeholder="Password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button id="signup-btn" className="btn-primary" onClick={handleSignup}>
            Sign Up
          </button>
        </div>

        <p className="status-text">{message}</p>
      </div>

      <div className="bg-icon-car">🚗</div>
      <div className="bg-icon-park">🅿️</div>
    </div>
  );
}

export default Signup;