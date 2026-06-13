import "./NumberBoard.css";

/**
 * 9×10 grid showing numbers 1-90.
 * Called numbers are highlighted, current number pulses.
 */
export default function NumberBoard({ calledNumbers = [], currentNumber }) {
  const calledSet = new Set(calledNumbers);

  return (
    <div className="number-board glass-card">
      <h3 className="number-board-title">Number Board</h3>
      <div className="number-grid">
        {Array.from({ length: 90 }, (_, i) => {
          const num = i + 1;
          const isCalled = calledSet.has(num);
          const isCurrent = num === currentNumber;

          return (
            <div
              key={num}
              className={`number-cell ${isCalled ? "called" : ""} ${isCurrent ? "current" : ""}`}
            >
              {num}
            </div>
          );
        })}
      </div>
      <div className="board-stats">
        <span className="text-muted">
          Called: <strong className="text-gold">{calledNumbers.length}</strong> / 90
        </span>
        <span className="text-muted">
          Remaining: <strong className="text-cyan">{90 - calledNumbers.length}</strong>
        </span>
      </div>
    </div>
  );
}
