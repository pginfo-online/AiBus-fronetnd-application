import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bus,
  ShieldCheck,
  Calendar,
  Clock,
  Sparkles,
  MapPin,
  Star,
  Armchair,
  Check,
  AlertCircle,
  Wifi,
  Zap,
  Coffee,
} from "lucide-react";
import busService from "../../services/busService";
import bookingService from "../../services/bookingService";
import SeatLayout from "../../components/SeatLayout/SeatLayout";
import BookingStepper from "../../components/BookingStepper/BookingStepper";
import AiBusChatAssistant from "../../components/AiBusChatAssistant/AiBusChatAssistant";
import { formatPointTime } from "../../components/BoardingDroppingSelector/BoardingDroppingSelector";
import "./SeatSelection.css";

function formatTripDate(dateStr) {
  if (!dateStr) return "Wed, 14 Oct 2026";
  try {
    const parts = String(dateStr).split("T")[0].split("-");
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
    return String(dateStr);
  }
}

function SeatSelection() {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [selectedDropoff, setSelectedDropoff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [citiesList, setCitiesList] = useState([]);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const busId = searchParams.get("busId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const fromId = searchParams.get("fromId") || (from && !isNaN(Number(from)) ? from : "");
  const toId = searchParams.get("toId") || (to && !isNaN(Number(to)) ? to : "");
  const date = searchParams.get("date");

  // Fetch cities list for resolving IDs into readable names
  useEffect(() => {
    busService.getCities().then((cities) => {
      if (Array.isArray(cities)) setCitiesList(cities);
    });
  }, []);

  const resolvedFromCity = useMemo(() => {
    const paramName = searchParams.get("fromName");
    if (paramName && isNaN(Number(paramName))) return paramName;
    if (from && isNaN(Number(from))) return from;
    if (selectedBus?.from && isNaN(Number(selectedBus.from))) return selectedBus.from;
    const found = citiesList.find((c) => String(c.id || c.CityId) === String(fromId || from));
    return found?.name || found?.City || "Bangalore";
  }, [searchParams, from, fromId, selectedBus, citiesList]);

  const resolvedToCity = useMemo(() => {
    const paramName = searchParams.get("toName");
    if (paramName && isNaN(Number(paramName))) return paramName;
    if (to && isNaN(Number(to))) return to;
    if (selectedBus?.to && isNaN(Number(selectedBus.to))) return selectedBus.to;
    const found = citiesList.find((c) => String(c.id || c.CityId) === String(toId || to));
    return found?.name || found?.City || "Madras";
  }, [searchParams, to, toId, selectedBus, citiesList]);

  // Detect if the bus layout is single-deck
  const isSingleDeck = useMemo(() => {
    const chartLayout = selectedBus?.seatsLayout?.ChartLayout;
    if (chartLayout) {
      if (chartLayout.Info?.Decks !== undefined) {
        return Number(chartLayout.Info.Decks) <= 1;
      }
      if (chartLayout.Layout) {
        const layoutKeys = Object.keys(chartLayout.Layout);
        if (layoutKeys.length > 0) {
          return layoutKeys.length <= 1;
        }
      }
    }
    if (selectedBus?.decks !== undefined) {
      return Number(selectedBus.decks) <= 1;
    }
    const typeStr = (selectedBus?.busType || "").toLowerCase();
    if (typeStr.includes("seater") && !typeStr.includes("sleeper")) {
      return true;
    }
    return false;
  }, [selectedBus]);

  // Fetch live seat availability from backend
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadBusData = async () => {
      const stateBus = location.state?.bus || null;
      try {
        let busObj = stateBus;
        if (!busObj && fromId && toId && date && busId) {
          busObj = await busService.searchSingleBus({
            fromCityId: fromId,
            toCityId: toId,
            journeyDate: date,
            busId,
            from: from || "",
            to: to || "",
          });

          if (!busObj) {
            const searchResults = await busService.searchBuses({
              from: from || "",
              to: to || "",
              fromCityId: fromId,
              toCityId: toId,
              journeyDate: date,
            });
            busObj =
              searchResults.find(
                (b) =>
                  String(b.id) === String(busId) ||
                  String(b.busId) === String(busId) ||
                  String(b.tripId) === String(busId)
              ) ||
              searchResults[0] ||
              null;
          }
        }

        if (busObj && isMounted) {
          const realBusId = busObj.routeBusId || busObj.busId || busObj.id;
          const chartId = realBusId;
          const seatsResponse = await busService.getSeatAvailability(fromId, toId, date, chartId);
          if (isMounted) {
            const resolvedPickups =
              seatsResponse?.BoardingPoints?.length > 0 ? seatsResponse.BoardingPoints : (busObj.pickups || []);
            const resolvedDropoffs =
              seatsResponse?.DroppingPoints?.length > 0 ? seatsResponse.DroppingPoints : (busObj.dropoffs || []);

            setSelectedBus({
              ...busObj,
              busId: realBusId,
              routeBusId: realBusId,
              seatsLayout: seatsResponse,
              pickups: resolvedPickups,
              dropoffs: resolvedDropoffs,
            });

            if (!selectedPickup && resolvedPickups.length > 0) {
              setSelectedPickup(resolvedPickups[0]);
            }
            if (!selectedDropoff && resolvedDropoffs.length > 0) {
              setSelectedDropoff(resolvedDropoffs[0]);
            }
            setLoading(false);
          }
        } else if (isMounted) {
          if (stateBus) {
            setSelectedBus(stateBus);
            if (!selectedPickup && stateBus.pickups?.length > 0) {
              setSelectedPickup(stateBus.pickups[0]);
            }
            if (!selectedDropoff && stateBus.dropoffs?.length > 0) {
              setSelectedDropoff(stateBus.dropoffs[0]);
            }
          } else {
            setSelectedBus({
              id: "BUS-1",
              busId: "BUS-1",
              operator: "SRS Travels",
              busType: "2X2(35) NAC Seater",
              price: 205,
              from: resolvedFromCity,
              to: resolvedToCity,
              departureTime: "12:16",
              arrivalTime: "00:21",
              duration: "12h 5m",
            });
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching live seats or bus:", err);
        if (isMounted) {
          if (stateBus) {
            setSelectedBus(stateBus);
          } else {
            setSelectedBus({
              id: "BUS-1",
              busId: "BUS-1",
              operator: "SRS Travels",
              busType: "2X2(35) NAC Seater",
              price: 205,
              from: resolvedFromCity,
              to: resolvedToCity,
              departureTime: "12:16",
              arrivalTime: "00:21",
              duration: "12h 5m",
            });
          }
          setLoading(false);
        }
      }
    };

    loadBusData();

    return () => {
      isMounted = false;
    };
  }, [busId, from, to, fromId, toId, date, location.state]);

  // Clear any stale seat locks
  useEffect(() => {
    bookingService.clearSeatLock();
  }, []);

  const handleSeatClick = (seatObj) => {
    const seatId = typeof seatObj === "string" ? seatObj : (seatObj.id || seatObj.display || seatObj.seatNo);
    const exists = selectedSeats.some(
      (s) => (typeof s === "string" ? s === seatId : (s.id === seatId || s.display === seatId || s.seatNo === seatId))
    );
    if (exists) {
      setSelectedSeats(
        selectedSeats.filter(
          (s) => (typeof s === "string" ? s !== seatId : (s.id !== seatId && s.display !== seatId && s.seatNo !== seatId))
        )
      );
    } else {
      setSelectedSeats([...selectedSeats, seatObj]);
    }
  };

  const handleContinue = () => {
    if (selectedSeats.length === 0) return;

    const seatCodes = selectedSeats.map((s) =>
      typeof s === "object" ? s.display || s.seatNo || s.id : s
    );

    const resolvedFromId = fromId || (selectedBus?.fromCityId ? String(selectedBus.fromCityId) : "") || "4292";
    const resolvedToId = toId || (selectedBus?.toCityId ? String(selectedBus.toCityId) : "") || "4562";

    const params = new URLSearchParams({
      busId: String(selectedBus?.routeBusId || selectedBus?.busId || selectedBus?.id || "1"),
      seats: seatCodes.join(","),
      fromId: String(resolvedFromId),
      toId: String(resolvedToId),
      from: selectedBus?.from || resolvedFromCity,
      to: selectedBus?.to || resolvedToCity,
      date: selectedBus?.date || date || new Date().toISOString().split("T")[0],
    });

    navigate(`/traveller-details?${params.toString()}`, {
      state: {
        bus: selectedBus,
        selectedSeats,
        pickup: selectedPickup || selectedBus?.pickups?.[0],
        dropoff: selectedDropoff || selectedBus?.dropoffs?.[0],
      },
    });
  };

  const handleStepClick = (stepNum) => {
    if (stepNum === 1) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (stepNum === 2) {
      if (selectedSeats.length > 0) {
        handleContinue();
      } else {
        alert("Please select at least one seat first.");
      }
    }
  };

  const totalAmount = selectedSeats.reduce(
    (sum, s) => sum + (typeof s === "object" ? s.price || selectedBus?.price || 205 : selectedBus?.price || 205),
    0
  );

  const pickupsList = selectedBus?.pickups || selectedBus?.BoardingPoints || [];
  const dropoffsList = selectedBus?.dropoffs || selectedBus?.DroppingPoints || [];

  if (loading) {
    return (
      <main className="modern-seat-page">
        <div className="modern-seat-container">
          <BookingStepper currentStep={1} />
          <div className="modern-loading-card">
            <div className="coach-loader-pulse">
              <Bus size={32} className="loader-bus-icon" />
              <div className="loader-orbit-ring" />
            </div>
            <h3 className="loader-title">Loading Live Berth Availability</h3>
            <p className="loader-sub">Connecting to real-time seat charts & boarding points...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="modern-seat-page">
      <div className="modern-seat-container">
        {/* Step 1 Booking Stepper */}
        <BookingStepper currentStep={1} onStepClick={handleStepClick} />

        {/* 2-Column Responsive Layout (Exact structure as TravellerDetails & BookingConfirmation) */}
        <div className="modern-seat-layout">
          {/* LEFT COLUMN: Seat Layout & Filters */}
          <section className="modern-seat-main-column" aria-label="Seat Selection Map">
            {/* Back Button */}
            <button
              type="button"
              className="modern-back-btn"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={16} />
              <span>Back to Search Results</span>
            </button>

            {/* Page Title Block */}
            <div className="modern-page-header">
              <div className="header-badge-row">
                <span className="step-pill-tag">Step 1 of 4</span>
                <span className="secure-badge">
                  <ShieldCheck size={14} /> Live Seat Layout
                </span>
              </div>
              <h1 className="modern-page-title">Select Your Seats</h1>
              <p className="modern-page-subtitle">
                Choose your preferred berth or chair from real-time coach availability
              </p>
            </div>

            {/* Coach Layout Chassis Component */}
            <div className="coach-seat-map-wrapper">
              <SeatLayout
                bus={selectedBus}
                selectedSeats={selectedSeats}
                onSeatClick={handleSeatClick}
                isSingleDeck={isSingleDeck}
              />
            </div>

            {/* Coach Amenities & Operator Policy Info Card */}
            <div className="seat-amenities-card">
              <h4 className="amenities-card-title">
                <Sparkles size={16} style={{ color: "#2563eb" }} />
                Bus Amenities & Policies
              </h4>
              <div className="amenities-pill-grid">
                <span className="amenity-chip"><Wifi size={13} /> Free High-Speed WiFi</span>
                <span className="amenity-chip"><Zap size={13} /> Individual Charging Points</span>
                <span className="amenity-chip"><Coffee size={13} /> Mineral Water Bottle</span>
                <span className="amenity-chip"><ShieldCheck size={13} /> Emergency Exit & First Aid</span>
                <span className="amenity-chip"><Bus size={13} /> Live GPS Bus Tracking</span>
              </div>
              <div className="amenities-policy-summary">
                <div className="policy-mini-item">
                  <strong>Luggage Allowance</strong>
                  Up to 20kg per passenger included in ticket fare. Excess luggage chargeable.
                </div>
                <div className="policy-mini-item">
                  <strong>Cancellation Policy</strong>
                  Refundable up to 6 hours before departure time. Free reschedule available.
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: Modern Sticky Trip Summary Sidebar (Matches TravellerDetails) */}
          <aside className="modern-summary-sidebar" aria-label="Trip Summary and Checkout">
            <div className="modern-summary-card">
              {/* Summary Header */}
              <div className="summary-top-banner">
                <div className="banner-badge-strip">
                  <span className="bus-company-tag">
                    <Bus size={13} /> {selectedBus?.operator || selectedBus?.operatorName || "SRS Travels"}
                  </span>
                  <span className="star-rating-pill">★ {selectedBus?.rating || "4.8"}</span>
                </div>
                <h3 className="summary-bus-title">
                  {selectedBus?.busType || "2X2(35) NAC Seater"}
                </h3>
              </div>

              {/* Journey Route & Timing Section */}
              <div className="summary-route-timeline">
                <div className="route-node dep">
                  <span className="route-time">{selectedBus?.departureTime || "12:16"}</span>
                  <strong className="route-city">{resolvedFromCity}</strong>
                  <span className="route-sub-loc">Boarding Point</span>
                </div>

                <div className="route-connector-block">
                  <span className="journey-duration-pill">
                    {selectedBus?.duration || "12h 5m"}
                  </span>
                  <div className="animated-connector-line">
                    <span className="connector-dot start" />
                    <div className="connector-dashes" />
                    <span className="connector-dot end" />
                  </div>
                </div>

                <div className="route-node arr">
                  <span className="route-time">{selectedBus?.arrivalTime || "00:21"}</span>
                  <strong className="route-city">{resolvedToCity}</strong>
                  <span className="route-sub-loc">Dropping Point</span>
                </div>
              </div>

              {/* Date & Seats Meta Bar */}
              <div className="summary-meta-grid">
                <div className="meta-box">
                  <span className="meta-label">Date of Journey</span>
                  <strong className="meta-value">
                    {formatTripDate(selectedBus?.date || date)}
                  </strong>
                </div>
                <div className="meta-box">
                  <span className="meta-label">Total Seats</span>
                  <strong className="meta-value">
                    {selectedSeats.length > 0
                      ? `${selectedSeats.length} ${selectedSeats.length === 1 ? "Seat" : "Seats"}`
                      : "0 Seats"}
                  </strong>
                </div>
              </div>

              {/* Selected Seats Highlight Box */}
              <div className="selected-seats-strip">
                <div className="strip-title-row">
                  <span className="strip-title">Selected Berth(s):</span>
                  {selectedSeats.length > 0 && (
                    <button
                      type="button"
                      className="seat-clear-all-link"
                      onClick={() => setSelectedSeats([])}
                    >
                      Clear All
                    </button>
                  )}
                </div>
                {selectedSeats.length > 0 ? (
                  <div className="seat-pills-row">
                    {selectedSeats.map((s, idx) => {
                      const seatCode = typeof s === "object" ? s.display || s.seatNo || s.id : s;
                      const seatPrice = typeof s === "object" ? s.price || selectedBus?.price || 205 : selectedBus?.price || 205;
                      const uniqueKey = `selected-seat-${seatCode || idx}-${idx}`;
                      return (
                        <span key={uniqueKey} className="highlighted-seat-tag">
                          <Armchair size={11} /> {seatCode} (₹{seatPrice})
                          <button
                            type="button"
                            className="remove-seat-mini-btn"
                            onClick={() => handleSeatClick(s)}
                            title="Remove seat"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="no-seats-hint">
                    Select seats on the coach layout to proceed with your booking.
                  </p>
                )}
              </div>

              {/* Quick Boarding & Dropping Point Pickers */}
              {(pickupsList.length > 0 || dropoffsList.length > 0) && (
                <div className="quick-points-picker-block">
                  <div className="quick-point-group">
                    <label className="point-select-label">
                      <MapPin size={12} className="point-pin-icon dep" /> Boarding Point
                    </label>
                    <select
                      className="point-select-dropdown"
                      value={selectedPickup?.PickupId || selectedPickup?.pickupId || selectedPickup?.id || ""}
                      onChange={(e) => {
                        const found = pickupsList.find(
                          (p) => String(p.PickupId || p.pickupId || p.id) === e.target.value
                        );
                        if (found) setSelectedPickup(found);
                      }}
                    >
                      {pickupsList.map((p, idx) => {
                        const id = p.PickupId || p.pickupId || p.id || `pickup-${idx}`;
                        const name = p.PickupName || p.pickupName || p.name || `Boarding Point ${idx + 1}`;
                        const time = p.PickupTime || p.pickupTime || p.time;
                        const uniqueKey = `pickup-opt-${id}-${idx}`;
                        return (
                          <option key={uniqueKey} value={id}>
                            {time ? `${formatPointTime(time)} - ` : ""}{name}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="quick-point-group">
                    <label className="point-select-label">
                      <MapPin size={12} className="point-pin-icon arr" /> Dropping Point
                    </label>
                    <select
                      className="point-select-dropdown"
                      value={selectedDropoff?.DropoffId || selectedDropoff?.dropoffId || selectedDropoff?.id || ""}
                      onChange={(e) => {
                        const found = dropoffsList.find(
                          (d) => String(d.DropoffId || d.dropoffId || d.id) === e.target.value
                        );
                        if (found) setSelectedDropoff(found);
                      }}
                    >
                      {dropoffsList.map((d, idx) => {
                        const id = d.DropoffId || d.dropoffId || d.id || `dropoff-${idx}`;
                        const name = d.DropoffName || d.dropoffName || d.name || `Dropping Point ${idx + 1}`;
                        const time = d.DropoffTime || d.dropoffTime || d.time;
                        const uniqueKey = `dropoff-opt-${id}-${idx}`;
                        return (
                          <option key={uniqueKey} value={id}>
                            {time ? `${formatPointTime(time)} - ` : ""}{name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="summary-price-breakdown">
                <div className="price-row">
                  <span>Base Fare ({selectedSeats.length || 0} Seats)</span>
                  <span>₹{selectedSeats.length > 0 ? totalAmount : 0}</span>
                </div>
                <div className="price-row">
                  <span>Taxes & GST</span>
                  <span className="tax-free-tag">Included</span>
                </div>
                <div className="price-row total-row">
                  <div>
                    <span className="total-title">Total Amount</span>
                    <span className="total-subtext">All taxes & fees included</span>
                  </div>
                  <span className="total-amount-display">
                    ₹{selectedSeats.length > 0 ? totalAmount.toLocaleString("en-IN") : "0"}
                  </span>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                className={`modern-primary-checkout-btn ${selectedSeats.length === 0 ? "is-disabled" : ""}`}
                onClick={handleContinue}
                disabled={selectedSeats.length === 0}
              >
                <span>
                  {selectedSeats.length > 0
                    ? `Proceed to Traveller Details (${selectedSeats.length})`
                    : "Select Seats to Proceed"}
                </span>
                <ArrowRight size={16} />
              </button>

              {/* Temporary Hold Guarantee */}
              <div className="seat-hold-guarantee">
                <Clock size={13} />
                <span>Seats will be temporarily held for 5 mins during checkout</span>
              </div>
            </div>
          </aside>
        </div>

        {/* Interactive AiBus Assistant */}
        <AiBusChatAssistant
          bus={selectedBus}
          fromCity={resolvedFromCity}
          toCity={resolvedToCity}
          date={date}
          selectedSeats={selectedSeats}
        />
      </div>
    </main>
  );
}

export default SeatSelection;