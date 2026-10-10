import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

  useEffect(() => {
    busService.getCities().then((data) => {
      const mapped = data.map((c) => ({
        id: String(c.CityId || c.id),
        name: c.City || c.name,
        state: c.State || "",
      }));

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

  const isVertical = layout === "vertical";

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