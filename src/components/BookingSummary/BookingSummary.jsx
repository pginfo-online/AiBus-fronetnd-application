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

function BookingSummary({ selectedSeats = [], price = 15, onClear, onContinue }) {
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
      {/* Top Accent Strip */}
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
          <span className="panel-field-lbl">Selected Berth(s)</span>

          {hasSeats ? (
            <div className="seat-chips-flow">
              {selectedSeats.map((seat, index) => {
                const seatDisplay = typeof seat === "object" ? seat.display || seat.id : seat;
                const seatPrice = typeof seat === "object" ? seat.price || price : price;

                return (
                  <div className="modern-seat-chip" key={index}>
                    <div className="chip-left">
                      <Armchair size={13} className="chip-armchair-icon" />
                      <strong className="chip-seat-name">{seatDisplay}</strong>
                      <span className="chip-price-tag">₹{seatPrice}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-seats-empty-state">
              <Armchair size={24} className="empty-state-icon" />
              <p className="empty-state-text">
                No seats selected yet. Click on any white seat on the bus layout to begin.
              </p>
            </div>
          )}
        </div>

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

        {/* Primary Proceed CTA Button */}
        <button
          type="button"
          disabled={!hasSeats}
          className={`modern-proceed-cta ${hasSeats ? "enabled-cta" : "disabled-cta"}`}
          onClick={onContinue}
        >
          <span>Proceed to Traveller Details</span>
          <ArrowRight size={17} className="cta-arrow" />
        </button>

        {/* Lock Notice Banner */}
        {hasSeats && (
          <div className="lock-notice-pill">
            <Clock size={13} className="clock-blue-icon" />
            <span>Seats will be temporarily held for 5 mins during checkout</span>
          </div>
        )}

        {/* Location Pricing Tip Box */}
        <div className="location-pricing-tip-box">
          <Lightbulb size={16} className="tip-bulb-icon" />
          <p className="tip-text">
            Front rows (+₹100) & Rear rows (-₹60) have location-based dynamic pricing.
          </p>
        </div>
      </div>
    </div>
  );
}

export default BookingSummary;
