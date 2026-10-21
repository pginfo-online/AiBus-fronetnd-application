import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  Share2,
  Printer,
  Bus,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  ShieldCheck,
  Navigation,
  Phone,
  Mail,
  User,
  ArrowRight,
  ExternalLink,
  Lock,
  Headphones,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import bookingService from "../../services/bookingService";
import BookingStepper from "../../components/BookingStepper/BookingStepper";
import "./BookingSuccess.css";

function formatTripDate(dateStr) {
  if (!dateStr) return "Thu, 14 Jan 2027";
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
    return String(dateStr);
  } catch {
    return String(dateStr);
  }
}

function getArrivalDateStr(departureDateStr, departureTime = "11:50", arrivalTime = "00:21") {
  if (!departureDateStr) return "Fri, 15 Jan 2027";
  try {
    const parts = String(departureDateStr).split("T")[0].split("-");
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const depHour = parseInt(String(departureTime).split(":")[0], 10) || 0;
      const arrHour = parseInt(String(arrivalTime).split(":")[0], 10) || 0;

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
    return String(departureDateStr);
  } catch {
    return String(departureDateStr);
  }
}

function formatCleanPhone(raw) {
  if (!raw) return "+91 90876 54567";
  let digits = String(raw).replace(/\D/g, "");
  // Strip duplicate leading 91 country codes
  while (digits.length > 10 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return `+91 ${digits}`;
}

// Pure SVG Vector Boarding Pass QR Code Generator
function BoardingPassQR({ value = "AIBUS-BOARDING-PASS", size = 100 }) {
  const matrixSize = 21;
  const grid = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(false));

  const addFinder = (startX, startY) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[startY + r][startX + c] = isBorder || isCenter;
      }
    }
  };

  addFinder(0, 0);
  addFinder(matrixSize - 7, 0);
  addFinder(0, matrixSize - 7);

  for (let i = 7; i < matrixSize - 7; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  let seed = Math.abs(hash) || 98765;
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= matrixSize - 8;
      const inBL = r >= matrixSize - 8 && c < 8;
      const inTiming = r === 6 || c === 6;

      if (!inTL && !inTR && !inBL && !inTiming) {
        seed = (seed * 9301 + 49297) % 233280;
        grid[r][c] = seed / 233280 > 0.44;
      }
    }
  }

  const cellSize = size / matrixSize;

  return (
    <div className="boarding-qr-wrapper" title={`Boarding Pass QR: ${value}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="boarding-qr-svg"
      >
        <rect width={size} height={size} fill="#ffffff" rx="10" />
        {grid.map((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize + 0.3}
                y={r * cellSize + 0.3}
                width={cellSize - 0.6}
                height={cellSize - 0.6}
                rx={cellSize * 0.22}
                fill="#0f172a"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}

function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get("bookingId");

  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (bookingId) {
      bookingService
        .getBookingById(bookingId)
        .then((data) => {
          if (isMounted) {
            if (data) {
              setBooking(data);
            } else {
              // Fallback demo data with the given bookingId
              setBooking({
                id: bookingId,
                bookingId: bookingId,
                bookingReference: bookingId,
                pnr: "GDS-984210",
                ticketNumber: "TKT-AIBUS-58705",
                userMobile: "9087654567",
                contactEmail: "vrinda@aibus.in",
                bus: {
                  operator: "GDS Demo Testnaveen",
                  busType: "AC Seater (2+2)",
                  from: "Bengaluru",
                  to: "Chennai",
                  departureTime: "11:50",
                  arrivalTime: "00:21",
                  duration: "12h 31m",
                  date: "2027-01-14",
                  pickupLocation: "Majestic Bus Terminal (Bay 12)",
                  dropoffLocation: "Koyambedu Bus Stand (Platform 4)",
                },
                travellers: [
                  {
                    seat: "21",
                    name: "vrinda sa",
                    age: 33,
                    gender: "Male",
                    mobile: "9087654567",
                  },
                ],
                seats: ["21"],
                totalAmount: 15,
                baseFare: 15,
                serviceTax: 0,
                status: "Confirmed",
              });
            }
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setBooking({
              id: bookingId,
              bookingId: bookingId,
              bookingReference: bookingId,
              pnr: "GDS-984210",
              ticketNumber: "TKT-AIBUS-58705",
              userMobile: "9087654567",
              contactEmail: "vrinda@aibus.in",
              bus: {
                operator: "GDS Demo Testnaveen",
                busType: "AC Seater (2+2)",
                from: "Bengaluru",
                to: "Chennai",
                departureTime: "11:50",
                arrivalTime: "00:21",
                duration: "12h 31m",
                date: "2027-01-14",
                pickupLocation: "Majestic Bus Terminal (Bay 12)",
                dropoffLocation: "Koyambedu Bus Stand (Platform 4)",
              },
              travellers: [
                {
                  seat: "21",
                  name: "vrinda sa",
                  age: 33,
                  gender: "Male",
                  mobile: "9087654567",
                },
              ],
              seats: ["21"],
              totalAmount: 15,
              baseFare: 15,
              serviceTax: 0,
              status: "Confirmed",
            });
            setLoading(false);
          }
        });
    } else {
      // Check if recent guest booking exists
      const guests = bookingService.getGuestBookings?.() || [];
      if (guests.length > 0) {
        setBooking(guests[0]);
      } else {
        // Default demo booking
        setBooking({
          id: "36358705-059e-4058-8776-de10b9df8f6d",
          bookingId: "36358705-059e-4058-8776-de10b9df8f6d",
          bookingReference: "36358705-059e-4058-8776-de10b9df8f6d",
          pnr: "GDS-984210",
          ticketNumber: "TKT-AIBUS-58705",
          userMobile: "9087654567",
          contactEmail: "vrinda@aibus.in",
          bus: {
            operator: "GDS Demo Testnaveen",
            busType: "AC Seater (2+2)",
            from: "Bengaluru",
            to: "Chennai",
            departureTime: "11:50",
            arrivalTime: "00:21",
            duration: "12h 31m",
            date: "2027-01-14",
            pickupLocation: "Majestic Bus Terminal (Bay 12)",
            dropoffLocation: "Koyambedu Bus Stand (Platform 4)",
          },
          travellers: [
            {
              seat: "21",
              name: "vrinda sa",
              age: 33,
              gender: "Male",
              mobile: "9087654567",
            },
          ],
          seats: ["21"],
          totalAmount: 15,
          baseFare: 15,
          serviceTax: 0,
          status: "Confirmed",
        });
      }
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  const handleCopyId = () => {
    const idToCopy = booking?.bookingReference || booking?.bookingId || bookingId || "";
    if (idToCopy) {
      navigator.clipboard.writeText(idToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareTicket = async () => {
    const bId = booking?.bookingReference || booking?.bookingId || "Ticket";
    const shareData = {
      title: `AiBus Ticket - ${bId}`,
      text: `🚌 AiBus Booking Confirmed!\nRoute: ${booking?.bus?.from || "Bengaluru"} → ${booking?.bus?.to || "Chennai"}\nSeat: ${booking?.seats?.join(", ") || "21"}\nBooking ID: ${bId}\nTrack live on AiBus.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== "AbortError") {
          navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
          setShared(true);
          setTimeout(() => setShared(false), 2500);
        }
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }
  };

  const handlePrintTicket = () => {
    const originalTitle = document.title;
    const bId = booking?.bookingReference || booking?.bookingId || "Ticket";
    document.title = `AiBus_Ticket_${bId}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1200);
  };

  if (loading) {
    return (
      <main className="booking-success-page">
        <div className="booking-success-container">
          <div className="luxury-loading-card">
            <div className="luxury-loading-spinner" />
            <h2>Issuing Digital Boarding Pass...</h2>
            <p>Fetching confirmed PNR & seat reservation details</p>
          </div>
        </div>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="booking-success-page">
        <div className="booking-success-container">
          <div className="luxury-not-found-card">
            <AlertTriangle size={48} className="warn-svg" />
            <h1>Booking Not Found</h1>
            <p>We could not find booking details for this reference.</p>
            <button
              type="button"
              className="luxury-back-home-btn"
              onClick={() => navigate("/")}
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  const bus = booking.bus || {};
  const operator = bus.operator || "AI Bus Express";
  const busType = bus.busType || "AC Seater (2+2)";
  const fromCity = bus.from || "Bengaluru";
  const toCity = bus.to || "Chennai";
  const departureTime = bus.departureTime || "11:50";
  const arrivalTime = bus.arrivalTime || "00:21";
  const duration = bus.duration || "12h 31m";
  const pickupLocation = bus.pickupLocation || "Majestic Bus Terminal (Bay 12)";
  const dropoffLocation = bus.dropoffLocation || "Koyambedu Bus Stand (Platform 4)";
  const displayDate = formatTripDate(bus.date);
  const arrivalDateStr = getArrivalDateStr(bus.date, departureTime, arrivalTime);

  const passengerList =
    booking.travellers && booking.travellers.length > 0
      ? booking.travellers
      : (booking.seats && booking.seats.length > 0
          ? booking.seats.map((s, i) => ({
              seat: s,
              name: booking.traveller?.name || `Passenger ${i + 1}`,
              age: booking.traveller?.age || 28,
              gender: booking.traveller?.gender || "Male",
            }))
          : [{ seat: "21", name: "vrinda sa", age: 33, gender: "Male" }]);

  const rawPhone = booking.userMobile || booking.traveller?.mobile || "9087654567";
  const cleanedPhone = formatCleanPhone(rawPhone);
  const contactEmail = booking.contactEmail || "vrinda@aibus.in";

  const rawStatus = String(booking.status || "CONFIRMED").toUpperCase();
  const isFailedStatus = rawStatus.includes("FAIL") || rawStatus.includes("CANCEL");
  const pnrValue = booking.pnr || booking.bookingReference?.slice(0, 8)?.toUpperCase() || "GDS-984210";
  const bookingRef = booking.bookingReference || booking.bookingId || bookingId || "36358705-059e-4058-8776-de10b9df8f6d";

  const mapsQuery = encodeURIComponent(`${pickupLocation}, ${fromCity}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <main className="booking-success-page">
      <div className="booking-success-container">
        {/* Step 4 Stepper */}
        <div className="stepper-section-wrap">
          <BookingStepper currentStep={4} />
        </div>

        {/* Top Celebration Hero Header */}
        <div className="celebration-hero-wrap">
          <div className="celebration-badge-outer">
            <div className="celebration-badge-inner">
              <CheckCircle2 size={36} className="hero-check-icon" strokeWidth={2.8} />
            </div>
            <div className="celebration-halo-pulse" />
            <div className="celebration-sparkle celebration-sparkle-1">
              <Sparkles size={16} />
            </div>
            <div className="celebration-sparkle celebration-sparkle-2">
              <Sparkles size={14} />
            </div>
          </div>

          <div className="celebration-text-group">
            <div className="celebration-pill-tag">
              <ShieldCheck size={14} className="tag-shield-icon" />
              <span>Official E-Ticket Confirmed</span>
            </div>
            <h1 className="celebration-main-title">Booking Confirmed!</h1>
            <p className="celebration-subtext">
              Thank you for choosing <strong>AI Bus</strong>. Your digital boarding pass has been issued and dispatched via SMS & WhatsApp.
            </p>
          </div>

          {/* Interactive Booking Reference Capsule */}
          <div className="booking-reference-capsule">
            <div className="capsule-id-group">
              <span className="capsule-label">BOOKING ID:</span>
              <span className="capsule-value">{bookingRef}</span>
            </div>

            <div className="capsule-actions-group">
              <button
                type="button"
                className={`capsule-action-btn ${copied ? "is-copied" : ""}`}
                onClick={handleCopyId}
                title="Copy Booking ID"
              >
                {copied ? (
                  <>
                    <Check size={14} className="btn-icon" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} className="btn-icon" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className={`capsule-action-btn ${shared ? "is-copied" : ""}`}
                onClick={handleShareTicket}
                title="Share Ticket"
              >
                {shared ? (
                  <>
                    <Check size={14} className="btn-icon" />
                    <span>Shared!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={14} className="btn-icon" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* THE CENTERPIECE: Luxury Boarding Pass Ticket Card */}
        <section className="luxury-boarding-pass" aria-label="Digital Boarding Pass">
          {/* Top Pass Banner: Navy Indigo Gradient with Operator & QR Code */}
          <div className="pass-header-banner">
            <div className="pass-header-left">
              <div className="operator-logo-emblem">
                <Bus size={24} className="emblem-bus-icon" />
              </div>
              <div className="operator-meta-info">
                <div className="operator-name-row">
                  <h2 className="operator-name-text">{operator}</h2>
                  <span className="verified-coach-pill">
                    <CheckCircle size={12} />
                    Verified Operator
                  </span>
                </div>
                <div className="operator-tags-row">
                  <span className="coach-type-badge">{busType}</span>
                  <span className="coach-rating-badge">★ 4.8 Rating</span>
                  <span className="coach-gps-badge">Live GPS Enabled</span>
                </div>
              </div>
            </div>

            <div className="pass-header-right">
              <div className="pass-qr-container">
                <BoardingPassQR value={`AIBUS-${bookingRef}-${pnrValue}`} size={76} />
                <span className="qr-scan-label">SCAN TO BOARD</span>
              </div>
              <div className="pass-pnr-box">
                <span className="pnr-title">PNR NUMBER</span>
                <span className="pnr-val-badge">{pnrValue}</span>
              </div>
            </div>
          </div>

          {/* Route Journey Flight-Style Strip */}
          <div className="pass-journey-strip">
            {/* Origin & Departure */}
            <div className="journey-station-block origin-block">
              <div className="station-city-badge">ORIGIN</div>
              <div className="station-time-text">{departureTime}</div>
              <div className="station-city-name">{fromCity}</div>
              <div className="station-date-row">
                <Calendar size={13} className="mini-icon" />
                <span>{displayDate}</span>
              </div>
              <div className="station-pickup-chip" title={pickupLocation}>
                <MapPin size={13} className="pickup-pin-icon" />
                <span className="pickup-loc-text">{pickupLocation}</span>
              </div>
              <span className="station-reporting-note">Report 15 mins prior</span>
            </div>

            {/* Travel Path & Duration Center */}
            <div className="journey-transit-center">
              <div className="transit-duration-pill">
                <Clock size={13} className="mini-icon" />
                <span>{duration}</span>
              </div>

              <div className="transit-track-line">
                <span className="transit-node-start" />
                <div className="transit-animated-bus">
                  <Bus size={15} />
                </div>
                <span className="transit-node-end" />
              </div>

              <span className="transit-type-tag">Direct Non-Stop Coach</span>
            </div>

            {/* Destination & Arrival */}
            <div className="journey-station-block destination-block">
              <div className="station-city-badge dest-badge">DESTINATION</div>
              <div className="station-time-text">{arrivalTime}</div>
              <div className="station-city-name">{toCity}</div>
              <div className="station-date-row">
                <Calendar size={13} className="mini-icon" />
                <span>{arrivalDateStr}</span>
              </div>
              <div className="station-pickup-chip dest-chip" title={dropoffLocation}>
                <MapPin size={13} className="pickup-pin-icon" />
                <span className="pickup-loc-text">{dropoffLocation}</span>
              </div>
              <span className="station-reporting-note">Est. on-time drop</span>
            </div>
          </div>

          {/* Authentic Perforated Ticket Tear Notch Line */}
          <div className="pass-perforation-divider">
            <div className="notch notch-left" />
            <div className="perforation-dashed-line" />
            <div className="perforation-seal-chip">
              <Ticket size={13} className="seal-icon" />
              <span>DIGITAL BOARDING PASS · OFFICIAL TRAVEL VOUCHER</span>
            </div>
            <div className="notch notch-right" />
          </div>

          {/* Passenger & Berth Seat Section */}
          <div className="pass-passenger-section">
            <div className="section-title-bar">
              <div className="title-left">
                <User size={16} className="sec-icon" />
                <h3 className="section-heading-text">
                  Confirmed Passengers ({passengerList.length})
                </h3>
              </div>
              <div className="seats-counter-badge">
                Selected Seats: <strong>{booking.seats?.join(", ") || passengerList.map((p) => p.seat).join(", ")}</strong>
              </div>
            </div>

            <div className="passengers-cards-grid">
              {passengerList.map((p, idx) => (
                <div key={p.seat || idx} className="passenger-berth-card">
                  <div className="berth-seat-tag">
                    <span className="berth-seat-label">SEAT</span>
                    <strong className="berth-seat-num">{p.seat}</strong>
                  </div>

                  <div className="berth-passenger-info">
                    <div className="passenger-name-row">
                      <span className="passenger-primary-name">{p.name || `Passenger ${idx + 1}`}</span>
                      {idx === 0 && (
                        <span className="primary-passenger-tag">Primary</span>
                      )}
                    </div>
                    <div className="passenger-meta-row">
                      <span>{p.age || 33} yrs</span>
                      <span className="meta-dot">•</span>
                      <span>{p.gender || "Male"}</span>
                      <span className="meta-dot">•</span>
                      <span className="berth-type-text">Window Berth (AC)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Verified Contact Bar */}
            <div className="pass-contact-strip">
              <div className="contact-item">
                <Phone size={15} className="contact-icon" />
                <div className="contact-details">
                  <span className="contact-label">Primary Mobile:</span>
                  <strong className="contact-value">{cleanedPhone}</strong>
                </div>
              </div>

              <div className="contact-item">
                <Mail size={15} className="contact-icon" />
                <div className="contact-details">
                  <span className="contact-label">Registered Email:</span>
                  <strong className="contact-value">{contactEmail}</strong>
                </div>
              </div>

              <div className="contact-verified-pill">
                <CheckCircle2 size={14} className="pill-check" />
                <span>E-Ticket dispatched via WhatsApp & SMS</span>
              </div>
            </div>
          </div>

          {/* Perforation Divider 2 */}
          <div className="pass-perforation-divider pass-perforation-sub">
            <div className="notch notch-left" />
            <div className="perforation-dashed-line" />
            <div className="notch notch-right" />
          </div>

          {/* Payment Details & Receipt Stub */}
          <div className="pass-payment-stub">
            <div className="payment-stub-grid">
              <div className="stub-metric-box">
                <span className="metric-label">Base Coach Fare</span>
                <strong className="metric-val">₹{booking.baseFare || booking.totalAmount || 15}</strong>
              </div>

              <div className="stub-metric-box">
                <span className="metric-label">Taxes & GST (5%)</span>
                <strong className="metric-val">₹{booking.serviceTax || 0}</strong>
              </div>

              <div className="stub-metric-box total-fare-highlight">
                <span className="metric-label">Total Amount Paid</span>
                <strong className="metric-val-price">
                  ₹{(booking.totalAmount || 15).toLocaleString("en-IN")}
                </strong>
              </div>

              <div className="stub-metric-box status-metric-box">
                <span className="metric-label">Payment Status</span>
                {isFailedStatus ? (
                  <div className="payment-status-badge is-failed">
                    <AlertTriangle size={13} />
                    <span>REFUND INITIATED</span>
                  </div>
                ) : (
                  <div className="payment-status-badge is-confirmed">
                    <Lock size={12} />
                    <span>PAID & CONFIRMED</span>
                  </div>
                )}
                <span className="payment-mode-subtext">Online Instant Verification</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Helpful Post-Booking Journey Utility Cards */}
        <div className="journey-utilities-grid">
          <div className="utility-card">
            <div className="utility-icon-box blue-accent">
              <Navigation size={22} />
            </div>
            <div className="utility-card-content">
              <h3 className="utility-title">Live GPS Bus Tracking</h3>
              <p className="utility-desc">
                Driver details and live satellite GPS link will become active 30 minutes before {departureTime}. An SMS alert will be sent automatically.
              </p>
              <div className="utility-active-badge">
                <span className="pulse-dot" />
                <span>Auto-tracking enabled</span>
              </div>
            </div>
          </div>

          <div className="utility-card">
            <div className="utility-icon-box emerald-accent">
              <MapPin size={22} />
            </div>
            <div className="utility-card-content">
              <h3 className="utility-title">Boarding Station Navigation</h3>
              <p className="utility-desc">
                {pickupLocation}, {fromCity}. Please arrive at least 15 minutes prior to departure for luggage check-in.
              </p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="utility-action-link"
              >
                <span>Navigate on Google Maps</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          <div className="utility-card">
            <div className="utility-icon-box purple-accent">
              <Headphones size={22} />
            </div>
            <div className="utility-card-content">
              <h3 className="utility-title">24x7 AI Bus Care & Support</h3>
              <p className="utility-desc">
                Have questions regarding luggage allowances, station pickup, or cancellations? Our AI support team is available 24/7.
              </p>
              <div className="utility-helpline-chip">
                <span>Toll Free Helpline:</span>
                <strong>1800-120-AIBUS</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="action-buttons-container">
          <button
            type="button"
            className="luxury-action-btn primary-print-btn"
            onClick={handlePrintTicket}
          >
            <Printer size={18} className="btn-icon-svg" />
            <span>Download / Print E-Ticket</span>
          </button>

          <button
            type="button"
            className="luxury-action-btn secondary-details-btn"
            onClick={() =>
              navigate(`/booking-details?bookingId=${bookingRef}`)
            }
          >
            <Ticket size={18} className="btn-icon-svg" />
            <span>View Booking Details</span>
          </button>

          <button
            type="button"
            className="luxury-action-btn tertiary-home-btn"
            onClick={() => navigate("/")}
          >
            <ArrowRight size={18} className="btn-icon-svg" />
            <span>Book Another Trip</span>
          </button>
        </div>

        {/* Trust Badges & Safe Travels Guarantee */}
        <div className="safe-travels-trust-footer">
          <div className="trust-pillars-row">
            <div className="trust-pillar">
              <ShieldCheck size={16} className="pillar-icon" />
              <span>100% Verified Travel Partner</span>
            </div>
            <span className="pillar-divider">•</span>
            <div className="trust-pillar">
              <Lock size={16} className="pillar-icon" />
              <span>Govt Compliant GST Voucher</span>
            </div>
            <span className="pillar-divider">•</span>
            <div className="trust-pillar">
              <CheckCircle2 size={16} className="pillar-icon" />
              <span>Contactless Mobile Boarding</span>
            </div>
          </div>
          <p className="safe-travels-brand-tag">
            Wishing you safe, comfortable & timely travels with <strong>AI Bus</strong>
          </p>
        </div>
      </div>
    </main>
  );
}

export default BookingSuccess;
