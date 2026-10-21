import React from "react";
import {
  Armchair,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Lightbulb,
  Tag,
  Clock,
  Sparkles,
  X,
} from "lucide-react";
import "./BookingSummary.css";

function BookingSummary({
  selectedSeats = [],
  price = 15,
  pickups = [],
  dropoffs = [],
  selectedPickup,
  selectedDropoff,
  onSelectPickup,
  onSelectDropoff,
  onClear,
  onRemoveSeat,
  onContinue,
}) {
  const hasSeats = selectedSeats.length > 0;

  // Calculate actual total sum from selected seat objects (or default to count * price)
  const totalAmount = hasSeats
    ? selectedSeats.reduce(
        (sum, s) => sum + (typeof s === "object" ? s.price || price : price),
        0
      )
    : 0;

  const count = selectedSeats.length;

  return (
    <div className="modern-selection-card">
      {/* Top Accent Strip (redBus Red) */}
      <div className="selection-card-accent-strip" />

      {/* Card Header */}
      <div className="modern-selection-header">
        <div className="selection-header-left">
          <h3 className="selection-header-title">Your Selection</h3>
          {hasSeats && (
            <span className="seat-count-bubble">
              {count} Seat{count > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {hasSeats && (
          <button
            type="button"
            className="clear-all-btn"
            onClick={onClear}
            title="Clear all selected seats"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Body Section */}
      <div className="selection-card-body">
        {/* Selected Seats Chips */}
        <div className="selected-seats-panel">
          <span className="panel-field-lbl">Selected Seat(s)</span>

          {hasSeats ? (
            <div className="seat-chips-flow">
              {selectedSeats.map((seat, index) => {
                const seatDisplay = typeof seat === "object" ? seat.display || seat.seatNo || seat.id : seat;
                const seatPrice = typeof seat === "object" ? seat.price || price : price;

                return (
                  <div className="modern-seat-chip" key={index}>
                    <div className="chip-left">
                      <Armchair size={13} className="chip-armchair-icon" />
                      <strong className="chip-seat-name">{seatDisplay}</strong>
                      <span className="chip-price-tag">₹{seatPrice}</span>
                    </div>
                    {onRemoveSeat && (
                      <button
                        type="button"
                        className="chip-remove-btn"
                        onClick={() => onRemoveSeat(seat)}
                        title={`Remove seat ${seatDisplay}`}
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-seats-empty-state">
              <Armchair size={24} className="empty-state-icon" />
              <p className="empty-state-text">
                No seats selected yet. Click any green seat on the bus diagram to start booking.
              </p>
            </div>
          )}
        </div>

        {/* Inline Boarding & Dropping Point Picker (like redBus) */}
        {hasSeats && (pickups.length > 0 || dropoffs.length > 0) && (
          <div className="summary-points-picker-section">
            {pickups.length > 0 && (
              <div className="summary-picker-group">
                <div className="picker-header-row">
                  <span className="picker-title-label">📍 Boarding Point</span>
                  {selectedPickup?.PickupTime && (
                    <span className="picker-time-tag">{selectedPickup.PickupTime}</span>
                  )}
                </div>
                <select
                  className="summary-points-dropdown"
                  value={selectedPickup?.PickupId || selectedPickup?.id || ""}
                  onChange={(e) => {
                    const found = pickups.find(
                      (p) => String(p.PickupId || p.id) === e.target.value
                    );
                    if (found && onSelectPickup) onSelectPickup(found);
                  }}
                >
                  {pickups.map((p, idx) => (
                    <option key={idx} value={p.PickupId || p.id}>
                      {p.PickupTime || p.time ? `${p.PickupTime || p.time} - ` : ""}{p.PickupName || p.name || p.location}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {dropoffs.length > 0 && (
              <div className="summary-picker-group">
                <div className="picker-header-row">
                  <span className="picker-title-label">📍 Dropping Point</span>
                  {selectedDropoff?.DropoffTime && (
                    <span className="picker-time-tag">{selectedDropoff.DropoffTime}</span>
                  )}
                </div>
                <select
                  className="summary-points-dropdown"
                  value={selectedDropoff?.DropoffId || selectedDropoff?.id || ""}
                  onChange={(e) => {
                    const found = dropoffs.find(
                      (d) => String(d.DropoffId || d.id) === e.target.value
                    );
                    if (found && onSelectDropoff) onSelectDropoff(found);
                  }}
                >
                  {dropoffs.map((d, idx) => (
                    <option key={idx} value={d.DropoffId || d.id}>
                      {d.DropoffTime || d.time ? `${d.DropoffTime || d.time} - ` : ""}{d.DropoffName || d.name || d.location}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div className="summary-divider-line" />

        {/* Pricing Breakdown */}
        <div className="fare-breakdown-table">
          <div className="breakdown-row">
            <span className="breakdown-lbl">Base Fare</span>
            <span className="breakdown-val">
              {hasSeats ? `₹${price} × ${count}` : `from ₹${price}`}
            </span>
          </div>

          <div className="breakdown-row">
            <span className="breakdown-lbl">Taxes & GST</span>
            <span className="breakdown-val free-badge">Included</span>
          </div>

          <div className="breakdown-row total-highlight-row">
            <div className="total-title-col">
              <span className="total-hero-title">Total Amount</span>
              <span className="total-tax-note">All taxes & fees included</span>
            </div>
            <div className="total-hero-price">
              <span className="total-currency">₹</span>
              <span className="total-num">{totalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Primary Proceed CTA Button (redBus Red) */}
        <button
          type="button"
          disabled={!hasSeats}
          className={`modern-proceed-cta ${hasSeats ? "enabled-cta" : "disabled-cta"}`}
          onClick={onContinue}
        >
          <span>PROCEED TO BOOK</span>
          <ArrowRight size={17} className="cta-arrow" />
        </button>

        {/* Lock Notice Banner */}
        {hasSeats && (
          <div className="lock-notice-pill">
            <Clock size={13} className="clock-blue-icon" />
            <span>Seats will be temporarily held for 5 mins during checkout</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingSummary;
