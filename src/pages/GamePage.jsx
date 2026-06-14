import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import { useWebSocket } from "../hooks/useWebSocket";
import Navbar from "../components/Navbar";
import NumberBoard from "../components/NumberBoard";
import TicketCard from "../components/TicketCard";
import ClaimPanel from "../components/ClaimPanel";
import CurrentNumber from "../components/CurrentNumber";
import PlayerList from "../components/PlayerList";
import "./GamePage.css";

export default function GamePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, getAccessToken, showToast } = useAuth();
  const { get, post } = useApi();

  // Game state
  const [game, setGame] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Derived state
  const isHost = game && user && game.host?._id === user.id;
  const isPlayer = game?.players?.some(
    (p) => (p.user?._id || p.user) === user?.id
  );

  // ─── Fetch game data ─────────────────────────────────────
  const fetchGame = useCallback(async () => {
    const { ok, data } = await get(`/api/games/${code}`);
    if (ok && data?.data) {
      setGame(data.data);
    } else {
      showToast("Game not found", "error");
      navigate("/");
    }
    setLoading(false);
  }, [get, code, navigate, showToast]);

  // Fetch my tickets
  const fetchTickets = useCallback(async () => {
    const { ok, data } = await get(`/api/games/${code}/tickets`);
    if (ok && data?.data?.tickets) {
      setTickets(data.data.tickets);
    }
  }, [get, code]);

  useEffect(() => {
    fetchGame();
    fetchTickets();
  }, [fetchGame, fetchTickets]);

  // ─── WebSocket handler ────────────────────────────────────
  const handleWsMessage = useCallback(
    (msg) => {
      switch (msg.type) {
        case "game_state":
          setGame((prev) =>
            prev
              ? {
                  ...prev,
                  status: msg.data.status,
                  calledNumbers: msg.data.calledNumbers,
                  currentNumber: msg.data.currentNumber,
                  winners: msg.data.winners,
                  playerCount: msg.data.playerCount,
                }
              : prev
          );
          break;

        case "number_called":
          setGame((prev) =>
            prev
              ? {
                  ...prev,
                  currentNumber: msg.data.number,
                  calledNumbers: msg.data.calledNumbers,
                }
              : prev
          );
          break;

        case "player_joined":
          showToast(`${msg.data.username} joined the game`, "info");
          setGame((prev) =>
            prev ? { ...prev, playerCount: msg.data.playerCount } : prev
          );
          fetchGame(); // Refresh full player list
          break;

        case "player_left":
          showToast(`${msg.data.username} left the game`, "info");
          fetchGame();
          break;

        case "game_started":
          showToast("🎯 Game started!", "success");
          setGame((prev) => (prev ? { ...prev, status: "in_progress" } : prev));
          break;

        case "game_paused":
          showToast("⏸️ Game paused", "info");
          setGame((prev) => (prev ? { ...prev, status: "paused" } : prev));
          break;

        case "game_resumed":
          showToast("▶️ Game resumed", "success");
          setGame((prev) => (prev ? { ...prev, status: "in_progress" } : prev));
          break;

        case "claim_result":
          if (msg.data.valid) {
            showToast(`🏆 ${msg.data.message}`, "success");
            setGame((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                winners: {
                  ...prev.winners,
                  [msg.data.pattern]: msg.data.winner,
                },
              };
            });
          } else {
            showToast(msg.data.message, "error");
          }
          break;

        case "game_ended":
          showToast("🎊 Game over!", "success");
          setGame((prev) =>
            prev
              ? { ...prev, status: "completed", winners: msg.data.winners }
              : prev
          );
          break;

        case "error":
          showToast(msg.data.message, "error");
          break;
      }
    },
    [showToast, fetchGame]
  );

  const { send, connected } = useWebSocket(
    game?.status !== "completed" ? code : null,
    getAccessToken(),
    handleWsMessage
  );

  // ─── Actions ──────────────────────────────────────────────
  const handleJoinGame = async () => {
    const { ok } = await post(`/api/games/${code}/join`);
    if (ok) {
      showToast("Joined! Tickets generated automatically 🎫", "success");
      fetchGame();
      fetchTickets();
    }
  };

  const handleStartGame = () => send({ action: "start_game" });
  const handlePauseGame = () => send({ action: "pause_game" });
  const handleResumeGame = () => send({ action: "resume_game" });

  const handleClaim = (pattern, ticketId) => {
    send({ action: "claim", payload: { pattern, ticketId } });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code.toUpperCase());
    showToast("Code copied! 📋", "success");
  };

  // ─── Render ───────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loader" style={{ minHeight: "60vh" }}>
          <div className="spinner" />
          <span>Loading game...</span>
        </div>
      </>
    );
  }

  if (!game) return null;

  const isWaiting = game.status === "waiting";
  const isPlaying = game.status === "in_progress" || game.status === "paused";
  const isCompleted = game.status === "completed";

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="container">
          {/* Game header */}
          <div className="game-header animate-fade-in">
            <div className="game-header-left">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate("/")}
              >
                ← Back
              </button>
              <div>
                <div className="game-code-display" onClick={copyCode} title="Click to copy">
                  {code.toUpperCase()}
                  <span className="copy-hint">📋</span>
                </div>
                <div className="game-status-row">
                  <span
                    className={`badge ${
                      isWaiting
                        ? "badge-cyan"
                        : isPlaying
                        ? "badge-emerald"
                        : "badge-gold"
                    }`}
                  >
                    {game.status === "in_progress"
                      ? "In Progress"
                      : game.status === "paused"
                      ? "Paused"
                      : game.status}
                  </span>
                  {game.ticketsPerPlayer && (
                    <span className="badge badge-gold">
                      {game.ticketsPerPlayer} 🎫 per player
                    </span>
                  )}
                  <span className="connection-dot">
                    <span className={`dot-indicator ${connected ? "online" : "offline"}`} />
                    {connected ? "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>
            </div>

            {/* Host controls */}
            {isHost && (
              <div className="host-controls">
                {isWaiting && tickets.length > 0 && (
                  <button className="btn btn-emerald" onClick={handleStartGame}>
                    ▶ Start Game
                  </button>
                )}
                {game.status === "in_progress" && (
                  <button className="btn btn-secondary" onClick={handlePauseGame}>
                    ⏸ Pause
                  </button>
                )}
                {game.status === "paused" && (
                  <button className="btn btn-cyan" onClick={handleResumeGame}>
                    ▶ Resume
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ─── WAITING STATE ──────────────────────────────── */}
          {isWaiting && (
            <div className="game-waiting animate-slide-up">
              <div className="waiting-grid">
                {/* Left: Players + Join */}
                <div className="waiting-left">
                  {!isPlayer && (
                    <div className="glass-card join-prompt">
                      <h3>Join this game?</h3>
                      <p className="text-muted">
                        You'll automatically receive{" "}
                        <strong className="text-gold">
                          {game.ticketsPerPlayer} ticket{game.ticketsPerPlayer > 1 ? "s" : ""}
                        </strong>{" "}
                        when you join.
                      </p>
                      <button
                        className="btn btn-primary btn-block"
                        onClick={handleJoinGame}
                      >
                        Join Game
                      </button>
                    </div>
                  )}

                  <PlayerList
                    players={game.players || []}
                    hostId={game.host?._id}
                  />
                </div>

                {/* Right: Ticket preview (read-only, auto-generated) */}
                <div className="waiting-right">
                  {isPlayer && tickets.length > 0 && (
                    <div className="glass-card ticket-info-card">
                      <h3>🎫 Your Tickets</h3>
                      <p className="text-muted">
                        You have <strong className="text-gold">{tickets.length}</strong> ticket
                        {tickets.length > 1 ? "s" : ""} — auto-assigned when you joined.
                      </p>
                    </div>
                  )}

                  {/* Preview tickets */}
                  {tickets.length > 0 && (
                    <div className="tickets-preview">
                      {tickets.map((ticket, idx) => (
                        <TicketCard
                          key={ticket.id}
                          ticket={ticket}
                          calledNumbers={[]}
                          ticketIndex={idx}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── PLAYING STATE ──────────────────────────────── */}
          {isPlaying && (
            <div className="game-playing animate-fade-in">
              <div className="playing-layout">
                {/* Top row: Current number + Board */}
                <div className="playing-top">
                  <CurrentNumber
                    number={game.currentNumber}
                    calledNumbers={game.calledNumbers || []}
                  />
                  <NumberBoard
                    calledNumbers={game.calledNumbers || []}
                    currentNumber={game.currentNumber}
                  />
                </div>

                {/* Bottom row: Tickets + Claims */}
                <div className="playing-bottom">
                  <div className="playing-tickets">
                    <h3 className="section-title">🎫 Your Tickets</h3>
                    <div className="tickets-grid">
                      {tickets.map((ticket, idx) => (
                        <TicketCard
                          key={ticket.id}
                          ticket={ticket}
                          calledNumbers={game.calledNumbers || []}
                          ticketIndex={idx}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="playing-sidebar">
                    <ClaimPanel
                      availablePatterns={game.availablePatterns || []}
                      winners={game.winners || {}}
                      tickets={tickets}
                      onClaim={handleClaim}
                      disabled={!connected}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── COMPLETED STATE ─────────────────────────────── */}
          {isCompleted && (
            <div className="game-completed animate-slide-up">
              {/* Confetti */}
              <div className="confetti-container">
                {Array.from({ length: 30 }, (_, i) => (
                  <div
                    key={i}
                    className="confetti-piece"
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${2 + Math.random() * 3}s`,
                      backgroundColor: [
                        "var(--gold)",
                        "var(--cyan)",
                        "var(--emerald)",
                        "var(--rose)",
                        "var(--purple)",
                      ][Math.floor(Math.random() * 5)],
                    }}
                  />
                ))}
              </div>

              <div className="completed-content">
                <div className="completed-header">
                  <h1>🎊 Game Over!</h1>
                  <p className="text-muted">Here are the winners</p>
                </div>

                <div className="winners-grid">
                  {(game.availablePatterns || []).map((pattern) => {
                    const winner = game.winners?.[pattern];
                    const labels = {
                      earlyFive: "Early Five",
                      topLine: "Top Line",
                      middleLine: "Middle Line",
                      bottomLine: "Bottom Line",
                      fullHouse: "Full House",
                    };
                    const icons = {
                      earlyFive: "5️⃣",
                      topLine: "⬆️",
                      middleLine: "➡️",
                      bottomLine: "⬇️",
                      fullHouse: "🏠",
                    };

                    return (
                      <div key={pattern} className="winner-card glass-card">
                        <div className="winner-icon">{icons[pattern]}</div>
                        <h3>{labels[pattern]}</h3>
                        {winner ? (
                          <span className="winner-name text-gold">🏆 {winner}</span>
                        ) : (
                          <span className="text-muted">Not claimed</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => navigate("/")}
                >
                  Back to Lobby
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
