import React, { useState, useMemo } from "react";
import {
  MapPin,
  Clock,
  CheckCircle2,
  Search,
  ArrowRight,
  Navigation,
  Compass,
  Building,
  Sparkles,
  Phone,
} from "lucide-react";
import "./BoardingDroppingSelector.css";

/**
 * Format time string into 12-hour AM/PM readable format
 */
export function formatPointTime(timeStr) {
  if (!timeStr) return "--:--";
  try {
    if (timeStr.includes("T") || (timeStr.includes(" ") && timeStr.includes("-"))) {
      const d = new Date(timeStr.replace(" ", "T"));
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      }
    }
    const cleanTime = timeStr.includes(" ") ? timeStr.split(" ")[1] : timeStr;
    const parts = cleanTime.split(":");
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1].slice(0, 2);
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
    }
    return timeStr;
  } catch {
    return timeStr;
  }
}

/**
 * Extract date badge if dropping/pickup happens on a different day
 */
export function getPointDayBadge(timeStr) {
  if (!timeStr) return null;
  try {
    if (timeStr.includes("T") || timeStr.includes("-")) {
      const parts = timeStr.split("T")[0].split(" ")[0].split("-");
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      }
    }
  } catch {
    return null;
  }
  return null;
}

export default function BoardingDroppingSelector({
  pickups = [],
  dropoffs = [],
  selectedPickup,
  selectedDropoff,
  onSelectPickup,
  onSelectDropoff,
  fromCity = "Origin",
  toCity = "Destination",
  title = "Boarding & Dropping Points",
  subtitle = "Select your preferred boarding location and dropping destination",
}) {
  const [activeTab, setActiveTab] = useState("boarding"); // "boarding" | "dropping"
  const [searchQuery, setSearchQuery] = useState("");

  // Normalize pickup items
  const normalizedPickups = useMemo(() => {
    return (pickups || []).map((p, idx) => ({
      code: String(p.PickupCode || p.pickupCode || p.id || idx),
      name: p.PickupName || p.pickupName || p.name || p.location || `Boarding Point ${idx + 1}`,
      time: p.PickupTime || p.pickupTime || p.time || "",
      address: p.Address || p.PickupArea || p.pickupArea || "",
      landmark: p.Landmark || p.landmark || "",
      contact: p.Contact || p.contact || p.phone || "",
      crossed: Boolean(p.PickupCrossed),
      raw: p,
    }));
  }, [pickups]);

  // Normalize dropoff items
  const normalizedDropoffs = useMemo(() => {
    return (dropoffs || []).map((d, idx) => ({
      code: String(d.DropoffCode || d.dropoffCode || d.id || idx),
      name: d.DropoffName || d.dropoffName || d.name || d.location || `Dropping Point ${idx + 1}`,
      time: d.DropoffTime || d.dropoffTime || d.time || "",
      address: d.Address || d.DropoffArea || d.dropoffArea || "",
      landmark: d.Landmark || d.landmark || "",
      contact: d.Contact || d.contact || d.phone || "",
      crossed: false,
      raw: d,
    }));
  }, [dropoffs]);

  // Selected codes
  const selectedPickupCode = String(
    selectedPickup?.PickupCode ||
      selectedPickup?.pickupCode ||
      selectedPickup?.code ||
      (typeof selectedPickup === "string" ? selectedPickup : "") ||
      normalizedPickups[0]?.code ||
      ""
  );

  const selectedDropoffCode = String(
    selectedDropoff?.DropoffCode ||
      selectedDropoff?.dropoffCode ||
      selectedDropoff?.code ||
      (typeof selectedDropoff === "string" ? selectedDropoff : "") ||
      normalizedDropoffs[0]?.code ||
      ""
  );

  // Active list filtered by search
  const currentList = activeTab === "boarding" ? normalizedPickups : normalizedDropoffs;
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const q = searchQuery.toLowerCase().trim();
    return currentList.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.address && item.address.toLowerCase().includes(q))
    );
  }, [currentList, searchQuery]);

  // Selected resolved items for summary banner
  const activePickupObj =
    normalizedPickups.find((p) => p.code === selectedPickupCode) || normalizedPickups[0];
  const activeDropoffObj =
    normalizedDropoffs.find((d) => d.code === selectedDropoffCode) || normalizedDropoffs[0];

  return (
    <section className="modern-points-card" aria-label="Boarding and Dropping Points Selector">
      {/* Header with Title & Badge */}
      <div className="points-card-header">
        <div className="header-text-group">
          <div className="title-row">
            <div className="points-icon-badge">
              <Compass size={20} className="points-icon" />
            </div>
            <div>
              <h3 className="points-card-title">{title}</h3>
              <p className="points-card-subtitle">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Live Route Flow Pill */}
        <div className="points-route-pill">
          <span className="route-origin-tag">{fromCity}</span>
          <ArrowRight size={13} className="route-arrow-icon" />
          <span className="route-dest-tag">{toCity}</span>
        </div>
      </div>

      {/* Selected Points Live Quick-Review Banner */}
      <div className="points-live-selection-strip">
        <div
          className={`selection-strip-box boarding-box ${activeTab === "boarding" ? "active-focus" : ""}`}
          onClick={() => setActiveTab("boarding")}
          role="button"
          tabIndex={0}
        >
          <div className="strip-box-top">
            <span className="strip-type-badge boarding">Boarding</span>
            <span className="strip-time-text">
              <Clock size={12} />
              {activePickupObj ? formatPointTime(activePickupObj.time) : "Select"}
            </span>
          </div>
          <div className="strip-point-name" title={activePickupObj?.name || "Select Boarding Point"}>
            <MapPin size={13} className="strip-pin-icon" />
            <span>{activePickupObj?.name || "Choose boarding location"}</span>
          </div>
          {activePickupObj?.address && (
            <div className="strip-point-address">{activePickupObj.address}</div>
          )}
        </div>

        <div className="strip-middle-connector">
          <div className="connector-dot" />
          <div className="connector-line" />
          <div className="connector-dot" />
        </div>

        <div
          className={`selection-strip-box dropping-box ${activeTab === "dropping" ? "active-focus" : ""}`}
          onClick={() => setActiveTab("dropping")}
          role="button"
          tabIndex={0}
        >
          <div className="strip-box-top">
            <span className="strip-type-badge dropping">Dropping</span>
            <span className="strip-time-text">
              <Clock size={12} />
              {activeDropoffObj ? formatPointTime(activeDropoffObj.time) : "Select"}
            </span>
          </div>
          <div className="strip-point-name" title={activeDropoffObj?.name || "Select Dropping Point"}>
            <MapPin size={13} className="strip-pin-icon" />
            <span>{activeDropoffObj?.name || "Choose dropping destination"}</span>
          </div>
          {activeDropoffObj?.address && (
            <div className="strip-point-address">{activeDropoffObj.address}</div>
          )}
        </div>
      </div>

      {/* Tab Switcher & Search Bar */}
      <div className="points-controls-toolbar">
        <div className="points-tabs-container" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "boarding"}
            className={`points-tab-btn ${activeTab === "boarding" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("boarding");
              setSearchQuery("");
            }}
          >
            <Navigation size={15} />
            <span>Boarding Points</span>
            <span className="tab-count-pill">{normalizedPickups.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "dropping"}
            className={`points-tab-btn ${activeTab === "dropping" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("dropping");
              setSearchQuery("");
            }}
          >
            <MapPin size={15} />
            <span>Dropping Points</span>
            <span className="tab-count-pill">{normalizedDropoffs.length}</span>
          </button>
        </div>

        {/* Search / Filter Input */}
        <div className="points-search-field">
          <Search size={15} className="search-field-icon" />
          <input
            type="text"
            className="points-search-input"
            placeholder={
              activeTab === "boarding"
                ? "Search boarding point or landmark..."
                : "Search dropping destination..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Points Cards Grid / List */}
      <div className="points-cards-list-wrapper">
        {filteredList.length === 0 ? (
          <div className="points-empty-state">
            <Search size={24} className="empty-search-icon" />
            <p>No {activeTab === "boarding" ? "boarding" : "dropping"} points match "{searchQuery}"</p>
            <button
              type="button"
              className="reset-filter-btn"
              onClick={() => setSearchQuery("")}
            >
              Show all points
            </button>
          </div>
        ) : (
          <div className="points-cards-grid">
            {filteredList.map((point) => {
              const isSelected =
                activeTab === "boarding"
                  ? point.code === selectedPickupCode
                  : point.code === selectedDropoffCode;

              const formattedTime = formatPointTime(point.time);
              const dayBadge = getPointDayBadge(point.time);

              return (
                <div
                  key={point.code}
                  className={`point-card-item ${isSelected ? "selected-point" : ""} ${point.crossed ? "point-crossed" : ""}`}
                  onClick={() => {
                    if (activeTab === "boarding") {
                      if (onSelectPickup) onSelectPickup(point.raw || point);
                    } else {
                      if (onSelectDropoff) onSelectDropoff(point.raw || point);
                    }
                  }}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (activeTab === "boarding") {
                        if (onSelectPickup) onSelectPickup(point.raw || point);
                      } else {
                        if (onSelectDropoff) onSelectDropoff(point.raw || point);
                      }
                    }
                  }}
                >
                  {/* Left: Radio Selector Indicator */}
                  <div className="point-card-indicator">
                    <div className={`custom-radio-circle ${isSelected ? "checked" : ""}`}>
                      {isSelected && <div className="radio-inner-dot" />}
                    </div>
                  </div>

                  {/* Center: Time & Details */}
                  <div className="point-card-content">
                    <div className="point-card-top-row">
                      <span className="point-time-badge">
                        <Clock size={13} />
                        <strong>{formattedTime}</strong>
                      </span>
                      {dayBadge && <span className="point-day-pill">{dayBadge}</span>}
                      {isSelected && (
                        <span className="point-active-tag">
                          <CheckCircle2 size={12} />
                          Selected
                        </span>
                      )}
                    </div>

                    <h4 className="point-name-title">{point.name}</h4>

                    {point.address && (
                      <p className="point-address-desc">
                        <Building size={12} className="address-icon" />
                        <span>{point.address}</span>
                      </p>
                    )}

                    {point.landmark && (
                      <p className="point-landmark-desc">
                        <MapPin size={11} className="landmark-icon" />
                        <span>Landmark: {point.landmark}</span>
                      </p>
                    )}

                    {point.contact && (
                      <div className="point-contact-badge">
                        <Phone size={11} />
                        <span>{point.contact}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
