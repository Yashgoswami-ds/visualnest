import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/admin.css";
import { fetchImagesByCategory, loginAdmin, normalizeMediaUrl } from "../services/api";
import type { Image } from "../types/Image";

const AdminLogin = () => {
  const LOGIN_BG_CATEGORY = "admin-login-bg";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginBgUrl, setLoginBgUrl] = useState<string>("/uploads/aglogin.jpg");
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const loadLoginBackground = async () => {
      try {
        const media = await fetchImagesByCategory(LOGIN_BG_CATEGORY);
        const imagesOnly = media.filter((item: Image) => (item.mediaKind || "image") === "image");

        if (!imagesOnly.length || !mounted) {
          return;
        }

        const latest = [...imagesOnly].sort((a, b) => {
          const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return bTime - aTime;
        })[0];

        if (!latest?.url) {
          return;
        }

        setLoginBgUrl(normalizeMediaUrl(latest.url));
      } catch {
      }
    };

    loadLoginBackground();

    return () => {
      mounted = false;
    };
  }, []);

  const loginBgStyle = useMemo(() => {
    const separator = loginBgUrl.includes("?") ? "&" : "?";
    return {
      backgroundImage: `url(${loginBgUrl}${separator}v=${Date.now()})`,
    };
  }, [loginBgUrl]);
  
// AdminLogin.tsx

const handleLogin = async () => {
  setError("");
  setInfo("");
  try {
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setError("Please enter email and password");
      return;
    }

    // 🧹 clear old mock flag (IMPORTANT)
    localStorage.removeItem("adminAuth");

    // 🔐 real login
    setLoggingIn(true);
    await loginAdmin(normalizedEmail, normalizedPassword);
    setInfo("Login successful");
    setError("");
    navigate("/admin");
  } catch (err) {
    if (err instanceof Error && err.message) {
      setError(err.message);
      return;
    }
    setError("Login failed. Check your credentials.");
  } finally {
    setLoggingIn(false);
  }
};

  return (
    <div className="admin-login-page" style={loginBgStyle}>
      <div className="admin-container">
        <h2 className="login-title">Admin Login</h2>

        {error && <p className="login-error">{error}</p>}
        {info && <p className="login-info">{info}</p>}

        <input
          type="email"
          placeholder="Admin Email"
          className="login-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Admin Password"
          className="login-input"
        
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="login-button" onClick={handleLogin} disabled={loggingIn}>
          {loggingIn ? "Logging in..." : "Login"}
        </button>

        <div className="auth-links">
          <Link to="/admin-existing-access" className="auth-link">Existing User Request Access</Link>
          <Link to="/admin-create-user" className="auth-link">Request Access</Link>
          <Link to="/admin-forgot-password" className="auth-link">Forgot Password?</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
