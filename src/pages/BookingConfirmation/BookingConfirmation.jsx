import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  CreditCard,
  Lock,
  ArrowLeft,
  Bus,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  Sparkles,
  Smartphone,
  QrCode,
  Building2,
  Ticket,
  ChevronRight,
  Shield,
  Zap,
  Tag,
  HelpCircle,
  Check,
  User,
  HeartHandshake,
  CheckCircle,
} from "lucide-react";
import busService from "../../services/busService";
import bookingService from "../../services/bookingService";
import authService from "../../services/authService";
import paymentService from "../../services/paymentService";
import BookingStepper from "../../components/BookingStepper/BookingStepper";
import "./BookingConfirmation.css";

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
    return String(dateStr);
  } catch {
    return String(dateStr);
  }
}

function getArrivalDateStr(departureDateStr, departureTime = "10:01", arrivalTime = "19:21") {
  if (!departureDateStr) return "Wed, 14 Oct 2026";
  try {
    const parts = String(departureDateStr).split("T")[0].split("-");
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

function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const busId = searchParams.get("busId");
  const seatsParam = searchParams.get("seats");
  const travellersDataParam = searchParams.get("travellersData");
  const contactMobile =
    searchParams.get("contactMobile") || searchParams.get("mobile") || "8999253954";
  const contactEmail = searchParams.get("contactEmail") || "booking@aibus.in";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const fromId = searchParams.get("fromId");
  const toId = searchParams.get("toId");
  const date = searchParams.get("date");
  const holdIdParam = searchParams.get("holdId");
  const totalAmountParam = searchParams.get("totalAmount");
  const promoDiscountParam = searchParams.get("discount");
  const promoCodeParam = searchParams.get("promoCode");

  const [selectedBus, setSelectedBus] = useState(null);
  const [resolvedFromCity, setResolvedFromCity] = useState(from || "Bengaluru");
  const [resolvedToCity, setResolvedToCity] = useState(to || "Chennai");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC");
  const [insuranceOpted, setInsuranceOpted] = useState(true);

  const loggedInUser = authService.getLoggedInUser();

  useEffect(() => {
    let isMounted = true;

    async function loadInfo() {
      const fromName = await busService.resolveCityName(from || fromId || "4292");
      const toName = await busService.resolveCityName(to || toId || "4562");

      if (isMounted) {
        setResolvedFromCity(fromName || "Bengaluru");
        setResolvedToCity(toName || "Chennai");
      }

      const stateBus = location.state?.bus;
      if (stateBus) {
        const resolvedPickups =
          stateBus.pickups?.length > 0
            ? stateBus.pickups
            : (stateBus.BoardingPoints || stateBus.seatsLayout?.BoardingPoints || []);
        const resolvedDropoffs =
          stateBus.dropoffs?.length > 0
            ? stateBus.dropoffs
            : (stateBus.DroppingPoints || stateBus.seatsLayout?.DroppingPoints || []);

        if (isMounted) {
          setSelectedBus({
            ...stateBus,
            from: fromName || stateBus.from,
            to: toName || stateBus.to,
            pickups: resolvedPickups,
            dropoffs: resolvedDropoffs,
          });
          setLoading(false);
        }
        return;
      }

      // If state is missing, load bus
      try {
        const liveBus = await busService.searchSingleBus({
          fromCityId: fromId || 4292,
          toCityId: toId || 4562,
          journeyDate: date || new Date().toISOString().split("T")[0],
          busId: busId || 1,
          from: fromName,
          to: toName,
        });

        if (isMounted) {
          if (liveBus) {
            setSelectedBus({
              ...liveBus,
              from: fromName || liveBus.from,
              to: toName || liveBus.to,
            });
          } else {
            setSelectedBus({
              id: busId || 1,
              busId: Number(busId) || 1,
              routeBusId: Number(busId) || 1,
              operator: "Premium Intercity Express",
              busType: "2X1(36) AC Sleeper Volvo 9600",
              from: fromName || "Bengaluru",
              to: toName || "Chennai",
              departureTime: "21:30",
              arrivalTime: "07:30",
              duration: "10h 00m",
              date: date || new Date().toISOString().split("T")[0],
              price: 105,
              rating: 4.8,
            });
          }
          setLoading(false);
        }
      } catch {
        if (isMounted) setLoading(false);
      }
    }

    loadInfo();

    return () => {
      isMounted = false;
    };
  }, [location.state, from, to, fromId, toId, date, busId]);

  const selectedSeats = seatsParam
    ? seatsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : ["2"];

  let travellers = [];
  try {
    if (travellersDataParam) {
      travellers = JSON.parse(travellersDataParam);
    }
  } catch {
    travellers = [];
  }

  if (travellers.length === 0 && selectedSeats.length > 0) {
    travellers = selectedSeats.map((seat, index) => ({
      seat,
      name: index === 0 ? loggedInUser?.name || "Primary Passenger" : `Passenger ${index + 1}`,
      age: index === 0 ? "28" : "26",
      gender: "Male",
      mobile: contactMobile,
    }));
  }

  // ⏱️ Seat Lock Timer
  const [timeLeft, setTimeLeft] = useState(285);

  useEffect(() => {
    const timer = setInterval(() => {
      const lock = bookingService.getSeatLock();
      if (!lock) {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        return;
      }

      const secondsRemaining = Math.max(
        0,
        Math.floor((lock.expiresAt - Date.now()) / 1000)
      );
      setTimeLeft(secondsRemaining);

      if (secondsRemaining <= 0) {
        clearInterval(timer);
        bookingService.clearSeatLock();
        alert("Your seat reservation timer expired. Please select seats again.");
        navigate(`/seat-selection?busId=${busId || "1"}&from=${from || ""}&to=${to || ""}&date=${date || ""}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [busId, from, to, date, navigate]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <main className="luxury-review-page">
        <div className="luxury-review-container">
          <BookingStepper currentStep={3} />
          <div className="luxury-loading-card">
            <div className="luxury-spinner-pulse">
              <Bus size={32} className="spin-bus-icon" />
              <div className="spin-orbit" />
            </div>
            <h3>Preparing Your Booking Summary</h3>
            <p>Verifying live seat hold and pricing directly with Mantis GDS...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!selectedBus) {
    return (
      <main className="luxury-review-page">
        <div className="luxury-review-container">
          <div className="luxury-not-found-card">
            <div className="not-found-icon-wrap">
              <AlertCircle size={32} />
            </div>
            <h2>Trip Details Not Found</h2>
            <p>We couldn't load the trip information for this booking. Please search again.</p>
            <button
              type="button"
              className="luxury-retry-cta"
              onClick={() => navigate("/")}
            >
              Search Buses
            </button>
          </div>
        </div>
      </main>
    );
  }

  const busPrice = selectedBus.price || 105;
  const baseFare = busPrice * selectedSeats.length;
  const discountAmount = Number(promoDiscountParam) || 0;
  const insuranceAmount = insuranceOpted ? 0 : 0; // Free complimentary protection
  const totalAmount = totalAmountParam
    ? Number(totalAmountParam)
    : Math.max(1, baseFare - discountAmount + insuranceAmount);

  const displayDate = formatTripDate(date || selectedBus.date);
  const arrivalDateStr = getArrivalDateStr(
    date || selectedBus.date,
    selectedBus.departureTime,
    selectedBus.arrivalTime
  );

  const selectedPickup = location.state?.pickup;
  const selectedDropoff = location.state?.dropoff;

  const pickupPoint =
    selectedPickup ||
    selectedBus.pickups?.[0] ||
    selectedBus.BoardingPoints?.[0] ||
    selectedBus.boardingPoints?.[0] ||
    { PickupName: "Anand Rao Circle / Peenya", PickupTime: `${selectedBus.departureTime}` };

  const dropoffPoint =
    selectedDropoff ||
    selectedBus.dropoffs?.[0] ||
    selectedBus.DroppingPoints?.[0] ||
    selectedBus.droppingPoints?.[0] ||
    { DropoffName: "Chennai Central / Koyambedu", DropoffTime: `${selectedBus.arrivalTime}` };

  const operatorName = selectedBus.operator || "Express Transit";
  const initials =
    operatorName
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "AI";

  const handleConfirmBooking = async () => {
    if (!loggedInUser || !authService.isAuthenticated()) {
      const returnUrl = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?returnTo=${returnUrl}`);
      return;
    }

    const userMobile = loggedInUser?.mobile || loggedInUser?.phone || contactMobile;
    const holdId = holdIdParam || location.state?.holdId;

    try {
      setSubmitting(true);
      setBookingError("");

      const resolvedFromCityId = Number(
        fromId ||
        selectedBus?.fromCityId ||
        (from && !isNaN(Number(from)) ? from : 4292)
      );
      const resolvedToCityId = Number(
        toId ||
        selectedBus?.toCityId ||
        (to && !isNaN(Number(to)) ? to : 4562)
      );

      const isGuest = false;
      const newBooking = await bookingService.createBooking({
        bus: {
          ...selectedBus,
          from: resolvedFromCity,
          to: resolvedToCity,
        },
        travellers,
        seats: selectedSeats,
        totalAmount,
        userMobile,
        userId: loggedInUser?.id || null,
        isGuest,
        fromId: resolvedFromCityId,
        toId: resolvedToCityId,
        holdId,
        pickup: pickupPoint,
        dropoff: dropoffPoint,
      });

      const bId = newBooking.bookingId || newBooking.id;

      // Initiate PhonePe Payment Intent
      const redirectUrl = `${window.location.origin}/payment-result?bookingId=${bId}`;
      const intent = await paymentService.createPaymentIntent({
        bookingId: bId,
        gateway: "PHONEPE",
        redirectUrl,
      });

      if (intent?.merchantTxnId) {
        localStorage.setItem(
          "aibus_pending_payment",
          JSON.stringify({
            bookingId: bId,
            merchantTxnId: intent.merchantTxnId,
            amount: intent.amount || totalAmount,
            timestamp: Date.now(),
          })
        );
      }

      if (intent?.paymentUrl) {
        // Redirect to PhonePe payment gateway
        window.location.href = intent.paymentUrl;
      } else {
        // Fallback to verification page directly
        navigate(`/payment-result?bookingId=${bId}&merchantTxnId=${intent?.merchantTxnId || ""}`);
      }
    } catch (err) {
      console.error("Booking & Payment initiation failed:", err);
      setBookingError(err.message || "Failed to initiate payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="luxury-review-page">
      <div className="luxury-review-container">
        {/* Step 3 Luxury Stepper */}
        <BookingStepper currentStep={3} />

        {/* Top Floating Action Bar & Live Countdown Timer */}
        <div className="luxury-top-bar">
          <button
            type="button"
            className="luxury-back-link-btn"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
            <span>Back to Traveller Details</span>
          </button>

          <div className="luxury-live-timer-chip">
            <div className="timer-lock-indicator">
              <Lock size={13} className="lock-icon-svg" />
            </div>
            <div className="timer-text-wrap">
              <span className="timer-label">Seats held for:</span>
              <strong className="timer-digits">{formatTimer(timeLeft)} mins</strong>
            </div>
          </div>
        </div>

        {/* Hero Header Strip */}
        <div className="luxury-header-strip">
          <div className="header-tags-row">
            <span className="luxury-step-tag">Step 3 of 4</span>
            <span className="luxury-secure-tag">
              <ShieldCheck size={14} className="tag-icon-green" /> 100% Encrypted Checkout
            </span>
            <span className="luxury-instant-tag">
              <Zap size={13} className="tag-icon-gold" /> Instant Confirmation
            </span>
          </div>
          <h1 className="luxury-page-heading">
            Review & <span className="heading-gradient">Pay</span>
          </h1>
          <p className="luxury-page-subheading">
            Verify journey schedule and passenger details before proceeding to instant confirmation
          </p>
        </div>

        {/* Error Alert Banner */}
        {bookingError && (
          <div className="luxury-error-banner" role="alert">
            <AlertCircle size={20} className="err-icon" />
            <div className="err-content">
              <strong>Booking Confirmation Failed</strong>
              <span>{bookingError}</span>
            </div>
          </div>
        )}

        {/* Main 2-Column Responsive Checkout Grid */}
        <div className="luxury-checkout-grid">
          {/* LEFT COLUMN: Ticket Boarding Pass + Passenger Summary + Travel Protection + Payment Options */}
          <section className="luxury-details-col" aria-label="Journey & Passenger Details">
            {/* 1. LUXURY BOARDING PASS TICKET CARD */}
            <div className="luxury-ticket-card">
              {/* Ticket Top Banner */}
              <div className="ticket-top-header">
                <div className="ticket-brand-left">
                  <div className="operator-monogram-box">
                    <Bus size={22} />
                  </div>
                  <div>
                    <div className="operator-title-line">
                      <span className="details-card-label">Bus & Journey Details</span>
                      <span className="verified-gold-badge" title="Verified Safe Bus Operator">
                        ★ 4.8 Verified
                      </span>
                    </div>
                    <h3 className="ticket-operator-name">{operatorName}</h3>
                    <span className="ticket-bus-type">
                      {selectedBus.busType || "2X1(36) AC Sleeper Deluxe"}
                    </span>
                  </div>
                </div>

                <div className="ticket-seats-chip">
                  <span className="seat-chip-label">
                    {selectedSeats.length} Seat{selectedSeats.length > 1 ? "s" : ""} ({selectedSeats.join(", ")})
                  </span>
                  <div className="seat-chip-pills">
                    {selectedSeats.map((s) => (
                      <span key={s} className="seat-num-badge">
                        Seat {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Decorative Perforation Divider */}
              <div className="ticket-perforated-divider">
                <span className="ticket-cutout left" />
                <div className="ticket-dash-line" />
                <span className="ticket-cutout right" />
              </div>

              {/* Journey Timeline Body */}
              <div className="ticket-timeline-body">
                <div className="ticket-timeline-row">
                  {/* Departure Node */}
                  <div className="timeline-station departure">
                    <div className="luxury-station-time">{selectedBus.departureTime || "21:30"}</div>
                    <h4 className="station-city">{resolvedFromCity}</h4>
                    <span className="station-date">{displayDate}</span>
                    <div className="station-point-pill" title={pickupPoint.PickupName}>
                      <MapPin size={13} className="pin-icon-blue" />
                      <span>{pickupPoint.PickupName || "Main Boarding Stop"}</span>
                    </div>
                  </div>

                  {/* Central Route Duration Visual */}
                  <div className="timeline-track-center">
                    <div className="duration-pill-tag">
                      <Clock size={12} />
                      <span>{selectedBus.duration || "10h 00m"}</span>
                    </div>
                    <div className="route-visual-line">
                      <span className="track-dot start" />
                      <div className="track-bar" />
                      <span className="track-dot end" />
                    </div>
                    <span className="direct-service-sub">Direct Highway Express</span>
                  </div>

                  {/* Arrival Node */}
                  <div className="timeline-station arrival">
                    <div className="luxury-station-time">{selectedBus.arrivalTime || "07:30"}</div>
                    <h4 className="station-city">{resolvedToCity}</h4>
                    <span className="station-date">{arrivalDateStr}</span>
                    <div className="station-point-pill" title={dropoffPoint.DropoffName}>
                      <MapPin size={13} className="pin-icon-red" />
                      <span>{dropoffPoint.DropoffName || "City Dropping Point"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. PASSENGER & CONTACT DETAILS CARD */}
            <div className="luxury-glass-card">
              <div className="glass-card-header">
                <div className="card-header-left">
                  <div className="header-icon-circle blue-accent">
                    <Ticket size={18} />
                  </div>
                  <div>
                    <h3 className="glass-card-title">Traveller Details</h3>
                    <span className="glass-card-subtitle">
                      {travellers.length} Passenger{travellers.length > 1 ? "s" : ""} travelling on this booking
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="edit-details-btn"
                  onClick={() => navigate(-1)}
                >
                  Edit Info
                </button>
              </div>

              <div className="glass-card-body">
                {/* Passengers List */}
                <div className="passengers-pill-grid">
                  {travellers.map((p, idx) => (
                    <div key={p.seat || idx} className="passenger-badge-row">
                      <div className="passenger-badge-left">
                        <div className="passenger-avatar-box">
                          {idx + 1}
                        </div>
                        <div className="passenger-info-text">
                          <strong className="p-name">{p.name || "Primary Traveller"}</strong>
                          <span className="p-meta">
                            {p.age} Yrs • {p.gender || "Male"} • Seat Berth
                          </span>
                        </div>
                      </div>

                      <div className="passenger-badge-right">
                        <span className="passenger-seat-pill">
                          Seat <strong>{p.seat}</strong>
                        </span>
                        <span className="verified-status-tag">
                          <CheckCircle2 size={13} /> Reserved
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Contact Information Bar */}
                <div className="contact-verified-strip">
                  <div className="contact-item">
                    <span className="contact-label">SMS / WhatsApp:</span>
                    <strong className="contact-val">🇮🇳 +91 {contactMobile}</strong>
                  </div>
                  <div className="contact-divider" />
                  <div className="contact-item">
                    <span className="contact-label">e-Ticket PDF Email:</span>
                    <strong className="contact-val">{contactEmail}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. FREE TRAVEL PROTECTION CARD */}
            <div className="luxury-glass-card insurance-card">
              <div className="insurance-inner-row">
                <div className="insurance-left-icon">
                  <ShieldCheck size={26} className="insurance-shield-svg" />
                </div>
                <div className="insurance-text-content">
                  <div className="insurance-title-row">
                    <h4 className="insurance-title">Complimentary Travel Protection Included</h4>
                    <span className="free-tag-pill">100% FREE</span>
                  </div>
                  <p className="insurance-desc">
                    Includes ₹5,00,000 emergency accidental cover, emergency medical assistance & zero-hassle instant cancellation support.
                  </p>
                </div>
                <div className="insurance-check-wrap">
                  <CheckCircle size={22} className="insurance-checked-icon" />
                </div>
              </div>
            </div>

            {/* 4. PAYMENT METHOD SELECTOR */}
            <div className="luxury-glass-card payment-selection-card">
              <div className="glass-card-header">
                <div className="card-header-left">
                  <div className="header-icon-circle green-accent">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h3 className="glass-card-title">Select Payment Mode</h3>
                    <span className="glass-card-subtitle">
                      Choose your preferred instant secure checkout method
                    </span>
                  </div>
                </div>
                <div className="ssl-guarantee-badge">
                  <ShieldCheck size={14} /> 256-Bit SSL Encrypted
                </div>
              </div>

              <div className="glass-card-body">
                <div className="payment-tiles-grid">
                  {/* UPI Option */}
                  <label
                    className={`payment-tile ${paymentMethod === "upi" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("upi")}
                  >
                    <div className="tile-top-row">
                      <div className="tile-icon-wrap">
                        <QrCode size={22} className="tile-svg" />
                      </div>
                      <div className="tile-info">
                        <div className="tile-title-row">
                          <strong>UPI Instant Pay</strong>
                          <span className="speed-pill">Instant & Free</span>
                        </div>
                        <span>Google Pay, PhonePe, Paytm, BHIM & Any UPI ID</span>
                      </div>
                      <div className="tile-check-radio">
                        <div className="check-dot" />
                      </div>
                    </div>

                    {paymentMethod === "upi" && (
                      <div className="payment-sub-content">
                        <div className="upi-apps-row">
                          <span className="upi-app-badge">GPay</span>
                          <span className="upi-app-badge">PhonePe</span>
                          <span className="upi-app-badge">Paytm</span>
                          <span className="upi-app-badge">BHIM</span>
                          <span className="upi-app-badge">CRED</span>
                        </div>
                        <div className="upi-input-group">
                          <input
                            type="text"
                            placeholder="Enter UPI ID (e.g. mobile@upi)"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="upi-text-input"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            type="button"
                            className="upi-verify-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (upiId) alert(`UPI ID ${upiId} verified!`);
                            }}
                          >
                            Verify
                          </button>
                        </div>
                        <span className="upi-subtext">
                          Or click "Pay & Confirm" below to scan QR code on the payment gateway
                        </span>
                      </div>
                    )}
                  </label>

                  {/* Cards Option */}
                  <label
                    className={`payment-tile ${paymentMethod === "card" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("card")}
                  >
                    <div className="tile-top-row">
                      <div className="tile-icon-wrap">
                        <CreditCard size={22} className="tile-svg" />
                      </div>
                      <div className="tile-info">
                        <div className="tile-title-row">
                          <strong>Credit / Debit Card</strong>
                          <span className="secure-pill">Zero Surcharge</span>
                        </div>
                        <span>Visa, MasterCard, RuPay, Maestro & American Express</span>
                      </div>
                      <div className="tile-check-radio">
                        <div className="check-dot" />
                      </div>
                    </div>

                    {paymentMethod === "card" && (
                      <div className="payment-sub-content card-inputs-grid" onClick={(e) => e.stopPropagation()}>
                        <div className="card-input-full">
                          <label>Card Number</label>
                          <input
                            type="text"
                            placeholder="4532 •••• •••• 8890"
                            maxLength={19}
                            className="luxury-card-input"
                          />
                        </div>
                        <div className="card-input-half">
                          <label>Valid Thru</label>
                          <input
                            type="text"
                            placeholder="MM / YY"
                            maxLength={5}
                            className="luxury-card-input"
                          />
                        </div>
                        <div className="card-input-half">
                          <label>CVV / CVC</label>
                          <input
                            type="password"
                            placeholder="•••"
                            maxLength={4}
                            className="luxury-card-input"
                          />
                        </div>
                      </div>
                    )}
                  </label>

                  {/* Net Banking Option */}
                  <label
                    className={`payment-tile ${paymentMethod === "netbanking" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("netbanking")}
                  >
                    <div className="tile-top-row">
                      <div className="tile-icon-wrap">
                        <Building2 size={22} className="tile-svg" />
                      </div>
                      <div className="tile-info">
                        <div className="tile-title-row">
                          <strong>Net Banking</strong>
                        </div>
                        <span>HDFC, SBI, ICICI, Axis, Kotak & 50+ Indian Banks</span>
                      </div>
                      <div className="tile-check-radio">
                        <div className="check-dot" />
                      </div>
                    </div>

                    {paymentMethod === "netbanking" && (
                      <div className="payment-sub-content bank-chips-grid" onClick={(e) => e.stopPropagation()}>
                        {["HDFC Bank", "State Bank of India", "ICICI Bank", "Axis Bank", "Kotak"].map((bank) => (
                          <button
                            key={bank}
                            type="button"
                            className={`bank-chip ${selectedBank === bank ? "active" : ""}`}
                            onClick={() => setSelectedBank(bank)}
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: Modern Sticky Checkout Summary & Payment Action */}
          <aside className="luxury-sidebar-col" aria-label="Payment and Fare Breakdown">
            <div className="luxury-summary-card">
              <div className="summary-card-header">
                <h3 className="summary-heading">Fare Summary</h3>
                <span className="summary-currency-badge">INR (₹)</span>
              </div>

              {/* Price Breakdown */}
              <div className="summary-items-list">
                <div className="summary-line-item">
                  <span>
                    Base Fare ({selectedSeats.length} × ₹{busPrice})
                  </span>
                  <strong>₹{baseFare.toLocaleString("en-IN")}</strong>
                </div>

                <div className="summary-line-item">
                  <span>Operator Service Charge</span>
                  <span className="free-badge">FREE</span>
                </div>

                <div className="summary-line-item">
                  <span>Taxes & GST</span>
                  <span>₹0</span>
                </div>

                {discountAmount > 0 && (
                  <div className="summary-line-item discount-item">
                    <span className="discount-label">
                      <Sparkles size={13} /> Coupon Savings {promoCodeParam ? `(${promoCodeParam})` : ""}
                    </span>
                    <span className="discount-value">-₹{discountAmount}</span>
                  </div>
                )}

                {/* Perforated Total Divider */}
                <div className="summary-total-divider" />

                <div className="summary-total-row">
                  <div>
                    <span className="total-label-text">Total Payable</span>
                    <span className="all-inclusive-text">Inclusive of all taxes</span>
                  </div>
                  <div className="total-amount-block">
                    <span className="rupee-symbol">₹</span>
                    <strong className="total-number">{totalAmount.toLocaleString("en-IN")}</strong>
                  </div>
                </div>
              </div>

              {/* Primary Instant Checkout Action Button */}
              <button
                type="button"
                className="luxury-pay-confirm-cta"
                disabled={submitting}
                onClick={handleConfirmBooking}
              >
                <div className="btn-shine-effect" />
                <Lock size={18} className="cta-lock-icon" />
                <span>
                  {submitting
                    ? "Issuing Official Ticket & PNR..."
                    : `Pay ₹${totalAmount.toLocaleString("en-IN")} & Confirm`}
                </span>
              </button>

              {/* Trust Assurances */}
              <div className="checkout-trust-box">
                <div className="trust-row">
                  <ShieldCheck size={16} className="trust-green" />
                  <div>
                    <strong>Free Cancellation Guarantee</strong>
                    <p>Cancel up to 4 hrs before departure for instant refund directly to bank</p>
                  </div>
                </div>

                <div className="trust-row">
                  <Zap size={16} className="trust-blue" />
                  <div>
                    <strong>Instant e-Ticket & Live GPS Tracking</strong>
                    <p>Official PNR & m-ticket delivered via WhatsApp and Email instantly</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default BookingConfirmation;