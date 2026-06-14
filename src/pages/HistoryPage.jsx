import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import Navbar from "../components/Navbar";
import "./HistoryPage.css";

const STATUS_LABELS = {
  waiting: "Waiting",
  in_progress: "In Progress",
  paused: "Paused",
  completed: "Completed",
};

const STATUS_BADGE_CLASS = {
  waiting: "badge-cyan",
  in_progress: "badge-emerald",
  paused: "badge-gold",
  completed: "badge-rose",
};

const STATUS_ICONS = {
  waiting: "⏳",
  in_progress: "🎯",
  paused: "⏸️",
  completed: "🏁",
};

const PATTERN_LABELS = {
  earlyFive: "Early 5",
  topLine: "Top Line",
  middleLine: "Mid Line",
  bottomLine: "Bottom Line",
  fullHouse: "Full House",
};

const TABS = [
  { key: "all", label: "All Games", icon: "📋" },
  { key: "active", label: "Active", icon: "🎯" },
  { key: "completed", label: "Completed", icon: "🏁" },
];

export default function HistoryPage() {
  const navigate = useNavigate();
  const { showToast } = useAuth();
  const { get } = useApi();

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchHistory = useCallback(
    async (page = 1) => {
      setLoading(true);

      let url = `/api/games/history?limit=12&page=${page}`;
      if (activeTab === "active") {
        // Fetch both waiting and in_progress — we'll do two calls or handle server-side
        // For simplicity, we fetch without filter and filter client-side, or make two requests
        // Actually, let's use the status filter. We'll fetch waiting first, then in_progress.
        // Better approach: backend supports only one status, so let's handle "active" tab differently.
        url = `/api/games/history?limit=12&page=${page}`;
      } else if (activeTab === "completed") {
        url += "&status=completed";
      }

      const { ok, data } = await get(url);
      if (ok && data?.data) {
        let fetchedGames = data.data.games || [];

        // Client-side filter for "active" tab (waiting + in_progress + paused)
        if (activeTab === "active") {
          fetchedGames = fetchedGames.filter(
            (g) => g.status !== "completed"
          );
        }

        setGames(fetchedGames);
        setPagination(data.data.pagination || { page: 1, pages: 1, total: 0 });
      }
      setLoading(false);
    },
    [get, activeTab]
  );

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="container">
          {/* Header */}
          <div className="history-header animate-fade-in">
            <div className="history-header-top">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate("/")}
              >
                ← Lobby
              </button>
              <div>
                <h1>
                  <span className="text-gold">Game</span> History
                </h1>
                <p className="text-muted">
                  {pagination.total} game{pagination.total !== 1 ? "s" : ""} played
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="history-tabs animate-slide-up">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`history-tab ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span className="tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Games list */}
          <div className="history-games animate-slide-up" style={{ animationDelay: "0.15s" }}>
            {loading ? (
              <div className="loader">
                <div className="spinner" />
                <span>Loading history...</span>
              </div>
            ) : games.length > 0 ? (
              <>
                <div className="history-grid">
                  {games.map((game) => (
                    <div
                      key={game.id || game.code}
                      className="history-card glass-card"
                      onClick={() => navigate(`/game/${game.code}`)}
                    >
                      {/* Card header */}
                      <div className="history-card-header">
                        <div className="history-card-code-row">
                          <span className="history-card-code">{game.code}</span>
                          <span
                            className={`badge ${STATUS_BADGE_CLASS[game.status] || "badge-cyan"}`}
                          >
                            {STATUS_ICONS[game.status]} {STATUS_LABELS[game.status] || game.status}
                          </span>
                        </div>
                        <div className="history-card-meta">
                          <span className="text-muted">{formatDate(game.createdAt)}</span>
                          {game.isHost && (
                            <span className="badge badge-gold host-badge">👑 Host</span>
                          )}
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="history-card-body">
                        <div className="history-stats-row">
                          <div className="history-stat">
                            <span className="stat-icon">👥</span>
                            <span>{game.playerCount} player{game.playerCount !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="history-stat">
                            <span className="stat-icon">🎫</span>
                            <span>{game.ticketsPerPlayer || 1} ticket{(game.ticketsPerPlayer || 1) > 1 ? "s" : ""}/player</span>
                          </div>
                          <div className="history-stat">
                            <span className="stat-icon">🏆</span>
                            <span>{game.availablePatterns?.length || 5} patterns</span>
                          </div>
                        </div>

                        {/* Host info */}
                        <div className="history-host-row">
                          <span className="text-muted">Hosted by </span>
                          <span className="text-cyan">
                            {game.host?.displayName || game.host?.username || "Unknown"}
                          </span>
                        </div>
                      </div>

                      {/* Winners section (only for completed games) */}
                      {game.status === "completed" && (
                        <div className="history-card-winners">
                          <div className="winners-label">Winners</div>
                          <div className="winners-list">
                            {(game.availablePatterns || [
                              "earlyFive",
                              "topLine",
                              "middleLine",
                              "bottomLine",
                              "fullHouse",
                            ]).map((pattern) => {
                              const winner = game.winners?.[pattern];
                              return (
                                <div key={pattern} className="winner-chip">
                                  <span className="winner-pattern">
                                    {PATTERN_LABELS[pattern] || pattern}
                                  </span>
                                  <span
                                    className={`winner-name-chip ${
                                      winner ? "text-gold" : "text-muted"
                                    }`}
                                  >
                                    {winner || "Unclaimed"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Card footer */}
                      <div className="history-card-footer">
                        <span className="view-link">
                          {game.status === "completed" ? "View Results →" : "Open Game →"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="history-pagination">
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={pagination.page <= 1}
                      onClick={() => fetchHistory(pagination.page - 1)}
                    >
                      ← Previous
                    </button>
                    <span className="text-muted">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => fetchHistory(pagination.page + 1)}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state glass-card">
                <div className="icon">🎲</div>
                <h3>No games found</h3>
                <p>
                  {activeTab === "all"
                    ? "You haven't joined any games yet. Head to the lobby to get started!"
                    : activeTab === "active"
                    ? "No active games right now."
                    : "No completed games yet."}
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/")}
                  style={{ marginTop: "var(--space-md)" }}
                >
                  Go to Lobby
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
