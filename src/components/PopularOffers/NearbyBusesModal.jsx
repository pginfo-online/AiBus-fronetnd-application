import { useState } from "react";
import { useNavigate } from "react-router-dom";

const NEARBY_LOCATIONS = [
  "Anand Vihar ISBT, Delhi NCR",
  "Kashmere Gate ISBT, Delhi",
  "Sector 62 / Botanical Garden, Noida",
  "Majestic Bus Stand, Bengaluru",
  "Dadar TT Circle, Mumbai",
];

const NEARBY_BUSES = [
  {
    id: "nb-1",
    busName: "AiBus Royal Club Multi-Axle",
    busType: "AC Sleeper (2+1)",
    fromCity: "Delhi",
    toCity: "Jaipur",
    boardingPoint: "Platform 4, Anand Vihar ISBT (800m away)",
    departureTime: "11:45 AM",
    departureIn: "Departing in 35 mins",
    isFast: true,
    rating: "4.8",
    ratingCount: "320+",
    seatsLeft: 12,
    fare: "₹749",
    category: "sleeper",
    amenities: ["WiFi", "Blanket", "Charging Point", "Water Bottle"],
  },
  {
    id: "nb-2",
    busName: "AiBus Gold Express Seater",
    busType: "AC Pushback Seater (2+2)",
    fromCity: "Delhi",
    toCity: "Agra",
    boardingPoint: "Gate 2 Bus Bay, ISBT (1.2 km away)",
    departureTime: "12:20 PM",
    departureIn: "Departing in 1h 10m",
    isFast: false,
    rating: "4.7",
    ratingCount: "184+",
    seatsLeft: 7,
    fare: "₹499",
    category: "seater",
    amenities: ["AC", "Reclining Seats", "Charging Point"],
  },
  {
    id: "nb-3",
    busName: "AiBus Northern Star Premium",
    busType: "AC Sleeper / Seater (2+1)",
    fromCity: "Delhi",
    toCity: "Dehradun",
    boardingPoint: "Kashmere Gate Metro Gate 1 (3.5 km away)",
    departureTime: "01:15 PM",
    departureIn: "Departing in 2h 05m",
    isFast: false,
    rating: "4.6",
    ratingCount: "95+",
    seatsLeft: 18,
    fare: "₹620",
    category: "sleeper",
    amenities: ["AC", "Reading Light", "Pillow", "Live GPS"],
  },
  {
    id: "nb-4",
    busName: "AiBus Quick-Hop Express",
    busType: "Non-AC Hi-Tech (2+2)",
    fromCity: "Delhi",
    toCity: "Mathura",
    boardingPoint: "Noida Sector 37 Underpass (4.1 km away)",
    departureTime: "01:45 PM",
    departureIn: "Departing in 2h 35m",
    isFast: false,
    rating: "4.4",
    ratingCount: "62",
    seatsLeft: 22,
    fare: "₹299",
    category: "seater",
    amenities: ["Express Route", "Punctual", "First Aid"],
  },
];

function NearbyBusesModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState(NEARBY_LOCATIONS[0]);
  const [isLocating, setIsLocating] = useState(false);
  const [filterType, setFilterType] = useState("all");

  if (!isOpen) return null;

  const handleRefreshLocation = () => {
    setIsLocating(true);
    setTimeout(() => {
      // Pick next or random location
      const nextIndex = (NEARBY_LOCATIONS.indexOf(currentLocation) + 1) % NEARBY_LOCATIONS.length;
      setCurrentLocation(NEARBY_LOCATIONS[nextIndex]);
      setIsLocating(false);
    }, 600);
  };

  const filteredBuses = NEARBY_BUSES.filter((bus) => {
    if (filterType === "soon") return bus.isFast;
    if (filterType === "sleeper") return bus.category === "sleeper";
    if (filterType === "seater") return bus.category === "seater";
    return true;
  });

  const handleBookNow = (bus) => {
    onClose();
    // Get today's date in YYYY-MM-DD
    const today = new Date().toISOString().split("T")[0];
    const params = new URLSearchParams({
      from: bus.fromCity,
      to: bus.toCity,
      date: today,
    });
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container nearby-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-badge-icon badge-blue">📍</span>
            <div>
              <h3>Buses Near You</h3>
              <p>Find & board buses departing shortly from your nearest bus terminals</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Location Detection Bar */}
        <div className="location-detector-bar">
          <div className="location-info">
            <span className="pulse-indicator"></span>
            <div>
              <span className="location-label">CURRENT DETECTED LOCATION</span>
              <strong className="location-name">{currentLocation}</strong>
            </div>
          </div>

          <button
            type="button"
            className="refresh-location-btn"
            onClick={handleRefreshLocation}
            disabled={isLocating}
          >
            <svg
              className={isLocating ? "spin-icon" : ""}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {isLocating ? "Detecting..." : "Change / Refresh"}
          </button>
        </div>

        {/* Filter Chips */}
        <div className="modal-tabs">
          <button
            type="button"
            className={`tab-btn ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All Departures ({NEARBY_BUSES.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${filterType === "soon" ? "active" : ""}`}
            onClick={() => setFilterType("soon")}
          >
            ⚡ Departing Soon (&lt; 45m)
          </button>
          <button
            type="button"
            className={`tab-btn ${filterType === "sleeper" ? "active" : ""}`}
            onClick={() => setFilterType("sleeper")}
          >
            AC Sleeper
          </button>
          <button
            type="button"
            className={`tab-btn ${filterType === "seater" ? "active" : ""}`}
            onClick={() => setFilterType("seater")}
          >
            Seater Buses
          </button>
        </div>

        {/* Buses List */}
        <div className="modal-body-scroll">
          <div className="nearby-buses-list">
            {filteredBuses.map((bus) => (
              <div key={bus.id} className="nearby-bus-card">
                <div className="bus-card-top-row">
                  <div>
                    <h4 className="bus-title">{bus.busName}</h4>
                    <span className="bus-type-sub">{bus.busType}</span>
                  </div>
                  <div className="bus-price-tag">
                    <span className="fare-label">Starting from</span>
                    <strong className="fare-amount">{bus.fare}</strong>
                  </div>
                </div>

                <div className="bus-route-highlight">
                  <div className="route-point">
                    <span className="dot-green"></span>
                    <div>
                      <strong>{bus.fromCity}</strong>
                      <span className="time-sub">{bus.departureTime}</span>
                    </div>
                  </div>
                  <div className="route-arrow">➔</div>
                  <div className="route-point">
                    <span className="dot-red"></span>
                    <div>
                      <strong>{bus.toCity}</strong>
                      <span className="time-sub">Direct</span>
                    </div>
                  </div>
                </div>

                <div className="bus-boarding-info">
                  <span className="info-icon">📍</span>
                  <span>{bus.boardingPoint}</span>
                </div>

                <div className="bus-amenities-row">
                  {bus.amenities.map((item, idx) => (
                    <span key={idx} className="amenity-chip">
                      ✓ {item}
                    </span>
                  ))}
                </div>

                <div className="nearby-card-footer">
                  <div className="bus-badges">
                    <span className="depart-badge">{bus.departureIn}</span>
                    <span className="seats-badge">💺 {bus.seatsLeft} seats left</span>
                    <span className="rating-pill">★ {bus.rating}</span>
                  </div>
                  <button
                    type="button"
                    className="action-btn btn-solid-blue"
                    onClick={() => handleBookNow(bus)}
                  >
                    Book Now &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <p className="footer-note">
            📍 Showing real-time scheduled departures within 15 km with live boarding gate tracking.
          </p>
          <button type="button" className="action-btn btn-outline-gray" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default NearbyBusesModal;
