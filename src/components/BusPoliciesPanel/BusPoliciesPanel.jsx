import React, { useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  PawPrint,
  Milestone,
  Wine,
  Bus,
  Clock,
  MapPin,
  Coffee,
  Star,
  Armchair,
  Check,
} from "lucide-react";
import BookingSummary from "../BookingSummary/BookingSummary";
import "./BusPoliciesPanel.css";

export default function BusPoliciesPanel({
  bus,
  pickups = [],
  dropoffs = [],
  selectedPickup,
  selectedDropoff,
  onSelectPickup,
  onSelectDropoff,
  routeText = "Via Samruddhi Highway",
  activeTab = "policies",
  onTabChange,
  selectedSeats = [],
  onClearSeats,
  onRemoveSeat,
  onContinue,
}) {
  const tabsScrollRef = useRef(null);

  const scrollTabs = (direction) => {
    if (tabsScrollRef.current) {
      tabsScrollRef.current.scrollBy({
        left: direction === "left" ? -140 : 140,
        behavior: "smooth",
      });
    }
  };

  const tabs = [
    { id: "selection", label: "Your Selection", count: selectedSeats.length },
    { id: "boarding", label: "Boarding point" },
    { id: "dropping", label: "Dropping point" },
    { id: "rest", label: "Rest stop" },
    { id: "reviews", label: "Rating and reviews" },
    { id: "policies", label: "Other Policies" },
  ];

  // Auto-scroll active tab into view
  useEffect(() => {
    if (tabsScrollRef.current) {
      const activeEl = tabsScrollRef.current.querySelector(".policy-tab-item.active");
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [activeTab]);

  const totalAmount = selectedSeats.reduce(
    (sum, s) => sum + (typeof s === "object" ? s.price || bus?.price || 1700 : bus?.price || 1700),
    0
  );

  return (
    <div className="bus-policies-panel-card">
      {/* Top Horizontal Scrolling Tabs Bar (Matches Image 1 Exactly) */}
      <div className="policies-tabs-nav-bar">
        <button
          type="button"
          className="tab-nav-arrow-btn left"
          onClick={() => scrollTabs("left")}
          title="Scroll tabs left"
          aria-label="Scroll left"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="policies-tabs-track" ref={tabsScrollRef}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`policy-tab-item ${isActive ? "active" : ""}`}
                onClick={() => onTabChange(tab.id)}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="tab-pill-badge">{tab.count}</span>
                )}
                {isActive && <div className="tab-red-indicator" />}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="tab-nav-arrow-btn right"
          onClick={() => scrollTabs("right")}
          title="Scroll tabs right"
          aria-label="Scroll right"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Tab Body Content */}
      <div className="policies-panel-content">
        {/* TAB 0: YOUR SELECTION (Matches Image 2 Exactly) */}
        {activeTab === "selection" && (
          <div className="selection-view-wrapper">
            <BookingSummary
              selectedSeats={selectedSeats}
              price={bus?.price || 11}
              pickups={pickups}
              dropoffs={dropoffs}
              selectedPickup={selectedPickup}
              selectedDropoff={selectedDropoff}
              onSelectPickup={onSelectPickup}
              onSelectDropoff={onSelectDropoff}
              onClear={onClearSeats}
              onRemoveSeat={onRemoveSeat}
              onContinue={onContinue}
            />
          </div>
        )}

        {/* TAB 1: OTHER POLICIES (Matches Image 1 Exactly) */}
        {activeTab === "policies" && (
          <div className="policy-tab-content">
            {/* Top Baggage Notice */}
            <p className="policy-lead-notice">
              Excess baggage over 20 kgs per passenger will be chargeable
            </p>

            {/* Policy 1: Pets Policy */}
            <div className="policy-entry-item">
              <div className="policy-icon-wrap">
                <PawPrint size={18} className="policy-entry-icon" />
              </div>
              <div className="policy-text-wrap">
                <h4 className="policy-title">Pets Policy</h4>
                <p className="policy-desc">Pets are not allowed</p>
              </div>
            </div>

            {/* Policy 2: Route Policy */}
            <div className="policy-entry-item">
              <div className="policy-icon-wrap">
                <Milestone size={18} className="policy-entry-icon" />
              </div>
              <div className="policy-text-wrap">
                <h4 className="policy-title">Route Policy</h4>
                <p className="policy-desc">
                  Bus will pass through {routeText || "Via Samruddhi Highway"}
                </p>
              </div>
            </div>

            {/* Policy 3: Liquor Policy */}
            <div className="policy-entry-item">
              <div className="policy-icon-wrap">
                <Wine size={18} className="policy-entry-icon" />
              </div>
              <div className="policy-text-wrap">
                <h4 className="policy-title">Liquor Policy</h4>
                <p className="policy-desc">
                  Carrying or consuming liquor inside the bus is prohibited. Bus operator reserves the right to deboard drunk passengers.
                </p>
              </div>
            </div>

            {/* Policy 4: Pick up time policy */}
            <div className="policy-entry-item">
              <div className="policy-icon-wrap">
                <Bus size={18} className="policy-entry-icon" />
              </div>
              <div className="policy-text-wrap">
                <h4 className="policy-title">Pick up time policy</h4>
                <p className="policy-desc">
                  Bus operator is not obligated to wait beyond the scheduled departure time of the bus. No refund request will be entertained for late arriving passengers.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BOARDING POINT */}
        {activeTab === "boarding" && (
          <div className="policy-tab-content points-list-view">
            <h4 className="section-mini-heading">Boarding Locations & Schedule</h4>
            {pickups.length > 0 ? (
              <div className="sub-timeline-list">
                {pickups.map((p, idx) => (
                  <div className="sub-timeline-node" key={idx}>
                    <div className="sub-timeline-bullet" />
                    <div className="sub-point-details">
                      <div className="sub-point-title-row">
                        <strong className="sub-point-name">
                          {p.PickupName || p.name || p.location || `Point ${idx + 1}`}
                        </strong>
                        <span className="sub-point-time">{p.PickupTime || p.time || "11:05 PM"}</span>
                      </div>
                      {(p.Address || p.address || p.Landmark) && (
                        <p className="sub-point-sub">{p.Address || p.address || p.Landmark}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="sub-timeline-list">
                <div className="sub-timeline-node">
                  <div className="sub-timeline-bullet" />
                  <div className="sub-point-details">
                    <div className="sub-point-title-row">
                      <strong className="sub-point-name">Peenya (Near Flyover)</strong>
                      <span className="sub-point-time">11:05 PM</span>
                    </div>
                    <p className="sub-point-sub">Opposite Peenya Metro Station, Bangalore</p>
                  </div>
                </div>
                <div className="sub-timeline-node">
                  <div className="sub-timeline-bullet" />
                  <div className="sub-point-details">
                    <div className="sub-point-title-row">
                      <strong className="sub-point-name">Race Course Road</strong>
                      <span className="sub-point-time">11:15 PM</span>
                    </div>
                    <p className="sub-point-sub">Anandrao Circle, Bangalore</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DROPPING POINT */}
        {activeTab === "dropping" && (
          <div className="policy-tab-content points-list-view">
            <h4 className="section-mini-heading">Arrival & Dropping Locations</h4>
            {dropoffs.length > 0 ? (
              <div className="sub-timeline-list">
                {dropoffs.map((d, idx) => (
                  <div className="sub-timeline-node" key={idx}>
                    <div className="sub-timeline-bullet dropping" />
                    <div className="sub-point-details">
                      <div className="sub-point-title-row">
                        <strong className="sub-point-name">
                          {d.DropoffName || d.name || d.location || `Destination Point ${idx + 1}`}
                        </strong>
                        <span className="sub-point-time">{d.DropoffTime || d.time || "09:30 AM"}</span>
                      </div>
                      {(d.Address || d.address || d.Landmark) && (
                        <p className="sub-point-sub">{d.Address || d.address || d.Landmark}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="sub-timeline-list">
                <div className="sub-timeline-node">
                  <div className="sub-timeline-bullet dropping" />
                  <div className="sub-point-details">
                    <div className="sub-point-title-row">
                      <strong className="sub-point-name">Chennai Central (Periamet)</strong>
                      <span className="sub-point-time">09:30 AM</span>
                    </div>
                    <p className="sub-point-sub">Opposite Railway Station, Chennai</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REST STOP */}
        {activeTab === "rest" && (
          <div className="policy-tab-content">
            <div className="rest-stop-banner">
              <div className="rest-icon-box">
                <Coffee size={20} className="rest-coffee-icon" />
              </div>
              <div className="rest-meta">
                <h4 className="rest-title">Highway Express Food Plaza</h4>
                <p className="rest-sub">Expressway Corridor • 25 - 30 Minutes</p>
              </div>
            </div>
            <div className="rest-features-grid">
              <span className="rest-tag">✨ Sanitized Washrooms</span>
              <span className="rest-tag">🍽️ Pure Veg Food Court</span>
              <span className="rest-tag">☕ 24x7 Tea & Refreshments</span>
              <span className="rest-tag">🏧 Working ATM Facility</span>
            </div>
          </div>
        )}

        {/* TAB 5: RATING AND REVIEWS */}
        {activeTab === "reviews" && (
          <div className="policy-tab-content">
            <div className="rating-overview-row">
              <div className="rating-score-box">
                <span className="rating-big-num">{bus?.rating || "4.8"}</span>
                <div className="rating-stars-row">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <span className="reviews-count-lbl">520+ verified travelers</span>
              </div>
              <div className="rating-metrics-bars">
                <div className="metric-row">
                  <span>Bus Cleanliness</span>
                  <div className="metric-bar-bg"><div className="metric-bar-fill" style={{ width: "95%" }} /></div>
                  <strong>4.9</strong>
                </div>
                <div className="metric-row">
                  <span>Punctuality</span>
                  <div className="metric-bar-bg"><div className="metric-bar-fill" style={{ width: "92%" }} /></div>
                  <strong>4.8</strong>
                </div>
                <div className="metric-row">
                  <span>Staff Behavior</span>
                  <div className="metric-bar-bg"><div className="metric-bar-fill" style={{ width: "90%" }} /></div>
                  <strong>4.7</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Selection Notice Bar when user is on another tab */}
      {activeTab !== "selection" && selectedSeats.length > 0 && (
        <div className="policy-bottom-selection-strip">
          <div className="selection-mini-info">
            <span className="selection-mini-count">
              {selectedSeats.length} Berth{selectedSeats.length > 1 ? "s" : ""} Selected
            </span>
            <strong className="selection-mini-price">₹{totalAmount.toLocaleString("en-IN")}</strong>
          </div>
          <button
            type="button"
            className="selection-mini-action-btn"
            onClick={() => onTabChange("selection")}
          >
            Review Selection ➔
          </button>
        </div>
      )}
    </div>
  );
}
