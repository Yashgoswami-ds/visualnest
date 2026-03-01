import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/admin.css";
import { sendResetLink, sendResetOtp } from "../services/api";
import { useAdminAuthBackground } from "../hooks/useAdminAuthBackground";

const AdminForgotPassword = () => {
  const authBgStyle = useAdminAuthBackground(["admin-login-bg"]);
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<"link" | "otp">("link");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  const handleForgot = async () => {
    setError("");
    setInfo("");

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Please enter your email to reset password");
      return;
    }

    try {
      setSending(true);
      if (method === "link") {
        await sendResetLink(normalizedEmail);
        setInfo("Reset link sent! Check your email.");
      } else {
        await sendResetOtp(normalizedEmail);
        setInfo("Reset OTP sent! Check your email.");
        setTimeout(() => {
          navigate(`/reset-password?mode=otp&email=${encodeURIComponent(normalizedEmail)}`);
        }, 700);
      }
    } catch {
      setError(method === "link" ? "Failed to send reset link. Try again." : "Failed to send reset OTP. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-login-page" style={authBgStyle}>
      <div className="admin-container">
        <h2 className="login-title">Forgot Password</h2>

        {error && <p className="login-error">{error}</p>}
        {info && <p className="login-info">{info}</p>}

        <div className="auth-method-toggle" role="radiogroup" aria-label="Reset method">
          <label className="auth-method-item">
            <input
              type="radio"
              name="reset-method"
              value="link"
              checked={method === "link"}
              onChange={() => setMethod("link")}
            />
            <span>Reset by Link</span>
          </label>
          <label className="auth-method-item">
            <input
              type="radio"
              name="reset-method"
              value="otp"
              checked={method === "otp"}
              onChange={() => setMethod("otp")}
            />
            <span>Reset by OTP</span>
          </label>
        </div>

        <input
          type="email"
          placeholder="Admin Email"
          className="login-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button className="login-button" onClick={handleForgot} disabled={sending}>
          {sending ? "Sending..." : method === "link" ? "Send Reset Link" : "Send Reset OTP"}
        </button>

        <div className="auth-links">
          <Link to="/admin-login" className="auth-link">Back to Login</Link>
          <Link to="/admin-create-user" className="auth-link">Create User</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminForgotPassword;
