import { ArrowUpDown, Clock, DollarSign, Zap, Star } from "lucide-react";
import "./SortControl.css";

const SORT_OPTIONS = [
  { value: "departure_asc", label: "Earliest", icon: Clock, fullLabel: "Departure: Earliest First" },
  { value: "price_asc", label: "Cheapest", icon: DollarSign, fullLabel: "Price: Low to High" },
  { value: "duration_asc", label: "Fastest", icon: Zap, fullLabel: "Duration: Shortest" },
  { value: "rating_desc", label: "Top Rated", icon: Star, fullLabel: "Rating: High to Low" },
  { value: "price_desc", label: "Price: High to Low", icon: DollarSign, fullLabel: "Price: High to Low" },
];

function SortControl({ value, onChange, totalCount }) {
  return (
    <div className="modern-sort-bar">
      <div className="sort-bar-left">
        <span className="results-badge-pill">
          <span className="pulse-dot"></span>
          {typeof totalCount === "number" ? `${totalCount} ${totalCount === 1 ? "Bus" : "Buses"} Available` : "Available Buses"}
        </span>
      </div>

      <div className="sort-bar-right">
        {/* Desktop Segmented Buttons */}
        <div className="sort-segmented-group">
          <span className="sort-by-title">Sort By:</span>
          {SORT_OPTIONS.slice(0, 4).map((opt) => {
            const Icon = opt.icon;
            const isActive = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`sort-pill-btn ${isActive ? "active" : ""}`}
                onClick={() => onChange(opt.value)}
              >
                <Icon size={13} className="sort-pill-icon" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dropdown for All / Mobile / Extra Options */}
        <div className="sort-select-wrapper">
          <ArrowUpDown size={14} className="sort-dropdown-icon-left" />
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="modern-sort-select"
            aria-label="Sort buses by"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.fullLabel}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default SortControl;
