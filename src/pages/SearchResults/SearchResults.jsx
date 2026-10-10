import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  Bus, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal, 
  RotateCcw, 
  Sparkles, 
  Wind, 
  BedDouble, 
  Sun, 
  Moon, 
  ArrowRight,
  ShieldCheck,
  Zap,
  MapPin,
  Clock,
  Compass
} from "lucide-react";
import SearchBox from "../../components/SearchBox/SearchBox";
import FilterPanel from "../../components/FilterPanel/FilterPanel";
import SortControl from "../../components/SortControl/SortControl";
import BusList from "../../components/BusList/BusList";
import busService from "../../services/busService";
import filterBuses from "../../utils/filterBuses";
import "./SearchResults.css";

// Skeleton Loader Component for luxury loading state
function BusCardSkeleton() {
  return (
    <div className="bus-skeleton-card">
      <div className="skeleton-left">
        <div className="skeleton-avatar skeleton-pulse" />
        <div className="skeleton-text-group">
          <div className="skeleton-line skeleton-title skeleton-pulse" />
          <div className="skeleton-line skeleton-sub skeleton-pulse" />
        </div>
      </div>
      <div className="skeleton-middle">
        <div className="skeleton-time-row">
          <div className="skeleton-time skeleton-pulse" />
          <div className="skeleton-track skeleton-pulse" />
          <div className="skeleton-time skeleton-pulse" />
        </div>
        <div className="skeleton-amenities skeleton-pulse" />
      </div>
      <div className="skeleton-right">
        <div className="skeleton-price skeleton-pulse" />
        <div className="skeleton-btn skeleton-pulse" />
      </div>
    </div>
  );
}

function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    acOnly: false,
    nonAcOnly: false,
    sleeperOnly: false,
    seaterOnly: false,
    depTime: [],
    maxPrice: 2000,
  });

  const [sortBy, setSortBy] = useState("departure_asc");
  const [busesForRoute, setBusesForRoute] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [citiesList, setCitiesList] = useState([]);

  const fromId = searchParams.get("from") || searchParams.get("fromCityId") || "";
  const toId = searchParams.get("to") || searchParams.get("toCityId") || "";
  const date = searchParams.get("date") || searchParams.get("journeyDate") || "";

  useEffect(() => {
    busService.getCities().then((data) => {
      setCitiesList(data);
    });
  }, []);

  const displayFromName = useMemo(() => {
    const raw = searchParams.get("fromName");
    if (raw && isNaN(Number(raw))) return raw;
    const found = citiesList.find((c) => String(c.id || c.CityId) === String(fromId));
    return found?.name || found?.City || raw || fromId || "Origin";
  }, [searchParams, fromId, citiesList]);

  const displayToName = useMemo(() => {
    const raw = searchParams.get("toName");
    if (raw && isNaN(Number(raw))) return raw;
    const found = citiesList.find((c) => String(c.id || c.CityId) === String(toId));
    return found?.name || found?.City || raw || toId || "Destination";
  }, [searchParams, toId, citiesList]);

  useEffect(() => {
    if (!fromId || !toId || !date) {
      navigate("/");
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError("");

    busService
      .searchBuses({ from: fromId, to: toId, date, fromCityId: fromId, toCityId: toId, journeyDate: date })
      .then((results) => {
        if (isMounted) {
          setBusesForRoute(results);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load buses. Please try again.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fromId, toId, date, navigate]);

  const handleInPageSearch = ({ from: newFromId, fromName: newFromName, to: newToId, toName: newToName, date: newDate }) => {
    const nextParams = {
      from: newFromId,
      to: newToId,
      date: newDate,
    };
    if (newFromName) nextParams.fromName = newFromName;
    if (newToName) nextParams.toName = newToName;
    setSearchParams(nextParams);
  };

  // Date Shift Helper
  const shiftDate = (days) => {
    try {
      const parts = date.split("-");
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        d.setDate(d.getDate() + days);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dt = String(d.getDate()).padStart(2, "0");
        const newDateStr = `${y}-${m}-${dt}`;
        setSearchParams({
          from: fromId,
          fromName: displayFromName,
          to: toId,
          toName: displayToName,
          date: newDateStr,
        });
      }
    } catch {
      // Fallback
    }
  };

  const formattedDate = useMemo(() => {
    if (!date) return "";
    try {
      const parts = date.split("-");
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
    } catch {
      return date;
    }
    return date;
  }, [date]);

  const filteredBuses = useMemo(() => {
    return filterBuses(busesForRoute, filters, sortBy);
  }, [busesForRoute, filters, sortBy]);

  const activeFilterCount =
    (filters.acOnly ? 1 : 0) +
    (filters.nonAcOnly ? 1 : 0) +
    (filters.sleeperOnly ? 1 : 0) +
    (filters.seaterOnly ? 1 : 0) +
    (filters.depTime?.length || 0) +
    (filters.maxPrice < 2000 ? 1 : 0);

  const clearAllFilters = () => {
    setFilters({
      acOnly: false,
      nonAcOnly: false,
      sleeperOnly: false,
      seaterOnly: false,
      depTime: [],
      maxPrice: 2000,
    });
  };

  const toggleQuickFilter = (key, value) => {
    if (key === "depTime") {
      setFilters((prev) => {
        const exists = prev.depTime?.includes(value);
        return {
          ...prev,
          depTime: exists ? prev.depTime.filter((s) => s !== value) : [...(prev.depTime || []), value],
        };
      });
    } else {
      setFilters((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    }
  };

  return (
    <main className="modern-search-results-page">
      {/* Dynamic Route Header Strip */}
      <section className="route-hero-strip">
        <div className="results-container">
          <div className="route-hero-flex">
            <div className="route-hero-left">
              <div className="route-badge-indicator">
                <span className="route-live-dot" />
                <span>Intercity Direct Route</span>
              </div>
              <div className="route-cities-title">
                <span className="route-city from">{displayFromName}</span>
                <span className="route-arrow-icon">➔</span>
                <span className="route-city to">{displayToName}</span>
              </div>
              <div className="route-details-row">
                <span className="route-detail-chip">
                  <Calendar size={13} />
                  <span>{formattedDate}</span>
                </span>
                <span className="route-detail-chip bus-count">
                  <Bus size={13} />
                  <span>
                    {loading ? "Searching..." : `${filteredBuses.length} ${filteredBuses.length === 1 ? "bus" : "buses"} available`}
                  </span>
                </span>
              </div>
            </div>

            {/* Quick Date Stepper */}
            <div className="route-date-stepper">
              <button
                type="button"
                className="date-nav-btn"
                onClick={() => shiftDate(-1)}
                title="Previous Day"
              >
                <ChevronLeft size={16} />
                <span>Prev Day</span>
              </button>

              <div className="current-date-pill">
                <Calendar size={14} className="cal-icon" />
                <span>{formattedDate}</span>
              </div>

              <button
                type="button"
                className="date-nav-btn"
                onClick={() => shiftDate(1)}
                title="Next Day"
              >
                <span>Next Day</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="results-container main-content-wrap">
        {/* Floating Search Bar Modification Card */}
        <section className="search-bar-card-wrapper">
          <SearchBox
            initialFromId={fromId}
            initialToId={toId}
            initialDate={date}
            onSearch={handleInPageSearch}
          />
        </section>

        {/* Quick Filter Pill Chips Strip */}
        <div className="quick-filter-ribbon">
          <div className="ribbon-label">
            <Sparkles size={13} />
            <span>Quick:</span>
          </div>

          <button
            type="button"
            className={`quick-pill ${filters.acOnly ? "active" : ""}`}
            onClick={() => toggleQuickFilter("acOnly")}
          >
            <Wind size={13} />
            <span>AC Only</span>
          </button>

          <button
            type="button"
            className={`quick-pill ${filters.sleeperOnly ? "active" : ""}`}
            onClick={() => toggleQuickFilter("sleeperOnly")}
          >
            <BedDouble size={13} />
            <span>Sleeper</span>
          </button>

          <button
            type="button"
            className={`quick-pill ${filters.depTime?.includes("6amTo12pm") ? "active" : ""}`}
            onClick={() => toggleQuickFilter("depTime", "6amTo12pm")}
          >
            <Sun size={13} />
            <span>Morning (6am-12pm)</span>
          </button>

          <button
            type="button"
            className={`quick-pill ${filters.depTime?.includes("after6pm") ? "active" : ""}`}
            onClick={() => toggleQuickFilter("depTime", "after6pm")}
          >
            <Moon size={13} />
            <span>Night (After 6pm)</span>
          </button>

          <button
            type="button"
            className={`quick-pill ${sortBy === "price_asc" ? "active" : ""}`}
            onClick={() => setSortBy((prev) => (prev === "price_asc" ? "departure_asc" : "price_asc"))}
          >
            <Zap size={13} />
            <span>Cheapest Fare</span>
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              className="quick-pill reset-pill"
              onClick={clearAllFilters}
            >
              <RotateCcw size={12} />
              <span>Reset ({activeFilterCount})</span>
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="search-loading-container">
            <div className="skeleton-list">
              <BusCardSkeleton />
              <BusCardSkeleton />
              <BusCardSkeleton />
            </div>
          </div>
        ) : error ? (
          <div className="modern-no-buses-card error-card">
            <div className="no-buses-radar">
              <div className="radar-circle radar-1" />
              <div className="radar-circle radar-2" />
              <div className="no-buses-icon-box error">⚠️</div>
            </div>
            <h2>Unable to load buses</h2>
            <p>{error}</p>
            <button
              type="button"
              className="action-pill-btn primary"
              onClick={() => handleInPageSearch({ from: fromId, to: toId, date })}
            >
              <RotateCcw size={14} />
              <span>Try Again</span>
            </button>
          </div>
        ) : (
          <div className="search-results-grid-layout">
            {/* Mobile Filter Toggle Button */}
            <div className="mobile-filter-trigger">
              <button
                type="button"
                className={`mobile-filter-btn ${showMobileFilters ? "open" : ""}`}
                onClick={() => setShowMobileFilters((prev) => !prev)}
                aria-expanded={showMobileFilters}
              >
                <div className="mobile-btn-left">
                  <SlidersHorizontal size={16} />
                  <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount} active)` : ""}</span>
                </div>
                <span className="toggle-indicator">{showMobileFilters ? "Close ▲" : "Modify ▼"}</span>
              </button>
            </div>

            {/* Left Filter Sidebar */}
            <div className={`filter-sidebar-col ${showMobileFilters ? "mobile-open" : ""}`}>
              <FilterPanel
                buses={busesForRoute}
                filters={filters}
                onFilterChange={setFilters}
              />
            </div>

            {/* Right Bus Results Column */}
            <div className="results-list-col">
              <SortControl
                value={sortBy}
                onChange={setSortBy}
                totalCount={filteredBuses.length}
              />

              {filteredBuses.length > 0 ? (
                <BusList
                  buses={filteredBuses}
                  searchFrom={displayFromName}
                  searchTo={displayToName}
                  searchFromId={fromId}
                  searchToId={toId}
                  searchDate={date}
                />
              ) : (
                <div className="modern-no-buses-card">
                  <div className="no-buses-radar">
                    <div className="radar-circle radar-1" />
                    <div className="radar-circle radar-2" />
                    <div className="no-buses-icon-box">
                      <Bus size={36} />
                    </div>
                  </div>

                  <h2 className="empty-title">No Buses Found For This Date</h2>
                  <p className="empty-subtitle">
                    We couldn't find any scheduled buses between <strong>{displayFromName}</strong> and{" "}
                    <strong>{displayToName}</strong> on <strong>{formattedDate}</strong>.
                  </p>

                  <div className="empty-action-buttons">
                    <button
                      type="button"
                      className="action-pill-btn primary"
                      onClick={() => shiftDate(1)}
                    >
                      <Calendar size={15} />
                      <span>Search Next Day</span>
                    </button>

                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        className="action-pill-btn secondary"
                        onClick={clearAllFilters}
                      >
                        <RotateCcw size={15} />
                        <span>Clear All Filters</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="action-pill-btn outline"
                      onClick={() => navigate("/")}
                    >
                      <Compass size={15} />
                      <span>Explore Popular Routes</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default SearchResults;