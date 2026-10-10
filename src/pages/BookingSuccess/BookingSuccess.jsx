import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import bookingService from "../../services/bookingService";
import BookingStepper from "../../components/BookingStepper/BookingStepper";
import "./BookingSuccess.css";

function formatTripDate(dateStr) {
  if (!dateStr) return "Tue, 17 Sep 2026";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function getArrivalDateStr(departureDateStr, departureTime = "19:00", arrivalTime = "04:00") {
  if (!departureDateStr) return "Wed, 18 Sep 2026";
  try {
    const parts = departureDateStr.split("-");
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const depHour = parseInt(departureTime.split(":")[0], 10) || 0;
      const arrHour = parseInt(arrivalTime.split(":")[0], 10) || 0;

      if (arrHour < depHour) {
        d.setDate(d.getDate() + 1);
      }

      return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    return departureDateStr;
  } catch {
    return departureDateStr;
  }
}

function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get("bookingId");
  const [copied, setCopied] = useState(false);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (bookingId) {
      bookingService
        .getBookingById(bookingId)
        .then((data) => {
          if (isMounted) {
            setBooking(data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  const handleCopyId = () => {
    if (booking?.bookingId) {
      navigator.clipboard.writeText(booking.bookingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <main className="booking-success-page">
        <div className="booking-success-container" style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "1.2rem", color: "#666" }}>
            ⏳ Fetching confirmed booking details...
          </div>
        </div>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="booking-success-page">
        <div className="booking-success-container">
          <div className="not-found-card">
            <h1>Booking Not Found</h1>
            <p>We could not find details for this booking.</p>
            <button
              type="button"
              className="primary-view-details-btn"
              onClick={() => navigate("/")}
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  const passengerList =
    booking.travellers && booking.travellers.length > 0
      ? booking.travellers
      : [{ seat: booking.seats.join(", "), ...booking.traveller }];

  const contactMobile =
    booking.userMobile || booking.traveller?.mobile || "9876543210";
  const displayDate = formatTripDate(booking.bus?.date);
  const arrivalDateStr = getArrivalDateStr(
    booking.bus?.date,
    booking.bus?.departureTime,
    booking.bus?.arrivalTime
  );

  return (
    <main className="booking-success-page">
      <div className="booking-success-container">
        {/* Step 4 Stepper */}
        <BookingStepper currentStep={4} />

        {/* Top Success Header Area */}
        <div className="success-header-area">
          {/* Green Check Icon Circle */}
          <div className="success-check-circle">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="check-svg"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 className="success-title">Booking Confirmed!</h1>
          <p className="success-subtitle">
            Thank you for choosing AI Bus. Have a safe journey!
          </p>

          {/* Booking ID Pill Box */}
          <div className="booking-id-pill-box">
            <span className="id-label">Booking ID:</span>
            <strong className="id-val">{booking.bookingId}</strong>
            <button
              type="button"
              className="copy-id-btn"
              title="Copy Booking ID"
              onClick={handleCopyId}
            >
              {copied ? (
                <span className="copied-text">Copied!</span>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="copy-icon"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Single Main White Confirmation Card (max-width ~920px) */}
        <div className="main-success-card">
          {/* Section 1: Bus Details (Text Only - NO bus image/icon!) */}
          <div className="card-section">
            <h2 className="section-heading">Bus Details</h2>
            <div className="grid-info-rows">
              <div className="info-row">
                <span className="info-label">Operator</span>
                <strong className="info-value">{booking.bus.operator}</strong>
              </div>
              <div className="info-row">
                <span className="info-label">Bus Type</span>
                <strong className="info-value">{booking.bus.busType}</strong>
              </div>
              <div className="info-row">
                <span className="info-label">Route</span>
                <strong className="info-value">
                  {booking.bus.from} → {booking.bus.to}
                </strong>
              </div>
              <div className="info-row">
                <span className="info-label">Departure</span>
                <strong className="info-value">
                  {booking.bus.departureTime}{" "}
                  <span className="meta-date-inline">({displayDate})</span>
                </strong>
              </div>
              <div className="info-row">
                <span className="info-label">Arrival</span>
                <strong className="info-value">
                  {booking.bus.arrivalTime}{" "}
                  <span className="meta-date-inline">({arrivalDateStr})</span>
                </strong>
              </div>
              <div className="info-row">
                <span className="info-label">Duration</span>
                <strong className="info-value">{booking.bus.duration}</strong>
              </div>
            </div>
          </div>

          <div className="card-divider" />

          {/* Section 2: Passenger Details (Dynamic N Count) */}
          <div className="card-section">
            <h2 className="section-heading">
              Passenger Details ({passengerList.length})
            </h2>
            <div className="passenger-rows-list">
              {passengerList.map((p, idx) => (
                <div key={p.seat || idx} className="passenger-item-row">
                  <div className="passenger-item-left">
                    <strong className="passenger-num-title">
                      Passenger {idx + 1}
                    </strong>
                    <span className="passenger-seat-badge">Seat {p.seat}</span>
                  </div>
                  <div className="passenger-item-right">
                    <strong className="passenger-name-val">{p.name}</strong>
                    <span className="passenger-meta-val">
                      {p.age} yrs • {p.gender || "Male"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid-info-rows contact-mobile-block">
              <div className="info-row">
                <span className="info-label">Contact Mobile</span>
                <strong className="info-value">+91 {contactMobile}</strong>
              </div>
            </div>
          </div>

          <div className="card-divider" />

          {/* Section 3: Seat Details */}
          <div className="card-section">
            <h2 className="section-heading">Seat Details</h2>
            <div className="grid-info-rows">
              <div className="info-row">
                <span className="info-label">Selected Seats</span>
                <strong className="info-value">{booking.seats.join(", ")}</strong>
              </div>
              <div className="info-row">
                <span className="info-label">Total Seats</span>
                <strong className="info-value">{booking.seats.length}</strong>
              </div>
            </div>
          </div>

          <div className="card-divider" />

          {/* Section 4: Payment Details */}
          <div className="card-section">
            <h2 className="section-heading">Payment Details</h2>
            <div className="grid-info-rows">
              <div className="info-row align-center">
                <span className="info-label">Total Amount</span>
                <strong className="info-value price-highlight">
                  ₹{booking.totalAmount.toLocaleString("en-IN")}
                </strong>
              </div>
              <div className="info-row align-center">
                <span className="info-label">Payment Status</span>
                <span className="payment-status-badge">
                  {booking.status || "Confirmed"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="action-buttons-row">
          <button
            type="button"
            className="primary-view-details-btn"
            onClick={() =>
              navigate(`/booking-details?bookingId=${booking.bookingId}`)
            }
          >
            View Booking Details
          </button>
          <button
            type="button"
            className="print-ticket-btn"
            onClick={() => window.print()}
          >
            🖨️ Print / Save Ticket
          </button>
          <button
            type="button"
            className="secondary-home-btn"
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>
        </div>

        {/* Footer Subtext */}
        <div className="safe-travels-footer-text">
          Safe Travels with AI Bus!
        </div>
      </div>
    </main>
  );
}

export default BookingSuccess;
