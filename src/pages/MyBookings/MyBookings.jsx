import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bus,
  MapPin,
  Clock,
  Calendar,
  User,
  Armchair,
  Download,
  Share2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Receipt,
} from "lucide-react";
import bookingService from "../../services/bookingService";
import authService from "../../services/authService";
import "./MyBookings.css";

const formatTripDate = (rawDate) => {
  if (!rawDate) return "Upcoming Journey";
  try {
    const cleanStr = String(rawDate).trim();
    const isoStr = cleanStr.includes(" ") ? cleanStr.split(" ")[0] : cleanStr.slice(0, 10);
    const d = new Date(isoStr.includes("T") ? isoStr : `${isoStr}T00:00:00`);
    if (isNaN(d.getTime())) return cleanStr;
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(rawDate);
  }
};

const formatTimeDisplay = (timeStr, fallback = "08:00") => {
  if (!timeStr) return fallback;
  const str = String(timeStr).trim();
  if (str.includes(" ")) {
    const parts = str.split(" ");
    if (parts[1] && parts[1].includes(":")) return parts[1].slice(0, 5);
  }
  if (str.includes("T")) {
    const timePart = str.split("T")[1];
    if (timePart && timePart.includes(":")) return timePart.slice(0, 5);
  }
  if (str.length >= 5 && str.includes(":")) {
    const match = str.match(/\b\d{1,2}:\d{2}\b/);
    if (match) return match[0];
    return str.slice(0, 5);
  }
  return fallback;
};

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(() => authService.getLoggedInUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterTab, setFilterTab] = useState("ALL");
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();

  const loadBookings = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await bookingService.getMyBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load bookings:", err);
      const local = bookingService.getGuestBookings() || [];
      if (local.length > 0) {
        setBookings(local);
      } else if (err?.response?.status === 401) {
        setError("Session expired. Please log in again.");
      } else {
        setError(err.message || "Failed to load bookings. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleLoginChange = async () => {
      let loggedInUser = authService.getLoggedInUser();
      if (!loggedInUser && authService.isAuthenticated()) {
        try {
          loggedInUser = await authService.getProfile();
        } catch {
          // Ignore profile sync error
        }
      }
      setUser(loggedInUser);
      loadBookings();
    };

    handleLoginChange();

    window.addEventListener("loginStatusChanged", handleLoginChange);
    window.addEventListener("storage", handleLoginChange);
    window.addEventListener("guestBookingsChanged", handleLoginChange);

    return () => {
      window.removeEventListener("loginStatusChanged", handleLoginChange);
      window.removeEventListener("storage", handleLoginChange);
      window.removeEventListener("guestBookingsChanged", handleLoginChange);
    };
  }, []);

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCancelBooking = (bookingId) => {
    navigate(`/booking-details?bookingId=${bookingId}&openCancel=true`);
  };

  const handleShareTicket = async (booking) => {
    const bRef = booking.bookingNumber || booking.bookingReference || booking.pnr || booking.id;
    const shareText = `🚌 AiBus Ticket Details\nBooking ID: ${bRef}\nRoute: ${booking.bus?.from} → ${booking.bus?.to}\nDate: ${formatTripDate(booking.bus?.date || booking.journeyDate)}\nSeats: ${Array.isArray(booking.seats) ? booking.seats.join(", ") : booking.seats}`;
    const url = `${window.location.origin}/booking-details?bookingId=${booking.bookingId || booking.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `AiBus Ticket – ${bRef}`,
          text: shareText,
          url,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          await navigator.clipboard.writeText(`${shareText}\n${url}`);
          alert("Ticket details copied to clipboard!");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${url}`);
        alert("Ticket details copied to clipboard!");
      } catch {
        alert("Unable to copy ticket URL. Please copy from the address bar.");
      }
    }
  };

  const handleDownloadTicket = (booking) => {
    const bRef = booking.bookingId || booking.bookingReference || booking.id || booking.bookingNumber;
    navigate(`/booking-details?bookingId=${bRef}`);
  };

  const today = new Date().toISOString().slice(0, 10);
  const filteredBookings = bookings.filter((b) => {
    if (filterTab === "ALL") return true;
    const journeyDate = b.bus?.date ? String(b.bus.date).slice(0, 10) : (b.journeyDate ? String(b.journeyDate).slice(0, 10) : "");
    const isCancelled = b.status?.toLowerCase() === "cancelled";

    if (filterTab === "UPCOMING") {
      return !isCancelled && (!journeyDate || journeyDate >= today);
    }
    if (filterTab === "COMPLETED") {
      return !isCancelled && journeyDate && journeyDate < today;
    }
    if (filterTab === "CANCELLED") {
      return isCancelled;
    }
    return true;
  });

  return (
    <main className="my-bookings-page">
      <div className="my-bookings-container">
        {/* Top Header Bar */}
        <div className="bookings-page-topbar">
          <button
            type="button"
            className="subtle-back-nav"
            onClick={() => navigate("/")}
          >
            ← Back to Home
          </button>

          {user && (
            <div className="session-user-badge">
              <span className="user-avatar-pip">
                <User size={13} />
              </span>
              <span>Logged in as: <strong>{user.name || user.contactName || "Traveler"} ({user.mobile || "+91 User"})</strong></span>
            </div>
          )}
        </div>

        <div className="my-bookings-header-row">
          <div>
            <h1 className="my-bookings-title">My Bookings</h1>
            <p className="my-bookings-subtitle">
              Manage your confirmed trips, download official tickets, or track cancellation refunds.
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        {bookings.length > 0 && (
          <div className="bookings-tabs-bar">
            {[
              { id: "ALL", label: `All Trips (${bookings.length})` },
              {
                id: "UPCOMING",
                label: `Upcoming (${
                  bookings.filter(
                    (b) =>
                      b.status?.toLowerCase() !== "cancelled" &&
                      (!b.bus?.date || String(b.bus.date).slice(0, 10) >= today)
                  ).length
                })`,
              },
              {
                id: "COMPLETED",
                label: `Completed (${
                  bookings.filter(
                    (b) =>
                      b.status?.toLowerCase() !== "cancelled" &&
                      b.bus?.date &&
                      String(b.bus.date).slice(0, 10) < today
                  ).length
                })`,
              },
              {
                id: "CANCELLED",
                label: `Cancelled (${
                  bookings.filter((b) => b.status?.toLowerCase() === "cancelled").length
                })`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`booking-tab-btn ${filterTab === tab.id ? "active" : ""}`}
                onClick={() => setFilterTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Empty States */}
        {!user && bookings.length === 0 ? (
          <section className="empty-bookings-card">
            <div className="empty-icon-wrap">
              <User size={32} />
            </div>
            <h2>Sign in to view your bookings</h2>
            <p className="simple-login-msg">Log in to view your confirmed tickets, manage cancellations, and track your refunds in real time.</p>
            <button
              type="button"
              className="primary-login-btn"
              onClick={() => navigate("/login?returnTo=/my-bookings")}
            >
              Log In to My Account
            </button>
          </section>
        ) : loading ? (
          <div className="modern-loading-box">
            <div className="pulse-spinner" />
            <p>Retrieving your confirmed bookings from partner network...</p>
          </div>
        ) : error ? (
          <section className="empty-bookings-card error-card">
            <div className="empty-icon-wrap error-icon">
              <AlertCircle size={32} />
            </div>
            <h2>Unable to load bookings</h2>
            <p>{error}</p>
            <button type="button" className="retry-btn" onClick={loadBookings}>
              Try Again
            </button>
          </section>
        ) : bookings.length === 0 ? (
          <section className="empty-bookings-card">
            <div className="empty-icon-wrap">
              <Bus size={32} />
            </div>
            <h2>No Bookings Yet</h2>
            <p>You haven&apos;t booked any bus journeys yet. Explore top highway corridors and reserve your seats with ease!</p>
            <button
              type="button"
              className="search-buses-cta-btn"
              onClick={() => navigate("/")}
            >
              Explore Routes & Book Buses
            </button>
          </section>
        ) : filteredBookings.length === 0 ? (
          <section className="empty-bookings-card">
            <div className="empty-icon-wrap">
              <Calendar size={32} />
            </div>
            <h2>No {filterTab.toLowerCase()} trips found</h2>
            <p>You do not have any trips in this category.</p>
            <button
              type="button"
              className="search-buses-cta-btn"
              onClick={() => setFilterTab("ALL")}
            >
              View All Trips
            </button>
          </section>
        ) : (
          <div className="bookings-list">
            {filteredBookings.map((booking) => {
              const statusRaw = String(booking.status || "").toLowerCase();
              const isCancelled = statusRaw === "cancelled";
              const isHoldExpired = statusRaw.includes("hold") || statusRaw.includes("expired");
              const isConfirmed = !isCancelled && !isHoldExpired;

              const refId = booking.bookingId || booking.bookingReference || booking.id;
              const displayBookingNo = booking.bookingNumber || booking.bookingReference || (refId ? `AIB-${String(refId).slice(0, 8).toUpperCase()}` : "AIB-TICKET");
              const pnr = booking.pnr || booking.pnrNumber || displayBookingNo;
              const ticketNo = booking.ticketNumber || booking.providerTicketNo || booking.ticketNo || booking.ticket?.ticketNumber || pnr;

              const operator = booking.bus?.operator || booking.operatorName || "Intercity Express";
              const busType = booking.bus?.busType || booking.busType || "AC Luxury Coach";
              const initials = operator
                .split(" ")
                .map((w) => w[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase() || "BUS";

              const depTime = formatTimeDisplay(booking.bus?.departureTime || booking.pickupTime, "13:03");
              const arrTime = formatTimeDisplay(booking.bus?.arrivalTime || booking.dropoffTime, "22:23");
              const journeyDateStr = formatTripDate(booking.bus?.date || booking.journeyDate);
              const duration = booking.bus?.duration || "9h 20m";

              const fromCity = booking.bus?.from || booking.fromCityName || "Chennai";
              const toCity = booking.bus?.to || booking.toCityName || "Bangalore";
              const pickupLoc = booking.bus?.pickupLocation || booking.pickupLocation || `${fromCity} Boarding Terminal`;
              const dropoffLoc = booking.bus?.dropoffLocation || booking.dropoffLocation || `${toCity} Central Drop`;

              const seatsArray = Array.isArray(booking.seats)
                ? booking.seats
                : typeof booking.seats === "string"
                  ? booking.seats.split(",").map((s) => s.trim())
                  : ["16"];

              const passengerName =
                booking.traveller?.name ||
                booking.contactName ||
                (booking.passengers?.[0]?.name) ||
                "Passenger";

              const totalPaid = Number(booking.totalAmount || booking.totalFare || 210);
              const baseFare = Number(booking.baseFare || (totalPaid > 10 ? totalPaid - 10 : totalPaid));
              const tax = Number(booking.serviceTax || Math.max(0, totalPaid - baseFare));

              return (
                <article key={refId} className={`modern-ticket-card ${isCancelled ? "is-cancelled" : isHoldExpired ? "is-expired" : "is-confirmed"}`}>
                  {/* Top Card Bar: Operator Info & Status Tag */}
                  <div className="ticket-card-top-bar">
                    <div className="operator-profile-box">
                      <div className="operator-initials-avatar" title={operator}>
                        {initials}
                      </div>
                      <div className="operator-meta-col">
                        <div className="operator-name-row">
                          <h2 className="operator-title">{operator}</h2>
                          <span className="verified-partner-pip" title="Verified Bus Partner">
                            <ShieldCheck size={13} className="shield-icon" />
                            <span>Verified</span>
                          </span>
                        </div>
                        <span className="coach-type-lbl">{busType}</span>
                      </div>
                    </div>

                    <div className="status-and-pnr-group">
                      <div className={`modern-status-badge ${isCancelled ? "badge-cancelled" : isHoldExpired ? "badge-expired" : "badge-confirmed"}`}>
                        {isCancelled ? (
                          <>
                            <span className="status-dot red" />
                            <span>Cancelled</span>
                          </>
                        ) : isHoldExpired ? (
                          <>
                            <span className="status-dot amber" />
                            <span>Hold Expired</span>
                          </>
                        ) : (
                          <>
                            <span className="status-dot green" />
                            <span>Confirmed</span>
                          </>
                        )}
                      </div>

                      {/* Clean Booking ID & Quick Copy */}
                      <div className="booking-ref-chip" title="Click to copy Booking Number">
                        <span className="ref-prefix">ID:</span>
                        <strong className="ref-value">{displayBookingNo}</strong>
                        <button
                          type="button"
                          className="copy-ref-icon-btn"
                          onClick={() => handleCopy(displayBookingNo, refId)}
                          aria-label="Copy Booking ID"
                        >
                          {copiedId === refId ? (
                            <Check size={12} className="copy-success" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>

                      {/* Ticket Number & Quick Copy */}
                      <div className="booking-ref-chip ticket-no-chip" title="Click to copy Ticket Number">
                        <span className="ref-prefix">TKT:</span>
                        <strong className="ref-value">{ticketNo}</strong>
                        <button
                          type="button"
                          className="copy-ref-icon-btn"
                          onClick={() => handleCopy(ticketNo, `${refId}-tkt`)}
                          aria-label="Copy Ticket Number"
                        >
                          {copiedId === `${refId}-tkt` ? (
                            <Check size={12} className="copy-success" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Route & Timing Visual Timeline */}
                  <div className="journey-timeline-section">
                    {/* Departure Node */}
                    <div className="timeline-node departure-col">
                      <span className="node-time">{depTime}</span>
                      <div className="node-city-row">
                        <MapPin size={13} className="city-pin-icon departure" />
                        <span className="node-city-name">{fromCity}</span>
                      </div>
                      <span className="node-point-name" title={pickupLoc}>
                        {pickupLoc}
                      </span>
                      <span className="node-date-badge">{journeyDateStr}</span>
                    </div>

                    {/* Middle Transit Connector */}
                    <div className="transit-connector-track">
                      <span className="transit-duration-bubble">
                        <Clock size={11} className="duration-icon" />
                        <span>{duration}</span>
                      </span>
                      <div className="transit-track-line">
                        <div className="track-pulse-dot" />
                        <Bus size={15} className="transit-bus-glyph" />
                        <div className="track-pulse-dot" />
                      </div>
                      <span className="transit-mode-text">Direct Highway Express</span>
                    </div>

                    {/* Arrival Node */}
                    <div className="timeline-node arrival-col">
                      <span className="node-time">{arrTime}</span>
                      <div className="node-city-row">
                        <MapPin size={13} className="city-pin-icon arrival" />
                        <span className="node-city-name">{toCity}</span>
                      </div>
                      <span className="node-point-name" title={dropoffLoc}>
                        {dropoffLoc}
                      </span>
                      <span className="node-date-badge">{journeyDateStr}</span>
                    </div>
                  </div>

                  {/* Information Grid: Passenger, Seats, Fare, Tracking */}
                  <div className="ticket-info-grid">
                    <div className="info-cell">
                      <span className="cell-lbl">
                        <User size={12} />
                        <span>Passenger</span>
                      </span>
                      <strong className="cell-val text-capitalize">{passengerName}</strong>
                      <span className="cell-sub-note">{seatsArray.length} Seat{seatsArray.length > 1 ? "s" : ""} Reserved</span>
                    </div>

                    <div className="info-cell">
                      <span className="cell-lbl">
                        <Armchair size={12} />
                        <span>Seats Booked</span>
                      </span>
                      <div className="seats-badge-row">
                        {seatsArray.map((s, idx) => (
                          <span key={idx} className="seat-num-badge">
                            Seat {s}
                          </span>
                        ))}
                      </div>
                      <span className="cell-sub-note">Berth Confirmed</span>
                    </div>

                    <div className="info-cell">
                      <span className="cell-lbl">
                        <Receipt size={12} />
                        <span>Total Paid</span>
                      </span>
                      <strong className="cell-val fare-highlight">₹{totalPaid}</strong>
                      <span className="cell-sub-note">
                        {tax > 0 ? `Base ₹${baseFare} + ₹${tax} Tax` : "All Taxes Included"}
                      </span>
                    </div>

                    <div className="info-cell">
                      <span className="cell-lbl">
                        <ShieldCheck size={12} />
                        <span>PNR & Ticket No</span>
                      </span>
                      <strong className="cell-val pnr-text">{pnr}</strong>
                      <span className="cell-sub-note">
                        Ticket: <strong style={{ color: "#0f172a" }}>{ticketNo}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Dedicated Refund Status Box for Cancelled Bookings */}
                  {isCancelled && (
                    <div className="cancellation-refund-card">
                      <div className="refund-card-header">
                        <div className="refund-status-tag">
                          <CheckCircle2 size={15} />
                          <span>REFUND PROCESSED</span>
                        </div>
                        <div className="refund-amount-box">
                          <span>Total Refund:</span>
                          <strong>₹{booking.refundAmount || totalPaid}</strong>
                        </div>
                      </div>
                      <p className="refund-description">
                        Processed back to original payment method. Amount will credit to your account within 3–5 business days.
                      </p>
                    </div>
                  )}

                  {/* Action Toolbar */}
                  <div className="ticket-card-actions-bar">
                    <div className="action-left-pills">
                      <button
                        type="button"
                        className="card-secondary-btn share-btn"
                        title="Share Ticket details"
                        onClick={() => handleShareTicket(booking)}
                      >
                        <Share2 size={13} />
                        <span>Share</span>
                      </button>

                      <button
                        type="button"
                        className="card-secondary-btn download-btn"
                        title="Download e-Ticket PDF"
                        onClick={() => handleDownloadTicket(booking)}
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </button>
                    </div>

                    <div className="action-right-buttons">
                      {isConfirmed && (
                        <button
                          type="button"
                          className="card-cancel-btn"
                          onClick={() => handleCancelBooking(refId)}
                          title="Cancel seat reservation"
                        >
                          <RotateCcw size={13} />
                          <span>Cancel Ticket</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="card-primary-view-btn"
                        onClick={() => navigate(`/booking-details?bookingId=${refId}`)}
                      >
                        <span>View Details</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default MyBookings;
