import { useState } from "react";
import API_BASE_URL from "../api";

function Login({ setRole }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userRole", data.role);
        setRole(data.role);
      } else {
        setMessage(data.message || data.error || "Invalid credentials.");
      }
    } catch (error) {
      setMessage("Connection Error.");
    }
  };

  return (
    <>
      {/* 2. STATUS MESSAGES */}
      <p id="response-message" className="status-text">
        {message}
      </p>

      {/* 3. AUTHENTICATION SECTION */}
      <div className="auth-container">
        {/* LOGIN CARD */}
        <div id="login-card" className="card">
          <h3>Welcome Back!</h3>

          <div className="input-group">
            <input
              type="email"
              id="login-email"
              placeholder="Email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <input
              type="password"
              id="login-password"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <button id="login-btn" className="btn-primary" onClick={handleLogin}>
              Login
            </button>
          </div>
        </div>

        <div className="bg-icon-car">🚗</div>
        <div className="bg-icon-park">🅿️</div>
      </div>
    </>
  );
}

export default Login;