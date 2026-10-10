import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
  User,
  Users,
  Phone,
  Mail,
  ShieldCheck,
  Clock,
  ArrowLeft,
  ArrowRight,
  Tag,
  Sparkles,
  Check,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  Bus,
  Lock,
  Building,
  Receipt,
  ChevronDown,
  ChevronUp,
  Percent,
} from "lucide-react";
import busService from "../../services/busService";
import bookingService from "../../services/bookingService";
import authService from "../../services/authService";
import BookingStepper from "../../components/BookingStepper/BookingStepper";
import BoardingDroppingSelector, { formatPointTime } from "../../components/BoardingDroppingSelector/BoardingDroppingSelector";
import "./TravellerDetails.css";

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

function TravellerDetails() {
  const loggedInUser = authService.getLoggedInUser();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const busId = searchParams.get("busId") || "1";
  const seatsParam = searchParams.get("seats") || "4B";
  const fromParam = searchParams.get("from") || "";
  const toParam = searchParams.get("to") || "";
  const fromIdParam = searchParams.get("fromId") || "";
  const toIdParam = searchParams.get("toId") || "";
  const dateParam = searchParams.get("date") || "";

  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedPickup, setSelectedPickup] = useState(location.state?.pickup || null);
  const [selectedDropoff, setSelectedDropoff] = useState(location.state?.dropoff || null);
  const [loading, setLoading] = useState(true);
  const [resolvedFromCity, setResolvedFromCity] = useState(fromParam);
  const [resolvedToCity, setResolvedToCity] = useState(toParam);

  const selectedSeats = seatsParam
    ? seatsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : ["4B"];

  // 1. Resolve City Names and Load Bus Data from Live API / Cache
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      // Resolve city names if numeric or empty
      const fromName = await busService.resolveCityName(fromParam || fromIdParam || "4292");
      const toName = await busService.resolveCityName(toParam || toIdParam || "4562");

      if (isMounted) {
        setResolvedFromCity(fromName || "Bengaluru");
        setResolvedToCity(toName || "Chennai");
      }

      // Check location state first
      const stateBus = location.state?.bus;
      if (stateBus) {
        const resolvedPickups =
          stateBus.seatsLayout?.BoardingPoints?.length > 0
            ? stateBus.seatsLayout.BoardingPoints
            : (stateBus.pickups?.length > 0 ? stateBus.pickups : (stateBus.BoardingPoints || []));
        const resolvedDropoffs =
          stateBus.seatsLayout?.DroppingPoints?.length > 0
            ? stateBus.seatsLayout.DroppingPoints
            : (stateBus.dropoffs?.length > 0 ? stateBus.dropoffs : (stateBus.DroppingPoints || []));

        if (isMounted) {
          setSelectedBus({
            ...stateBus,
            from: fromName || stateBus.from,
            to: toName || stateBus.to,
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
        return;
      }

      // If state is missing (e.g. page refresh), fetch live from API
      try {
        const liveBus = await busService.searchSingleBus({
          fromCityId: fromIdParam || fromParam || 4292,
          toCityId: toIdParam || toParam || 4562,
          journeyDate: dateParam || new Date().toISOString().split("T")[0],
          busId: busId || 1,
          from: fromName,
          to: toName,
        });

        let resolvedBus = liveBus;
        if (!resolvedBus) {
          const routeBuses = await busService.searchBuses({
            from: fromName,
            to: toName,
            fromCityId: fromIdParam || fromParam || 4292,
            toCityId: toIdParam || toParam || 4562,
            journeyDate: dateParam || new Date().toISOString().split("T")[0],
          });
          resolvedBus =
            routeBuses.find((b) => String(b.busId || b.id || b.routeBusId) === String(busId)) ||
            routeBuses[0] ||
            null;
        }

        if (isMounted) {
          if (resolvedBus) {
            const chartData = await busService.getSeatAvailability(
              fromIdParam || fromParam || 4292,
              toIdParam || toParam || 4562,
              dateParam || new Date().toISOString().split("T")[0],
              resolvedBus.routeBusId || resolvedBus.busId || resolvedBus.id
            );

            const resolvedPickups =
              chartData?.BoardingPoints?.length > 0 ? chartData.BoardingPoints : (resolvedBus.pickups || []);
            const resolvedDropoffs =
              chartData?.DroppingPoints?.length > 0 ? chartData.DroppingPoints : (resolvedBus.dropoffs || []);

            setSelectedBus({
              ...resolvedBus,
              from: fromName || resolvedBus.from,
              to: toName || resolvedBus.to,
              seatsLayout: chartData,
              pickups: resolvedPickups,
              dropoffs: resolvedDropoffs,
            });

            if (!selectedPickup && resolvedPickups.length > 0) {
              setSelectedPickup(resolvedPickups[0]);
            }
            if (!selectedDropoff && resolvedDropoffs.length > 0) {
              setSelectedDropoff(resolvedDropoffs[0]);
            }
          } else {
            setSelectedBus({
              id: busId,
              busId: Number(busId) || 1,
              routeBusId: Number(busId) || 1,
              operator: "Premium Intercity Express",
              busType: "2+1 Multi-Axle AC Sleeper",
              from: fromName || "Bengaluru",
              to: toName || "Chennai",
              departureTime: "10:01",
              arrivalTime: "19:21",
              duration: "9h 20m",
              date: dateParam || new Date().toISOString().split("T")[0],
              price: 205,
              rating: 4.8,
            });
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load bus for traveller details:", err);
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [busId, fromParam, toParam, fromIdParam, toIdParam, dateParam, location.state]);

  const stateSeats = location.state?.selectedSeats || [];

  // 2. Generate Passenger Form entries based on selected seats
  const [travellers, setTravellers] = useState(() =>
    selectedSeats.map((seat, index) => {
      const seatObj =
        stateSeats.find(
          (s) =>
            typeof s === "object" &&
            (String(s.id) === String(seat) || String(s.display) === String(seat) || String(s.seatNo) === String(seat))
        ) || (typeof seat === "object" ? seat : null);
      const seatNoStr = typeof seat === "object" ? seat.display || seat.seatNo || seat.id : String(seat);
      const seatFare = seatObj?.price || (typeof seat === "object" ? seat.price : null) || selectedBus?.price || 15;
      const seatTypeId = seatObj?.seat_type || (typeof seat === "object" ? seat.seat_type : null) || 1;

      return {
        seat: seatNoStr,
        fare: seatFare,
        seatTypeId,
        name: index === 0 && loggedInUser?.name ? loggedInUser.name : "",
        age: index === 0 && loggedInUser?.age ? String(loggedInUser.age) : "",
        gender: index === 0 && loggedInUser?.gender ? loggedInUser.gender : "Male",
      };
    })
  );

  // Sync travellers array if seats change
  useEffect(() => {
    setTravellers((prev) => {
      return selectedSeats.map((seat, idx) => {
        const existing = prev.find((p) => String(p.seat) === String(seat)) || prev[idx];
        const seatObj =
          stateSeats.find(
            (s) =>
              typeof s === "object" &&
              (String(s.id) === String(seat) || String(s.display) === String(seat) || String(s.seatNo) === String(seat))
          ) || (typeof seat === "object" ? seat : null);
        const seatFare = seatObj?.price || existing?.fare || (typeof seat === "object" ? seat.price : null) || selectedBus?.price || 15;
        const seatTypeId = seatObj?.seat_type || existing?.seatTypeId || (typeof seat === "object" ? seat.seat_type : null) || 1;

        return {
          seat: typeof seat === "object" ? seat.display || seat.seatNo || seat.id : String(seat),
          fare: seatFare,
          seatTypeId,
          name: existing?.name || (idx === 0 && loggedInUser?.name ? loggedInUser.name : ""),
          age: existing?.age || (idx === 0 && loggedInUser?.age ? String(loggedInUser.age) : ""),
          gender: existing?.gender || "Male",
        };
      });
    });
  }, [seatsParam]);

  // Contact Info State
  const [contactMobile, setContactMobile] = useState(
    loggedInUser?.mobile || loggedInUser?.phone || "8999253954"
  );
  const [contactEmail, setContactEmail] = useState(
    loggedInUser?.email || "booking@aibus.in"
  );
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  // Optional GST State
  const [showGst, setShowGst] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [gstCompany, setGstCompany] = useState("");

  // Promo Code State
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // ⏱️ 5-Minute Seat Lock Timer
  const [timeLeft, setTimeLeft] = useState(282); // ~04:42

  useEffect(() => {
    const activeLock = bookingService.getSeatLock();
    if (!activeLock) {
      bookingService.lockSeats(busId, selectedSeats, {
        from: resolvedFromCity,
        to: resolvedToCity,
        date: dateParam,
      });
    }

    const timer = setInterval(() => {
      const currentLock = bookingService.getSeatLock();
      if (!currentLock) {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        return;
      }

      const secondsRemaining = Math.max(
        0,
        Math.floor((currentLock.expiresAt - Date.now()) / 1000)
      );
      setTimeLeft(secondsRemaining);

      if (secondsRemaining <= 0) {
        clearInterval(timer);
        bookingService.clearSeatLock();
        alert("Your seat lock timer expired. Please select seats again.");
        navigate(
          `/seat-selection?busId=${busId}&from=${fromParam}&to=${toParam}&date=${dateParam}`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [busId, fromParam, toParam, dateParam, resolvedFromCity, resolvedToCity, navigate, selectedSeats]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Form Field Validation
  const isValidName = (name) => /^[a-zA-Z\s]{2,50}$/.test(name?.trim() || "");
  const isValidAge = (age) => {
    const num = Number(age);
    return !isNaN(num) && num >= 1 && num <= 120;
  };
  const isValidMobile = (mob) => /^[6-9]\d{9}$/.test(mob?.trim() || "");
  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim() || "");

  const handleTravellerChange = (index, field, value) => {
    let updatedValue = value;
    if (field === "name") {
      updatedValue = value.replace(/[^a-zA-Z\s]/g, "").slice(0, 50);
    } else if (field === "age") {
      updatedValue = value.replace(/\D/g, "").slice(0, 3);
    }

    const updated = [...travellers];
    updated[index] = {
      ...updated[index],
      [field]: updatedValue,
    };
    setTravellers(updated);
    setFormError("");
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setPromoError("");
    const cleanCode = promoCode.trim().toUpperCase();

    if (!cleanCode) {
      setPromoError("Please enter a valid coupon code");
      return;
    }

    if (cleanCode === "AIBUS50" || cleanCode === "FIRST50") {
      setAppliedPromo({ code: cleanCode, discount: 50, label: "₹50 Instant Discount" });
      setPromoCode("");
    } else if (cleanCode === "SUPER100" || cleanCode === "TRAVEL100") {
      setAppliedPromo({ code: cleanCode, discount: 100, label: "₹100 Mega Discount" });
      setPromoCode("");
    } else if (cleanCode === "AIBUS10" || cleanCode === "FESTIVE") {
      const baseAmt = (selectedBus?.price || 205) * selectedSeats.length;
      const calcDiscount = Math.round(baseAmt * 0.1);
      setAppliedPromo({ code: cleanCode, discount: calcDiscount, label: "10% Festive Savings" });
      setPromoCode("");
    } else {
      setPromoError("Invalid coupon code. Try 'AIBUS50' or 'SUPER100'");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedPromo(null);
    setPromoError("");
  };

  const handleAutoFillUser = (index) => {
    if (!loggedInUser) return;
    const updated = [...travellers];
    updated[index] = {
      ...updated[index],
      name: loggedInUser.name || "Primary Traveller",
      age: loggedInUser.age ? String(loggedInUser.age) : "30",
      gender: loggedInUser.gender || "Male",
    };
    setTravellers(updated);
  };

  const handleContinue = async () => {
    // Validate passengers
    for (let i = 0; i < travellers.length; i++) {
      const p = travellers[i];
      if (!p.name?.trim()) {
        setFormError(`Please enter Full Name for Passenger ${i + 1} (Seat ${p.seat}).`);
        return;
      }
      if (!isValidName(p.name)) {
        setFormError(`Passenger ${i + 1} name must contain only alphabets (min 2 characters).`);
        return;
      }
      if (!p.age?.toString().trim()) {
        setFormError(`Please enter Age for Passenger ${i + 1} (Seat ${p.seat}).`);
        return;
      }
      if (!isValidAge(p.age)) {
        setFormError(`Please enter a valid age (1-120) for Passenger ${i + 1}.`);
        return;
      }
    }

    if (!contactMobile?.trim() || !isValidMobile(contactMobile)) {
      setFormError("Please enter a valid 10-digit Indian mobile number (starts with 6-9).");
      return;
    }

    if (contactEmail && !isValidEmail(contactEmail)) {
      setFormError("Please enter a valid email address for e-ticket delivery.");
      return;
    }

    setFormError("");
    setSubmitting(true);

    try {
      // 3. Create Seat Hold in Backend / Database
      const boardingPoints =
        selectedBus?.pickups?.length > 0
          ? selectedBus.pickups
          : (selectedBus?.BoardingPoints || selectedBus?.boardingPoints || selectedBus?.seatsLayout?.BoardingPoints || []);

      const droppingPoints =
        selectedBus?.dropoffs?.length > 0
          ? selectedBus.dropoffs
          : (selectedBus?.DroppingPoints || selectedBus?.droppingPoints || selectedBus?.seatsLayout?.DroppingPoints || []);

      const pickupCode =
        selectedPickup?.PickupCode ||
        selectedPickup?.pickupCode ||
        selectedPickup?.code ||
        boardingPoints[0]?.PickupCode ||
        boardingPoints[0]?.pickupCode ||
        (selectedBus?.routeBusId === 2 || selectedBus?.busId === 2 ? "74717" : "39436");

      const dropoffCode =
        selectedDropoff?.DropoffCode ||
        selectedDropoff?.dropoffCode ||
        selectedDropoff?.code ||
        droppingPoints[0]?.DropoffCode ||
        droppingPoints[0]?.dropoffCode ||
        (selectedBus?.routeBusId === 2 || selectedBus?.busId === 2 ? "746" : "750");

      const cleanDate = String(selectedBus?.date || dateParam || new Date().toISOString().split("T")[0]).split("T")[0];

      const resolvedFromCityId = Number(
        fromIdParam ||
        selectedBus?.fromCityId ||
        (fromParam && !isNaN(Number(fromParam)) ? fromParam : 4292)
      );
      const resolvedToCityId = Number(
        toIdParam ||
        selectedBus?.toCityId ||
        (toParam && !isNaN(Number(toParam)) ? toParam : 4562)
      );

      const holdRes = await bookingService.holdSeats({
        fromCityId: resolvedFromCityId,
        toCityId: resolvedToCityId,
        journeyDate: cleanDate,
        busId: selectedBus?.routeBusId || selectedBus?.busId || Number(busId) || 1,
        pickupId: String(pickupCode),
        dropoffId: String(dropoffCode),
        contactInfo: {
          customerName: travellers[0]?.name || "Traveller",
          email: contactEmail || "booking@aibus.in",
          phone: contactMobile,
          mobile: contactMobile,
        },
        passengers: travellers.map((t, idx) => {
          const seatObj = stateSeats[idx] || selectedBus?.seatsLayout?.Layout?.find(s => String(s.seat_no) === String(t.seat));
          const fare = t.fare || seatObj?.price || seatObj?.total_fare || selectedBus?.price || 15;
          return {
            seatNo: String(t.seat),
            seatTypeId: Number(t.seatTypeId || seatObj?.seat_type || 1),
            fare: Number(fare),
            gender: t.gender === "Female" || t.gender === "F" ? "F" : "M",
            age: parseInt(t.age, 10) || 28,
            name: t.name,
            isAcSeat: Boolean(selectedBus?.busType?.toLowerCase().includes("ac")),
          };
        }),
      });

      const holdId = holdRes?.holdId || holdRes?.providerHoldId || holdRes?.id;

      // Calculate final pricing
      const baseFare = (selectedBus?.price || 205) * selectedSeats.length;
      const discount = appliedPromo?.discount || 0;
      const taxes = 0; // Tax included or minimal
      const finalTotal = Math.max(1, baseFare + taxes - discount);

      const params = new URLSearchParams({
        busId: String(selectedBus?.busId || selectedBus?.id || busId),
        seats: selectedSeats.join(","),
        travellersData: JSON.stringify(travellers),
        contactMobile,
        contactEmail: contactEmail || "booking@aibus.in",
        sendWhatsApp: String(sendWhatsApp),
        ...(holdId && { holdId: String(holdId) }),
        fromId: String(resolvedFromCityId),
        toId: String(resolvedToCityId),
        from: resolvedFromCity,
        to: resolvedToCity,
        date: selectedBus?.date || dateParam,
        totalAmount: String(finalTotal),
        ...(appliedPromo && { discount: String(discount), promoCode: appliedPromo.code }),
      });

      const finalPickupObj =
        selectedPickup ||
        boardingPoints.find((p) => String(p.PickupCode || p.pickupCode) === String(pickupCode)) ||
        boardingPoints[0];

      const finalDropoffObj =
        selectedDropoff ||
        droppingPoints.find((d) => String(d.DropoffCode || d.dropoffCode) === String(dropoffCode)) ||
        droppingPoints[0];

      navigate(`/booking-confirmation?${params.toString()}`, {
        state: {
          bus: selectedBus,
          travellers,
          contact: { mobile: contactMobile, email: contactEmail, sendWhatsApp },
          holdId,
          pricing: { baseFare, discount, taxes, total: finalTotal },
          pickup: finalPickupObj,
          dropoff: finalDropoffObj,
        },
      });
    } catch (err) {
      console.error("Hold seats error:", err);
      setFormError(err.message || "Could not reserve seats at provider. Please try another seat.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="modern-traveller-page">
        <div className="modern-traveller-container">
          <BookingStepper currentStep={2} />
          <div className="modern-loading-card">
            <div className="modern-spinner" />
            <h3>Fetching live trip details...</h3>
            <p>Verifying seat availability and operator pricing with Mantis GDS</p>
          </div>
        </div>
      </main>
    );
  }

  const busPrice = selectedBus?.price || 205;
  const baseFare = busPrice * selectedSeats.length;
  const discountAmount = appliedPromo?.discount || 0;
  const serviceTax = 0;
  const totalFare = Math.max(1, baseFare + serviceTax - discountAmount);

  const pickupsList = selectedBus?.pickups || selectedBus?.BoardingPoints || [];
  const dropoffsList = selectedBus?.dropoffs || selectedBus?.DroppingPoints || [];

  return (
    <main className="modern-traveller-page">
      <div className="modern-traveller-container">
        {/* Step 2 Stepper */}
        <BookingStepper currentStep={2} />

        {/* 2-Column Responsive Layout */}
        <div className="modern-traveller-layout">
          {/* LEFT COLUMN: Passenger Forms + Contact Details */}
          <section className="modern-forms-column" aria-label="Passenger and Contact Forms">
            {/* Back Button */}
            <button
              type="button"
              className="modern-back-btn"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={16} />
              <span>Back to Seat Selection</span>
            </button>

            {/* Page Title Block */}
            <div className="modern-page-header">
              <div className="header-badge-row">
                <span className="step-pill-tag">Step 2 of 4</span>
                <span className="secure-badge">
                  <ShieldCheck size={14} /> Verified Booking
                </span>
              </div>
              <h1 className="modern-page-title">Traveller Details</h1>
              <p className="modern-page-subtitle">
                Select your boarding/dropping points and enter details of all travellers
              </p>
            </div>

            {/* Form Error Alert Banner */}
            {formError && (
              <div className="modern-error-banner" role="alert">
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            {/* LIVE BOARDING & DROPPING POINTS SELECTOR */}
            {(pickupsList.length > 0 || dropoffsList.length > 0) && (
              <BoardingDroppingSelector
                pickups={pickupsList}
                dropoffs={dropoffsList}
                selectedPickup={selectedPickup}
                selectedDropoff={selectedDropoff}
                onSelectPickup={setSelectedPickup}
                onSelectDropoff={setSelectedDropoff}
                fromCity={resolvedFromCity}
                toCity={resolvedToCity}
                title="Select Boarding & Dropping Points"
                subtitle="Choose your preferred pickup station and destination dropping point"
              />
            )}

            {/* PASSENGER CARDS LIST */}
            <div className="modern-passenger-list">
              {travellers.map((passenger, idx) => {
                const nameHasErr =
                  passenger.name.length > 0 && !isValidName(passenger.name);
                const ageHasErr =
                  passenger.age.length > 0 && !isValidAge(passenger.age);
                const isPrimary = idx === 0;

                return (
                  <div key={passenger.seat || idx} className="modern-passenger-card">
                    {/* Passenger Card Header */}
                    <div className="modern-card-header">
                      <div className="header-left">
                        <div className="avatar-circle">
                          <User size={18} />
                        </div>
                        <div>
                          <h3 className="passenger-num-heading">
                            Passenger {idx + 1}
                            {isPrimary && (
                              <span className="primary-pill">Primary Contact</span>
                            )}
                          </h3>
                          <span className="seat-spec-meta">
                            Reserved Seat Berth
                          </span>
                        </div>
                      </div>

                      <div className="header-right">
                        {isPrimary && loggedInUser && (
                          <button
                            type="button"
                            className="autofill-btn"
                            onClick={() => handleAutoFillUser(idx)}
                          >
                            <Sparkles size={13} />
                            <span>Auto-fill My Info</span>
                          </button>
                        )}
                        <span className="seat-badge-pill">
                          Seat <strong>{passenger.seat}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Passenger Card Inputs */}
                    <div className="modern-card-body">
                      {/* Full Name */}
                      <div className="modern-input-group full-width">
                        <label htmlFor={`name-${idx}`} className="input-label">
                          Full Name <span className="req-star">*</span>
                        </label>
                        <div className={`input-field-wrap ${nameHasErr ? "has-error" : ""}`}>
                          <User size={17} className="input-icon" />
                          <input
                            id={`name-${idx}`}
                            type="text"
                            maxLength={50}
                            placeholder="e.g. Vrinda Sharma"
                            value={passenger.name}
                            autoComplete="off"
                            onChange={(e) =>
                              handleTravellerChange(idx, "name", e.target.value)
                            }
                          />
                          {passenger.name.length >= 2 && isValidName(passenger.name) && (
                            <CheckCircle2 size={16} className="valid-icon" />
                          )}
                        </div>
                        {nameHasErr && (
                          <span className="field-err-msg">
                            Please enter full name (letters only, min 2 chars)
                          </span>
                        )}
                      </div>

                      {/* Age & Gender Grid */}
                      <div className="modern-input-grid">
                        {/* Age */}
                        <div className="modern-input-group">
                          <label htmlFor={`age-${idx}`} className="input-label">
                            Age <span className="req-star">*</span>
                          </label>
                          <div className={`input-field-wrap ${ageHasErr ? "has-error" : ""}`}>
                            <Calendar size={17} className="input-icon" />
                            <input
                              id={`age-${idx}`}
                              type="text"
                              inputMode="numeric"
                              maxLength={3}
                              placeholder="e.g. 28"
                              value={passenger.age}
                              onChange={(e) =>
                                handleTravellerChange(idx, "age", e.target.value)
                              }
                            />
                            {passenger.age.length > 0 && isValidAge(passenger.age) && (
                              <CheckCircle2 size={16} className="valid-icon" />
                            )}
                          </div>
                          {ageHasErr && (
                            <span className="field-err-msg">Age must be 1 - 120</span>
                          )}
                        </div>

                        {/* Gender Pill Buttons */}
                        <div className="modern-input-group">
                          <label className="input-label">
                            Gender <span className="req-star">*</span>
                          </label>
                          <div className="gender-pill-group">
                            {[
                              { label: "Male", emoji: "👨" },
                              { label: "Female", emoji: "👩" },
                              { label: "Other", emoji: "🧑" },
                            ].map((g) => {
                              const isSelected = passenger.gender === g.label;
                              return (
                                <button
                                  key={g.label}
                                  type="button"
                                  className={`gender-btn ${isSelected ? "selected" : ""}`}
                                  onClick={() =>
                                    handleTravellerChange(idx, "gender", g.label)
                                  }
                                >
                                  <span className="gender-emoji">{g.emoji}</span>
                                  <span>{g.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CONTACT INFORMATION CARD */}
            <div className="modern-passenger-card contact-section-card">
              <div className="modern-card-header">
                <div className="header-left">
                  <div className="avatar-circle green-accent">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h3 className="passenger-num-heading">Contact Information</h3>
                    <p className="section-header-sub">
                      Your booking confirmation, m-ticket & tracking SMS will be sent here
                    </p>
                  </div>
                </div>
              </div>

              <div className="modern-card-body">
                <div className="modern-input-grid">
                  {/* Mobile Number */}
                  <div className="modern-input-group">
                    <label htmlFor="contact-phone" className="input-label">
                      Mobile Number <span className="req-star">*</span>
                    </label>
                    <div
                      className={`input-field-wrap prefix-wrap ${
                        contactMobile.length > 0 && !isValidMobile(contactMobile)
                          ? "has-error"
                          : ""
                      }`}
                    >
                      <span className="country-code-pill">🇮🇳 +91</span>
                      <div className="input-v-divider" />
                      <input
                        id="contact-phone"
                        type="tel"
                        maxLength={10}
                        placeholder="8999253954"
                        value={contactMobile}
                        onChange={(e) => {
                          setContactMobile(
                            e.target.value.replace(/\D/g, "").slice(0, 10)
                          );
                          setFormError("");
                        }}
                      />
                    </div>
                    {contactMobile.length > 0 && !isValidMobile(contactMobile) && (
                      <span className="field-err-msg">
                        Enter a valid 10-digit Indian mobile number
                      </span>
                    )}
                  </div>

                  {/* Email Address */}
                  <div className="modern-input-group">
                    <label htmlFor="contact-email" className="input-label">
                      Email Address (for e-ticket PDF)
                    </label>
                    <div className="input-field-wrap">
                      <Mail size={17} className="input-icon" />
                      <input
                        id="contact-email"
                        type="email"
                        placeholder="booking@aibus.in"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* WhatsApp Updates Checkbox */}
                <div className="whatsapp-toggle-wrap">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={sendWhatsApp}
                      onChange={(e) => setSendWhatsApp(e.target.checked)}
                    />
                    <span className="checkmark-box" />
                    <span className="whatsapp-text">
                      <span className="wa-badge">WhatsApp</span>
                      Send booking confirmation, live bus tracking link and invoice on WhatsApp
                    </span>
                  </label>
                </div>

                {/* Optional GST Accordion */}
                <div className="gst-accordion-block">
                  <button
                    type="button"
                    className="gst-toggle-header"
                    onClick={() => setShowGst(!showGst)}
                  >
                    <div className="gst-toggle-left">
                      <Building size={16} className="gst-icon" />
                      <span>Have a GST Number? (Optional for Business)</span>
                    </div>
                    {showGst ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showGst && (
                    <div className="gst-inputs-row">
                      <div className="modern-input-group">
                        <label className="input-label">GSTIN Number</label>
                        <div className="input-field-wrap">
                          <Receipt size={16} className="input-icon" />
                          <input
                            type="text"
                            maxLength={15}
                            placeholder="e.g. 29ABCDE1234F1Z5"
                            value={gstNumber}
                            onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                          />
                        </div>
                      </div>
                      <div className="modern-input-group">
                        <label className="input-label">Registered Company Name</label>
                        <div className="input-field-wrap">
                          <Building size={16} className="input-icon" />
                          <input
                            type="text"
                            placeholder="e.g. Acme Tech Private Ltd"
                            value={gstCompany}
                            onChange={(e) => setGstCompany(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: Modern Sticky Trip Summary & Checkout */}
          <aside className="modern-summary-sidebar" aria-label="Trip Summary and Checkout">
            <div className="modern-summary-card">
              {/* Summary Header */}
              <div className="summary-top-banner">
                <div className="banner-badge-strip">
                  <span className="bus-company-tag">
                    <Bus size={13} /> {selectedBus?.operator || "GDS Demo Testpampa"}
                  </span>
                  <span className="star-rating-pill">★ 4.8</span>
                </div>
                <h3 className="summary-bus-title">
                  {selectedBus?.busType || "2X1(28) NAC -Semisleeper Deluxe"}
                </h3>
              </div>

              {/* Journey Route & Timing Section */}
              <div className="summary-route-timeline">
                <div className="route-node dep">
                  <span className="route-time">{selectedBus?.departureTime || "10:01"}</span>
                  <strong className="route-city">{resolvedFromCity}</strong>
                  <span className="route-sub-loc">Boarding Point</span>
                </div>

                <div className="route-connector-block">
                  <span className="journey-duration-pill">
                    {selectedBus?.duration || "9h 20m"}
                  </span>
                  <div className="animated-connector-line">
                    <span className="connector-dot start" />
                    <div className="connector-dashes" />
                    <span className="connector-dot end" />
                  </div>
                </div>

                <div className="route-node arr">
                  <span className="route-time">{selectedBus?.arrivalTime || "19:21"}</span>
                  <strong className="route-city">{resolvedToCity}</strong>
                  <span className="route-sub-loc">Dropping Point</span>
                </div>
              </div>

              {/* Selected Boarding & Dropping Points Quick Tile */}
              {(selectedPickup || selectedDropoff) && (
                <div style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  marginBottom: "16px",
                  fontSize: "12px",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "10px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb", marginTop: "4px", flexShrink: 0 }} />
                    <div>
                      <span style={{ color: "#64748b", fontSize: "11px", fontWeight: 600 }}>Selected Boarding</span>
                      <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "13px" }}>
                        {selectedPickup?.PickupName || selectedPickup?.pickupName || selectedPickup?.name || "Boarding Point"}
                      </div>
                      <span style={{ color: "#2563eb", fontWeight: 700, fontSize: "11px" }}>
                        {formatPointTime(selectedPickup?.PickupTime || selectedPickup?.time || selectedBus?.departureTime)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#7c3aed", marginTop: "4px", flexShrink: 0 }} />
                    <div>
                      <span style={{ color: "#64748b", fontSize: "11px", fontWeight: 600 }}>Selected Dropping</span>
                      <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "13px" }}>
                        {selectedDropoff?.DropoffName || selectedDropoff?.dropoffName || selectedDropoff?.name || "Dropping Point"}
                      </div>
                      <span style={{ color: "#7c3aed", fontWeight: 700, fontSize: "11px" }}>
                        {formatPointTime(selectedDropoff?.DropoffTime || selectedDropoff?.time || selectedBus?.arrivalTime)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Date & Seats Meta Bar */}
              <div className="summary-meta-grid">
                <div className="meta-box">
                  <span className="meta-label">Date of Journey</span>
                  <strong className="meta-value">
                    {formatTripDate(selectedBus?.date || dateParam)}
                  </strong>
                </div>
                <div className="meta-box">
                  <span className="meta-label">Total Seats</span>
                  <strong className="meta-value">
                    {selectedSeats.length} {selectedSeats.length === 1 ? "Seat" : "Seats"}
                  </strong>
                </div>
              </div>

              {/* Selected Seats Highlight Box */}
              <div className="selected-seats-strip">
                <span className="strip-title">Selected Berth(s):</span>
                <div className="seat-pills-row">
                  {selectedSeats.map((s) => (
                    <span key={s} className="highlighted-seat-tag">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Promo Code Box */}
              <div className="promo-coupon-section">
                {appliedPromo ? (
                  <div className="applied-promo-chip">
                    <div className="promo-left">
                      <Sparkles size={16} className="sparkle-icon" />
                      <div>
                        <strong>{appliedPromo.code}</strong>
                        <span>{appliedPromo.label}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="remove-promo-btn"
                      onClick={handleRemoveCoupon}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="promo-input-form">
                    <div className="promo-input-wrap">
                      <Tag size={15} className="promo-icon" />
                      <input
                        type="text"
                        placeholder="Enter Promo Code (e.g. AIBUS50)"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value);
                          setPromoError("");
                        }}
                      />
                    </div>
                    <button type="submit" className="apply-coupon-btn">
                      Apply
                    </button>
                  </form>
                )}
                {promoError && <span className="promo-err-msg">{promoError}</span>}
              </div>

              {/* Price Breakdown */}
              <div className="summary-price-breakdown">
                <div className="price-row">
                  <span>Base Fare ({selectedSeats.length} × ₹{busPrice})</span>
                  <span>₹{baseFare.toLocaleString("en-IN")}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="price-row discount-row">
                    <span>Promo Discount</span>
                    <span className="discount-val">-₹{discountAmount}</span>
                  </div>
                )}
                <div className="price-row total-row">
                  <span className="total-title">Total Fare</span>
                  <strong className="total-amount-display">
                    ₹{totalFare.toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              {/* PRIMARY ACTION CTA BUTTON */}
              <button
                type="button"
                className="modern-primary-checkout-btn"
                disabled={submitting}
                onClick={handleContinue}
              >
                <span>{submitting ? "Reserving Seats..." : "Continue to Review & Pay"}</span>
                <ArrowRight size={18} className="btn-arrow" />
              </button>

              {/* 5-Min Lock Timer Indicator */}
              <div className="modern-timer-strip">
                <div className="timer-lock-pulse">
                  <Lock size={14} />
                </div>
                <span>
                  Seats reserved for{" "}
                  <strong className="time-digits">{formatTimer(timeLeft)}</strong>
                </span>
              </div>

              {/* Trust Badges */}
              <div className="trust-assurances-list">
                <div className="trust-item">
                  <ShieldCheck size={14} className="trust-icon" />
                  <span>256-Bit SSL Encrypted Instant Booking</span>
                </div>
                <div className="trust-item">
                  <Clock size={14} className="trust-icon" />
                  <span>Free Cancellation up to 4 hrs before departure</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default TravellerDetails;