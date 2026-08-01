"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <Link href="/" className="navbar-brand">
          <div className="navbar-logo">🎯</div>
          <span className="navbar-title">Tambola</span>
        </Link>

        {user && (
          <div className="navbar-right">
            <div className="navbar-stats">
              <span className="stat-item" title="Games Won">
                🏆 {user.stats?.gamesWon || 0}
              </span>
              <span className="stat-item" title="Games Played">
                🎮 {user.stats?.gamesPlayed || 0}
              </span>
            </div>
            <button
              className="btn btn-secondary btn-sm navbar-history-btn"
              onClick={() => router.push("/history")}
              title="Game History"
            >
              📜 History
            </button>
            <div className="navbar-user">
              <div className="navbar-avatar">
                {user.displayName?.charAt(0).toUpperCase()}
              </div>
              <span className="navbar-username">{user.displayName}</span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
