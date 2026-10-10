import { useState, useRef, useEffect, useMemo } from "react";
import "./LocationInput.css";

function LocationInput({ label, placeholder, value, onChange, disabledCityId = "", cities = [] }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState(value?.name || "");

  useEffect(() => {
    if (value?.name) {
      setSearchTerm(value.name);
    }
  }, [value]);

  const searchLower = searchTerm.toLowerCase().trim();

  const filteredCities = useMemo(() => {
    if (!cities || cities.length === 0) return [];
    if (!searchLower) {
      // Show major hubs first when field is empty
      const popularHubs = [
        "Bangalore",
        "Bengaluru",
        "Chennai",
        "Madras",
        "Mumbai",
        "Pune",
        "Hyderabad",
        "Delhi",
        "Jaipur",
        "Ahmedabad",
        "Goa",
        "Coimbatore",
      ];
      const matchedPopular = [];
      for (const name of popularHubs) {
        const found = cities.find((c) => c.name.toLowerCase() === name.toLowerCase());
        if (found && !matchedPopular.some((m) => m.id === found.id && m.name === found.name)) {
          matchedPopular.push(found);
        }
      }
      return matchedPopular;
    }

    const starts = [];
    const contains = [];
    for (const city of cities) {
      const cName = city.name.toLowerCase();
      if (cName.startsWith(searchLower)) {
        starts.push(city);
      } else if (cName.includes(searchLower)) {
        contains.push(city);
      }
      if (starts.length + contains.length >= 60) break;
    }
    return starts.concat(contains);
  }, [cities, searchLower]);

  const isCityDisabled = (city) => {
    if (!disabledCityId || !city) return false;
    return String(city.id) === String(disabledCityId);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (event) => {
    const val = event.target.value;
    setSearchTerm(val);
    setShowSuggestions(true);

    const exactMatch = cities.find(
      (c) => c.name.toLowerCase() === val.toLowerCase().trim()
    );

    if (exactMatch && !isCityDisabled(exactMatch)) {
      onChange(exactMatch);
    } else {
      onChange(null);
    }
  };

  const handleCitySelect = (city) => {
    if (isCityDisabled(city)) return;
    setSearchTerm(city.name);
    onChange(city);
    setShowSuggestions(false);
  };

  return (
    <div className="location-input" ref={containerRef}>
      <label>{label}</label>

      <div className="location-input-wrapper">
        <svg
          className="input-location-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>

        <input
          type="text"
          value={searchTerm}
          placeholder={placeholder}
          autoComplete="off"
          onChange={handleChange}
          onFocus={() => setShowSuggestions(true)}
        />

        {showSuggestions && filteredCities.length > 0 && (
          <div className="city-suggestions">
            {filteredCities.map((city, idx) => {
              const disabled = isCityDisabled(city);

              return (
                <button
                  type="button"
                  key={`${city.id}-${city.name}-${idx}`}
                  disabled={disabled}
                  className={`suggestion-item ${disabled ? "disabled-city" : ""}`}
                  onClick={() => handleCitySelect(city)}
                >
                  <div className="suggestion-left">
                    <svg
                      className="suggestion-pin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <div className="suggestion-text-box">
                      <span className="suggestion-city-name">{city.name}</span>
                      {city.state && <span className="suggestion-state-name">{city.state}</span>}
                    </div>
                  </div>

                  {disabled && <span className="disabled-tag">Selected</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationInput;