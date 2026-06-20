import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import Navbar from "../components/Navbar";
import GameCard from "../components/GameCard";
import "./LobbyPage.css";

export default function LobbyPage() {
  const navigate = useNavigate();
  const { showToast } = useAuth();
  const { get, post } = useApi();

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    maxPlayers: 2,
    ticketsPerPlayer: 1,
  });
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [activeGame, setActiveGame] = useState(null);

  // Check if user is already in an active game
  const fetchActiveGame = useCallback(async () => {
    const { ok, data } = await get("/api/games/active");
    if (ok && data?.data?.activeGame) {
      setActiveGame(data.data.activeGame);
    } else {
      setActiveGame(null);
    }
  }, [get]);

  // Fetch available games
  const fetchGames = useCallback(async () => {
    const { ok, data } = await get("/api/games?limit=20");
    if (ok && data?.data?.games) {
      setGames(data.data.games);
    }
    setLoading(false);
  }, [get]);

  useEffect(() => {
    fetchActiveGame();
    fetchGames();
  }, [fetchActiveGame, fetchGames]);

  // Create a new game
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);

    const { ok, data } = await post("/api/games", createForm);

    setCreating(false);

    if (ok && data?.data?.code) {
      showToast(`Game ${data.data.code} created! 🎯`, "success");
      navigate(`/game/${data.data.code}`);
    }
  };

  // Join by code
  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoining(true);

    const code = joinCode.trim().toUpperCase();
    const { ok } = await post(`/api/games/${code}/join`);

    setJoining(false);

    if (ok) {
      showToast(`Joined game ${code}! 🎉`, "success");
      navigate(`/game/${code}`);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="container">
          {/* Hero section */}
          <div className="lobby-hero animate-fade-in">
            <h1>
              <span className="text-gold">Play</span> Tambola Online
            </h1>
            <p className="text-muted">
              Create a room or join a game with friends
            </p>
          </div>

          {/* Active game banner */}
          {activeGame ? (
            <div className="lobby-actions animate-slide-up">
              <div className="action-card glass-card active-game-banner" style={{ gridColumn: "1 / -1" }}>
                <div className="action-icon">🎮</div>
                <h3>You're in an active game!</h3>
                <p className="text-muted">
                  You're currently part of game <strong className="text-gold">{activeGame.code}</strong>.
                  Finish or leave it before creating or joining another.
                </p>
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => navigate(`/game/${activeGame.code}`)}
                >
                  Return to Game →
                </button>
              </div>
            </div>
          ) : (
          /* Action cards */
          <div className="lobby-actions animate-slide-up">
            {/* Join by code */}
            <div className="action-card glass-card">
              <div className="action-icon">🔗</div>
              <h3>Join by Code</h3>
              <p className="text-muted">Have a room code? Enter it below.</p>
              <form className="join-form" onSubmit={handleJoin}>
                <input
                  className="input join-input"
                  type="text"
                  placeholder="Enter game code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  id="join-code-input"
                />
                <button
                  type="submit"
                  className="btn btn-cyan"
                  disabled={joining || !joinCode.trim()}
                >
                  {joining ? "Joining..." : "Join →"}
                </button>
              </form>
            </div>

            {/* Create game */}
            <div className="action-card glass-card">
              <div className="action-icon">🎯</div>
              <h3>Create Game</h3>
              <p className="text-muted">Host a new Tambola game room.</p>

              {!showCreate ? (
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => setShowCreate(true)}
                >
                  Create New Game
                </button>
              ) : (
                <form className="create-form" onSubmit={handleCreate}>
                  <div className="input-group">
                    <label htmlFor="max-players-input">Max Players</label>
                    <input
                      id="max-players-input"
                      className="input"
                      type="number"
                      min={2}
                      max={200}
                      value={createForm.maxPlayers}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          maxPlayers: parseInt(e.target.value) || 50,
                        })
                      }
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="tickets-per-player-input">Tickets Per Player</label>
                    <div className="tickets-slider-group">
                      <input
                        id="tickets-per-player-input"
                        className="tickets-slider"
                        type="range"
                        min={1}
                        max={6}
                        value={createForm.ticketsPerPlayer}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            ticketsPerPlayer: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                      <span className="tickets-count-badge">
                        {createForm.ticketsPerPlayer} 🎫
                      </span>
                    </div>
                    <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                      Every player gets the same number of tickets
                    </span>
                  </div>
                  <div className="create-buttons">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowCreate(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={creating}
                    >
                      {creating ? "Creating..." : "Create 🎯"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
          )}
          {/* Available games */}
          <div className="lobby-games animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h2>Available Games</h2>

            {loading ? (
              <div className="loader">
                <div className="spinner" />
                <span>Loading games...</span>
              </div>
            ) : games.length > 0 ? (
              <div className="games-grid">
                {games.map((game) => (
                  <GameCard key={game.id || game.code} game={game} />
                ))}
              </div>
            ) : (
              <div className="empty-state glass-card">
                <div className="icon">🎲</div>
                <h3>No games available</h3>
                <p>Be the first to create one!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
