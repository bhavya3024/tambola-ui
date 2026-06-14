import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AuthPage.css";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword, showToast } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      showToast("Invalid reset link — no token found.", "error");
      navigate("/login");
    }
  }, [token, showToast, navigate]);

  const validate = () => {
    const errs = {};

    if (!password) {
      errs.password = "Password is required";
    } else if (password.length < 6) {
      errs.password = "Minimum 6 characters";
    }

    if (!confirmPassword) {
      errs.confirm = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errs.confirm = "Passwords do not match";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const result = await resetPassword(token, password);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
    } else {
      setErrors({ general: result.message });
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-bg-shapes">
          <div className="shape shape-1" />
          <div className="shape shape-2" />
          <div className="shape shape-3" />
        </div>

        <div className="auth-container animate-slide-up">
          <div className="auth-header">
            <div className="auth-logo">✅</div>
            <h1 className="auth-title">Password Reset!</h1>
            <p className="auth-subtitle">
              Your password has been successfully changed.
            </p>
          </div>

          <Link
            to="/login"
            className="btn btn-primary btn-lg btn-block"
            style={{ marginTop: "var(--space-lg)" }}
          >
            Sign In with New Password
          </Link>
        </div>
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="auth-page">
      <div className="auth-bg-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      <div className="auth-container animate-slide-up">
        <div className="auth-header">
          <div className="auth-logo">🔒</div>
          <h1 className="auth-title">New Password</h1>
          <p className="auth-subtitle">Choose a strong password for your account.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="auth-error-banner">{errors.general}</div>
          )}

          <div className="input-group">
            <label htmlFor="new-password-field">New Password</label>
            <input
              id="new-password-field"
              className={`input ${errors.password ? "input-error" : ""}`}
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors({ ...errors, password: "", general: "" });
              }}
              autoFocus
            />
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="confirm-password-field">Confirm Password</label>
            <input
              id="confirm-password-field"
              className={`input ${errors.confirm ? "input-error" : ""}`}
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors({ ...errors, confirm: "", general: "" });
              }}
            />
            {errors.confirm && (
              <span className="error-text">{errors.confirm}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18 }} />
                Resetting...
              </>
            ) : (
              "Reset Password"
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
