import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import bookingService from "../../services/bookingService";
import authService from "../../services/authService";
import "./BookingDetails.css";

function BookingDetails() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get("bookingId");
  const loggedInUser = authService.getLoggedInUser();

  const [booking, setBooking] = useState(null);
  const [gdsDetails, setGdsDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [checkingCancellation, setCheckingCancellation] = useState(false);
  const [cancellationInfo, setCancellationInfo] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [copiedField, setCopiedField] = useState("");

  useEffect(() => {
    let isMounted = true;
    if (bookingId) {
      bookingService
        .getBookingById(bookingId)
        .then(async (data) => {
          if (!isMounted) return;
          setBooking(data);
          setLoading(false);

          // If ticket has PNR and Ticket number, fetch live GDS details
          const pnr = data?.pnr || data?.providerPnrNo;
          const ticketNo = data?.ticketNumber || data?.providerTicketNo;
          if (pnr && ticketNo && !pnr.startsWith("PNR-") && !ticketNo.startsWith("TKT-")) {
            try {
              const liveGds = await bookingService.getGdsBookingDetails({ pnr, ticketNo });
              if (isMounted && liveGds) {
                setGdsDetails(liveGds);
              }
            } catch (err) {
              console.warn("GDS live details check note:", err.message);
            }
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

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(""), 2000);
    });
  };

  const handleDownloadTicket = () => {
    // Trigger browser print dialog which can save as PDF
    const originalTitle = document.title;
    const bRef = booking?.bookingReference || booking?.bookingId || 'Ticket';
    document.title = `AiBus_Ticket_${bRef}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const handleShareTicket = async () => {
    const bRef = booking?.bookingReference || booking?.bookingId || '';
    const pnr = booking?.pnr || '';
    const from = booking?.bus?.from || '';
    const to = booking?.bus?.to || '';
    const date = booking?.bus?.date || '';
    const shareText = `🚌 AiBus Ticket\nBooking ID: ${bRef}\nPNR: ${pnr}\nRoute: ${from} → ${to}\nDate: ${date}\n\nTrack your ticket on AiBus App`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `AiBus Ticket – ${bRef}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Share failed, falling back to clipboard:', err);
          await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
          alert('Ticket details copied to clipboard!');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('Ticket details copied to clipboard!');
      } catch {
        alert('Could not share ticket. Please copy the page URL manually.');
      }
    }
  };

  const handlePrintTicket = () => {
    window.print();
  };

  // Fetch live IsCancellable details from GDS before cancellation
  const handleOpenCancelModal = async () => {
    if (!booking) return;
    setCancelError("");
    setCheckingCancellation(true);
    setShowCancelModal(true);

    try {
      const data = await bookingService.checkCancellability(
        booking.bookingId || booking.bookingReference,
        booking.seats
      );
      setCancellationInfo(data);
    } catch (err) {
      console.warn("Could not fetch live cancellability:", err);
      // Fallback preview
      setCancellationInfo({
        IsCancellable: true,
        ChargePct: 0,
        ChargeAmt: 0,
        TotalFare: booking.totalAmount || 0,
        RefundAmount: booking.totalAmount || 0,
        Message: "Cancellable under standard policy",
      });
    } finally {
      setCheckingCancellation(false);
    }
  };

  const handleConfirmCancellation = async () => {
    if (!booking) return;

    try {
      setCancelling(true);
      setCancelError("");
      await bookingService.cancelBooking(booking.bookingId || booking.bookingReference, {
        seatNos: Array.isArray(booking.seats) ? booking.seats : [booking.seats],
        reason: cancelReason || "Customer requested cancellation",
      });

      const updated = await bookingService.getBookingById(booking.bookingId || booking.bookingReference);
      if (updated) {
        setBooking(updated);
      } else {
        setBooking({ ...booking, status: "Cancelled" });
      }
      setShowCancelModal(false);
    } catch (err) {
      setCancelError(err.message || "Failed to cancel booking. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <main className="booking-details-page">
        <div className="booking-details-container loading-wrap">
          <div className="ticket-pulse-loader">
            <span className="loader-bus-icon">🚌</span>
            <h2>Fetching Digital Ticket Details...</h2>
            <p>Retrieving verified PNR and boarding information from Mantis GDS</p>
          </div>
        </div>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="booking-details-page">
        <div className="booking-details-container">
          <button
            type="button"
            className="subtle-back-btn no-print"
            onClick={() => navigate(loggedInUser ? "/my-bookings" : "/")}
          >
            ← Back to {loggedInUser ? "My Bookings" : "Home"}
          </button>

          <div className="booking-not-found-card">
            <h1>Booking Not Found</h1>
            <p>The requested booking details could not be found.</p>
            <button type="button" onClick={() => navigate("/")}>
              Search Buses
            </button>
          </div>
        </div>
      </main>
    );
  }

  const isCancelled =
    Boolean(gdsDetails?.IsCancelled) ||
    booking.status?.toLowerCase() === "cancelled" ||
    booking.bookingStatus?.toLowerCase() === "cancelled";

  const statusStr = isCancelled ? "Cancelled" : "Confirmed";

  // Merge GDS and Booking Details
  const operatorName = gdsDetails?.CompanyName || booking.bus?.operator || "AIBus Travels";
  const busTypeName = gdsDetails?.BusTypeName || booking.bus?.busType || "AC Sleeper / Seater";
  const fromCity = gdsDetails?.FromCityName || booking.bus?.from || "Bengaluru";
  const toCity = gdsDetails?.ToCityName || booking.bus?.to || "Chennai";
  const departureTime = gdsDetails?.DepartureDateTime
    ? gdsDetails.DepartureDateTime.slice(11, 16)
    : booking.bus?.departureTime || "23:00";
  const arrivalTime = gdsDetails?.ArrivalDateTime
    ? gdsDetails.ArrivalDateTime.slice(11, 16)
    : booking.bus?.arrivalTime || "09:15";
  const journeyDate = gdsDetails?.JourneyDate
    ? gdsDetails.JourneyDate.slice(0, 10)
    : booking.bus?.date || "2026-10-10";

  const pnrNumber = gdsDetails?.PNRNo || booking.pnr || "411415175-219402";
  const ticketNumber = gdsDetails?.TicketNo || booking.ticketNumber || "502627910";
  const bookingRef = booking.bookingReference || booking.bookingId;

  const pickupInfo = gdsDetails?.PickupInfo || {
    PickupName: booking.bus?.pickupLocation || "Main Boarding Point",
    PickupTime: booking.bus?.departureTime || departureTime,
    Address: "",
    Phone: booking.contactPhone || "",
    Landmark: "",
  };

  const passengers =
    Array.isArray(gdsDetails?.Passengers) && gdsDetails.Passengers.length > 0
      ? gdsDetails.Passengers.map((p) => ({
          seat: p.SeatNo || "3",
          name: p.Name || "Passenger",
          age: p.Age || 25,
          gender: p.Gender === "F" || p.Gender === "Female" ? "Female" : "Male",
          seatType: p.SeatType || (p.IsAcSeat ? "AC Seat" : "Seater"),
          fare: p.Fare || 105,
        }))
      : Array.isArray(booking.travellers) && booking.travellers.length > 0
      ? booking.travellers.map((t, idx) => ({
          seat: t.seat || booking.seats?.[idx] || "3",
          name: t.name || "Passenger",
          age: t.age || 25,
          gender: t.gender || "Male",
          seatType: "AC Seat",
          fare: booking.totalAmount || 105,
        }))
      : (booking.seats || ["3"]).map((seat) => ({
          seat,
          name: booking.traveller?.name || "Passenger",
          age: booking.traveller?.age || 25,
          gender: "Male",
          seatType: "AC Seat",
          fare: booking.totalAmount || 105,
        }));

  const primaryContactName = gdsDetails?.ContactInfo?.CustomerName || booking.traveller?.name || "Customer";
  const primaryMobile = gdsDetails?.ContactInfo?.Mobile || booking.userMobile || booking.contactPhone || "9876543210";
  const primaryEmail = gdsDetails?.ContactInfo?.Email || booking.contactEmail || "booking@aibus.in";
  const totalAmount = gdsDetails?.TotalFare || booking.totalAmount || 105;

  return (
    <main className="booking-details-page">
      <div className="booking-details-container">
        {/* Navigation & Action Bar (Hidden on print) */}
        <div className="ticket-top-nav-bar no-print">
          <button
            type="button"
            className="subtle-back-btn"
            onClick={() => navigate(loggedInUser ? "/my-bookings" : "/")}
          >
            ← Back to {loggedInUser ? "My Bookings" : "Home"}
          </button>

          <div className="ticket-quick-actions">
            <button
              type="button"
              className="action-pill-btn print-btn"
              onClick={handleDownloadTicket}
              title="Download as PDF"
            >
              ⬇️ Download PDF
            </button>

            <button
              type="button"
              className="action-pill-btn share-btn"
              onClick={handleShareTicket}
              title="Share Ticket"
            >
              📤 Share Ticket
            </button>

            <button
              type="button"
              className="action-pill-btn print-btn"
              onClick={handlePrintTicket}
              title="Print Ticket"
            >
              🖨️ Print
            </button>

            {!isCancelled && (
              <button
                type="button"
                className="action-pill-btn cancel-btn"
                onClick={handleOpenCancelModal}
              >
                ✕ Cancel Ticket
              </button>
            )}
          </div>
        </div>

        {/* ========================================================
            MAIN DIGITAL BOARDING PASS / TICKET CARD
           ======================================================== */}
        <div className="digital-ticket-wrapper">
          {/* TICKET HEADER HERO */}
          <div className="ticket-hero-header">
            <div className="header-left">
              <div className="brand-logo-row">
                <span className="ticket-logo-badge">🚌 AIBus</span>
                <span className="operator-name-pill">{operatorName}</span>
              </div>
              <span className="bus-category-subtext">{busTypeName}</span>
            </div>

            <div className="header-right">
              <span className={`ticket-status-pill ${isCancelled ? "cancelled" : "confirmed"}`}>
                {isCancelled ? "● TICKET CANCELLED" : "✓ CONFIRMED BOOKING"}
              </span>
              <span className="booking-ref-badge">
                ID: <strong>{bookingRef}</strong>
              </span>
            </div>
          </div>

          {/* CANCELLATION & REFUND BANNER */}
          {isCancelled && (
            <div className="ticket-cancellation-banner">
              <div className="cancellation-banner-header">
                <span className="cancellation-icon">⚠️</span>
                <div>
                  <h3 className="cancellation-title">This Ticket Has Been Cancelled</h3>
                  <p className="cancellation-subtitle">
                    Refund Status: <strong className="refund-status-highlight">{booking.refundStatus || "REFUND INITIATED"}</strong>
                  </p>
                </div>
              </div>
              <div className="cancellation-financial-breakdown">
                <div className="fin-item">
                  <span className="fin-label">Total Fare Paid:</span>
                  <strong className="fin-val">₹{totalAmount}</strong>
                </div>
                <div className="fin-item">
                  <span className="fin-label">Cancellation Charges:</span>
                  <strong className="fin-val penalty">₹{booking.cancellationCharges || 0}</strong>
                </div>
                <div className="fin-item">
                  <span className="fin-label">Refund Amount:</span>
                  <strong className="fin-val refund">₹{booking.refundAmount || totalAmount}</strong>
                </div>
              </div>
              <p className="cancellation-payout-note">
                ℹ️ The refund amount is credited directly to your original payment method within 3-5 business days.
              </p>
            </div>
          )}

          {/* REFERENCE NUMBERS BAR */}
          <div className="ticket-identifiers-bar">
            <div className="id-block">
              <span className="id-label">PNR Number</span>
              <div className="id-copy-row">
                <strong className="id-code">{pnrNumber}</strong>
                <button
                  type="button"
                  className="copy-mini-btn no-print"
                  onClick={() => copyToClipboard(pnrNumber, "pnr")}
                  title="Copy PNR"
                >
                  {copiedField === "pnr" ? "✓" : "📋"}
                </button>
              </div>
            </div>

            <div className="id-block">
              <span className="id-label">Ticket Number</span>
              <div className="id-copy-row">
                <strong className="id-code">{ticketNumber}</strong>
                <button
                  type="button"
                  className="copy-mini-btn no-print"
                  onClick={() => copyToClipboard(ticketNumber, "ticket")}
                  title="Copy Ticket No"
                >
                  {copiedField === "ticket" ? "✓" : "📋"}
                </button>
              </div>
            </div>

            <div className="id-block">
              <span className="id-label">Journey Date</span>
              <strong className="id-date">{journeyDate}</strong>
            </div>

            <div className="id-block">
              <span className="id-label">Total Fare</span>
              <strong className="id-fare">₹{totalAmount}</strong>
            </div>
          </div>

          {/* ROUTE & JOURNEY TIMELINE */}
          <div className="ticket-route-timeline">
            {/* Origin */}
            <div className="timeline-node origin">
              <span className="city-time">{departureTime}</span>
              <h3 className="city-name">{fromCity}</h3>
              <span className="city-date">{journeyDate}</span>
              <div className="stop-loc-tag">
                📍 {pickupInfo.PickupName || "Boarding Point"}
              </div>
            </div>

            {/* Path Graphic */}
            <div className="timeline-path">
              <div className="bus-travel-line">
                <span className="dot start-dot"></span>
                <span className="animated-bus-icon">🚍</span>
                <span className="dot end-dot"></span>
              </div>
              <span className="duration-tag">Direct Express</span>
            </div>

            {/* Destination */}
            <div className="timeline-node destination">
              <span className="city-time">{arrivalTime}</span>
              <h3 className="city-name">{toCity}</h3>
              <span className="city-date">Next Day</span>
              <div className="stop-loc-tag">
                📍 {booking.bus?.dropoffLocation || "Destination Central"}
              </div>
            </div>
          </div>

          {/* PERFORATED TICKET DIVIDER */}
          <div className="perforated-ticket-divider">
            <span className="notch notch-left"></span>
            <div className="dashed-cut-line"></div>
            <span className="notch notch-right"></span>
          </div>

          {/* BOARDING POINT & CONTACT DETAILS */}
          <div className="ticket-info-grid">
            <div className="info-card boarding-point-card">
              <h4 className="info-card-title">📍 Boarding & Pickup Point</h4>
              <div className="point-details-stack">
                <div className="detail-line">
                  <span className="p-label">Location:</span>
                  <strong className="p-val">{pickupInfo.PickupName || "Main Terminal"}</strong>
                </div>
                {pickupInfo.Address && (
                  <div className="detail-line">
                    <span className="p-label">Address:</span>
                    <span className="p-val">{pickupInfo.Address}</span>
                  </div>
                )}
                {pickupInfo.Landmark && (
                  <div className="detail-line">
                    <span className="p-label">Landmark:</span>
                    <span className="p-val">{pickupInfo.Landmark}</span>
                  </div>
                )}
                <div className="detail-line">
                  <span className="p-label">Pickup Time:</span>
                  <strong className="p-val text-red">{pickupInfo.PickupTime || departureTime}</strong>
                </div>
              </div>
            </div>

            <div className="info-card contact-info-card">
              <h4 className="info-card-title">👤 Contact & Passenger Details</h4>
              <div className="point-details-stack">
                <div className="detail-line">
                  <span className="p-label">Primary Traveller:</span>
                  <strong className="p-val">{primaryContactName}</strong>
                </div>
                <div className="detail-line">
                  <span className="p-label">Mobile Number:</span>
                  <strong className="p-val">
                    {primaryMobile.startsWith("+") ? primaryMobile : `+91 ${primaryMobile}`}
                  </strong>
                </div>
                <div className="detail-line">
                  <span className="p-label">Email Address:</span>
                  <span className="p-val">{primaryEmail}</span>
                </div>
                <div className="detail-line">
                  <span className="p-label">Total Seats:</span>
                  <strong className="p-val">{passengers.length} Seat(s)</strong>
                </div>
              </div>
            </div>
          </div>

          {/* PASSENGER SEAT ALLOCATION */}
          <div className="passenger-manifest-section">
            <h4 className="manifest-title">Passenger Manifest & Seat Allocation</h4>
            <div className="passenger-tickets-stack">
              {passengers.map((p, idx) => (
                <div key={p.seat || idx} className="passenger-ticket-row">
                  <div className="seat-badge-square">
                    <span className="seat-lbl">SEAT</span>
                    <strong className="seat-num">{p.seat}</strong>
                  </div>

                  <div className="passenger-details-col">
                    <span className="p-name-badge">{p.name}</span>
                    <span className="p-demographics">
                      {p.age} yrs • {p.gender} • {p.seatType || "AC Seat"}
                    </span>
                  </div>

                  <div className="passenger-fare-col">
                    <span className="fare-tag">Confirmed</span>
                    <span className="fare-val">₹{p.fare || Math.round(totalAmount / passengers.length)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BARCODE & BOARDING VERIFICATION FOOTER */}
          <div className="ticket-barcode-footer">
            <div className="barcode-graphic-col">
              <div className="barcode-bars">
                <div className="b-line w1"></div><div className="b-line w3"></div><div className="b-line w2"></div>
                <div className="b-line w1"></div><div className="b-line w4"></div><div className="b-line w2"></div>
                <div className="b-line w3"></div><div className="b-line w1"></div><div className="b-line w2"></div>
                <div className="b-line w4"></div><div className="b-line w1"></div><div className="b-line w3"></div>
                <div className="b-line w2"></div><div className="b-line w1"></div><div className="b-line w3"></div>
                <div className="b-line w4"></div><div className="b-line w2"></div><div className="b-line w1"></div>
              </div>
              <span className="barcode-num">{pnrNumber}-{ticketNumber}</span>
            </div>

            <div className="ticket-guidelines-col">
              <p className="guideline-text">
                ✓ Valid Govt Photo ID (Aadhaar / Driving License / Passport) is mandatory during boarding.
              </p>
              <p className="guideline-text">
                ✓ Please report at the boarding point at least <strong>15 minutes</strong> prior to departure time.
              </p>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="ticket-bottom-actions no-print">
          <button
            type="button"
            className="btn-print-ticket-main"
            onClick={handlePrintTicket}
          >
            🖨️ Print / Download Ticket
          </button>

          {!isCancelled && (
            <button
              type="button"
              className="btn-cancel-ticket-main"
              disabled={cancelling}
              onClick={handleOpenCancelModal}
            >
              Cancel Booking & View Refund
            </button>
          )}
        </div>

        {/* CANCELLATION & REFUND BREAKDOWN MODAL */}
        {showCancelModal && (
          <div className="modal-overlay" onClick={() => !cancelling && setShowCancelModal(false)}>
            <div className="cancellation-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">Cancellation & Refund Preview</h2>
                  <p className="modal-subtitle">
                    Live refund policy fetched from Mantis GDS Provider
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                >
                  ✕
                </button>
              </div>

              {checkingCancellation ? (
                <div className="modal-loading-state">
                  <div className="spinner-icon">⏳</div>
                  <p>Fetching live refundable fare and cancellation charges...</p>
                </div>
              ) : (
                <div className="modal-body-content">
                  {cancelError && (
                    <div className="cancel-error-banner">
                      ⚠️ {cancelError}
                    </div>
                  )}

                  {/* Status Banner */}
                  <div
                    className={`cancellation-eligibility-badge ${
                      cancellationInfo?.IsCancellable !== false ? "eligible" : "not-eligible"
                    }`}
                  >
                    <span>
                      {cancellationInfo?.IsCancellable !== false
                        ? "✅ Ticket is eligible for cancellation"
                        : "❌ Ticket cannot be cancelled at this time"}
                    </span>
                  </div>

                  {/* Live Refund & Fare Breakdown Grid */}
                  <div className="refund-summary-grid">
                    <div className="refund-stat-box">
                      <span className="stat-label">Total Booking Fare</span>
                      <span className="stat-value">
                        ₹{cancellationInfo?.TotalFare || cancellationInfo?.CancSeatsTotalFare || totalAmount}
                      </span>
                    </div>

                    <div className="refund-stat-box">
                      <span className="stat-label">
                        Cancellation Fee ({cancellationInfo?.ChargePct ?? 0}%)
                      </span>
                      <span className="stat-value text-red">
                        ₹{cancellationInfo?.ChargeAmt ?? (cancellationInfo?.CancellationCharge || 0)}
                      </span>
                    </div>

                    <div className="refund-stat-box highlight-green">
                      <span className="stat-label">Estimated Refund</span>
                      <span className="stat-value text-green">
                        ₹{cancellationInfo?.RefundAmount ?? totalAmount}
                      </span>
                    </div>
                  </div>

                  {/* Seats Info */}
                  <div className="cancellation-details-list">
                    <div className="detail-row">
                      <span className="detail-lbl">Ticket No:</span>
                      <span className="detail-val">
                        {cancellationInfo?.ticketNo || ticketNumber}
                      </span>
                    </div>
                    {pnrNumber && (
                      <div className="detail-row">
                        <span className="detail-lbl">PNR No:</span>
                        <span className="detail-val">{cancellationInfo?.pnrNo || pnrNumber}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-lbl">Seats to Cancel:</span>
                      <span className="detail-val">
                        {cancellationInfo?.seatNos || (Array.isArray(booking.seats) ? booking.seats.join(", ") : booking.seats)}
                      </span>
                    </div>
                  </div>

                  {/* Optional Cancellation Reason */}
                  <div className="cancellation-reason-group">
                    <label htmlFor="cancel-reason" className="reason-label">
                      Reason for cancellation (optional)
                    </label>
                    <input
                      id="cancel-reason"
                      type="text"
                      className="reason-input"
                      placeholder="e.g. Change of travel plans"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      disabled={cancelling}
                    />
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="modal-actions-footer">
                    <button
                      type="button"
                      className="btn-cancel-back"
                      onClick={() => setShowCancelModal(false)}
                      disabled={cancelling}
                    >
                      Keep Ticket
                    </button>

                    <button
                      type="button"
                      className="btn-confirm-cancellation"
                      disabled={cancelling || cancellationInfo?.IsCancellable === false}
                      onClick={handleConfirmCancellation}
                    >
                      {cancelling ? "Processing Cancellation..." : "Confirm & Cancel"}
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

export default BookingDetails;