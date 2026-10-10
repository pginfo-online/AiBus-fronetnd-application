import "./SearchSummary.css";

function formatSummaryDate(dateStr) {
  if (!dateStr) return "Wed, 17 Sep 2026";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function SearchSummary({ from, to, date }) {
  const displayFrom = from || "Pune";
  const displayTo = to || "Mumbai";
  const displayDate = formatSummaryDate(date);

  return (
    <div className="journey-summary-bar">
      {/* Departure City */}
      <div className="summary-item">
        <div className="summary-icon-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <div className="summary-text-block">
          <strong className="summary-title">{displayFrom}</strong>
          <span className="summary-label">Departure</span>
        </div>
      </div>

      {/* Swap Arrow */}
      <div className="summary-swap-circle">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="17 1 21 5 17 9" />
          <line x1="3" y1="5" x2="21" y2="5" />
          <polyline points="7 23 3 19 7 15" />
          <line x1="21" y1="19" x2="3" y2="19" />
        </svg>
      </div>

      {/* Arrival City */}
      <div className="summary-item">
        <div className="summary-icon-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <div className="summary-text-block">
          <strong className="summary-title">{displayTo}</strong>
          <span className="summary-label">Arrival</span>
        </div>
      </div>

      {/* Divider */}
      <div className="summary-divider" />

      {/* Journey Date */}
      <div className="summary-item date-item">
        <div className="summary-icon-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div className="summary-text-block">
          <strong className="summary-title">{displayDate}</strong>
          <span className="summary-label">Journey Date</span>
        </div>
      </div>
    </div>
  );
}

export default SearchSummary;