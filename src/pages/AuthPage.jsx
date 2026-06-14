import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AuthPage.css";

export default function AuthPage({ mode = "login" }) {
  const navigate = useNavigate();
  const { login, register, resendVerification, showToast } = useAuth();

  const [form, setForm] = useState({
    login: "",
    username: "",
    email: "",
    password: "",
    displayName: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Reset success state if user navigates back to login mode
  useEffect(() => {
    if (mode === "login") {
      setRegistrationSuccess(false);
      setErrors({});
    }
  }, [mode]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const errs = {};

    if (mode === "login") {
      if (!form.login.trim()) errs.login = "Username or email is required";
      if (!form.password) errs.password = "Password is required";
    } else {
      if (!form.username.trim()) errs.username = "Username is required";
      else if (form.username.length < 3) errs.username = "Min 3 characters";
      else if (!/^[a-zA-Z0-9_]+$/.test(form.username))
        errs.username = "Only letters, numbers, underscores";

      if (!form.email.trim()) errs.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email";

      if (!form.password) errs.password = "Password is required";
      else if (form.password.length < 6) errs.password = "Min 6 characters";

      if (!form.displayName.trim()) errs.displayName = "Display name is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setShowResend(false);

    let result;
    if (mode === "login") {
      result = await login(form.login, form.password);
    } else {
      result = await register(
        form.username,
        form.email,
        form.password,
        form.displayName
      );
    }

    setLoading(false);

    if (result.success) {
      if (mode === "login") {
        navigate("/");
      } else {
        // Registration success — show verification message
        setRegistrationSuccess(true);
        setRegisteredEmail(form.email);
      }
    } else {
      // Check if error is about email verification
      const msg = result.message?.toLowerCase() || "";
      if (msg.includes("verify your email")) {
        setShowResend(true);
      }
      setErrors({ general: result.message });
    }
  };

  const handleResend = async () => {
    const email = mode === "login" ? form.login : form.email;
    if (!email) {
      showToast("Please enter your email first.", "error");
      return;
    }

    setResendLoading(true);
    const result = await resendVerification(email);
    setResendLoading(false);
    showToast(result.message || "Verification email sent!", "success");
  };

  // ─── Registration success view ──────────────────────────────
  if (registrationSuccess) {
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
              We've sent a verification link to
            </p>
            <p className="auth-email-highlight">{registeredEmail}</p>
          </div>

          <div className="verify-instructions">
            <div className="verify-step">
              <span className="step-number">1</span>
              <span>Open your email inbox</span>
            </div>
            <div className="verify-step">
              <span className="step-number">2</span>
              <span>Click the verification link</span>
            </div>
            <div className="verify-step">
              <span className="step-number">3</span>
              <span>Come back and sign in!</span>
            </div>
          </div>

          <div className="auth-footer" style={{ marginTop: "1.5rem" }}>
            <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
              Didn't receive the email? Check your spam folder or{" "}
              <button
                className="link-btn"
                onClick={handleResend}
                disabled={resendLoading}
              >
                {resendLoading ? "sending..." : "resend it"}
              </button>
            </p>
            <Link to="/login" className="btn btn-primary btn-lg btn-block">
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Login / Register form ──────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-bg-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      <div className="auth-container animate-slide-up">
        <div className="auth-header">
          <div className="auth-logo">🎯</div>
          <h1 className="auth-title">Tambola</h1>
          <p className="auth-subtitle">
            {mode === "login"
              ? "Welcome back! Sign in to play."
              : "Create an account to start playing."}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="auth-error-banner">
              {errors.general}
              {showResend && (
                <button
                  type="button"
                  className="resend-btn"
                  onClick={handleResend}
                  disabled={resendLoading}
                >
                  {resendLoading ? "Sending..." : "Resend Verification Email"}
                </button>
              )}
            </div>
          )}

          {mode === "login" ? (
            <>
              <div className="input-group">
                <label htmlFor="login-field">Username or Email</label>
                <input
                  id="login-field"
                  className={`input ${errors.login ? "input-error" : ""}`}
                  type="text"
                  name="login"
                  placeholder="Enter username or email"
                  value={form.login}
                  onChange={handleChange}
                  autoFocus
                />
                {errors.login && <span className="error-text">{errors.login}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="password-field">Password</label>
                <input
                  id="password-field"
                  className={`input ${errors.password ? "input-error" : ""}`}
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={handleChange}
                />
                {errors.password && (
                  <span className="error-text">{errors.password}</span>
                )}
                <div className="forgot-password-row">
                  <Link to="/forgot-password" className="forgot-password-link">
                    Forgot password?
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="input-group">
                <label htmlFor="display-name-field">Display Name</label>
                <input
                  id="display-name-field"
                  className={`input ${errors.displayName ? "input-error" : ""}`}
                  type="text"
                  name="displayName"
                  placeholder="How others will see you"
                  value={form.displayName}
                  onChange={handleChange}
                  autoFocus
                />
                {errors.displayName && (
                  <span className="error-text">{errors.displayName}</span>
                )}
              </div>

              <div className="input-group">
                <label htmlFor="username-field">Username</label>
                <input
                  id="username-field"
                  className={`input ${errors.username ? "input-error" : ""}`}
                  type="text"
                  name="username"
                  placeholder="Choose a unique username"
                  value={form.username}
                  onChange={handleChange}
                />
                {errors.username && (
                  <span className="error-text">{errors.username}</span>
                )}
              </div>

              <div className="input-group">
                <label htmlFor="email-field">Email</label>
                <input
                  id="email-field"
                  className={`input ${errors.email ? "input-error" : ""}`}
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <span className="error-text">{errors.email}</span>
                )}
              </div>

              <div className="input-group">
                <label htmlFor="register-password-field">Password</label>
                <input
                  id="register-password-field"
                  className={`input ${errors.password ? "input-error" : ""}`}
                  type="password"
                  name="password"
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={handleChange}
                />
                {errors.password && (
                  <span className="error-text">{errors.password}</span>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18 }} />
                {mode === "login" ? "Signing in..." : "Creating account..."}
              </>
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="auth-footer">
          {mode === "login" ? (
            <p>
              Don't have an account?{" "}
              <Link to="/register">Create one</Link>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <Link to="/login">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
