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
    gender: p.gender || "Male",
    mobile: p.mobile || b.contactPhone || "",
    fare: p.fare || 0,
  }));

  const primaryPassenger = passengers[0] || {};
  const seatsList = b.selectedSeats || passengers.map((p) => p.seat);

  return {
    id: b.id || b.bookingReference,
    bookingId: b.id || b.bookingReference,
    bookingReference: b.bookingReference || b.bookingNumber || b.id,
    pnr: b.providerPnrNo || b.pnrNumber || b.pnr || b.bookingReference,
    ticketNumber: b.providerTicketNo || b.ticketNumber || b.ticketNo || b.bookingReference,
    userMobile: b.contactPhone || b.user?.mobile || primaryPassenger.mobile || "",
    contactEmail: b.contactEmail || "customer@aibus.in",
    contactPhone: b.contactPhone || primaryPassenger.mobile || "",
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
    contactInfo,
    passengers,
  }) => {
    try {
      const response = await api.post("/api/v1/holds", {
        fromCityId: Number(fromCityId || 4292),
        toCityId: Number(toCityId || 4562),
        journeyDate: String(journeyDate || new Date().toISOString().split("T")[0]).split("T")[0],
        busId: Number(busId || 1),
        pickupId: String(pickupId || "44953"),
        dropoffId: String(dropoffId || "750"),
        contactInfo: {
          customerName: contactInfo.customerName || "Traveller",
          email: contactInfo.email || "traveller@aibus.in",
          phone: String(contactInfo.phone || "9876543210"),
          mobile: String(contactInfo.mobile || contactInfo.phone || "9876543210"),
        },
        passengers: passengers.map((p, idx) => ({
          seatNo: String(p.seat || p.seatNo || `S${idx + 1}`),
          seatTypeId: Number(p.seatTypeId || 1),
          fare: Number(p.fare || 650),
          gender: p.gender === "Female" || p.gender === "F" ? "F" : "M",
          age: Number(p.age || 25),
          name: p.name || `Passenger ${idx + 1}`,
          isAcSeat: Boolean(p.isAcSeat),
        })),
      });
      const holdData = response.data?.data || response.data;
      console.log("[HoldSeats Live Response]", holdData);
      return holdData;
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.response?.data?.message || err.message;
      console.error("[HoldSeats Error]", errorMsg);
      throw new Error(errorMsg || "Failed to hold seats with GDS provider");
    }
  },

  // ----------------------------------------------------
  // 2️⃣ Mantis POST /ota/BookSeats -> Backend POST /api/v1/bookings
  // ----------------------------------------------------
  createBooking: async ({
    bus,
    travellers,
    seats,
    totalAmount,
    userMobile,
    userId,
    isGuest = false,
    fromId,
    toId,
    holdId,
    pickup,
    dropoff,
  }) => {
    const passengersList = (travellers || []).map((t, idx) => ({
      seatNo: String(t.seat || seats[idx] || "A1"),
      seatTypeId: 1,
      fare: Number(bus.price || 650),
      gender: t.gender === "Female" || t.gender === "F" ? "F" : "M",
      age: parseInt(t.age, 10) || 25,
      name: t.name || `Passenger ${idx + 1}`,
      isAcSeat: Boolean(bus.busType?.toLowerCase().includes("ac")),
    }));

    const primaryName = travellers?.[0]?.name || "Passenger";
    const primaryPhone = userMobile || travellers?.[0]?.mobile || "9876543210";
    const primaryEmail = "booking@aibus.in";
    const cleanDate = String(bus.date || new Date().toISOString().split("T")[0]).split("T")[0];

    const resolvedPickupCode = String(
      pickup?.PickupCode ||
      pickup?.PickUpID ||
      pickup?.pickupId ||
      pickup?.Id ||
      (Number(bus.busId || bus.id) === 2 ? "74717" : "39436")
    );

    const resolvedDropoffCode = String(
      dropoff?.DropoffCode ||
      dropoff?.DropOffID ||
      dropoff?.dropoffId ||
      dropoff?.Id ||
      (Number(bus.busId || bus.id) === 2 ? "746" : "750")
    );

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
      pickupLocation: pickup?.PickupName || pickup?.name || pickup?.location || "Boarding Point",
      pickupTime: pickup?.PickupTime || `${cleanDate} 23:00:00`,
      dropoffCode: resolvedDropoffCode,
      dropoffLocation: dropoff?.DropoffName || dropoff?.name || dropoff?.location || "Dropping Point",
      dropoffTime: dropoff?.DropoffTime || `${cleanDate} 09:15:00`,
      operatorName: bus.operator || "Express Line",
      busType: bus.busType || "AC Seater/Sleeper",
      totalFare: Number(totalAmount || bus.price * seats.length || 105),
      baseFare: Number(bus.price * seats.length || totalAmount || 105),
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
      pnr: createdBooking?.providerPnrNo || createdBooking?.pnrNumber || `PNR-${Math.floor(100000 + Math.random() * 900000)}`,
      ticketNumber: createdBooking?.providerTicketNo || createdBooking?.ticketNumber || `TKT-${Math.floor(100000 + Math.random() * 900000)}`,
      totalAmount: Number(createdBooking?.totalFare || createdBooking?.totalAmount || totalAmount),
      status: createdBooking?.status || "Confirmed",
      seats: createdBooking?.selectedSeats || seats,
      passengers: createdBooking.passengers || passengersList,
      travellers: passengersList,
      traveller: { name: primaryName, mobile: primaryPhone },
      userMobile: primaryPhone,
      bus: {
        id: bus.id,
        operator: bus.operator || "AIBus Travels",
        busNumber: bus.busNumber || "AI001",
        busType: formatBusType(bus.busType),
        from: bus.from || "Bengaluru",
        to: bus.to || "Chennai",
        departureTime: bus.departureTime || "08:30",
        arrivalTime: bus.arrivalTime || "14:30",
        duration: bus.duration || "6h 00m",
        date: cleanDate,
      },
      bookingDate: new Date().toISOString(),
      isGuest,
    };

    if (isGuest || !userId) {
      bookingService.saveGuestBooking(fullBookingData);
    }

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
      if (data) return mapBackendBooking(data);
    } catch (err) {
      console.warn("Checking guest storage for booking:", err.message);
    }

    return bookingService.getGuestBookingById(bookingReference);
  },

  // ----------------------------------------------------
  // 4️⃣ User Bookings List
  // ----------------------------------------------------
  getMyBookings: async () => {
    try {
      const response = await api.get("/api/v1/bookings/my-bookings");
      const list = response.data?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        return list.map(mapBackendBooking);
      }
    } catch {
      // Fallback
    }

    const guestList = bookingService.getGuestBookings();
    return guestList;
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
      const existing = bookingService.getGuestBookings();
      const bookingId = booking.bookingId || booking.bookingReference;
      const filtered = existing.filter(
        (b) => (b.bookingId || b.bookingReference) !== bookingId
      );
      const updated = [
        { ...booking, isGuest: true, bookedAt: new Date().toISOString() },
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
    const list = bookingService.getGuestBookings();
    return (
      list.find((b) => (b.bookingId || b.bookingReference) === bookingId) || null
    );
  },

  clearGuestBookings: () => {
    localStorage.removeItem(GUEST_BOOKINGS_KEY);
    window.dispatchEvent(new Event("guestBookingsChanged"));
  },
};

export default bookingService;
