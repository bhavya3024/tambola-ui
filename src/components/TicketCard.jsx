import "./TicketCard.css";

/**
 * Renders a single Tambola ticket as a 3×9 grid.
 * Numbers that have been called are auto-marked.
 */
export default function TicketCard({ ticket, calledNumbers = [], ticketIndex = 0 }) {
  const calledSet = new Set(calledNumbers);

  // Count how many numbers on this ticket have been called
  const totalNumbers = ticket.grid.flat().filter((n) => n > 0).length;
  const markedCount = ticket.grid.flat().filter((n) => n > 0 && calledSet.has(n)).length;

  return (
    <div className="ticket-card glass-card animate-slide-up" style={{ animationDelay: `${ticketIndex * 0.1}s` }}>
      <div className="ticket-header">
        <span className="ticket-label">Ticket #{ticketIndex + 1}</span>
        <span className="ticket-progress">
          {markedCount}/{totalNumbers}
        </span>
      </div>
      <div className="ticket-grid">
        {ticket.grid.map((row, rowIdx) => (
          <div key={rowIdx} className="ticket-row">
            {row.map((num, colIdx) => {
              const isEmpty = num === 0;
              const isMarked = !isEmpty && calledSet.has(num);

              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={`ticket-cell ${isEmpty ? "empty" : ""} ${isMarked ? "marked" : ""}`}
                >
                  {isEmpty ? "" : num}
                  {isMarked && <div className="mark-dot" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {/* Progress bar */}
      <div className="ticket-progress-bar">
        <div
          className="ticket-progress-fill"
          style={{ width: `${(markedCount / totalNumbers) * 100}%` }}
        />
      </div>
    </div>
  );
}
