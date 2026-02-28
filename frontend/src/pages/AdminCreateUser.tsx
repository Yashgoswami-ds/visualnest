import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/admin.css";
import { sendRegistrationOtp, verifyRegistrationOtp } from "../services/api";

const AdminCreateUser = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const validateBasicInputs = () => {
    const normalizedEmail = email.trim();
    const normalizedName = name.trim();

    if (!normalizedName || !normalizedEmail) {
      setError("Please enter name and email");
      return null;
    }

    return {
      normalizedName,
      normalizedEmail,
    };
  };

  const handleSendOtp = async () => {
    setError("");
    setInfo("");

    const data = validateBasicInputs();
    if (!data) {
      return;
    }

    try {
      setRequesting(true);
      await sendRegistrationOtp(data.normalizedName, data.normalizedEmail);
      setOtpSent(true);
      setInfo("OTP sent to your email.");
    } catch (err) {
      if (err instanceof Error && err.message) {
        if (/already exists in database/i.test(err.message)) {
          setInfo("This email is already registered. Continue from Existing User Access Request.");
          navigate(`/admin-existing-access?email=${encodeURIComponent(data.normalizedEmail)}`);
          return;
        }

        if (/failed to send otp email|mail configuration|email service is not configured/i.test(err.message)) {
          setError("Unable to send OTP email. Please verify backend mail configuration and restart backend.");
          return;
        }

        setError(err.message);
        return;
      }
      setError("Unable to send OTP. Please check backend and mail configuration.");
    } finally {
      setRequesting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setInfo("");

    const normalizedEmail = email.trim();
    const normalizedOtp = otp.trim();

    if (!normalizedEmail || !normalizedOtp) {
      setError("Please enter email and OTP");
      return;
    }

    try {
      setRequesting(true);
      await verifyRegistrationOtp(normalizedEmail, normalizedOtp);
      setInfo("OTP verified successfully.");
      navigate(`/admin-set-password?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (err) {
      if (err instanceof Error && err.message) {
        setError(err.message);
        return;
      }
      setError("Failed to verify OTP.");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-container">
        <h2 className="login-title">New User Registration</h2>

        {error && <p className="login-error">{error}</p>}
        {info && <p className="login-info">{info}</p>}

        <input
          type="text"
          placeholder="Your Name"
          className="login-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          className="login-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {otpSent && (
          <input
            type="text"
            placeholder="OTP"
            className="login-input"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
        )}

        <button className="login-button" onClick={handleSendOtp} disabled={requesting}>
          {requesting ? "Please wait..." : otpSent ? "Resend OTP" : "Send OTP"}
        </button>

        {otpSent && (
          <button className="login-button" onClick={handleVerifyOtp} disabled={requesting}>
            {requesting ? "Verifying..." : "Verify OTP"}
          </button>
        )}

        <div className="auth-links">
          <Link to="/admin-existing-access" className="auth-link">Existing User Access Request</Link>
          <Link to="/admin-login" className="auth-link">Back to Login</Link>
          <Link to="/admin-forgot-password" className="auth-link">Forgot Password?</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminCreateUser;
