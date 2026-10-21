import { useState, useRef, useEffect, useMemo } from "react";
import "./LocationInput.css";

function formatCityDisplay(cityName, stateName) {
  let cleanCity = String(cityName || "").trim();
  let cleanState = String(stateName || "").trim();

  // Separate glued CamelCase words e.g. "MadrasTamilNadu" -> "Madras Tamil Nadu"
  cleanCity = cleanCity.replace(/([a-z])([A-Z])/g, "$1 $2");
  if (cleanState) {
    cleanState = cleanState.replace(/([a-z])([A-Z])/g, "$1 $2");
    if (cleanCity.toLowerCase().endsWith(cleanState.toLowerCase())) {
      cleanCity = cleanCity
        .slice(0, cleanCity.length - cleanState.length)
        .trim()
        .replace(/,\s*$/, "");
    }
  }

  return { cleanCity, cleanState };
}

function LocationInput({ label, placeholder, value, onChange, disabledCityId = "", cities = [] }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState(value?.name || "");

  useEffect(() => {
    if (value?.name) {
      const { cleanCity } = formatCityDisplay(value.name, value.state);
      setSearchTerm(cleanCity);
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
        const found = cities.find((c) => {
          const { cleanCity } = formatCityDisplay(c.name, c.state);
          return cleanCity.toLowerCase() === name.toLowerCase();
        });
        if (found && !matchedPopular.some((m) => m.id === found.id)) {
          const { cleanCity, cleanState } = formatCityDisplay(found.name, found.state);
          matchedPopular.push({ ...found, name: cleanCity, state: cleanState });
        }
      }
      return matchedPopular;
    }

    const starts = [];
    const contains = [];
    for (const city of cities) {
      const { cleanCity, cleanState } = formatCityDisplay(city.name, city.state);
      const cName = cleanCity.toLowerCase();
      const sName = cleanState.toLowerCase();
      const full = `${cName} ${sName}`.trim();

      const cityObj = { ...city, name: cleanCity, state: cleanState };

      if (cName.startsWith(searchLower) || sName.startsWith(searchLower) || full.startsWith(searchLower)) {
        starts.push(cityObj);
      } else if (cName.includes(searchLower) || sName.includes(searchLower) || full.includes(searchLower)) {
        contains.push(cityObj);
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

    const valClean = val.toLowerCase().trim().replace(/,/g, " ");
    const exactMatch = cities.find((c) => {
      const { cleanCity, cleanState } = formatCityDisplay(c.name, c.state);
      const cName = cleanCity.toLowerCase().trim();
      const full = `${cName} ${cleanState.toLowerCase().trim()}`.trim();
      return cName === valClean || full === valClean;
    });

    if (exactMatch && !isCityDisabled(exactMatch)) {
      const { cleanCity, cleanState } = formatCityDisplay(exactMatch.name, exactMatch.state);
      onChange({ ...exactMatch, name: cleanCity, state: cleanState });
    } else {
      onChange(null);
    }
  };

  const handleCitySelect = (city) => {
    if (isCityDisabled(city)) return;
    const { cleanCity, cleanState } = formatCityDisplay(city.name, city.state);
    const resolvedCity = { ...city, name: cleanCity, state: cleanState };
    setSearchTerm(cleanCity);
    onChange(resolvedCity);
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
              const { cleanCity, cleanState } = formatCityDisplay(city.name, city.state);

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
                      <span className="suggestion-city-name">{cleanCity}</span>
                      {cleanState && (
                        <span className="suggestion-state-name">
                          <span className="suggestion-comma">, </span>
                          {cleanState}
                        </span>
                      )}
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