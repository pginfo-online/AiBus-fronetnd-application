import React, { useState } from "react";
import {
  Clock,
  MapPin,
  Calendar,
  ShieldCheck,
  Info,
  Sparkles,
  ArrowRight,
  Bus,
} from "lucide-react";
import BusDetailsModal from "../BusDetailsModal/BusDetailsModal";
import "./TripSummary.css";

function formatTripDate(dateStr) {
  if (!dateStr) return "Fri, 9 Oct, 2026";
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

function TripSummary({ bus, from, to, date }) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  if (!bus) return null;

  const displayFrom = from || bus.from || "Bangalore";
  const displayTo = to || bus.to || "Madras";
  const displayDate = formatTripDate(date || bus.date);
  const operatorName = bus.operator || "GDS Demo Express";
  const initials =
    operatorName
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "BUS";

  return (
    <>
      <div className="modern-trip-summary-card">
        {/* Left: Operator Branding */}
        <div className="trip-operator-col">
          <div className="operator-logo-badge">{initials}</div>
          <div className="operator-text-wrap">
            <div className="operator-heading-row">
              <h2 className="trip-operator-name">{operatorName}</h2>
              <span className="verified-shield-pill" title="Verified Safe Bus">
                <ShieldCheck size={13} />
                <span>Verified</span>
              </span>
            </div>
            <span className="trip-bus-type-badge">
              {bus.busType || bus.busNumber || "2X2(35) NAC Seater"}
            </span>
          </div>
        </div>

        {/* Middle: Live Route Timeline */}
        <div className="trip-route-timeline-wrap">
          {/* Departure */}
          <div className="route-node dep-node">
            <span className="route-time-val">{bus.departureTime || "12:16"}</span>
            <div className="route-city-tag">
              <MapPin size={12} className="pin-blue" />
              <span>{displayFrom}</span>
            </div>
          </div>

          {/* Central Track */}
          <div className="route-track-center">
            <span className="duration-pill">
              <Clock size={11} />
              <span>{bus.duration || "12h 05m"}</span>
            </span>
            <div className="visual-route-track">
              <span className="track-dot start-dot" />
              <div className="track-line-body" />
              <span className="track-dot end-dot" />
            </div>
            <button
              type="button"
              className="quick-route-details-link"
              onClick={() => setIsDetailsOpen(true)}
            >
              <Info size={11} />
              <span>View Route & Policy</span>
            </button>
          </div>

          {/* Arrival */}
          <div className="route-node arr-node">
            <span className="route-time-val">{bus.arrivalTime || "00:21"}</span>
            <div className="route-city-tag">
              <MapPin size={12} className="pin-red" />
              <span>{displayTo}</span>
            </div>
          </div>
        </div>

        {/* Right: Date & Price Banner */}
        <div className="trip-meta-right-col">
          <div className="trip-date-pill">
            <Calendar size={13} className="cal-icon" />
            <span className="date-string">{displayDate}</span>
          </div>

          <div className="trip-fare-strip">
            <span className="fare-subtext">Starting from</span>
            <div className="fare-price-row">
              <span className="currency-symbol">₹</span>
              <span className="fare-amount">{bus.price || 15}</span>
              <span className="seat-unit-label">/ seat</span>
            </div>
          </div>
        </div>
      </div>

      {/* Details & Policy Modal */}
      {isDetailsOpen && (
        <BusDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          initialBus={bus}
          fromName={displayFrom}
          toName={displayTo}
          journeyDate={date || bus.date}
        />
      )}
    </>
  );
}

export default TripSummary;
