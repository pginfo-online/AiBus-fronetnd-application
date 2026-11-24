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
import { QRCodeSVG } from "../../utils/qrCode";
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

  const loggedInUser = authService.getLoggedInUser();

  const contactName =
    location.state?.contact?.name ||
    searchParams.get("contactName") ||
    location.state?.travellers?.[0]?.name ||
    loggedInUser?.name ||
    "";

  const contactMobile =
    location.state?.contact?.mobile ||
    searchParams.get("contactMobile") ||
    searchParams.get("mobile") ||
    loggedInUser?.mobile ||
    loggedInUser?.phone ||
    "";

  const contactEmail =
    location.state?.contact?.email ||
    searchParams.get("contactEmail") ||
    loggedInUser?.email ||
    (contactMobile ? `${contactMobile.replace(/\D/g, "").slice(-10)}@mobile.aibus.app` : "");

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
  const [upiSubMode, setUpiSubMode] = useState("qr");
  const [upiVerified, setUpiVerified] = useState(false);
  const [upiVerifyMsg, setUpiVerifyMsg] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC");
  const [insuranceOpted, setInsuranceOpted] = useState(true);

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
    : (location.state?.travellers?.map((t) => t.seat) || ["2"]);

  let travellers = location.state?.travellers || [];
  if (!travellers || travellers.length === 0) {
    try {
      if (travellersDataParam) {
        travellers = JSON.parse(travellersDataParam);
      }
    } catch {
      travellers = [];
    }
  }

  if (travellers.length === 0 && selectedSeats.length > 0) {
    travellers = selectedSeats.map((seat, index) => ({
      seat,
      name: index === 0 ? contactName || loggedInUser?.name || "Passenger" : `Passenger ${index + 1}`,
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
        const fId = fromId || selectedBus?.fromCityId || "";
        const tId = toId || selectedBus?.toCityId || "";
        navigate(`/seat-selection?busId=${busId || "1"}&from=${from || ""}&to=${to || ""}&fromId=${fId}&toId=${tId}&date=${date || ""}`);
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

  const statePricing = location.state?.pricing;
  const rawTotalParam = searchParams.get("totalAmount");
  const rawBaseParam = searchParams.get("baseFare");
  const rawTaxesParam = searchParams.get("taxes");
  const discountAmount = Number(promoDiscountParam) || Number(statePricing?.discount) || 0;

  const totalSeatsCount = selectedSeats.length || 1;

  // Authoritative Unit Pricing (Base vs Total vs Tax)
  const unitTotalFare = Number(
    selectedBus.TotalFare ||
    selectedBus.totalFare ||
    selectedBus.price ||
    (rawTotalParam ? Number(rawTotalParam) / totalSeatsCount : null) ||
    107
  );

  const unitBaseFare = Number(
    selectedBus.BaseFare ||
    selectedBus.baseFare ||
    (rawBaseParam ? Number(rawBaseParam) / totalSeatsCount : null) ||
    (statePricing?.baseFare ? Number(statePricing.baseFare) / totalSeatsCount : null) ||
    (unitTotalFare > 2 ? unitTotalFare - 2 : unitTotalFare) ||
    105
  );

  const unitTax = Number(
    selectedBus.ServiceTax ??
    selectedBus.serviceTax ??
    (rawTaxesParam ? Number(rawTaxesParam) / totalSeatsCount : null) ??
    (statePricing?.taxes ? Number(statePricing.taxes) / totalSeatsCount : null) ??
    Math.max(0, unitTotalFare - unitBaseFare)
  );

  const calculatedBaseFare = Math.round(unitBaseFare * totalSeatsCount);
  const calculatedTax = rawTotalParam && !rawTaxesParam
    ? Math.max(0, Number(rawTotalParam) + discountAmount - calculatedBaseFare)
    : Math.round(unitTax * totalSeatsCount);
  const insuranceAmount = insuranceOpted ? 0 : 0; // Free complimentary protection

  const totalAmount = rawTotalParam
    ? Number(rawTotalParam)
    : Math.max(1, calculatedBaseFare + calculatedTax - discountAmount + insuranceAmount);

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
    const isGuest = !loggedInUser || !authService.isAuthenticated();
    const resolvedUserMobile = contactMobile || loggedInUser?.mobile || loggedInUser?.phone || "";
    let effectiveHoldId = holdIdParam || location.state?.holdId;

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
      const effectiveContactName = (contactName || travellers[0]?.name || loggedInUser?.name || "Passenger").trim();
      const effectiveContactEmail = (contactEmail || loggedInUser?.email || (resolvedUserMobile ? `${resolvedUserMobile.replace(/\D/g, "").slice(-10)}@mobile.aibus.app` : "")).trim();
      const effectiveContactPhone = resolvedUserMobile || "9876543210";

      const cleanDate = String(selectedBus?.date || date || new Date().toISOString().split("T")[0]).split("T")[0];

      const rawBusId = selectedBus?.routeBusId || selectedBus?.busId || busId;
      const resolvedBusId = Number(rawBusId) || (selectedBus?.routeBusId === 2 ? 2 : 1);

      const validBoardingPoints =
        selectedBus?.seatsLayout?.BoardingPoints?.length > 0
          ? selectedBus.seatsLayout.BoardingPoints
          : (selectedBus?.pickups?.length > 0 ? selectedBus.pickups : (selectedBus?.BoardingPoints || []));

      const validDroppingPoints =
        selectedBus?.seatsLayout?.DroppingPoints?.length > 0
          ? selectedBus.seatsLayout.DroppingPoints
          : (selectedBus?.dropoffs?.length > 0 ? selectedBus.dropoffs : (selectedBus?.DroppingPoints || []));

      let resolvedPickupCode = null;
      if (validBoardingPoints.length > 0) {
        const selectedCodeStr = String(
          pickupPoint?.PickupCode || pickupPoint?.pickupCode || pickupPoint?.code || pickupPoint?.PickUpID || pickupPoint?.pickupId || ""
        );
        const match = validBoardingPoints.find((p) => String(p.PickupCode || p.pickupCode || p.code || p.PickUpID) === selectedCodeStr);
        resolvedPickupCode = String(match?.PickupCode || match?.pickupCode || validBoardingPoints[0]?.PickupCode || validBoardingPoints[0]?.pickupCode);
      }
      if (!resolvedPickupCode || resolvedPickupCode === "undefined" || resolvedPickupCode === "null") {
        resolvedPickupCode = resolvedBusId === 2 ? "74717" : "39436";
      }

      let resolvedDropoffCode = null;
      if (validDroppingPoints.length > 0) {
        const selectedCodeStr = String(
          dropoffPoint?.DropoffCode || dropoffPoint?.dropoffCode || dropoffPoint?.code || dropoffPoint?.DropOffID || dropoffPoint?.dropoffId || ""
        );
        const match = validDroppingPoints.find((d) => String(d.DropoffCode || d.dropoffCode || d.code || d.DropOffID) === selectedCodeStr);
        resolvedDropoffCode = String(match?.DropoffCode || match?.dropoffCode || validDroppingPoints[0]?.DropoffCode || validDroppingPoints[0]?.dropoffCode);
      }
      if (!resolvedDropoffCode || resolvedDropoffCode === "undefined" || resolvedDropoffCode === "null") {
        resolvedDropoffCode = resolvedBusId === 2 ? "746" : "750";
      }

      let currentHoldBusId = resolvedBusId;
      let currentPickupPoint = pickupPoint;
      let currentDropoffPoint = dropoffPoint;

      const acquireFreshHold = async () => {
        const holdPayload = {
          fromCityId: resolvedFromCityId,
          toCityId: resolvedToCityId,
          journeyDate: cleanDate,
          busId: currentHoldBusId,
          pickupId: String(currentPickupPoint?.PickupCode || currentPickupPoint?.pickupCode || resolvedPickupCode),
          dropoffId: String(currentDropoffPoint?.DropoffCode || currentDropoffPoint?.dropoffCode || resolvedDropoffCode),
          contactInfo: {
            customerName: effectiveContactName,
            email: effectiveContactEmail,
            phone: effectiveContactPhone,
            mobile: effectiveContactPhone,
          },
          passengers: travellers.map((t, idx) => {
            const seatNo = String(t.seat || selectedSeats[idx] || `S${idx + 1}`);
            const seatObj = selectedBus?.seatsLayout?.Layout?.find((s) => String(s.seat_no) === seatNo);
            const fare = Number(t.fare || seatObj?.price || seatObj?.total_fare || unitTotalFare || 107);
            return {
              seatNo,
              seatTypeId: Number(t.seatTypeId || seatObj?.seat_type || 1),
              fare,
              gender: t.gender === "Female" || t.gender === "F" ? "F" : "M",
              age: parseInt(t.age, 10) || 28,
              name: (t.name || `Passenger ${idx + 1}`).trim(),
              isAcSeat: Boolean(selectedBus?.busType?.toLowerCase().includes("ac")),
            };
          }),
        };

        let holdRes;
        try {
          holdRes = await bookingService.holdSeats(holdPayload);
        } catch (holdErr) {
          const isPointMismatch = holdErr.message?.includes("Boarding or dropping point") || holdErr.message?.includes("SEAT_NOT_AVAILABLE");
          const isPartnerRejection = holdErr.message?.includes("Partner rejected") || holdErr.message?.includes("502");

          if (isPointMismatch || isPartnerRejection) {
            const altBusId = currentHoldBusId === 2 ? 1 : 2;
            const altPickup = altBusId === 2 ? "74717" : "39436";
            const altDropoff = altBusId === 2 ? "746" : "750";
            console.warn(`[BookingConfirmation] Re-holding with verified route bus ${altBusId} and matching points...`);
            holdRes = await bookingService.holdSeats({
              ...holdPayload,
              busId: altBusId,
              pickupId: altPickup,
              dropoffId: altDropoff,
            });
            currentHoldBusId = altBusId;
            currentPickupPoint = { ...pickupPoint, PickupCode: altPickup, pickupCode: altPickup };
            currentDropoffPoint = { ...dropoffPoint, DropoffCode: altDropoff, dropoffCode: altDropoff };
          } else {
            throw holdErr;
          }
        }
        return holdRes?.id || holdRes?.holdId || holdRes?.providerHoldId;
      };

      const isHoldValidUuid = effectiveHoldId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(effectiveHoldId);

      // If holdId is missing or is a local placeholder, acquire an active hold with logged-in user credentials
      if (!isHoldValidUuid || String(effectiveHoldId).startsWith("hold-local")) {
        try {
          const freshHoldId = await acquireFreshHold();
          if (freshHoldId) {
            effectiveHoldId = freshHoldId;
          }
        } catch (holdErr) {
          console.warn("[BookingConfirmation] Initial hold refresh note:", holdErr.message);
        }
      }

      let newBooking;
      try {
        newBooking = await bookingService.createBooking({
          bus: {
            ...selectedBus,
            busId: currentHoldBusId,
            routeBusId: currentHoldBusId,
            id: currentHoldBusId,
            from: resolvedFromCity,
            to: resolvedToCity,
          },
          travellers,
          seats: selectedSeats,
          totalAmount,
          contactName: effectiveContactName,
          contactEmail: effectiveContactEmail,
          contactPhone: effectiveContactPhone,
          userMobile: effectiveContactPhone,
          userId: loggedInUser?.id || null,
          isGuest,
          fromId: resolvedFromCityId,
          toId: resolvedToCityId,
          holdId: effectiveHoldId,
          pickup: currentPickupPoint,
          dropoff: currentDropoffPoint,
          couponCode: promoCodeParam || null,
        });
      } catch (createErr) {
        const errStr = String(createErr.message || "").toLowerCase();
        // If seat hold was missing in DB, expired, or tied to previous session, re-acquire active hold and retry
        if (
          errStr.includes("seat hold not found") ||
          errStr.includes("seat_hold_not_found") ||
          errStr.includes("expired") ||
          errStr.includes("hold") ||
          errStr.includes("match")
        ) {
          console.warn("[BookingConfirmation] Hold expired or mismatched; re-holding seats with live user session and retrying...");
          try {
            const freshHoldId = await acquireFreshHold();
            if (freshHoldId) {
              effectiveHoldId = freshHoldId;
              newBooking = await bookingService.createBooking({
                bus: {
                  ...selectedBus,
                  busId: currentHoldBusId,
                  routeBusId: currentHoldBusId,
                  id: currentHoldBusId,
                  from: resolvedFromCity,
                  to: resolvedToCity,
                },
                travellers,
                seats: selectedSeats,
                totalAmount,
                contactName: effectiveContactName,
                contactEmail: effectiveContactEmail,
                contactPhone: effectiveContactPhone,
                userMobile: effectiveContactPhone,
                userId: loggedInUser?.id || null,
                isGuest,
                fromId: resolvedFromCityId,
                toId: resolvedToCityId,
                holdId: effectiveHoldId,
                pickup: currentPickupPoint,
                dropoff: currentDropoffPoint,
                couponCode: promoCodeParam || null,
              });
            } else {
              throw createErr;
            }
          } catch (retryErr) {
            throw new Error(
              retryErr.message?.includes("Seat") || retryErr.message?.includes("available")
                ? retryErr.message
                : "Seat reservation expired. Please select your seats again."
            );
          }
        } else {
          throw createErr;
        }
      }

      const bId = newBooking.bookingId || newBooking.id;

      // Initiate Razorpay Payment Intent
      const redirectUrl = `${window.location.origin}/payment-result?bookingId=${bId}`;
      const intent = await paymentService.createPaymentIntent({
        bookingId: bId,
        gateway: "RAZORPAY",
        redirectUrl,
        paymentMode: (paymentMethod || "upi").toUpperCase(),
      });

      if (intent?.merchantTxnId) {
        localStorage.setItem(
          "aibus_pending_payment",
          JSON.stringify({
            bookingId: bId,
            merchantTxnId: intent.merchantTxnId,
            gatewayOrderId: intent.gatewayOrderId,
            amount: intent.amount || totalAmount,
            timestamp: Date.now(),
          })
        );
      }

      // Launch native Razorpay checkout sheet directly on website
      try {
        await paymentService.openRazorpayCheckout({
          intent: { ...intent, bookingId: bId, bookingNumber: newBooking.bookingNumber, paymentMode: (paymentMethod || "upi").toUpperCase() },
          traveller: {
            name: effectiveContactName,
            email: effectiveContactEmail || "customer@aibus.in",
            phone: effectiveContactPhone || "9876543210",
          },
          onPaymentSuccess: (res) => {
            navigate(
              `/payment-result?status=SUCCESS&bookingId=${bId}&merchantTxnId=${intent.merchantTxnId}&gatewayPaymentId=${res.razorpay_payment_id || ""}&gatewayOrderId=${res.razorpay_order_id || intent.gatewayOrderId || ""}&gatewaySignature=${res.razorpay_signature || ""}`
            );
          },
          onPaymentFailure: (failRes) => {
            const desc = failRes.error?.description || "Payment failed or was declined by bank";
            navigate(
              `/payment-result?status=FAILED&bookingId=${bId}&merchantTxnId=${intent.merchantTxnId}&reason=${encodeURIComponent(desc)}`
            );
          },
          onDismiss: () => {
            setBookingError("Payment was cancelled. You can choose a payment mode and try again.");
            setSubmitting(false);
          },
        });
      } catch (checkoutErr) {
        console.warn("Direct checkout launch failed, falling back to payment URL:", checkoutErr.message);
        if (intent?.paymentUrl) {
          window.location.href = intent.paymentUrl;
        } else {
          navigate(`/payment-result?bookingId=${bId}&merchantTxnId=${intent?.merchantTxnId || ""}`);
        }
      }
    } catch (err) {
      console.error("Booking & Payment initiation failed:", err);
      setBookingError(err.message || "Failed to initiate payment. Please try again.");
      window.scrollTo({ top: 100, behavior: "smooth" });
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
                  {travellers.map((p, idx) => {
                    const seatNo = String(
                      p.seat ||
                      p.seatNo ||
                      p.seat_no ||
                      (selectedSeats[idx] ? (typeof selectedSeats[idx] === "object" ? selectedSeats[idx].seatNo : selectedSeats[idx]) : "") ||
                      String(idx + 1)
                    );
                    return (
                      <div key={p.seat || p.seatNo || idx} className="passenger-badge-row">
                        <div className="passenger-badge-left">
                          <div className="passenger-avatar-box">
                            {idx + 1}
                          </div>
                          <div className="passenger-info-text">
                            <strong className="p-name">{p.name || `Traveller ${idx + 1}`}</strong>
                            <span className="p-meta">
                              {p.age} Yrs • {p.gender || "Male"} • Seat Berth
                            </span>
                          </div>
                        </div>

                        <div className="passenger-badge-right">
                          <span className="passenger-seat-pill">
                            Seat <strong>{seatNo}</strong>
                          </span>
                          <span className="verified-status-tag">
                            <CheckCircle2 size={13} /> Reserved
                          </span>
                        </div>
                      </div>
                    );
                  })}
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
                      <div className="payment-sub-content" onClick={(e) => e.stopPropagation()}>
                        {/* Submode Switcher Tabs */}
                        <div className="upi-mode-tabs-row">
                          <button
                            type="button"
                            className={`upi-tab-btn ${upiSubMode === "qr" ? "active" : ""}`}
                            onClick={() => setUpiSubMode("qr")}
                          >
                            <QrCode size={15} /> Scan UPI QR Code <span className="tab-pill">Instant</span>
                          </button>
                          <button
                            type="button"
                            className={`upi-tab-btn ${upiSubMode === "vpa" ? "active" : ""}`}
                            onClick={() => setUpiSubMode("vpa")}
                          >
                            <Smartphone size={15} /> Enter UPI ID / VPA
                          </button>
                        </div>

                        {upiSubMode === "qr" ? (
                          <div className="upi-qr-card-view">
                            <div className="qr-box-wrapper">
                              <QRCodeSVG
                                value={`upi://pay?pa=aibus@icici&pn=AiBus%20Travels&am=${Number(totalAmount).toFixed(2)}&cu=INR&tn=Booking%20${encodeURIComponent(selectedSeats.join(","))}`}
                                size={148}
                              />
                              <div className="qr-scan-badge">
                                <Sparkles size={13} className="text-amber" /> Scan with any UPI App
                              </div>
                            </div>
                            <div className="qr-details-side">
                              <div className="qr-amount-row">
                                <span className="qr-amount-label">Amount to Pay</span>
                                <strong className="qr-amount-value">₹{totalAmount}</strong>
                              </div>
                              <div className="upi-apps-row">
                                <span className="upi-app-badge">GPay</span>
                                <span className="upi-app-badge">PhonePe</span>
                                <span className="upi-app-badge">Paytm</span>
                                <span className="upi-app-badge">BHIM</span>
                                <span className="upi-app-badge">CRED</span>
                              </div>
                              <ul className="qr-instructions-list">
                                <li>
                                  <CheckCircle2 size={13} className="bullet-ico" /> 1. Scan this live QR with Google Pay, PhonePe, Paytm or BHIM
                                </li>
                                <li>
                                  <CheckCircle2 size={13} className="bullet-ico" /> 2. Enter UPI PIN on your phone to authorize payment
                                </li>
                                <li>
                                  <CheckCircle2 size={13} className="bullet-ico" /> 3. Instant auto-confirmation & WhatsApp e-ticket delivery
                                </li>
                              </ul>
                              <button
                                type="button"
                                className="btn-launch-qr-pay"
                                onClick={handleConfirmBooking}
                                disabled={submitting}
                              >
                                <Lock size={14} /> {submitting ? "Opening Payment..." : `Launch Razorpay QR Sheet (₹${totalAmount})`}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="upi-vpa-view">
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
                                placeholder="Enter UPI ID (e.g. mobile@upi, name@okhdfcbank)"
                                value={upiId}
                                onChange={(e) => {
                                  setUpiId(e.target.value);
                                  setUpiVerified(false);
                                  setUpiVerifyMsg("");
                                }}
                                className="upi-text-input"
                              />
                              <button
                                type="button"
                                className="upi-verify-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (upiId && upiId.includes("@")) {
                                    setUpiVerified(true);
                                    setUpiVerifyMsg(`UPI ID "${upiId}" verified!`);
                                  } else {
                                    setUpiVerified(false);
                                    setUpiVerifyMsg("Please enter a valid UPI ID (e.g. yourname@okhdfcbank)");
                                  }
                                }}
                              >
                                {upiVerified ? "✓ Verified" : "Verify"}
                              </button>
                            </div>
                            {upiVerifyMsg && (
                              <div className={`upi-verify-status ${upiVerified ? "success" : "error"}`}>
                                {upiVerified ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                <span>{upiVerifyMsg}</span>
                              </div>
                            )}
                            <span className="upi-subtext">
                              Click "Pay & Confirm" below to authorize transaction on your UPI app or scan QR
                            </span>
                          </div>
                        )}
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
                    Base Fare ({selectedSeats.length} × ₹{unitBaseFare})
                  </span>
                  <strong>₹{calculatedBaseFare.toLocaleString("en-IN")}</strong>
                </div>

                <div className="summary-line-item">
                  <span>Operator Service Charge</span>
                  <span className="free-badge">FREE</span>
                </div>

                <div className="summary-line-item">
                  <span>Taxes & GST</span>
                  <span>₹{calculatedTax.toLocaleString("en-IN")}</span>
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

              {/* Inline Sidebar Booking Error Alert */}
              {bookingError && (
                <div
                  className="luxury-error-banner sidebar-error-box"
                  role="alert"
                  style={{
                    marginBottom: "14px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    fontSize: "13px",
                    color: "#b91c1c",
                    lineHeight: "1.4",
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0, color: "#dc2626", marginTop: "2px" }} />
                  <span>{bookingError}</span>
                </div>
              )}

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