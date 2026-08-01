"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { useApi } from "../../../hooks/useApi";
import { useWebSocket } from "../../../hooks/useWebSocket";
import { ProtectedRoute } from "../../../components/ProtectedRoute";
import Navbar from "../../../components/Navbar";
import NumberBoard from "../../../components/NumberBoard";
import TicketCard from "../../../components/TicketCard";
import ClaimPanel from "../../../components/ClaimPanel";
import CurrentNumber from "../../../components/CurrentNumber";
import PlayerList from "../../../components/PlayerList";
import "@/styles/GamePage.css";

function GamePageContent({ paramsPromise }) {
  const params = use(paramsPromise);
  const code = params.code;
  const router = useRouter();
  const { user, getAccessToken, showToast } = useAuth();
  const { get, post } = useApi();

  const [game, setGame] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGame = useCallback(async () => {
    const { ok, data } = await get(`/games/${code}`);
    if (ok && data?.data?.game) {
      setGame(data.data.game);
    } else {
      showToast("Game not found", "error");
      router.push("/");
    }
    setLoading(false);
  }, [get, code, router, showToast]);

  const fetchTickets = useCallback(async () => {
    const { ok, data } = await get(`/games/${code}/tickets`);
    if (ok && data?.data?.tickets) {
      setTickets(data.data.tickets);
    }
  }, [get, code]);

  useEffect(() => {
    fetchGame();
    fetchTickets();
  }, [fetchGame, fetchTickets]);

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
          fetchGame();
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

  const { send } = useWebSocket(
    game?.status !== "completed" ? code : null,
    getAccessToken(),
    handleWsMessage
  );

  const handleJoinGame = async () => {
    const { ok } = await post(`/games/${code}/join`);
    if (ok) {
      showToast("Joined! Tickets generated automatically 🎫", "success");
      fetchGame();
      fetchTickets();
    }
  };

  const handlePauseGame = () => send({ action: "pause_game" });
  const handleResumeGame = () => send({ action: "resume_game" });

  const handleClaim = (pattern, ticketId) => {
    send({ action: "claim", payload: { pattern, ticketId } });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code.toUpperCase());
    showToast("Code copied! 📋", "success");
  };

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
  const isHost = game.isHost;
  const isPlayer = game.isPlayer;

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="container">
          <div className="game-header glass-card animate-fade-in">
            <div className="game-header-top">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => router.push("/")}
              >
                ← Lobby
              </button>

              <div className="game-code-badge" onClick={copyCode} title="Click to copy">
                <span className="code-label">CODE:</span>
                <span className="code-value">{game.code}</span>
                <span className="copy-icon">📋</span>
              </div>

              <span
                className={`badge badge-${
                  isWaiting
                    ? "cyan"
                    : isPlaying
                    ? game.status === "paused"
                      ? "gold"
                      : "emerald"
                    : "rose"
                }`}
              >
                {game.status === "in_progress"
                  ? "🔴 LIVE"
                  : game.status.toUpperCase()}
              </span>
            </div>

            <div className="game-header-meta">
              <span>
                Host: <strong>{game.host?.displayName || game.host?.username || "Unknown"}</strong>
              </span>
              <span>
                Players: <strong>{game.playerCount || game.players?.length || 0} / {game.maxPlayers}</strong>
              </span>
            </div>
          </div>

          {isPlaying && (
            <div className="current-number-banner animate-slide-up">
              <CurrentNumber number={game.currentNumber} />
            </div>
          )}

          {isHost && isPlaying && (
            <div className="host-controls glass-card animate-slide-up">
              <span className="host-badge">👑 Host Controls</span>
              {game.status === "in_progress" ? (
                <button
                  className="btn btn-gold btn-sm"
                  onClick={handlePauseGame}
                >
                  ⏸️ Pause Game
                </button>
              ) : (
                <button
                  className="btn btn-emerald btn-sm"
                  onClick={handleResumeGame}
                >
                  ▶️ Resume Game
                </button>
              )}
            </div>
          )}

          <div className="game-layout">
            <div className="game-main">
              <div className="board-tickets-row">
                {isPlaying && (
                  <div className="section animate-slide-up">
                    <h2>Number Board</h2>
                    <NumberBoard calledNumbers={game.calledNumbers || []} />
                  </div>
                )}

                {isPlayer && (
                  <div className="section animate-slide-up">
                    <h2>Your Tickets ({tickets.length})</h2>
                    {tickets.length > 0 ? (
                      <div className="tickets-grid">
                        {tickets.map((t, idx) => (
                          <TicketCard
                            key={t.id || idx}
                            ticket={t}
                            calledNumbers={game.calledNumbers || []}
                            ticketNumber={idx + 1}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="glass-card text-center" style={{ padding: "var(--space-lg)" }}>
                        <p>No tickets found.</p>
                        <button className="btn btn-primary btn-sm" onClick={fetchTickets}>
                          Refresh Tickets
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!isPlayer && !isCompleted && (
                <div className="glass-card text-center join-banner animate-slide-up">
                  <h3>You haven't joined this game yet</h3>
                  <p className="text-muted">
                    Join now to get your auto-generated ticket!
                  </p>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleJoinGame}
                  >
                    Join Game 🎯
                  </button>
                </div>
              )}
            </div>

            <div className="game-sidebar">
              {isPlaying && isPlayer && (
                <div className="animate-slide-up">
                  <ClaimPanel
                    availablePatterns={game.availablePatterns || []}
                    winners={game.winners || {}}
                    tickets={tickets}
                    onClaim={handleClaim}
                    gameStatus={game.status}
                  />
                </div>
              )}

              <div className="animate-slide-up">
                <PlayerList
                  players={game.players || []}
                  hostId={game.host?._id || game.host?.id}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function GamePage({ params }) {
  return (
    <ProtectedRoute>
      <GamePageContent paramsPromise={params} />
    </ProtectedRoute>
  );
}
