import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../styles/admin.css";
import { requestAdminAccessExisting } from "../services/api";
import { useAdminAuthBackground } from "../hooks/useAdminAuthBackground";

const AdminExistingAccess = () => {
  const authBgStyle = useAdminAuthBackground(["admin-login-bg"]);
  const [searchParams] = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get("email")?.trim() || "", [searchParams]);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleRequestAccess = async () => {
    setError("");
    setInfo("");

    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setError("Please enter email and password");
      return;
    }

    try {
      setRequesting(true);
      await requestAdminAccessExisting(normalizedEmail, normalizedPassword);
      setInfo("Access request submitted. Wait for super admin approval.");
    } catch (err) {
      if (err instanceof Error && err.message) {
        setError(err.message);
        return;
      }
      setError("Failed to submit access request.");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="admin-login-page" style={authBgStyle}>
      <div className="admin-container">
        <h2 className="login-title">Request Admin Access</h2>

        {error && <p className="login-error">{error}</p>}
        {info && <p className="login-info">{info}</p>}

        <input
          type="email"
          placeholder="Email"
          className="login-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="login-button" onClick={handleRequestAccess} disabled={requesting}>
          {requesting ? "Submitting..." : "Request Access"}
        </button>

        <div className="auth-links">
          <Link to="/admin-create-user" className="auth-link">New User? Register with OTP</Link>
          <Link to="/admin-login" className="auth-link">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminExistingAccess;
