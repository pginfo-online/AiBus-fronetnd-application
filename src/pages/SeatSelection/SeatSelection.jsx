import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, RefreshCw, Bus, AlertCircle } from "lucide-react";
import busService from "../../services/busService";
import bookingService from "../../services/bookingService";
import BookingStepper from "../../components/BookingStepper/BookingStepper";
import TripSummary from "../../components/TripSummary/TripSummary";
import SeatLayout from "../../components/SeatLayout/SeatLayout";
import BookingSummary from "../../components/BookingSummary/BookingSummary";
import BoardingDroppingSelector from "../../components/BoardingDroppingSelector/BoardingDroppingSelector";
import "./SeatSelection.css";

function SeatSelection() {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [selectedDropoff, setSelectedDropoff] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const busId = searchParams.get("busId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const fromId = searchParams.get("fromId") || (from && !isNaN(Number(from)) ? from : "");
  const toId = searchParams.get("toId") || (to && !isNaN(Number(to)) ? to : "");
  const date = searchParams.get("date");

  // Fetch live seat availability from backend
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadBusData = async () => {
      const stateBus = location.state?.bus || null;
      try {
        let busObj = stateBus;
        if (!busObj && fromId && toId && date && busId) {
          // 1. Try single bus search via Mantis /ota/SearchBus
          busObj = await busService.searchSingleBus({
            fromCityId: fromId,
            toCityId: toId,
            journeyDate: date,
            busId,
            from: from || "",
            to: to || "",
          });

          // 2. Fallback to full route search if single bus lookup returns null
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
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching live seats or bus:", err);
        if (isMounted) {
          if (stateBus) setSelectedBus(stateBus);
          setLoading(false);
        }
      }
    };

    loadBusData();

    return () => {
      isMounted = false;
    };
  }, [busId, from, to, fromId, toId, date, location.state]);

  // Clear any stale seat locks when opening seat selection
  useEffect(() => {
    bookingService.clearSeatLock();
  }, []);

  if (loading) {
    return (
      <main className="seat-selection-page">
        <div className="seat-selection-container">
          <div className="modern-loading-card">
            <div className="coach-loader-pulse">
              <Bus size={32} className="loader-bus-icon" />
              <div className="loader-orbit-ring" />
            </div>
            <h3 className="loader-title">Loading Live Berth Availability</h3>
            <p className="loader-sub">Connecting to real-time GDS seat charts & boarding points...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!selectedBus) {
    return (
      <main className="seat-selection-page">
        <div className="seat-selection-container">
          <button
            type="button"
            className="modern-back-btn"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
            <span>Back to Search Results</span>
          </button>
          <div className="modern-not-found-card">
            <div className="not-found-icon-circle">
              <AlertCircle size={28} />
            </div>
            <h2>Bus Layout Not Found</h2>
            <p>We couldn't retrieve the seat configuration for this specific service. Please try searching again.</p>
            <button
              type="button"
              className="not-found-retry-btn"
              onClick={() => navigate(-1)}
            >
              Search Other Buses
            </button>
          </div>
        </div>
      </main>
    );
  }

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

    const resolvedFromId = fromId || (selectedBus.fromCityId ? String(selectedBus.fromCityId) : "") || (from && !isNaN(Number(from)) ? from : "4292");
    const resolvedToId = toId || (selectedBus.toCityId ? String(selectedBus.toCityId) : "") || (to && !isNaN(Number(to)) ? to : "4562");

    const params = new URLSearchParams({
      busId: String(selectedBus.routeBusId || selectedBus.busId || selectedBus.id),
      seats: seatCodes.join(","),
      fromId: String(resolvedFromId),
      toId: String(resolvedToId),
      from: selectedBus.from || from || "Origin",
      to: selectedBus.to || to || "Destination",
      date: selectedBus.date || date || new Date().toISOString().split("T")[0],
    });

    navigate(`/traveller-details?${params.toString()}`, {
      state: {
        bus: selectedBus,
        selectedSeats,
        pickup: selectedPickup || selectedBus.pickups?.[0],
        dropoff: selectedDropoff || selectedBus.dropoffs?.[0],
      },
    });
  };

  const totalAmount = selectedSeats.reduce(
    (sum, s) => sum + (typeof s === "object" ? s.price || selectedBus.price : selectedBus.price),
    0
  );

  const pickupsList = selectedBus.pickups || selectedBus.BoardingPoints || [];
  const dropoffsList = selectedBus.dropoffs || selectedBus.DroppingPoints || [];

  return (
    <main className="seat-selection-page">
      <div className="seat-selection-container">
        {/* Navigation Back Link */}
        <div className="page-top-action-bar">
          <button
            type="button"
            className="modern-back-btn"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
            <span>Back to Buses</span>
          </button>
        </div>

        {/* Step Progress Stepper */}
        <BookingStepper currentStep={1} />

        {/* Compact Luxury Trip Summary Strip */}
        <TripSummary bus={selectedBus} from={from} to={to} date={date} />

        {/* Main 2-Column Grid: Seat Map (Left) & Selection Card (Right) */}
        <div className="seat-selection-grid">
          {/* Left Column: Bus Seat Layout Map + Boarding & Dropping Points Selector */}
          <div className="seat-map-column">
            <SeatLayout
              bus={selectedBus}
              selectedSeats={selectedSeats}
              onSeatClick={handleSeatClick}
            />

            {/* Live Boarding & Dropping Points Selector Card */}
            {(pickupsList.length > 0 || dropoffsList.length > 0) && (
              <div style={{ marginTop: "24px" }}>
                <BoardingDroppingSelector
                  pickups={pickupsList}
                  dropoffs={dropoffsList}
                  selectedPickup={selectedPickup}
                  selectedDropoff={selectedDropoff}
                  onSelectPickup={setSelectedPickup}
                  onSelectDropoff={setSelectedDropoff}
                  fromCity={selectedBus.from || from || "Origin"}
                  toCity={selectedBus.to || to || "Destination"}
                  title="Select Boarding & Dropping Points"
                  subtitle="Choose where you'll board the bus and your arrival destination"
                />
              </div>
            )}
          </div>

          {/* Right Column: Booking Summary Card */}
          <div className="selection-card-column">
            <BookingSummary
              selectedSeats={selectedSeats}
              price={selectedBus.price}
              onClear={() => setSelectedSeats([])}
              onContinue={handleContinue}
            />
          </div>
        </div>

        {/* Mobile Sticky Bottom Floating Action Bar */}
        {selectedSeats.length > 0 && (
          <div className="mobile-seat-sticky-bar">
            <div className="mobile-sticky-left">
              <span className="mobile-seat-count-label">
                {selectedSeats.length} Seat{selectedSeats.length > 1 ? "s" : ""} Selected:{" "}
                {selectedSeats
                  .map((s) => (typeof s === "object" ? s.display || s.id : s))
                  .join(", ")}
              </span>
              <strong className="mobile-seat-total-price">
                ₹{totalAmount.toLocaleString("en-IN")}
              </strong>
            </div>
            <button
              type="button"
              className="mobile-sticky-continue-btn"
              onClick={handleContinue}
            >
              Continue →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default SeatSelection;