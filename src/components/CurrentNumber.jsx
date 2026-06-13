import "./CurrentNumber.css";

/**
 * Large animated display of the current called number.
 */
export default function CurrentNumber({ number, calledNumbers = [] }) {
  const lastFive = calledNumbers.slice(-6, -1).reverse();

  return (
    <div className="current-number-container glass-card">
      {number ? (
        <>
          <span className="current-label">Current Number</span>
          <div className="current-number animate-bounce-in" key={number}>
            {number}
          </div>
          {lastFive.length > 0 && (
            <div className="call-history">
              <span className="history-label">Previous:</span>
              <div className="history-numbers">
                {lastFive.map((n, i) => (
                  <span key={n} className="history-num" style={{ opacity: 1 - i * 0.15 }}>
                    {n}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="waiting-number">
          <span className="current-label">Waiting for game to start...</span>
          <div className="waiting-dots">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </div>
      )}
    </div>
  );
}
