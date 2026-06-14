import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AuthPage.css";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    const result = await forgotPassword(email.trim().toLowerCase());
    setLoading(false);

    if (result.success) {
      setSent(true);
    } else {
      // Even on failure, show the success message (don't reveal if email exists)
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-bg-shapes">
          <div className="shape shape-1" />
          <div className="shape shape-2" />
          <div className="shape shape-3" />
        </div>

        <div className="auth-container animate-slide-up">
          <div className="auth-header">
            <div className="auth-logo">📧</div>
            <h1 className="auth-title">Check Your Email</h1>
            <p className="auth-subtitle">
              If <strong style={{ color: "var(--cyan)" }}>{email}</strong> is
              registered, we've sent a password reset link.
            </p>
          </div>

          <div className="verify-instructions">
            <div className="verify-step">
              <span className="step-number">1</span>
              <span>Open your email inbox</span>
            </div>
            <div className="verify-step">
              <span className="step-number">2</span>
              <span>Click the reset link</span>
            </div>
            <div className="verify-step">
              <span className="step-number">3</span>
              <span>Choose a new password</span>
            </div>
          </div>

          <div className="auth-footer" style={{ marginTop: "1.5rem" }}>
            <p
              className="text-muted"
              style={{ fontSize: "0.85rem", marginBottom: "1rem" }}
            >
              The link expires in 1 hour. Check your spam folder if you don't
              see it.
            </p>
            <Link to="/login" className="btn btn-primary btn-lg btn-block">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      <div className="auth-container animate-slide-up">
        <div className="auth-header">
          <div className="auth-logo">🔑</div>
          <h1 className="auth-title">Forgot Password</h1>
          <p className="auth-subtitle">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error-banner">{error}</div>}

          <div className="input-group">
            <label htmlFor="reset-email-field">Email Address</label>
            <input
              id="reset-email-field"
              className={`input ${error ? "input-error" : ""}`}
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18 }} />
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Remember your password?{" "}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
