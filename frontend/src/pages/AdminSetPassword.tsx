import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "../styles/admin.css";
import { setRegistrationPassword } from "../services/api";

const AdminSetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get("email")?.trim() || "", [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleSubmit = async () => {
    setError("");
    setInfo("");

    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();
    const normalizedConfirmPassword = confirmPassword.trim();

    if (!normalizedEmail || !normalizedPassword || !normalizedConfirmPassword) {
      setError("Please complete all fields.");
      return;
    }

    if (normalizedPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (normalizedPassword !== normalizedConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSaving(true);
      await setRegistrationPassword(normalizedEmail, normalizedPassword);
      setInfo("Password set successfully. Continue to access request.");
      navigate(`/admin-existing-access?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (err) {
      if (err instanceof Error && err.message) {
        setError(err.message);
        return;
      }
      setError("Failed to set password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-container">
        <h2 className="login-title">Set Password</h2>

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

        <input
          type="password"
          placeholder="Confirm Password"
          className="login-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button className="login-button" onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : "Save Password"}
        </button>

        <div className="auth-links">
          <Link to="/admin-create-user" className="auth-link">Back to OTP Verification</Link>
          <Link to="/admin-existing-access" className="auth-link">Existing User Access Request</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminSetPassword;
