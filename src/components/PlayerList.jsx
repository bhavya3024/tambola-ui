import "./PlayerList.css";

export default function PlayerList({ players = [], hostId }) {
  return (
    <div className="player-list glass-card">
      <h3 className="player-list-title">
        Players <span className="player-count">{players.length}</span>
      </h3>
      <div className="player-items">
        {players.map((player, idx) => {
          const userData = player.user || player;
          const isHost =
            (hostId && userData._id === hostId) ||
            (hostId && userData === hostId);

          return (
            <div key={userData._id || idx} className="player-item animate-fade-in">
              <div className="player-avatar">
                {(userData.displayName || userData.username || "?")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <span className="player-name">
                {userData.displayName || userData.username || "Player"}
              </span>
              {isHost && <span className="badge badge-gold">Host</span>}
            </div>
          );
        })}

        {players.length === 0 && (
          <p className="text-muted" style={{ fontSize: "0.85rem", padding: "var(--space-sm)" }}>
            No players yet
          </p>
        )}
      </div>
    </div>
  );
}
