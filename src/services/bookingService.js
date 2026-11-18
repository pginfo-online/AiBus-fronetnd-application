import api from "./api";

const SEAT_LOCK_KEY = "activeSeatLock";
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const GUEST_BOOKINGS_KEY = "guestBookings";

function formatBusType(type) {
  if (!type) return "AC Seater";
  const str = type.toString().toUpperCase();
  if (str.includes("SLEEPER")) return "AC Sleeper (2+1)";
  if (str.includes("NON_AC") || str.includes("NON-AC")) return "Non-AC Seater (2+2)";
  if (str.includes("AC")) return "AC Seater (2+2)";
  return "Express Seater";
}

function calculateDuration(depTime, arrTime) {
  if (!depTime || !arrTime) return "4h 00m";
  try {
    const [depH, depM] = depTime.split(":").map(Number);
    const [arrH, arrM] = arrTime.split(":").map(Number);
    let diffMinutes = arrH * 60 + arrM - (depH * 60 + depM);
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60;
    }
    const h = Math.floor(diffMinutes / 60);
    const m = diffMinutes % 60;
    return `${h}h ${m.toString().padStart(2, "0")}m`;
  } catch {
    return "4h 00m";
  }
}

function mapBackendBooking(b) {
  const depTime = b.pickupTime
    ? b.pickupTime.toString().slice(11, 16)
    : b.departureTime
      ? b.departureTime.toString().slice(0, 5)
      : "08:00";

  const arrTime = b.dropoffTime
    ? b.dropoffTime.toString().slice(11, 16)
    : b.arrivalTime
      ? b.arrivalTime.toString().slice(0, 5)
      : "14:00";

  const passengers = (b.passengers || []).map((p) => ({
    seat: p.seatNo || p.seatNumber || "A1",
    name: p.name || "Passenger",
    age: p.age || 25,
    gender: p.gender === "F" || p.gender === "Female" ? "Female" : "Male",
    mobile: p.mobile || b.contactPhone || "",
    fare: Number(p.fare || 0),
  }));

  const primaryPassenger = passengers[0] || {};
  const seatsList = b.selectedSeats || (b.seats && b.seats.map((s) => s.seatNo)) || passengers.map((p) => p.seat);

  return {
    id: b.id || b.bookingReference,
    bookingId: b.id || b.bookingReference,
    bookingReference: b.bookingReference || b.bookingNumber || b.id,
    bookingNumber: b.bookingNumber || b.bookingReference || b.id,
    pnr: b.providerPnrNo || b.pnrNumber || b.pnr || b.ticket?.pnrNumber || b.bookingReference,
    ticketNumber: b.providerTicketNo || b.ticketNumber || b.ticketNo || b.ticket?.ticketNumber || b.bookingReference,
    userMobile: b.contactPhone || b.user?.mobile || primaryPassenger.mobile || "",
    contactEmail: b.contactEmail || b.user?.email || "",
    contactPhone: b.contactPhone || primaryPassenger.mobile || "",
    contactName: b.contactName || primaryPassenger.name || "Passenger",
    bus: {
      id: b.busId || b.scheduleId || 1,
      operator: b.operatorName || b.busName || "AIBus Travels",
      busNumber: b.busNumber || "AI-BUS",
      busType: formatBusType(b.busType),
      from: b.fromCityName || b.source || "Bengaluru",
      to: b.toCityName || b.destination || "Chennai",
      departureTime: depTime,
      arrivalTime: arrTime,
      duration: calculateDuration(depTime, arrTime),
      date: b.journeyDate ? b.journeyDate.toString().slice(0, 10) : "",
      pickupLocation: b.pickupLocation || "Main Boarding Point",
      dropoffLocation: b.dropoffLocation || "City Dropoff Point",
    },
    travellers: passengers,
    traveller: {
      name: b.contactName || primaryPassenger.name || "Passenger",
      age: primaryPassenger.age || "",
      mobile: b.contactPhone || primaryPassenger.mobile || "",
    },
    seats: seatsList,
    totalAmount: Number(b.totalFare || b.totalAmount || 0),
    baseFare: Number(b.baseFare || 0),
    serviceTax: Number(b.serviceTax || 0),
    status:
      b.status === "CONFIRMED" || b.bookingStatus === "CONFIRMED"
        ? "Confirmed"
        : b.status === "CANCELLED" || b.bookingStatus === "CANCELLED"
          ? "Cancelled"
          : b.status || b.bookingStatus || "Confirmed",
    bookingDate: b.createdAt || new Date().toISOString(),
    isGuest: b.isGuest || false,
    cancellationPolicy: b.cancellationPolicy || [],
    cancellations: b.cancellations || [],
    refunds: b.refunds || [],
    payments: b.payments || [],
    refundAmount: Number(b.cancellations?.[0]?.refundAmount ?? b.refunds?.[0]?.amount ?? 0),
    refundStatus: b.refunds?.[0]?.status ?? (b.status === "CANCELLED" ? "REFUND_PENDING" : null),
    cancellationCharges: Number(b.cancellations?.[0]?.chargeAmt ?? 0),
    cancelledAt: b.cancelledAt || b.cancellations?.[0]?.createdAt || null,
  };
}

export const bookingService = {
  // ----------------------------------------------------
  // ⏱️ Seat Locking System (UI / Local Storage Helper)
  // ----------------------------------------------------
  lockSeats: (busId, seats, extraDetails = {}) => {
    const lockData = {
      busId,
      seats,
      lockedAt: Date.now(),
      expiresAt: Date.now() + LOCK_DURATION_MS,
      ...extraDetails,
    };
    localStorage.setItem(SEAT_LOCK_KEY, JSON.stringify(lockData));
    return lockData;
  },

  getSeatLock: () => {
    try {
      const data = localStorage.getItem(SEAT_LOCK_KEY);
      if (!data) return null;
      const lock = JSON.parse(data);

      if (Date.now() > lock.expiresAt) {
        bookingService.clearSeatLock();
        return null;
      }
      return lock;
    } catch {
      bookingService.clearSeatLock();
      return null;
    }
  },

  clearSeatLock: () => {
    localStorage.removeItem(SEAT_LOCK_KEY);
  },

  // ----------------------------------------------------
  // 1️⃣ Mantis POST /ota/HoldSeats -> Backend POST /api/v1/holds
  // ----------------------------------------------------
  holdSeats: async ({
    fromCityId,
    toCityId,
    journeyDate,
    busId,
    pickupId,
    dropoffId,
    contactInfo = {},
    passengers = [],
  }) => {
    try {
      const cleanPhone = String(contactInfo.phone || contactInfo.mobile || "9876543210").replace(/\D/g, "").slice(-10) || "9876543210";
      const cleanEmail = (contactInfo.email || "").trim() || `${cleanPhone}@mobile.aibus.app`;
      const cleanCustomerName = (contactInfo.customerName || contactInfo.name || passengers[0]?.name || "Traveller").trim();

      const response = await api.post("/api/v1/holds", {
        fromCityId: Number(fromCityId || 4292),
        toCityId: Number(toCityId || 4562),
        journeyDate: String(journeyDate || new Date().toISOString().split("T")[0]).split("T")[0],
        busId: Number(busId || 1),
        pickupId: String(pickupId || "44953"),
        dropoffId: String(dropoffId || "750"),
        contactInfo: {
          customerName: cleanCustomerName,
          email: cleanEmail,
          phone: cleanPhone,
          mobile: cleanPhone,
          ...(contactInfo.state ? { state: contactInfo.state } : {}),
        },
        passengers: passengers.map((p, idx) => ({
          seatNo: String(p.seat || p.seatNo || `S${idx + 1}`),
          seatTypeId: Number(p.seatTypeId || 1),
          fare: Number(p.fare || 650),
          gender: p.gender === "Female" || p.gender === "F" ? "F" : "M",
          age: Number(p.age || 25),
          name: (p.name || `Passenger ${idx + 1}`).trim(),
          isAcSeat: Boolean(p.isAcSeat),
        })),
      });
      const holdData = response.data?.data || response.data;
      console.log("[HoldSeats Live Response]", holdData);
      return {
        ...holdData,
        id: holdData?.id || holdData?.holdId,
      };
    } catch (err) {
      const errData = err.response?.data;
      const errorMsg =
        (typeof errData?.error === "string" ? errData.error : errData?.error?.message) ||
        errData?.message ||
        err.message ||
        "Failed to hold seats with GDS provider";
      console.error("[HoldSeats Error]", errorMsg);
      throw new Error(errorMsg);
    }
  },

  // ----------------------------------------------------
  // 2️⃣ Mantis POST /ota/BookSeats -> Backend POST /api/v1/bookings
  // ----------------------------------------------------
  createBooking: async ({
    bus,
    travellers = [],
    seats = [],
    totalAmount,
    contactName,
    contactEmail,
    contactPhone,
    userMobile,
    userId,
    isGuest = false,
    fromId,
    toId,
    holdId,
    pickup,
    dropoff,
  }) => {
    const passengersList = (travellers || []).map((t, idx) => {
      const seatNo = String(t.seat || t.seatNo || seats[idx] || `S${idx + 1}`);
      const fare = Number(t.fare || t.price || (totalAmount && seats.length ? Math.round(totalAmount / seats.length) : bus.price) || 205);
      const seatTypeId = Number(t.seatTypeId || 1);
      const gender = t.gender === "Female" || t.gender === "F" ? "F" : "M";
      const age = parseInt(t.age, 10) || 28;
      const name = (t.name || `Passenger ${idx + 1}`).trim();
      const isAcSeat = Boolean(t.isAcSeat ?? bus.busType?.toLowerCase().includes("ac"));
      return {
        seatNo,
        seatTypeId,
        fare,
        gender,
        age,
        name,
        isAcSeat,
      };
    });

    const primaryName = (contactName || travellers?.[0]?.name || "Passenger").trim();

    let rawPhone = String(contactPhone || userMobile || travellers?.[0]?.mobile || "9876543210");
    let cleanDigits = rawPhone.replace(/\D/g, "");
    while (cleanDigits.length > 10 && cleanDigits.startsWith("91")) {
      cleanDigits = cleanDigits.slice(2);
    }
    if (cleanDigits.length > 10) {
      cleanDigits = cleanDigits.slice(-10);
    }
    const primaryPhone = cleanDigits.length === 10 ? cleanDigits : "9876543210";

    const primaryEmail = (
      contactEmail ||
      travellers?.[0]?.email ||
      `${primaryPhone}@mobile.aibus.app`
    ).trim();

    const cleanDate = String(bus.date || new Date().toISOString().split("T")[0]).split("T")[0];

    const resolvedPickupCode = String(
      pickup?.PickupCode ||
      pickup?.pickupCode ||
      pickup?.PickUpID ||
      pickup?.pickupId ||
      pickup?.code ||
      pickup?.Id ||
      (Number(bus.busId || bus.id) === 2 ? "74717" : "39436")
    );

    const resolvedPickupLocation =
      pickup?.PickupName ||
      pickup?.pickupName ||
      pickup?.name ||
      pickup?.location ||
      "Boarding Point";

    const rawPickupTime =
      pickup?.PickupTime ||
      pickup?.pickupTime ||
      pickup?.time ||
      "";
    const resolvedPickupTime = rawPickupTime
      ? (rawPickupTime.includes(":") && !rawPickupTime.includes("-") ? `${cleanDate} ${rawPickupTime}:00`.replace(/:00:00$/, ":00") : rawPickupTime)
      : `${cleanDate} 23:00:00`;

    const resolvedDropoffCode = String(
      dropoff?.DropoffCode ||
      dropoff?.dropoffCode ||
      dropoff?.DropOffID ||
      dropoff?.dropoffId ||
      dropoff?.code ||
      dropoff?.Id ||
      (Number(bus.busId || bus.id) === 2 ? "746" : "750")
    );

    const resolvedDropoffLocation =
      dropoff?.DropoffName ||
      dropoff?.dropoffName ||
      dropoff?.name ||
      dropoff?.location ||
      "Dropping Point";

    const rawDropoffTime =
      dropoff?.DropoffTime ||
      dropoff?.dropoffTime ||
      dropoff?.time ||
      "";
    const resolvedDropoffTime = rawDropoffTime
      ? (rawDropoffTime.includes(":") && !rawDropoffTime.includes("-") ? `${cleanDate} ${rawDropoffTime}:00`.replace(/:00:00$/, ":00") : rawDropoffTime)
      : `${cleanDate} 09:15:00`;

    const calcTotalFare = passengersList.reduce((sum, p) => sum + p.fare, 0);
    const finalTotalFare = Number(totalAmount || calcTotalFare || bus.price * (seats.length || 1) || 105);
    const finalBaseFare = Number(calcTotalFare || bus.price * (seats.length || 1) || totalAmount || 105);

    const payload = {
      ...(holdId && { holdId: String(holdId) }),
      fromCityId: Number(fromId || 4292),
      toCityId: Number(toId || 4562),
      fromCityName: bus.from || "Bengaluru",
      toCityName: bus.to || "Chennai",
      journeyDate: cleanDate,
      busId: Number(bus.busId || bus.id || 1),
      tripId: String(bus.tripId || bus.id || "46754"),
      pickupCode: resolvedPickupCode,
      pickupLocation: resolvedPickupLocation,
      pickupTime: resolvedPickupTime,
      dropoffCode: resolvedDropoffCode,
      dropoffLocation: resolvedDropoffLocation,
      dropoffTime: resolvedDropoffTime,
      operatorName: bus.operator || "Express Line",
      busType: bus.busType || "AC Seater/Sleeper",
      totalFare: finalTotalFare,
      baseFare: finalBaseFare,
      serviceTax: Number(0),
      contactName: primaryName,
      contactEmail: primaryEmail,
      contactPhone: primaryPhone,
      passengers: passengersList,
    };

    let createdBooking = null;

    try {
      const response = await api.post("/api/v1/bookings", payload);
      createdBooking = response.data?.data;
      console.log("[BookSeats Confirmed Response]", createdBooking);
    } catch (err) {
      const errData = err.response?.data;
      let errorMsg = "Failed to confirm booking with GDS provider";

      if (errData?.error?.message) {
        errorMsg = errData.error.message;
        if (errData.error.details?.details) {
          const fieldErrors = errData.error.details.details
            .map((d) => `${d.field}: ${d.message}`)
            .join(", ");
          errorMsg = `${errorMsg} (${fieldErrors})`;
        }
      } else if (typeof errData?.error === "string") {
        errorMsg = errData.error;
      } else if (errData?.message) {
        errorMsg = errData.message;
      } else if (err.message) {
        errorMsg = err.message;
      }

      console.error("[BookSeats Error]", errorMsg, errData);
      throw new Error(errorMsg);
    }

    bookingService.clearSeatLock();

    const bookingIdentifier = createdBooking?.id || createdBooking?.bookingNumber || createdBooking?.bookingReference;

    const fullBookingData = {
      id: bookingIdentifier,
      bookingId: bookingIdentifier,
      bookingReference: createdBooking?.bookingNumber || createdBooking?.bookingReference || bookingIdentifier,
      bookingNumber: createdBooking?.bookingNumber || bookingIdentifier,
      pnr: createdBooking?.providerPnrNo || createdBooking?.pnrNumber || createdBooking?.ticket?.pnrNumber || `PNR-${Math.floor(100000 + Math.random() * 900000)}`,
      ticketNumber: createdBooking?.providerTicketNo || createdBooking?.ticketNumber || createdBooking?.ticket?.ticketNumber || `TKT-${Math.floor(100000 + Math.random() * 900000)}`,
      totalAmount: Number(createdBooking?.totalFare || createdBooking?.totalAmount || finalTotalFare),
      status: createdBooking?.status || "Confirmed",
      seats: createdBooking?.selectedSeats || (createdBooking?.seats && createdBooking.seats.map((s) => s.seatNo)) || seats,
      passengers: createdBooking?.passengers || passengersList,
      travellers: createdBooking?.passengers?.map((p) => ({
        seat: p.seatNo,
        name: p.name,
        age: p.age,
        gender: p.gender === "F" || p.gender === "Female" ? "Female" : "Male",
        mobile: primaryPhone,
        fare: p.fare,
      })) || passengersList,
      traveller: { name: primaryName, mobile: primaryPhone, email: primaryEmail },
      userMobile: primaryPhone,
      contactName: primaryName,
      contactEmail: primaryEmail,
      contactPhone: primaryPhone,
      bus: {
        id: bus.id,
        operator: createdBooking?.operatorName || bus.operator || "AIBus Travels",
        busNumber: bus.busNumber || "AI001",
        busType: formatBusType(createdBooking?.busType || bus.busType),
        from: createdBooking?.fromCityName || bus.from || "Bengaluru",
        to: createdBooking?.toCityName || bus.to || "Chennai",
        departureTime: bus.departureTime || (resolvedPickupTime.includes(":") ? resolvedPickupTime.slice(11, 16) : "08:30"),
        arrivalTime: bus.arrivalTime || (resolvedDropoffTime.includes(":") ? resolvedDropoffTime.slice(11, 16) : "14:30"),
        duration: bus.duration || "6h 00m",
        date: cleanDate,
        pickupLocation: createdBooking?.pickupLocation || resolvedPickupLocation,
        dropoffLocation: createdBooking?.dropoffLocation || resolvedDropoffLocation,
      },
      bookingDate: createdBooking?.createdAt || new Date().toISOString(),
      isGuest,
    };

    // Always cache the created booking locally so receipt/ticket can retrieve it instantly
    bookingService.saveGuestBooking(fullBookingData);

    return fullBookingData;
  },

  // ----------------------------------------------------
  // 2.5 Mantis POST /ota/bookingstatusv2 -> Backend POST /api/v1/bookings/status
  // ----------------------------------------------------
  checkBookingStatus: async (holdId) => {
    if (!holdId) throw new Error("holdId is required to check booking status");
    try {
      const response = await api.post("/api/v1/bookings/status", {
        holdId: String(holdId),
      });
      return response.data?.data;
    } catch (err) {
      const errorMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message;
      console.error("[BookingStatus Error]", errorMsg);
      throw new Error(errorMsg || "Failed to check booking status with provider");
    }
  },

  // ----------------------------------------------------
  // 3️⃣ Mantis GET /ota/BookingDetails -> Backend GET /api/v1/bookings/:id
  // ----------------------------------------------------
  getBookingById: async (bookingReference) => {
    if (!bookingReference) return null;

    try {
      const response = await api.get(`/api/v1/bookings/${bookingReference}`);
      const data = response.data?.data;
      if (data) {
        const mapped = mapBackendBooking(data);
        bookingService.saveGuestBooking(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn("Checking guest storage for booking:", err.message);
    }

    return bookingService.getGuestBookingById(bookingReference);
  },

  mapBackendBooking,

  // ----------------------------------------------------
  // 4️⃣ User Bookings List
  // ----------------------------------------------------
  getMyBookings: async () => {
    let remoteBookings = [];
    try {
      const response = await api.get("/api/v1/bookings/my-bookings");
      const raw = response.data?.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.items)
          ? raw.items
          : Array.isArray(raw?.bookings)
            ? raw.bookings
            : Array.isArray(raw?.data)
              ? raw.data
              : [];

      remoteBookings = list.map(mapBackendBooking);
    } catch (err) {
      console.warn("Failed to fetch remote /my-bookings:", err.message);
    }

    // Retrieve locally saved device / guest bookings
    const localBookings = (bookingService.getGuestBookings() || []).map((b) => ({
      ...b,
      isGuest: b.isGuest !== undefined ? Boolean(b.isGuest) : false,
    }));

    // Check if any recent pending payment booking can be fetched live
    try {
      const pendingRaw = localStorage.getItem("aibus_pending_payment");
      if (pendingRaw) {
        const pending = JSON.parse(pendingRaw);
        if (pending.bookingId) {
          const alreadyInLocal = localBookings.some((b) => {
            const bId = String(b.id || b.bookingId || b.bookingReference || b.bookingNumber || "");
            return bId === String(pending.bookingId);
          });
          if (!alreadyInLocal) {
            const liveBooking = await bookingService.getBookingById(pending.bookingId);
            if (liveBooking) {
              localBookings.unshift(liveBooking);
              bookingService.saveGuestBooking(liveBooking);
            }
          }
        }
      }
    } catch {
      // Ignore pending payment fetch error
    }

    // Merge remote and local bookings by ID / Reference / PNR
    const seenKeys = new Set();
    const merged = [];

    const getKeys = (b) => {
      const keys = [];
      if (b.id) keys.push(String(b.id));
      if (b.bookingId) keys.push(String(b.bookingId));
      if (b.bookingReference) keys.push(String(b.bookingReference));
      if (b.bookingNumber) keys.push(String(b.bookingNumber));
      if (b.pnr && !String(b.pnr).startsWith("PNR-")) keys.push(String(b.pnr));
      return keys;
    };

    // Prioritize remote bookings
    for (const rb of remoteBookings) {
      const keys = getKeys(rb);
      const isSeen = keys.some((k) => seenKeys.has(k));
      if (!isSeen) {
        keys.forEach((k) => seenKeys.add(k));
        merged.push(rb);
      }
    }

    // Add local bookings not already in remote
    for (const lb of localBookings) {
      const keys = getKeys(lb);
      const isSeen = keys.some((k) => seenKeys.has(k));
      if (!isSeen) {
        keys.forEach((k) => seenKeys.add(k));
        merged.push(lb);
      }
    }

    return merged;
  },

  getUserBookings: async (userId) => {
    return bookingService.getMyBookings();
  },

  // ----------------------------------------------------
  // 5️⃣ Mantis GET /ota/IsCancellable -> Backend GET /api/v1/cancellations/:id/check or direct
  // ----------------------------------------------------
  checkCancellability: async (bookingId, seatNos) => {
    try {
      const params = {};
      if (seatNos) {
        params.seatNos = Array.isArray(seatNos) ? seatNos.join(",") : seatNos;
      }
      const response = await api.get(`/api/v1/cancellations/${bookingId}/check`, { params });
      return response.data?.data || response.data;
    } catch (err) {
      console.warn("IsCancellable check error:", err.message);
      throw err;
    }
  },

  checkIsCancellableDirect: async ({ ticketNo, seatNos, pnrNo }) => {
    try {
      const response = await api.get(`/api/v1/cancellations/iscancellable`, {
        params: {
          TicketNo: ticketNo,
          seatNos: Array.isArray(seatNos) ? seatNos.join(",") : seatNos,
          PNRNo: pnrNo,
        },
      });
      return response.data?.data || response.data;
    } catch (err) {
      const errorMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message;
      console.error("[IsCancellable Direct Error]", errorMsg);
      throw new Error(errorMsg || "Failed to check cancellation policy");
    }
  },

  // ----------------------------------------------------
  // 6️⃣ Mantis POST /ota/CancelSeats -> Backend POST /api/v1/cancellations/:id or direct
  // ----------------------------------------------------
  cancelBooking: async (bookingId, { seatNos, reason } = {}) => {
    if (!bookingId) return null;

    try {
      const payload = {
        seatNos: Array.isArray(seatNos) ? seatNos : [seatNos || "1"],
        reason: reason || "User requested cancellation",
      };
      const response = await api.post(`/api/v1/cancellations/${bookingId}`, payload);
      const result = response.data?.data || response.data;
      console.log("[CancelBooking Response]", result);
      return result;
    } catch (err) {
      const errorMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message;
      console.error("[CancelBooking Error]", errorMsg);
      throw new Error(errorMsg || "Failed to cancel booking with provider");
    }
  },

  cancelSeatsDirect: async ({ ticketNo, seatNos, pnr }) => {
    try {
      const response = await api.post(`/api/v1/cancellations/cancelseats`, {
        TicketNo: String(ticketNo),
        SeatNos: Array.isArray(seatNos) ? seatNos.join(",") : String(seatNos),
        PNR: pnr ? String(pnr) : undefined,
      });
      return response.data?.data || response.data;
    } catch (err) {
      const errorMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message;
      console.error("[CancelSeats Direct Error]", errorMsg);
      throw new Error(errorMsg || "Failed to cancel seats directly with provider");
    }
  },

  // ----------------------------------------------------
  // 7️⃣ Ticket & GDS Booking Details
  // ----------------------------------------------------
  getGdsBookingDetails: async ({ pnr, ticketNo }) => {
    try {
      const response = await api.get("/api/v1/tickets/gds-details", {
        params: {
          PNR: String(pnr),
          TicketNo: String(ticketNo),
        },
      });
      return response.data?.data || response.data;
    } catch (err) {
      const errorMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message;
      console.warn("[GDS BookingDetails Error]", errorMsg);
      throw new Error(errorMsg || "Failed to retrieve provider booking details");
    }
  },

  getTicketByNumber: async (ticketNumber) => {
    try {
      const response = await api.get(`/api/v1/tickets/number/${ticketNumber}`);
      return response.data?.data;
    } catch (err) {
      console.warn("Failed to get ticket by number:", err.message);
      return null;
    }
  },

  getTicketByBookingId: async (bookingId) => {
    try {
      const response = await api.get(`/api/v1/tickets/booking/${bookingId}`);
      return response.data?.data;
    } catch (err) {
      console.warn("Failed to get ticket by bookingId:", err.message);
      return null;
    }
  },

  // ----------------------------------------------------
  // Local Guest Storage
  // ----------------------------------------------------
  saveGuestBooking: (booking) => {
    try {
      if (!booking) return [];
      const existing = bookingService.getGuestBookings();
      const targetId = String(
        booking.id ||
        booking.bookingId ||
        booking.bookingReference ||
        booking.bookingNumber ||
        ""
      );
      const targetPnr = String(booking.pnr || booking.pnrNumber || "");

      const filtered = existing.filter((b) => {
        const bId = String(b.id || b.bookingId || b.bookingReference || b.bookingNumber || "");
        const bPnr = String(b.pnr || b.pnrNumber || "");
        if (targetId && bId && targetId === bId) return false;
        if (targetPnr && bPnr && targetPnr === bPnr) return false;
        return true;
      });

      const updated = [
        {
          ...booking,
          id: targetId || booking.id,
          bookingId: targetId || booking.bookingId,
          bookingReference: booking.bookingReference || booking.bookingNumber || targetId,
          bookingNumber: booking.bookingNumber || booking.bookingReference || targetId,
          isGuest: booking.isGuest !== undefined ? Boolean(booking.isGuest) : false,
          bookedAt: booking.bookedAt || booking.bookingDate || new Date().toISOString(),
        },
        ...filtered,
      ];
      localStorage.setItem(GUEST_BOOKINGS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("guestBookingsChanged"));
      return updated;
    } catch (e) {
      console.warn("Could not save guest booking to localStorage:", e);
      return [];
    }
  },

  getGuestBookings: () => {
    try {
      const data = localStorage.getItem(GUEST_BOOKINGS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  getGuestBookingById: (bookingId) => {
    if (!bookingId) return null;
    const list = bookingService.getGuestBookings();
    const target = String(bookingId);
    return (
      list.find((b) => {
        const bId = String(b.id || b.bookingId || b.bookingReference || b.bookingNumber || "");
        const bPnr = String(b.pnr || b.pnrNumber || "");
        return bId === target || bPnr === target;
      }) || null
    );
  },

  clearGuestBookings: () => {
    localStorage.removeItem(GUEST_BOOKINGS_KEY);
    window.dispatchEvent(new Event("guestBookingsChanged"));
  },
};

export default bookingService;
