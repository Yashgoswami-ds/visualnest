import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../styles/admin.css";
import { resetPassword, resetPasswordWithOtp } from "../services/api";
import { useAdminAuthBackground } from "../hooks/useAdminAuthBackground";

const ResetPassword = () => {
  const authBgStyle = useAdminAuthBackground(["admin-login-bg"]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token"); // token from email link
  const mode = searchParams.get("mode") || "link";
  const emailFromQuery = searchParams.get("email") || "";

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Fill all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      if (mode === "otp") {
        const normalizedEmail = (email || emailFromQuery).trim();
        const normalizedOtp = otp.trim();
        if (!normalizedEmail) {
          setError("Email is required for OTP reset");
          return;
        }
        if (!/^\d{6}$/.test(normalizedOtp)) {
          setError("Please enter a valid 6-digit OTP");
          return;
        }
        await resetPasswordWithOtp(normalizedEmail, normalizedOtp, newPassword);
      } else {
        await resetPassword(token || "", newPassword);
      }
      setInfo("Password reset successful! Redirecting to login...");
      setError("");
      setTimeout(() => navigate("/admin-login"), 2000);
    } catch (err) {
      setError("Failed to reset password");
      setInfo("");
    }
  };

  return (
    <div className="admin-login-page" style={authBgStyle}>
      <div className="admin-container">
        <h2 className="login-title">Reset Password</h2>
        {error && <p className="login-error">{error}</p>}
        {info && <p className="login-info">{info}</p>}

        {mode === "otp" && (
          <>
            <input
              type="email"
              placeholder="Email"
              className="login-input"
              value={email || emailFromQuery}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="text"
              placeholder="6-digit OTP"
              className="login-input"
              value={otp}
              maxLength={6}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            />
          </>
        )}

        <input
          type="password"
          placeholder="New Password"
          className="login-input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className="login-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button className="login-button" onClick={handleReset}>
          Reset Password
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;
