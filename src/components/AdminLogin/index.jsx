import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Simple text button used for secondary actions
const LinkButton = ({ onClick, children }) => (
  <button className="admin-link-btn" onClick={onClick}>
    {children}
  </button>
);

const AdminLogin = ({ onDataUpdated }) => {
  const navigate = useNavigate();

  // Redirect if already logged in
  if (Cookies.get("admin_token")) {
    return <Navigate to="/admin" replace />;
  }

  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const titles = {
    login: "Owner Access",
    signup: "Create Account",
    verify_otp: "Verify OTP",
  };

  const handleLogin = async () => {
    if (!email || !password) return alert("Email and password are required.");
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        return alert(err.error || "Access Denied.");
      }
      const data = await res.json();
      Cookies.set("admin_token", data.token, { expires: 1 });
      // Seed menu (non-fatal if it fails)
      try {
        await fetch(`${API_URL}/seed`, {
          method: "POST",
          headers: { "x-admin-token": data.token },
        });
        if (onDataUpdated) onDataUpdated();
      } catch (_) {}
      navigate("/admin", { replace: true });
    } catch {
      alert("Server unreachable");
    } finally {
      setIsProcessing(false);
    }
  };

  const requestOtp = async () => {
    if (!email || !password) return alert("Email and password required.");
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        alert("OTP sent to Super Admin.");
        setAuthMode("verify_otp");
      } else {
        alert("Failed to send OTP.");
      }
    } catch {
      alert("Server unreachable");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignup = async () => {
    if (!otp) return alert("OTP required.");
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/auth/owner-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, otp }),
      });
      if (res.ok) {
        alert("Account created! You can now log in.");
        setAuthMode("login");
        setOtp("");
        setPassword("");
      } else {
        const err = await res.json();
        alert(err.error || "Signup failed.");
      }
    } catch {
      alert("Server unreachable");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="admin-container admin-container--centered">
      <div className="admin-section admin-section--narrow">
        <h2 className="serif">{titles[authMode]}</h2>
        <span className="gold-rule gold-rule--centered"></span>

        {/* Email & Password (shown for login & signup) */}
        {authMode !== "verify_otp" && (
          <>
            <input
              type="email"
              className="admin-input mb-1"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              className="admin-input mb-1"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </>
        )}

        {/* OTP input (shown for verify_otp) */}
        {authMode === "verify_otp" && (
          <>
            <p className="admin-hint">Enter the OTP provided by the Super Admin.</p>
            <input
              type="text"
              maxLength="4"
              className="admin-input mb-1 admin-input--otp"
              placeholder="4-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </>
        )}

        {/* Action buttons per mode */}
        {authMode === "login" && (
          <>
            <button className="admin-btn admin-btn--primary admin-btn--full mb-1" onClick={handleLogin} disabled={isProcessing}>
              {isProcessing ? "Logging in..." : "Login"}
            </button>
            <LinkButton onClick={() => setAuthMode("signup")}>
              Don't have an account? Create one
            </LinkButton>
          </>
        )}

        {authMode === "signup" && (
          <>
            <button className="admin-btn admin-btn--primary admin-btn--full mb-1" onClick={requestOtp} disabled={isProcessing}>
              {isProcessing ? "Sending..." : "Send OTP to Super Admin"}
            </button>
            <LinkButton onClick={() => setAuthMode("login")}>Back to Login</LinkButton>
          </>
        )}

        {authMode === "verify_otp" && (
          <>
            <button className="admin-btn admin-btn--primary admin-btn--full mb-1" onClick={handleSignup} disabled={isProcessing}>
              {isProcessing ? "Creating..." : "Create Account"}
            </button>
            <LinkButton onClick={() => { setAuthMode("signup"); setOtp(""); }}>
              Cancel
            </LinkButton>
          </>
        )}

        <Link to="/" className="admin-back-link">Return to Menu</Link>
      </div>
    </div>
  );
};

export default AdminLogin;
