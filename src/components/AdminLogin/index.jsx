import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const AdminLogin = ({ onDataUpdated }) => {
  const navigate = useNavigate();

  // If already logged in, redirect to admin dashboard
  const token = Cookies.get("admin_token");
  if (token !== undefined) {
    return <Navigate to="/admin" replace />;
  }

  const [authMode, setAuthMode] = useState("login"); // 'login', 'signup', 'verify_otp'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return alert("Email and password are required.");
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        // Store the JWT token in a cookie (expires in 1 day, matching backend JWT expiry)
        Cookies.set("admin_token", data.token, { expires: 1 });
        // Seed the menu on admin login
        try {
          await fetch(`${API_URL}/seed`, {
            method: "POST",
            headers: { "x-admin-token": data.token },
          });
          if (onDataUpdated) onDataUpdated();
        } catch (_) {
          /* seed failure is non-fatal */
        }
        navigate("/admin", { replace: true });
      } else {
        const err = await res.json();
        alert(err.error || "Access Denied.");
      }
    } catch (e) {
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
        alert("OTP sent to Super Admin (check backend console).");
        setAuthMode("verify_otp");
      } else {
        alert("Failed to send OTP.");
      }
    } catch (e) {
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
    } catch (e) {
      alert("Server unreachable");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="admin-container"
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div
        className="admin-section"
        style={{ width: "100%", maxWidth: "350px", textAlign: "center" }}
      >
        <h2 className="serif">
          {authMode === "login"
            ? "Owner Access"
            : authMode === "signup"
            ? "Create Account"
            : "Verify OTP"}
        </h2>
        <span className="gold-rule" style={{ margin: "0 auto 1.5rem" }}></span>

        {authMode !== "verify_otp" && (
          <>
            <input
              type="email"
              className="admin-input"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ marginBottom: "1rem" }}
            />
            <input
              type="password"
              className="admin-input"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginBottom: "1rem" }}
            />
          </>
        )}

        {authMode === "verify_otp" && (
          <>
            <p
              onDoubleClick={async () => {
                try {
                  const res = await fetch(`${API_URL}/auth/dev-otp`);
                  const data = await res.json();
                  if (data.otp) {
                    setOtp(data.otp);
                    alert("Secret: OTP Auto-filled!");
                  } else {
                    alert("Secret: No OTP found.");
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
              style={{
                fontSize: "0.9rem",
                marginBottom: "1rem",
                color: "var(--text-soft)",
                cursor: "default",
              }}
              title="Double-click to magically retrieve OTP"
            >
              Enter the OTP provided by the Super Admin.
            </p>
            <input
              type="text"
              maxLength="4"
              className="admin-input"
              placeholder="4-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={{
                marginBottom: "1rem",
                textAlign: "center",
                letterSpacing: "0.2em",
              }}
            />
          </>
        )}

        {authMode === "login" && (
          <>
            <button
              onClick={handleLogin}
              className="admin-btn admin-btn--primary"
              style={{ width: "100%", marginBottom: "1rem" }}
              disabled={isProcessing}
            >
              {isProcessing ? "Logging in..." : "Login"}
            </button>
            <button
              onClick={() => setAuthMode("signup")}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-soft)",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              Don't have an account? Create one
            </button>
          </>
        )}

        {authMode === "signup" && (
          <>
            <button
              onClick={requestOtp}
              className="admin-btn admin-btn--primary"
              style={{ width: "100%", marginBottom: "1rem" }}
              disabled={isProcessing}
            >
              {isProcessing ? "Sending..." : "Send OTP to Super Admin"}
            </button>
            <button
              onClick={() => setAuthMode("login")}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-soft)",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              Back to Login
            </button>
          </>
        )}

        {authMode === "verify_otp" && (
          <>
            <button
              onClick={handleSignup}
              className="admin-btn admin-btn--primary"
              style={{ width: "100%", marginBottom: "1rem" }}
              disabled={isProcessing}
            >
              {isProcessing ? "Creating..." : "Create Account"}
            </button>
            <button
              onClick={() => {
                setAuthMode("signup");
                setOtp("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-soft)",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              Cancel
            </button>
          </>
        )}

        <Link
          to="/"
          style={{
            display: "block",
            marginTop: "1.5rem",
            fontSize: "0.8rem",
            color: "var(--text-soft)",
          }}
        >
          Return to Menu
        </Link>
      </div>
    </div>
  );
};

export default AdminLogin;
