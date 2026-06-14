import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "./VerifyEmailPage.css";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found. Please check the link in your email.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (data.success) {
          setStatus("success");
          setMessage(data.message || "Your email has been verified!");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed. The link may have expired.");
        }
      } catch {
        setStatus("error");
        setMessage("Network error. Please try again.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="verify-page">
      <div className="verify-bg-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      <div className="verify-container animate-slide-up">
        {status === "verifying" && (
          <div className="verify-state">
            <div className="verify-spinner-wrapper">
              <div className="spinner" style={{ width: 48, height: 48 }} />
            </div>
            <h2>Verifying your email...</h2>
            <p className="text-muted">Please wait a moment.</p>
          </div>
        )}

        {status === "success" && (
          <div className="verify-state verify-success">
            <div className="verify-icon">✅</div>
            <h2>Email Verified!</h2>
            <p className="text-muted">{message}</p>
            <Link to="/login" className="btn btn-primary btn-lg">
              Sign In →
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="verify-state verify-error">
            <div className="verify-icon">❌</div>
            <h2>Verification Failed</h2>
            <p className="text-muted">{message}</p>
            <div className="verify-actions">
              <Link to="/login" className="btn btn-outline btn-lg">
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
