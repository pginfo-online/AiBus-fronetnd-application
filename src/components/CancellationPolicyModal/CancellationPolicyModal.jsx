import React, { useEffect } from "react";
import {
  X,
  Clock,
  ShieldCheck,
  Percent,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Bus,
  ArrowRight,
  Info,
  RefreshCw,
} from "lucide-react";
import "./CancellationPolicyModal.css";

export default function CancellationPolicyModal({
  isOpen,
  onClose,
  bus,
  fromCity,
  toCity,
  journeyDate,
  seatPrice,
}) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    // Prevent background scrolling while modal is open
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const basePrice = Number(seatPrice || bus?.price || 650);
  const operatorName = bus?.operator || bus?.operatorName || "AiBus Partner";
  const busType = bus?.busType || "AC Sleeper / Seater (2+1)";
  const depTime = bus?.departureTime || "12:16 PM";

  // Parse custom policy if available from GDS / Operator
  const rawPolicies =
    bus?.cancellationPolicy ||
    bus?.seatsLayout?.CancellationPolicy ||
    bus?.seatsLayout?.cancellationPolicy ||
    [];

  let parsedPolicies = [];

  if (Array.isArray(rawPolicies) && rawPolicies.length > 0) {
    // Sort descending by minutes/cutoff
    const sorted = [...rawPolicies].sort((a, b) => {
      const minsA = a.Mins ?? (a.cutoffTimeHours ? a.cutoffTimeHours * 60 : 0);
      const minsB = b.Mins ?? (b.cutoffTimeHours ? b.cutoffTimeHours * 60 : 0);
      return minsB - minsA;
    });

    parsedPolicies = sorted.map((rule, idx) => {
      const mins = rule.Mins ?? (rule.cutoffTimeHours ? rule.cutoffTimeHours * 60 : 0);
      const hours = Math.round(mins / 60);

      // Pct is cancellation charge / penalty percentage (0 - 100)
      const penaltyPct =
        rule.Pct !== undefined
          ? Number(rule.Pct)
          : rule.cancellationFeePercentage !== undefined
          ? Number(rule.cancellationFeePercentage)
          : rule.refundPercentage !== undefined
          ? Math.max(0, 100 - Number(rule.refundPercentage))
          : 10;

      const refundPct = Math.max(0, 100 - penaltyPct);
      const refundAmt = Math.round((basePrice * refundPct) / 100);
      const penaltyAmt = Math.round((basePrice * penaltyPct) / 100);

      let timeLabel = "";
      if (hours >= 48) {
        timeLabel = `More than ${hours} hours before departure`;
      } else if (hours >= 24) {
        timeLabel = `Between 24 to ${hours} hours before departure`;
      } else if (hours > 0) {
        timeLabel = `Between ${Math.max(0, hours - 12)} to ${hours} hours before departure`;
      } else {
        timeLabel = `0 to 6 hours before departure / Post departure`;
      }

      if (idx === sorted.length - 1 && hours === 0) {
        timeLabel = `Less than 6 hours before departure`;
      }

      return {
        label: timeLabel,
        refundPct,
        penaltyPct,
        refundAmt,
        penaltyAmt,
        hours,
      };
    });
  }

  // Fallback to industry-standard 4-tier slab if operator has no specific slab
  if (!parsedPolicies || parsedPolicies.length === 0) {
    parsedPolicies = [
      {
        label: "More than 48 hours before departure",
        refundPct: 90,
        penaltyPct: 10,
        refundAmt: Math.round(basePrice * 0.9),
        penaltyAmt: Math.round(basePrice * 0.1),
      },
      {
        label: "Between 24 to 48 hours before departure",
        refundPct: 80,
        penaltyPct: 20,
        refundAmt: Math.round(basePrice * 0.8),
        penaltyAmt: Math.round(basePrice * 0.2),
      },
      {
        label: "Between 12 to 24 hours before departure",
        refundPct: 50,
        penaltyPct: 50,
        refundAmt: Math.round(basePrice * 0.5),
        penaltyAmt: Math.round(basePrice * 0.5),
      },
      {
        label: "Less than 12 hours before departure",
        refundPct: 0,
        penaltyPct: 100,
        refundAmt: 0,
        penaltyAmt: basePrice,
      },
    ];
  }

  return (
    <div
      className="cancellation-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancellation-policy-title"
    >
      <div
        className="cancellation-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="cancellation-modal-header">
          <div className="cancellation-header-info">
            <div className="cancellation-header-badge">
              <Percent size={14} /> Official Cancellation Policy
            </div>
            <h2 id="cancellation-policy-title" className="cancellation-modal-title">
              Cancellation & Refund Slabs
            </h2>
            <div className="cancellation-bus-meta">
              <span className="cancellation-meta-item">
                <Bus size={13} /> {operatorName}
              </span>
              <span className="cancellation-meta-dot">•</span>
              <span className="cancellation-meta-item">{busType}</span>
              {(fromCity || toCity) && (
                <>
                  <span className="cancellation-meta-dot">•</span>
                  <span className="cancellation-meta-item">
                    {fromCity || "Origin"} <ArrowRight size={11} className="inline-arrow" /> {toCity || "Destination"}
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            className="cancellation-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Departure & Base Price Strip */}
        <div className="cancellation-trip-strip">
          <div className="trip-strip-col">
            <span className="strip-label">Scheduled Departure</span>
            <span className="strip-value">
              <Clock size={13} /> {depTime}
              {journeyDate && ` (${journeyDate})`}
            </span>
          </div>
          <div className="trip-strip-col">
            <span className="strip-label">Calculated Base Fare</span>
            <span className="strip-value price-highlight">
              ₹{basePrice.toLocaleString("en-IN")} <span className="per-seat">/ seat</span>
            </span>
          </div>
          <div className="trip-strip-col">
            <span className="strip-label">Refund Guarantee</span>
            <span className="strip-value verified-badge">
              <ShieldCheck size={13} /> 100% Transparent
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="cancellation-modal-body">
          {/* Refund Slabs Table */}
          <div className="cancellation-table-card">
            <div className="table-card-heading">
              <Clock size={15} />
              <h4>Refund Scale by Cancellation Time</h4>
            </div>

            <div className="cancellation-table-responsive">
              <table className="cancellation-slabs-table">
                <thead>
                  <tr>
                    <th>Cancellation Window</th>
                    <th>Refund Rate</th>
                    <th>Refund Amount / Seat</th>
                    <th>Deduction Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedPolicies.map((slab, i) => {
                    const isHigh = slab.refundPct >= 80;
                    const isPartial = slab.refundPct > 0 && slab.refundPct < 80;

                    return (
                      <tr key={i} className={isHigh ? "row-high-refund" : ""}>
                        <td className="window-cell">
                          <div className="window-text-wrapper">
                            <span className="window-dot" />
                            <strong>{slab.label}</strong>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`refund-chip ${
                              isHigh
                                ? "chip-green"
                                : isPartial
                                ? "chip-yellow"
                                : "chip-red"
                            }`}
                          >
                            {slab.refundPct}% Refund
                          </span>
                        </td>
                        <td>
                          <span className="refund-val">
                            ₹{slab.refundAmt.toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td>
                          <span className="penalty-val">
                            {slab.penaltyAmt > 0
                              ? `₹${slab.penaltyAmt.toLocaleString("en-IN")}`
                              : "Free"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Policy Highlights Grid */}
          <div className="policy-highlights-grid">
            <div className="highlight-box">
              <div className="highlight-icon green">
                <RefreshCw size={16} />
              </div>
              <div className="highlight-content">
                <strong>Instant Refund Processing</strong>
                <p>
                  Refunds to UPI and wallets are credited within 2 to 4 hours. Cards and Net Banking reflect in 2-4 business days.
                </p>
              </div>
            </div>

            <div className="highlight-box">
              <div className="highlight-icon blue">
                <CheckCircle2 size={16} />
              </div>
              <div className="highlight-content">
                <strong>Partial Cancellation Allowed</strong>
                <p>
                  Traveling in a group? You can cancel individual passenger seats without having to cancel the entire ticket.
                </p>
              </div>
            </div>

            <div className="highlight-box">
              <div className="highlight-icon amber">
                <Info size={16} />
              </div>
              <div className="highlight-content">
                <strong>Calculated from Departure Point</strong>
                <p>
                  Cancellation cutoff hours are calculated strictly from the scheduled departure time of the bus from the first boarding stop.
                </p>
              </div>
            </div>

            <div className="highlight-box">
              <div className="highlight-icon purple">
                <HelpCircle size={16} />
              </div>
              <div className="highlight-content">
                <strong>Free Reschedule Options</strong>
                <p>
                  Many operators permit 1-time free date rescheduling up to 6 hours before departure subject to seat availability.
                </p>
              </div>
            </div>
          </div>

          {/* Terms & Conditions Callout */}
          <div className="cancellation-terms-card">
            <h5 className="terms-heading">
              <AlertCircle size={15} /> Important Rules & Guidelines
            </h5>
            <ul className="terms-list">
              <li>
                <strong>Post-Departure:</strong> No refund or cancellation is permitted after the bus has departed or in case of a passenger no-show.
              </li>
              <li>
                <strong>Ancillary Fees:</strong> Gateway convenience fees, travel insurance premiums, and promotional discount vouchers are non-refundable.
              </li>
              <li>
                <strong>Trip Cancellation by Operator:</strong> In the rare event that the bus operator cancels the trip, you are entitled to a 100% full refund automatically.
              </li>
              <li>
                <strong>Live Assistance:</strong> Our automated chatbot and 24/7 support line (+91 80 4710 5555) can assist with one-click instant cancellations.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="cancellation-modal-footer">
          <div className="footer-support-note">
            Have questions about this bus? Email us at{" "}
            <a href="mailto:support@aibus.in" className="support-link">
              support@aibus.in
            </a>
          </div>
          <button
            type="button"
            className="cancellation-dismiss-btn"
            onClick={onClose}
          >
            I Understand & Close
          </button>
        </div>
      </div>
    </div>
  );
}

