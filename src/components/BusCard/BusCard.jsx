import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Wifi, 
  Zap, 
  Sparkles, 
  Droplets, 
  ShieldCheck, 
  Star, 
  ArrowRight, 
  Tv, 
  Radio, 
  Wind,
  Clock,
  MapPin,
  Eye,
} from "lucide-react";
import BusDetailsModal from "../BusDetailsModal/BusDetailsModal";
import "./BusCard.css";

function AmenityBadge({ name }) {
  const norm = (name || "").toLowerCase();
  let Icon = Sparkles;
  let label = name;

  if (norm.includes("wifi")) {
    Icon = Wifi;
    label = "Free WiFi";
  } else if (norm.includes("charg") || norm.includes("plug")) {
    Icon = Zap;
    label = "USB Charging";
  } else if (norm.includes("water")) {
    Icon = Droplets;
    label = "Water Bottle";
  } else if (norm.includes("blanket") || norm.includes("pillow")) {
    Icon = Sparkles;
    label = "Blanket";
  } else if (norm.includes("gps") || norm.includes("tracking")) {
    Icon = Radio;
    label = "Live GPS";
  } else if (norm.includes("tv") || norm.includes("entertainment")) {
    Icon = Tv;
    label = "Movies/TV";
  } else if (norm.includes("emergency") || norm.includes("ticket") || norm.includes("safe")) {
    Icon = ShieldCheck;
    label = "M-Ticket";
  }

  return (
    <span className="modern-amenity-chip" title={label}>
      <Icon size={12} className="amenity-chip-icon" />
      <span>{label}</span>
    </span>
  );
}

function BusCard({ bus, searchFrom, searchTo, searchFromId, searchToId, searchDate }) {
  const navigate = useNavigate();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleSelectSeats = () => {
    const params = new URLSearchParams({
      busId: bus.routeBusId || bus.busId || bus.id,
      from: searchFrom || bus.from || "Origin",
      to: searchTo || bus.to || "Destination",
      fromId: searchFromId || "",
      toId: searchToId || "",
      date: bus.date || searchDate || "",
    });
    navigate(`/seat-selection?${params.toString()}`, { state: { bus } });
  };

  const rawAmenities = Array.isArray(bus.amenities) && bus.amenities.length > 0
    ? bus.amenities
    : ["Free WiFi", "USB Charging", "Live GPS", "Blanket", "Water Bottle"];

  const amenities = rawAmenities
    .filter((item) => {
      const lower = String(item).toLowerCase();
      return !["ac", "non ac", "non-ac", "sleeper", "seater"].includes(lower);
    })
    .slice(0, 4);

  const availableSeats = bus.availableSeats ?? bus.seats ?? 18;
  const operatorName = bus.operator || "Express Transit";
  const initials = operatorName
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "BUS";

  const isLowSeats = availableSeats <= 5 && availableSeats > 0;

  return (
    <>
      <article className="modern-bus-card">
        <div className="bus-card-inner-grid">
          {/* Left Section: Operator Brand Info */}
          <div className="bus-brand-info">
            <div className="operator-header-row">
              <div className="operator-avatar-badge">{initials}</div>
              <div className="operator-meta">
                <div className="operator-title-wrap">
                  <h3 className="operator-heading">{operatorName}</h3>
                  <span className="verified-check" title="Verified Safe Operator">
                    <ShieldCheck size={14} />
                  </span>
                </div>
                <span className="bus-type-subtitle">{bus.busType || "AC Luxury Coach"}</span>
              </div>
            </div>

            <div className="rating-and-badges">
              <div className="modern-rating-pill">
                <Star size={12} className="star-fill-icon" />
                <strong>{bus.rating ? Number(bus.rating).toFixed(1) : "4.8"}</strong>
              </div>
              <span className="reviews-text">
                {typeof bus.reviews === "string" ? bus.reviews : "120+ ratings"}
              </span>
            </div>
          </div>

          {/* Middle Section: Route & Departure/Arrival Timeline */}
          <div className="bus-timeline-section">
            <div className="timeline-grid">
              {/* Departure */}
              <div className="time-node departure-node">
                <div className="time-digit">{bus.departureTime || "08:30"}</div>
                <div className="city-pill">
                  <MapPin size={11} className="pin-icon" />
                  <span>{bus.from || searchFrom}</span>
                </div>
              </div>

              {/* Duration Track */}
              <div className="duration-route-track">
                <span className="duration-bubble">
                  <Clock size={11} />
                  {bus.duration || "6h 00m"}
                </span>
                <div className="route-visual-line">
                  <span className="route-dot start-dot" />
                  <div className="track-line" />
                  <span className="route-dot end-dot" />
                </div>
                <span className="route-type-tag">Direct Service</span>
              </div>

              {/* Arrival */}
              <div className="time-node arrival-node">
                <div className="time-digit">{bus.arrivalTime || "14:30"}</div>
                <div className="city-pill">
                  <MapPin size={11} className="pin-icon" />
                  <span>{bus.to || searchTo}</span>
                </div>
              </div>
            </div>

            {/* Amenities & View Details Link */}
            <div className="amenities-bottom-row">
              <div className="amenities-strip">
                {amenities.map((item, idx) => (
                  <AmenityBadge key={idx} name={item} />
                ))}
              </div>
              <button
                type="button"
                className="view-details-trigger-btn"
                onClick={() => setIsDetailsOpen(true)}
              >
                <Eye size={13} />
                <span>View Details & Policy</span>
              </button>
            </div>
          </div>

          {/* Right Section: Price & Action CTA */}
          <div className="bus-action-section">
            <div className="seats-urgency-box">
              {isLowSeats ? (
                <span className="seat-badge low-seats">
                  🔥 Only {availableSeats} Seats Left!
                </span>
              ) : (
                <span className="seat-badge plenty-seats">
                  🟢 {availableSeats} Seats Available
                </span>
              )}
            </div>

            <div className="price-fare-box">
              <span className="starting-label">Starting From</span>
              <div className="price-hero-value">
                <span className="currency-sym">₹</span>
                <span className="fare-num">{bus.price || 650}</span>
              </div>
              <span className="tax-inclusive-text">All taxes included</span>
            </div>

            <button
              type="button"
              className="modern-select-seats-cta"
              onClick={handleSelectSeats}
            >
              <span>Select Seats</span>
              <ArrowRight size={15} className="cta-arrow-icon" />
            </button>
          </div>
        </div>
      </article>

      {/* Modern Live Bus Details Modal */}
      {isDetailsOpen && (
        <BusDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          initialBus={bus}
          fromCityId={searchFromId}
          toCityId={searchToId}
          journeyDate={searchDate || bus.date}
          fromName={searchFrom || bus.from}
          toName={searchTo || bus.to}
          onSelectSeats={handleSelectSeats}
        />
      )}
    </>
  );
}

export default BusCard;