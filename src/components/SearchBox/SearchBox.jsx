import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bus, ArrowLeftRight, Users, User, ArrowRight } from "lucide-react";
import LocationInput from "../LocationInput/LocationInput";
import DateInput from "../DateInput/DateInput";
import busService from "../../services/busService";
import "./SearchBox.css";

function SearchBox({
  initialFromId = "",
  initialToId = "",
  initialDate = "",
  onSearch,
  layout = "horizontal",
}) {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [date, setDate] = useState(initialDate);
  const [error, setError] = useState("");
  const [tripType, setTripType] = useState("oneWay"); // "oneWay", "roundTrip", "groupBooking"
  const [passengers, setPassengers] = useState(1);
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);
  const passengerRef = useRef(null);

  useEffect(() => {
    busService.getCities().then((data) => {
      const mapped = data.map((c) => {
        let cityName = String(c.City || c.name || "").trim();
        let stateName = String(c.State || c.state || "").trim();

        cityName = cityName.replace(/([a-z])([A-Z])/g, "$1 $2");
        if (stateName) {
          stateName = stateName.replace(/([a-z])([A-Z])/g, "$1 $2");
          if (cityName.toLowerCase().endsWith(stateName.toLowerCase())) {
            cityName = cityName
              .slice(0, cityName.length - stateName.length)
              .trim()
              .replace(/,\s*$/, "");
          }
        }

        return {
          id: String(c.CityId || c.id),
          name: cityName,
          state: stateName,
        };
      });

      // Deduplicate by name and id combination so all city names/aliases from GDS are searchable
      const uniqueMap = new Map();
      mapped.forEach((city) => {
        const key = `${city.id}-${city.name.toLowerCase()}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, city);
        }
      });
      const uniqueMapped = Array.from(uniqueMap.values());

      setCities(uniqueMapped);

      if (initialFromId) {
        const f = uniqueMapped.find((c) => String(c.id) === String(initialFromId));
        if (f) setFrom(f);
      }
      if (initialToId) {
        const t = uniqueMapped.find((c) => String(c.id) === String(initialToId));
        if (t) setTo(t);
      }
    });
  }, [initialFromId, initialToId]);

  useEffect(() => {
    if (initialDate) setDate(initialDate);
  }, [initialDate]);

  // Click outside to close passenger dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (passengerRef.current && !passengerRef.current.contains(e.target)) {
        setShowPassengerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
    setError("");
  };

  const handleSearch = () => {
    if (!from) {
      setError("Please enter a departure city.");
      return;
    }
    if (!to) {
      setError("Please select your arrival city.");
      return;
    }
    if (from.id === to.id) {
      setError("Departure and arrival cities cannot be the same.");
      return;
    }
    if (!date) {
      setError("Please select a journey date.");
      return;
    }
    setError("");

    if (onSearch) {
      onSearch({
        from: from.id,
        fromName: from.name,
        to: to.id,
        toName: to.name,
        date,
        passengers,
        tripType,
      });
    } else {
      const params = new URLSearchParams({
        from: from.id,
        fromName: from.name,
        to: to.id,
        toName: to.name,
        date,
      });
      navigate(`/search?${params.toString()}`);
    }
  };

  const isHero = layout === "hero" || layout === "floating";
  const isVertical = layout === "vertical";

  if (isHero) {
    return (
      <div className="hero-search-card" id="bus-search-section">
        {/* ================================
            TRIP TYPE TOGGLES
        ================================= */}
        <div className="trip-type-tabs">
          <button
            type="button"
            className={`trip-type-pill ${tripType === "oneWay" ? "active" : ""}`}
            onClick={() => setTripType("oneWay")}
          >
            <Bus size={15} />
            <span>One Way</span>
          </button>

          <button
            type="button"
            className={`trip-type-pill ${tripType === "roundTrip" ? "active" : ""}`}
            onClick={() => setTripType("roundTrip")}
          >
            <ArrowLeftRight size={14} />
            <span>Round Trip</span>
          </button>

          <button
            type="button"
            className={`trip-type-pill ${tripType === "groupBooking" ? "active" : ""}`}
            onClick={() => setTripType("groupBooking")}
          >
            <Users size={15} />
            <span>Group Booking</span>
          </button>
        </div>

        {/* ================================
            MAIN INPUTS ROW
        ================================= */}
        <div className="hero-search-row">
          {/* FROM */}
          <div className="hero-input-field from-field">
            <LocationInput
              label="From"
              placeholder="Enter city"
              value={from}
              cities={cities}
              onChange={(val) => {
                setFrom(val);
                if (error) setError("");
              }}
              disabledCityId={to?.id}
            />
          </div>

          {/* SWAP BUTTON */}
          <button
            type="button"
            className="hero-swap-btn"
            aria-label="Swap departure and arrival cities"
            onClick={handleSwap}
          >
            <ArrowLeftRight size={16} />
          </button>

          {/* TO */}
          <div className="hero-input-field to-field">
            <LocationInput
              label="To"
              placeholder="Enter city"
              value={to}
              cities={cities}
              onChange={(val) => {
                setTo(val);
                if (error) setError("");
              }}
              disabledCityId={from?.id}
            />
          </div>

          {/* JOURNEY DATE */}
          <div className="hero-input-field date-field">
            <DateInput value={date} onChange={setDate} />
          </div>

          {/* PASSENGERS */}
          <div className="hero-input-field passenger-field" ref={passengerRef}>
            <label className="passenger-label">PASSENGERS</label>
            <button
              type="button"
              className="passenger-trigger-btn"
              onClick={() => setShowPassengerDropdown((prev) => !prev)}
            >
              <User size={16} className="passenger-icon" />
              <span className="passenger-text">
                {passengers} {passengers === 1 ? "Passenger" : "Passengers"}
              </span>
            </button>

            {showPassengerDropdown && (
              <div className="passenger-dropdown-menu">
                <span className="passenger-dropdown-title">Select Travellers</span>
                <div className="passenger-options-list">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`passenger-opt-btn ${passengers === num ? "selected" : ""}`}
                      onClick={() => {
                        setPassengers(num);
                        setShowPassengerDropdown(false);
                      }}
                    >
                      {num} {num === 1 ? "Passenger" : "Passengers"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <button type="button" className="hero-search-submit-btn" onClick={handleSearch}>
            <span>Search Buses</span>
            <ArrowRight size={18} strokeWidth={2.4} />
          </button>
        </div>

        {error && <p className="hero-search-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className={`search-box ${isVertical ? "search-box-vertical" : "search-box-horizontal"}`}>
      {isVertical && (
        <div className="search-card-header">
          <div className="search-card-badge">
            <span className="badge-pulse-dot"></span>
            <span>Easy & Instant Booking</span>
          </div>
          <h3 className="search-card-title">Book Bus Tickets</h3>
        </div>
      )}

      <div className="search-box-inputs">
        <div className="locations-wrapper">
          <LocationInput
            label="FROM"
            placeholder="Departure city"
            value={from}
            cities={cities}
            onChange={(val) => {
              setFrom(val);
              if (error) setError("");
            }}
            disabledCityId={to?.id}
          />

          <div className="swap-btn-container">
            <button
              type="button"
              className="swap-button"
              aria-label="Swap departure and arrival cities"
              onClick={handleSwap}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M7 16V4m0 0L3 8m4-4l4 4m10 4v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          <LocationInput
            label="TO"
            placeholder="Arrival city"
            value={to}
            cities={cities}
            onChange={(val) => {
              setTo(val);
              if (error) setError("");
            }}
            disabledCityId={from?.id}
          />
        </div>

        <DateInput value={date} onChange={setDate} />

        <button type="button" className="search-button" onClick={handleSearch}>
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Search Buses
        </button>
      </div>
      {error && <p className="search-error">{error}</p>}
    </div>
  );
}

export default SearchBox;