import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import bookingService from "../../services/bookingService";
import authService from "../../services/authService";
import "./BookingDetails.css";

function formatTicketDate(dateStr, fallbackDate) {
  if (!dateStr || String(dateStr).includes("Invalid")) {
    const fb = fallbackDate && !String(fallbackDate).includes("Invalid") ? fallbackDate : new Date();
    const d = new Date(fb);
    return isNaN(d.getTime())
      ? new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  const clean = String(dateStr).trim().split(/[T ]/)[0];

  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(clean)) {
    const [y, m, d] = clean.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  }

  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(clean)) {
    const [d, m, y] = clean.split(/[-/]/).map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  }

  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const fb = fallbackDate && !String(fallbackDate).includes("Invalid") ? new Date(fallbackDate) : new Date();
  return isNaN(fb.getTime())
    ? new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : fb.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatBookedOn(dateVal) {
  const d = dateVal && !String(dateVal).includes("Invalid") ? new Date(dateVal) : new Date();
  const safeDate = isNaN(d.getTime()) ? new Date() : d;
  const dStr = safeDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const tStr = safeDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dStr}, ${tStr}`;
}

function calcReportingTime(timeStr) {
  if (!timeStr || !timeStr.includes(":")) return "21:15";
  try {
    const [h, m] = timeStr.split(":").map(Number);
    let totalMins = h * 60 + m - 15;
    if (totalMins < 0) totalMins += 24 * 60;
    const repH = String(Math.floor(totalMins / 60)).padStart(2, "0");
    const repM = String(totalMins % 60).padStart(2, "0");
    return `${repH}:${repM}`;
  } catch {
    return timeStr;
  }
}

function BookingDetails() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get("bookingId");
  const autoPrint = searchParams.get("autoPrint") === "true";
  const autoDownload = searchParams.get("autoDownload") === "true";
  const loggedInUser = authService.getLoggedInUser();

  const [booking, setBooking] = useState(null);
  const [gdsDetails, setGdsDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
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

  const handleDownloadTicket = async () => {
    const element = document.getElementById("printable-ticket");
    const bRef = booking?.bookingNumber || booking?.bookingReference || booking?.id || gdsDetails?.TicketNo || "Ticket";
    setDownloadingPdf(true);

    if (element) {
      try {
        const html2pdf = (await import("html2pdf.js")).default;
        const opt = {
          margin: [4, 6, 4, 6],
          filename: `AiBus_Ticket_${bRef}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            letterRendering: true,
          },
          jsPDF: {
            unit: "mm",
            format: "a4",
            orientation: "portrait",
          },
          pagebreak: { mode: ["css", "legacy"] },
        };
        await html2pdf().set(opt).from(element).save();
        setDownloadingPdf(false);
        return;
      } catch (clientPdfErr) {
        console.warn("[handleDownloadTicket] Client-side html2pdf failed, falling back to window.print():", clientPdfErr);
      }
    }

    setDownloadingPdf(false);
    // Fallback: Trigger browser print dialog which can save as PDF
    const originalTitle = document.title;
    document.title = `AiBus_Ticket_${bRef}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  useEffect(() => {
    if (autoPrint && booking && !loading) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
    if (autoDownload && booking && !loading) {
      const timer = setTimeout(() => {
        handleDownloadTicket();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, autoDownload, booking, loading]);

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(""), 2000);
    });
  };

  const handleShareTicket = async () => {
    const bRef = booking?.bookingReference || booking?.bookingId || "";
    const pnr = booking?.pnr || gdsDetails?.PNRNo || "";
    const from = gdsDetails?.FromCityName || booking?.bus?.from || "Pune";
    const to = gdsDetails?.ToCityName || booking?.bus?.to || "Nanded";
    const date = gdsDetails?.JourneyDate || booking?.bus?.date || "";
    const shareText = `🚌 AiBus Ticket\nBooking ID: ${bRef}\nPNR: ${pnr}\nRoute: ${from} → ${to}\nDate: ${date}\n\nView Ticket: ${window.location.href}`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `AiBus Ticket – ${bRef}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Share failed, falling back to clipboard:", err);
          await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
          alert("Ticket details copied to clipboard!");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert("Ticket details copied to clipboard!");
      } catch {
        alert("Could not share ticket. Please copy the page URL manually.");
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
    setCancellationInfo(null);
    setShowCancelModal(true);

    try {
      const targetId = booking.id || booking.bookingId || booking.bookingReference || bookingId;
      const data = await bookingService.checkCancellability(
        targetId,
        booking.seats
      );
      if (data) {
        setCancellationInfo(data);
      } else {
        throw new Error("Unable to retrieve live cancellation quote from operator.");
      }
    } catch (err) {
      console.warn("Could not fetch live cancellability:", err);
      const errMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        "Failed to retrieve cancellation quote from bus partner.";
      setCancelError(errMsg);
      setCancellationInfo(null);
    } finally {
      setCheckingCancellation(false);
    }
  };

  const handleConfirmCancellation = async () => {
    if (!booking) return;

    try {
      setCancelling(true);
      setCancelError("");
      const targetId = booking.id || booking.bookingId || booking.bookingReference || bookingId;
      const cancelResult = await bookingService.cancelBooking(targetId, {
        seatNos: Array.isArray(booking.seats) ? booking.seats : [booking.seats],
        reason: cancelReason || "Customer requested cancellation",
      });

      const updated = await bookingService.getBookingById(targetId);
      if (updated) {
        setBooking(updated);
      } else {
        setBooking((prev) => ({
          ...prev,
          status: "Cancelled",
          refundAmount: cancelResult?.cancellation?.refundAmount || cancellationInfo?.RefundAmount || 0,
        }));
      }
      setShowCancelModal(false);
    } catch (err) {
      const errMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        "Failed to cancel booking. Please try again.";
      setCancelError(errMsg);
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

  // Merge GDS and Booking Details
  const operatorName = gdsDetails?.CompanyName || booking.operatorName || booking.bus?.operator || "AiBus Travels";
  const busTypeName = gdsDetails?.BusTypeName || booking.busType || booking.bus?.busType || "AC Sleeper / Seater";
  const fromCity = gdsDetails?.FromCityName || booking.fromCityName || booking.bus?.from || "Bengaluru";
  const toCity = gdsDetails?.ToCityName || booking.toCityName || booking.bus?.to || "Chennai";
  const departureTime =
    (gdsDetails?.DepartureDateTime && gdsDetails.DepartureDateTime.includes(" ")
      ? gdsDetails.DepartureDateTime.split(" ")[1]?.slice(0, 5)
      : null) ||
    booking.pickupTime ||
    booking.bus?.departureTime ||
    "21:30";
  const arrivalTime =
    (gdsDetails?.ArrivalDateTime && gdsDetails.ArrivalDateTime.includes(" ")
      ? gdsDetails.ArrivalDateTime.split(" ")[1]?.slice(0, 5)
      : null) ||
    booking.dropoffTime ||
    booking.bus?.arrivalTime ||
    "06:30";
  const rawJourneyDate =
    (gdsDetails?.DepartureDateTime && gdsDetails.DepartureDateTime.includes(" ")
      ? gdsDetails.DepartureDateTime.split(" ")[0]
      : null) ||
    gdsDetails?.JourneyDate ||
    booking.journeyDate ||
    booking.bus?.date ||
    booking.createdAt;
  const journeyDate = formatTicketDate(rawJourneyDate, booking.createdAt);

  const pnrNumber =
    gdsDetails?.PNRNo ||
    gdsDetails?.pnrNo ||
    gdsDetails?.PNR ||
    booking.pnr ||
    booking.providerPnrNo ||
    booking.ticket?.pnrNumber ||
    booking.bookingNumber ||
    "—";

  const ticketNumber =
    gdsDetails?.TicketNo ||
    gdsDetails?.ticketNo ||
    gdsDetails?.TicketNumber ||
    booking.ticketNumber ||
    booking.providerTicketNo ||
    booking.ticketNo ||
    booking.ticket?.ticketNumber ||
    booking.ticket?.providerTicketNo ||
    booking.providerTicketNumber ||
    pnrNumber ||
    "—";
  const bookingRef = booking.bookingNumber || booking.bookingReference || booking.id || "—";

  const pickupInfo = gdsDetails?.PickupInfo || {
    PickupName: booking.pickupLocation || booking.bus?.pickupLocation || `${fromCity} Boarding Point`,
    PickupTime: departureTime,
    Address: booking.pickupAddress || booking.pickupLocation || booking.bus?.pickupLocation || `${fromCity} Boarding Point`,
    Phone: booking.contactPhone || "",
    Landmark: "",
  };

  const dropoffInfo = gdsDetails?.DroppingInfo || {
    DropoffName: booking.dropoffLocation || booking.bus?.dropoffLocation || `${toCity} Dropoff Point`,
    DropoffTime: arrivalTime,
    Address: booking.dropoffAddress || booking.dropoffLocation || booking.bus?.dropoffLocation || `${toCity} Dropoff Point`,
  };

  const totalAmount = Number(gdsDetails?.TotalFare || booking.totalAmount || booking.totalFare || 0);
  const discountAmount = Number(booking.discountAmount ?? booking.couponDiscount ?? 0);
  const walletAmount = Number(booking.walletAmount ?? 0);
  const totalSaved = discountAmount + walletAmount;
  const grossFare = totalAmount + totalSaved;

  let basicFare = 0;
  let gstAmount = 0;

  if (Number(booking.baseFare) > 0) {
    basicFare = Number(booking.baseFare);
    gstAmount = Math.max(0, Math.round((grossFare - basicFare) * 100) / 100);
  } else if (booking.serviceTax !== undefined && booking.serviceTax !== null && Number(booking.serviceTax) > 0) {
    gstAmount = Number(booking.serviceTax);
    basicFare = Math.max(0, Math.round((grossFare - gstAmount) * 100) / 100);
  } else {
    basicFare = grossFare;
    gstAmount = 0;
  }

  const getSeatValue = (item, fallbackIdx) => {
    if (!item) return "";
    if (typeof item === "string" || typeof item === "number") return String(item);
    return String(
      item.SeatNo ||
      item.seatNo ||
      item.seat_no ||
      item.SeatName ||
      item.seatNumber ||
      item.seat ||
      (typeof item.seat === "object" ? item.seat?.seatNo || item.seat?.seat : "") ||
      (booking.seats?.[fallbackIdx]
        ? typeof booking.seats[fallbackIdx] === "object"
          ? booking.seats[fallbackIdx].seatNo || booking.seats[fallbackIdx].seat_no
          : booking.seats[fallbackIdx]
        : "") ||
      ""
    );
  };

  const rawPassengerList =
    (Array.isArray(gdsDetails?.Passengers) && gdsDetails.Passengers.length > 0 ? gdsDetails.Passengers : null) ||
    (Array.isArray(gdsDetails?.Seats) && gdsDetails.Seats.length > 0 ? gdsDetails.Seats : null) ||
    (Array.isArray(booking.passengers) && booking.passengers.length > 0 ? booking.passengers : null) ||
    (Array.isArray(booking.travellers) && booking.travellers.length > 0 ? booking.travellers : null) ||
    (Array.isArray(booking.seats) && booking.seats.length > 0 ? booking.seats : []);

  const passengers = rawPassengerList.length > 0
    ? rawPassengerList.map((p, idx) => {
        const rawSeat = getSeatValue(p, idx);
        const seatNumber = rawSeat || (booking.seats?.[idx] ? (typeof booking.seats[idx] === "object" ? booking.seats[idx].seatNo : booking.seats[idx]) : "") || String(idx + 1);

        const passengerName =
          (typeof p === "object" ? p.Name || p.name || p.PassengerName || p.passengerName : null) ||
          booking.contactName ||
          booking.traveller?.name ||
          `Passenger ${idx + 1}`;

        const age = (typeof p === "object" ? p.Age || p.age : null) || booking.traveller?.age || 28;
        const rawGender = (typeof p === "object" ? p.Gender || p.gender : null) || "Male";
        const gender = String(rawGender).toUpperCase().startsWith("F") ? "Female" : "Male";
        const fare = (typeof p === "object" ? Number(p.Fare || p.fare || p.fareTotal) : null) || (totalAmount / (rawPassengerList.length || 1));

        return {
          seat: seatNumber,
          name: passengerName,
          age,
          gender,
          seatType: (typeof p === "object" && p.SeatType) || "Seater",
          fare,
        };
      })
    : [
        {
          seat: (booking.seats?.[0] ? (typeof booking.seats[0] === "object" ? booking.seats[0].seatNo : booking.seats[0]) : "") || "1",
          name: booking.contactName || booking.traveller?.name || "Passenger 1",
          age: booking.traveller?.age || 28,
          gender: "Male",
          seatType: "Seater",
          fare: totalAmount,
        },
      ];

  const serviceId = gdsDetails?.ServiceId || booking.serviceId || booking.bus?.busId || booking.busId || booking.tripId || "117089";
  const gstin = booking.operatorGstin || booking.bus?.gstin || "27APPPP5097J2ZZ";
  const helpline = booking.operatorHelpline || booking.bus?.helpline || booking.contactPhone || "9209081234";
  const bookedOnStr = formatBookedOn(booking.confirmedAt || booking.createdAt);
  const reportingTime = calcReportingTime(departureTime);

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
              disabled={downloadingPdf}
              title="Download as PDF"
            >
              {downloadingPdf ? "⏳ Generating..." : "⬇️ Download PDF"}
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

        {/* Cancellation Notice Banner (If cancelled) */}
        {isCancelled && (
          <div className="ticket-cancellation-banner no-print">
            <div className="cancellation-banner-header">
              <span className="cancellation-icon">⚠️</span>
              <div>
                <h3 className="cancellation-title">This Ticket Has Been Cancelled</h3>
                <p className="cancellation-subtitle">
                  Refund Status: <strong className="refund-status-highlight">{booking.refundStatus || "REFUND PROCESSED"}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            EXACT ABHIBUS FORMAT E-TICKET
           ======================================================== */}
        <div className="abhibus-ticket-sheet" id="printable-ticket">
          {/* PAGE 1 */}
          <div className="ticket-page ticket-page-1">
            {/* 1. TOP BRAND HEADER */}
            <div className="ticket-sheet-header">
              <div className="ticket-brand-logo">
                <span className="brand-aibus-text">aibus</span>
              </div>
              <div className="ticket-app-badges">
                <a
                  href="https://play.google.com/store/apps/details?id=com.worknai.aibus&pcampaignid=web_share"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-badge-pill"
                  title="Download AiBus App on Google Play"
                >
                  <svg className="badge-svg-icon" viewBox="0 0 24 24" width="14" height="14">
                    <path fill="#4285F4" d="M3.6 1.4L13.8 12 3.6 22.6c-.4-.4-.6-1-.6-1.7V3.1c0-.7.2-1.3.6-1.7z" />
                    <path fill="#FBBC05" d="M17.3 8.5L5.2.5C4.7.2 4.1.2 3.6 1.4l10.2 10.6 3.5-3.5z" />
                    <path fill="#34A853" d="M17.3 15.5l-3.5-3.5-10.2 10.6c.5 1.2 1.1 1.2 1.6.9l12.1-8z" />
                    <path fill="#EA4335" d="M21.5 12c.7.4.7 1 0 1.4l-4.2 2.1-3.5-3.5 3.5-3.5 4.2 2.1c.7.4.7 1 0 1.4z" />
                  </svg>
                  <span>Google Play</span>
                </a>
                <div className="store-badge-pill">
                  <svg className="badge-svg-icon" viewBox="0 0 24 24" width="14" height="14" fill="#000">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.64-.78 1.08-1.86.96-2.95-1 .04-2.17.67-2.86 1.46-.59.68-1.12 1.77-.98 2.84 1.12.09 2.24-.58 2.88-1.35z"/>
                  </svg>
                  <span>App Store</span>
                </div>
              </div>
            </div>

            {/* 2. TICKET META BAR */}
            <div className="ticket-meta-section">
              <div className="meta-left">
                <h2 className="ticket-title-bold">AiBus Ticket</h2>
                <span className="booked-on-text">Booked on {bookedOnStr}</span>
              </div>
              <div className="meta-right">
                <div className="meta-kv-row">
                  <span className="kv-lbl">AiBus Booking ID:</span>
                  <strong className="kv-val">{bookingRef}</strong>
                  <button
                    type="button"
                    className="copy-mini-link no-print"
                    onClick={() => copyToClipboard(bookingRef, "id")}
                    title="Copy Booking ID"
                  >
                    {copiedField === "id" ? "✓" : "📋"}
                  </button>
                </div>
                <div className="meta-kv-row">
                  <span className="kv-lbl">Ticket Number:</span>
                  <strong className="kv-val">{ticketNumber}</strong>
                  <button
                    type="button"
                    className="copy-mini-link no-print"
                    onClick={() => copyToClipboard(ticketNumber, "ticket")}
                    title="Copy Ticket Number"
                  >
                    {copiedField === "ticket" ? "✓" : "📋"}
                  </button>
                </div>
                <div className="meta-kv-row">
                  <span className="kv-lbl">Bus Partner PNR:</span>
                  <strong className="kv-val">{pnrNumber}</strong>
                  <button
                    type="button"
                    className="copy-mini-link no-print"
                    onClick={() => copyToClipboard(pnrNumber, "pnr")}
                    title="Copy PNR"
                  >
                    {copiedField === "pnr" ? "✓" : "📋"}
                  </button>
                </div>
              </div>
            </div>

            {/* 3. OPERATOR & SERVICE ROW */}
            <div className="operator-service-section">
              <div className="op-left">
                <h3 className="operator-name-bold">{operatorName}</h3>
                <span className="bus-type-text">{busTypeName}</span>
                <span className="bus-start-time-text">
                  Bus Start Time: <strong>{departureTime}</strong>
                </span>
              </div>
              <div className="op-right">
                <div className="service-number-text">Service # {serviceId}</div>
                <div className="service-route-text">{fromCity} - {toCity}</div>
                <div className="service-gstin-text">Bus Partner GSTIN: {gstin}</div>
                <div className="service-helpline-row">
                  <span>Bus Partner Helpline Number: </span>
                  <a href={`tel:${helpline}`} className="helpline-blue-link">{helpline}</a>
                </div>
              </div>
            </div>

            {/* 4. ROUTE JOURNEY & BOARDING DETAILS */}
            <div className="journey-grid-section">
              <div className="journey-col dep-col">
                <span className="journey-col-label">Departure <strong>{fromCity}</strong></span>
                <span className="journey-date-text">{journeyDate}</span>
                <strong className="journey-time-text">{departureTime}</strong>
              </div>

              <div className="journey-col boarding-col">
                <strong className="journey-point-title">Boarding Point:</strong>
                <p className="journey-point-desc">{pickupInfo.PickupName || pickupInfo.Address}</p>
                {pickupInfo.Phone && <span className="journey-point-phone">{pickupInfo.Phone}</span>}
              </div>

              <div className="journey-arrow-col">
                <span className="journey-maroon-arrow">→</span>
              </div>

              <div className="journey-col arr-col">
                <span className="journey-col-label">Arrival</span>
                <strong className="arrival-city-bold">{toCity}</strong>
                <span className="journey-date-text">{journeyDate} {arrivalTime}</span>
              </div>

              <div className="journey-col dropping-col">
                <strong className="journey-point-title">Dropping Point:</strong>
                <p className="journey-point-desc">{dropoffInfo.DropoffName || dropoffInfo.Address}</p>
              </div>
            </div>

            <div className="reporting-time-footer-note">
              *Reporting Time at the boarding Point- <strong>{reportingTime}</strong>
            </div>

            {/* 5. PASSENGER DETAILS & PAYMENT DETAILS */}
            <div className="manifest-payment-split">
              {/* Left Column: Passenger Details */}
              <div className="split-column passenger-split-col">
                <div className="split-col-header-bar">
                  Passenger Details
                </div>
                <table className="abhibus-table passenger-table">
                  <thead>
                    <tr>
                      <th style={{ width: "45%" }}>Name</th>
                      <th style={{ width: "20%" }}>Gender</th>
                      <th style={{ width: "15%" }}>Age</th>
                      <th style={{ width: "20%", textAlign: "right" }}>Seat No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passengers.map((p, idx) => (
                      <tr key={p.seat || idx}>
                        <td className="passenger-name-cell">{p.name}</td>
                        <td>{p.gender}</td>
                        <td>{p.age}</td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>{p.seat}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right Column: Payment Details */}
              <div className="split-column payment-split-col">
                <div className="split-col-header-bar">
                  Payment Details
                </div>
                <div className="payment-line-rows">
                  <div className="pay-line">
                    <span className="pay-lbl">Basic Fare</span>
                    <span className="pay-val">Rs. {Number(basicFare).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="pay-line">
                    <span className="pay-lbl">Bus Partner GST</span>
                    <span className="pay-val">Rs. {Number(gstAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="pay-line discount-line">
                      <span className="pay-lbl">Coupon Discount</span>
                      <span className="pay-val">(-)Rs. {Number(discountAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {walletAmount > 0 && (
                    <div className="pay-line promo-line">
                      <span className="pay-lbl">AiBus Cash (promo)</span>
                      <span className="pay-val">(-)Rs. {Number(walletAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="pay-divider-line" />
                  <div className="pay-line total-paid-line">
                    <strong className="pay-lbl-bold">Amount Paid</strong>
                    <strong className="pay-val-red">Rs. {Number(totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                </div>

                {totalSaved > 0 && (
                  <div className="you-saved-banner-box">
                    <div className="saved-title-green">You Saved Rs. {Math.round(totalSaved)} Via aibus</div>
                    <div className="saved-subtext-green">
                      ({discountAmount > 0 ? `Rs. ${discountAmount.toFixed(2)}` : ""}{discountAmount > 0 && walletAmount > 0 ? " + " : ""}{walletAmount > 0 ? `Rs. ${walletAmount.toFixed(2)} promo aibus` : ""})
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 6. IMPORTANT INFORMATION */}
            <div className="important-info-box">
              <div className="important-info-header">
                Important information
              </div>
              <ul className="important-info-list">
                <li>• Please reach the boarding point by the reporting time</li>
                <li>• Chat with us <a href="https://aibus.com/chat" target="_blank" rel="noreferrer">https://aibus.com/chat</a></li>
                <li>• In case Operator is not reachable please reach out to AiBus Customer Support at 040-61656789</li>
              </ul>
            </div>

            {/* 7. TERMS & CONDITIONS AND CANCELLATION POLICY */}
            <div className="terms-cancellation-split">
              <div className="terms-col">
                <h4 className="section-subtitle-bold">Terms and Conditions</h4>
                <ul className="terms-bullets">
                  <li>• The arrival and departure times mentioned on the ticket are only tentative timings.</li>
                  <li>• Passengers are requested to arrive at the boarding point at least 15 min. before the scheduled time of departure</li>
                </ul>
              </div>

              <div className="cancellation-col">
                <h4 className="section-subtitle-bold">Cancellation Policy</h4>
                <table className="abhibus-table cancel-table">
                  <thead>
                    <tr>
                      <th>Cancellation Time</th>
                      <th>Refund (%)</th>
                      <th style={{ textAlign: "right" }}>Refund Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>After {journeyDate} 09:00</td>
                      <td>0%</td>
                      <td style={{ textAlign: "right" }}>Rs. 0</td>
                    </tr>
                  </tbody>
                </table>
                <div className="cancellation-extra-note">
                  Additional Cancellation Charge of Rs. 15 per seat is applicable
                </div>
              </div>
            </div>
          </div>

          {/* PAGE 2 */}
          <div className="ticket-page ticket-page-2">
            <div className="page-2-terms-wrapper">
              <h3 className="page-2-title">General Terms and Conditions</h3>
              <ul className="page-2-list">
                <li>• AiBus is not responsible for any accidents or loss of passenger belongings.</li>
                <li>• AiBus is not responsible for any delay or inconvenience during the journey due to breakdown of the vehicle or other reasons beyond the control of AiBus.</li>
                <li>• If a bus/service is canceled, for tickets booked through AiBus, the refund money is transferred back to the passenger's Credit/Debit card or Bank Account used for booking.</li>
                <li>• Cancellation charges are applicable on Original fare but not on the Discounted Fare.</li>
                <li>• Any complaints/grievances related to journey should be reported within a week from date of journey.</li>
                <li>• For detailed AiBus Terms and Conditions, Please Click Here <a href="https://www.aibus.com/terms" target="_blank" rel="noreferrer">https://www.aibus.com/terms</a>.</li>
              </ul>
            </div>

            <div className="ticket-page-2-footer">
              Copyright © AiBus Technologies Ltd. All Rights Reserved.
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="ticket-bottom-actions no-print">
          <button
            type="button"
            className="btn-print-ticket-main"
            onClick={handleDownloadTicket}
            disabled={downloadingPdf}
          >
            {downloadingPdf ? "⏳ Generating..." : "⬇️ Download / Print E-Ticket"}
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
                      disabled={cancelling || !cancellationInfo || cancellationInfo?.IsCancellable === false}
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
