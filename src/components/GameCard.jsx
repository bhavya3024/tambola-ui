import { useNavigate } from "react-router-dom";
import "./GameCard.css";

const PATTERN_LABELS = {
  earlyFive: "Early 5",
  topLine: "Top Line",
  middleLine: "Mid Line",
  bottomLine: "Bottom Line",
  fullHouse: "Full House",
};

export default function GameCard({ game }) {
  const navigate = useNavigate();

  return (
    <div
      className="game-card glass-card animate-slide-up"
      onClick={() => navigate(`/game/${game.code}`)}
    >
      <div className="game-card-header">
        <div className="game-code-wrapper">
          <span className="game-code">{game.code}</span>
          <span className={`game-status badge badge-${game.status === "waiting" ? "emerald" : "gold"}`}>
            {game.status === "waiting" ? "Open" : game.status}
          </span>
        </div>
        <span className="game-host text-muted">
          by {game.host?.displayName || game.host?.username || "Unknown"}
        </span>
      </div>

      <div className="game-card-body">
        <div className="game-meta">
          <div className="meta-item">
            <span className="meta-icon">👥</span>
            <span>
              {game.playerCount || game.players?.length || 0} / {game.maxPlayers}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-icon">🏆</span>
            <span>{game.availablePatterns?.length || 5} patterns</span>
          </div>
          <div className="meta-item">
            <span className="meta-icon">🎫</span>
            <span>{game.ticketsPerPlayer || 1} ticket{(game.ticketsPerPlayer || 1) > 1 ? "s" : ""}/player</span>
          </div>
        </div>

        <div className="game-patterns">
          {game.availablePatterns?.slice(0, 3).map((p) => (
            <span key={p} className="pattern-tag">
              {PATTERN_LABELS[p] || p}
            </span>
          ))}
          {game.availablePatterns?.length > 3 && (
            <span className="pattern-tag more">+{game.availablePatterns.length - 3}</span>
          )}
        </div>
      </div>

      <div className="game-card-footer">
        <button className="btn btn-cyan btn-sm">Join Game →</button>
      </div>
    </div>
  );
}
