import "./ClaimPanel.css";

const PATTERN_CONFIG = {
  earlyFive: { label: "Early Five", icon: "5️⃣", description: "First 5 numbers marked" },
  topLine: { label: "Top Line", icon: "⬆️", description: "Complete top row" },
  middleLine: { label: "Middle Line", icon: "➡️", description: "Complete middle row" },
  bottomLine: { label: "Bottom Line", icon: "⬇️", description: "Complete bottom row" },
  fullHouse: { label: "Full House", icon: "🏠", description: "All 15 numbers" },
};

export default function ClaimPanel({
  availablePatterns = [],
  winners = {},
  tickets = [],
  onClaim,
  disabled = false,
}) {
  return (
    <div className="claim-panel glass-card">
      <h3 className="claim-title">🏆 Claim a Win</h3>
      <div className="claim-patterns">
        {availablePatterns.map((pattern) => {
          const config = PATTERN_CONFIG[pattern] || { label: pattern, icon: "🎯" };
          const winner = winners[pattern];
          const isClaimed = !!winner;

          return (
            <div key={pattern} className={`claim-item ${isClaimed ? "claimed" : ""}`}>
              <div className="claim-info">
                <span className="claim-icon">{config.icon}</span>
                <div>
                  <span className="claim-label">{config.label}</span>
                  {isClaimed ? (
                    <span className="claim-winner">
                      Won by {typeof winner === "string" ? winner : "🏆"}
                    </span>
                  ) : (
                    <span className="claim-desc">{config.description}</span>
                  )}
                </div>
              </div>
              {!isClaimed && (
                <div className="claim-actions">
                  {tickets.map((ticket, idx) => (
                    <button
                      key={ticket.id || idx}
                      className="btn btn-primary btn-sm"
                      disabled={disabled}
                      onClick={() => onClaim(pattern, ticket.id)}
                      title={`Claim with Ticket #${idx + 1}`}
                    >
                      T{idx + 1}
                    </button>
                  ))}
                </div>
              )}
              {isClaimed && (
                <span className="badge badge-gold">Claimed</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
