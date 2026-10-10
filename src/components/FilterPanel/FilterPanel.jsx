import { RotateCcw, Sparkles, Wind, Sun, Sunrise, Sunset, Moon, Armchair, BedDouble } from "lucide-react";
import "./FilterPanel.css";

function FilterPanel({ buses = [], filters = {}, onFilterChange }) {
  const acOnly = Boolean(filters.acOnly);
  const nonAcOnly = Boolean(filters.nonAcOnly);
  const sleeperOnly = Boolean(filters.sleeperOnly);
  const seaterOnly = Boolean(filters.seaterOnly);
  const depTime = filters.depTime || [];
  const maxPrice = filters.maxPrice ?? 2000;

  // Dynamic count helper
  const countMatches = (typeKey, value) => {
    return buses.filter((bus) => {
      const typeStr = (bus.busType || "").toLowerCase();
      const isNonAc = typeStr.includes("non ac") || typeStr.includes("non-ac");
      const isAc = typeStr.includes("ac") && !isNonAc;
      const isSleeper = typeStr.includes("sleeper");
      const isSeater = typeStr.includes("seater");

      if (typeKey === "ac") return isAc;
      if (typeKey === "nonAc") return isNonAc;
      if (typeKey === "sleeper") return isSleeper;
      if (typeKey === "seater") return isSeater;

      if (typeKey === "depSlot") {
        const hour = parseInt((bus.departureTime || "00").split(":")[0], 10);
        if (value === "before6am") return hour < 6;
        if (value === "6amTo12pm") return hour >= 6 && hour < 12;
        if (value === "12pmTo6pm") return hour >= 12 && hour < 18;
        if (value === "after6pm") return hour >= 18;
      }
      return true;
    }).length;
  };

  const handleClear = () => {
    onFilterChange({
      acOnly: false,
      nonAcOnly: false,
      sleeperOnly: false,
      seaterOnly: false,
      depTime: [],
      maxPrice: 2000,
    });
  };

  const handleDepTimeToggle = (slot) => {
    const updated = depTime.includes(slot)
      ? depTime.filter((s) => s !== slot)
      : [...depTime, slot];

    emitFilterChange({ depTime: updated });
  };

  const emitFilterChange = (overrides = {}) => {
    onFilterChange({
      acOnly: overrides.hasOwnProperty("acOnly") ? overrides.acOnly : acOnly,
      nonAcOnly: overrides.hasOwnProperty("nonAcOnly") ? overrides.nonAcOnly : nonAcOnly,
      sleeperOnly: overrides.hasOwnProperty("sleeperOnly") ? overrides.sleeperOnly : sleeperOnly,
      seaterOnly: overrides.hasOwnProperty("seaterOnly") ? overrides.seaterOnly : seaterOnly,
      depTime: overrides.hasOwnProperty("depTime") ? overrides.depTime : depTime,
      maxPrice: overrides.hasOwnProperty("maxPrice") ? overrides.maxPrice : maxPrice,
    });
  };

  const activeFiltersCount =
    (acOnly ? 1 : 0) +
    (nonAcOnly ? 1 : 0) +
    (sleeperOnly ? 1 : 0) +
    (seaterOnly ? 1 : 0) +
    depTime.length +
    (maxPrice < 2000 ? 1 : 0);

  return (
    <aside className="modern-filter-panel">
      {/* Header */}
      <div className="filter-panel-header">
        <div className="filter-header-title-box">
          <Sparkles size={16} className="filter-sparkle-icon" />
          <h2>Filters</h2>
          {activeFiltersCount > 0 && (
            <span className="active-filter-badge">{activeFiltersCount}</span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button type="button" className="modern-clear-all-btn" onClick={handleClear}>
            <RotateCcw size={12} />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Bus Type */}
      <div className="modern-filter-section">
        <h3 className="section-title">Bus Type</h3>
        <div className="filter-card-grid">
          <button
            type="button"
            className={`filter-pill-card ${acOnly ? "active" : ""}`}
            onClick={() => emitFilterChange({ acOnly: !acOnly })}
          >
            <div className="filter-card-left">
              <Wind size={15} className="card-icon" />
              <span>AC</span>
            </div>
            <span className="count-pill">{countMatches("ac")}</span>
          </button>

          <button
            type="button"
            className={`filter-pill-card ${nonAcOnly ? "active" : ""}`}
            onClick={() => emitFilterChange({ nonAcOnly: !nonAcOnly })}
          >
            <div className="filter-card-left">
              <Sun size={15} className="card-icon" />
              <span>Non-AC</span>
            </div>
            <span className="count-pill">{countMatches("nonAc")}</span>
          </button>
        </div>
      </div>

      {/* Seat Type */}
      <div className="modern-filter-section">
        <h3 className="section-title">Seat Layout</h3>
        <div className="filter-card-grid">
          <button
            type="button"
            className={`filter-pill-card ${sleeperOnly ? "active" : ""}`}
            onClick={() => emitFilterChange({ sleeperOnly: !sleeperOnly })}
          >
            <div className="filter-card-left">
              <BedDouble size={15} className="card-icon" />
              <span>Sleeper</span>
            </div>
            <span className="count-pill">{countMatches("sleeper")}</span>
          </button>

          <button
            type="button"
            className={`filter-pill-card ${seaterOnly ? "active" : ""}`}
            onClick={() => emitFilterChange({ seaterOnly: !seaterOnly })}
          >
            <div className="filter-card-left">
              <Armchair size={15} className="card-icon" />
              <span>Seater</span>
            </div>
            <span className="count-pill">{countMatches("seater")}</span>
          </button>
        </div>
      </div>

      {/* Departure Time Slots */}
      <div className="modern-filter-section">
        <h3 className="section-title">Departure Time</h3>
        <div className="dep-time-slots-list">
          <button
            type="button"
            className={`dep-time-btn ${depTime.includes("before6am") ? "active" : ""}`}
            onClick={() => handleDepTimeToggle("before6am")}
          >
            <div className="time-btn-left">
              <Sunrise size={16} className="time-icon" />
              <div className="time-text-block">
                <span className="time-title">Early Morning</span>
                <span className="time-sub">Before 6 AM</span>
              </div>
            </div>
            <span className="count-pill">{countMatches("depSlot", "before6am")}</span>
          </button>

          <button
            type="button"
            className={`dep-time-btn ${depTime.includes("6amTo12pm") ? "active" : ""}`}
            onClick={() => handleDepTimeToggle("6amTo12pm")}
          >
            <div className="time-btn-left">
              <Sun size={16} className="time-icon" />
              <div className="time-text-block">
                <span className="time-title">Morning</span>
                <span className="time-sub">6 AM – 12 PM</span>
              </div>
            </div>
            <span className="count-pill">{countMatches("depSlot", "6amTo12pm")}</span>
          </button>

          <button
            type="button"
            className={`dep-time-btn ${depTime.includes("12pmTo6pm") ? "active" : ""}`}
            onClick={() => handleDepTimeToggle("12pmTo6pm")}
          >
            <div className="time-btn-left">
              <Sunset size={16} className="time-icon" />
              <div className="time-text-block">
                <span className="time-title">Afternoon</span>
                <span className="time-sub">12 PM – 6 PM</span>
              </div>
            </div>
            <span className="count-pill">{countMatches("depSlot", "12pmTo6pm")}</span>
          </button>

          <button
            type="button"
            className={`dep-time-btn ${depTime.includes("after6pm") ? "active" : ""}`}
            onClick={() => handleDepTimeToggle("after6pm")}
          >
            <div className="time-btn-left">
              <Moon size={16} className="time-icon" />
              <div className="time-text-block">
                <span className="time-title">Night</span>
                <span className="time-sub">After 6 PM</span>
              </div>
            </div>
            <span className="count-pill">{countMatches("depSlot", "after6pm")}</span>
          </button>
        </div>
      </div>

      {/* Price Range Slider */}
      <div className="modern-filter-section border-none">
        <div className="price-header-row">
          <h3 className="section-title">Max Budget</h3>
          <span className="current-max-price-badge">₹{maxPrice}</span>
        </div>
        <div className="modern-price-slider-box">
          <input
            type="range"
            min="400"
            max="2500"
            step="50"
            value={maxPrice}
            onChange={(e) => {
              const val = Number(e.target.value);
              emitFilterChange({ maxPrice: val });
            }}
            className="modern-blue-range"
            aria-label="Filter maximum ticket price"
          />
          <div className="price-range-min-max">
            <span>₹400</span>
            <span>₹2,500</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default FilterPanel;