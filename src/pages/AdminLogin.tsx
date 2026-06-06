import React, { useState } from "react";
import "../styles/Login.css";
import { useNavigate } from "react-router-dom";

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await window.electronAPI.loginUser({
        username,
        password,
        role: "admin",
      });

      if (res.success) {
        localStorage.setItem("role", "admin");
        alert("✅ Login successful!");
        navigate("/admin/dashboard");
      } else {
        alert(res.message || "❌ Invalid username or password");
      }
    } catch (err) {
      console.error("⚠️ Login error:", err);
      alert("⚠️ Something went wrong while logging in.");
    }
  };

  return (
    <div className="login-wrapper"> {/* Default theme (Blue) applied */}
      {/* 🧭 Left Side - Form Section */}
      <div className="login-left">
        <div className="login-content">
          <h1 className="login-title">Admin Login</h1>
          <p className="login-subtitle">Sign in to access your dashboard</p>

          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Primary Blue Button */}
          <button className="submit-btn" onClick={handleLogin}>
            Login
          </button>
        </div>
      </div>

      {/* 🖼️ Right Side - Image Section */}
      <div className="login-right">
        <img
          src="/assets/admin-login-banner.png"
          alt="Business professional with dashboard"
          className="login-side-image"
        />
      </div>
    </div>
  );
};

export default AdminLogin;