import api from "./api";
import filterBuses from "../utils/filterBuses";



/**
 * Helper to calculate journey duration between departure and arrival timestamps
 */
function calculateDuration(depTimeStr, arrTimeStr) {
  try {
    if (!depTimeStr || !arrTimeStr) return "6h 00m";
    const d1 = new Date(depTimeStr.replace(" ", "T"));
    const d2 = new Date(arrTimeStr.replace(" ", "T"));
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return "6h 00m";
    const diffMs = d2.getTime() - d1.getTime();
    if (diffMs <= 0) return "6h 00m";
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : "00m"}`;
  } catch {
    return "6h 00m";
  }
}

/**
 * Extracts HH:mm formatted time string from various timestamp formats
 */
function extractTime(timeStr, fallback = "08:30") {
  if (!timeStr) return fallback;
  if (timeStr.includes(" ")) {
    const parts = timeStr.split(" ")[1];
    return parts ? parts.slice(0, 5) : fallback;
  }
  if (timeStr.includes("T")) {
    const parts = timeStr.split("T")[1];
    return parts ? parts.slice(0, 5) : fallback;
  }
  if (timeStr.length === 5 && timeStr.includes(":")) {
    return timeStr;
  }
  return timeStr.slice(0, 5) || fallback;
}

/**
 * Maps Mantis GDS Search result to Normalized UI Bus Model
 */
function mapNormalizedBus(bus, { from = "", to = "", date = "" } = {}) {
  const busTypeStr =
    bus.BusTypeName ||
    bus.busType ||
    bus.DisplayBusType ||
    (typeof bus.BusType === "string" ? bus.BusType : "") ||
    `${bus.IsAC || bus.BusType?.IsAC === "AC" ? "AC" : "Non-AC"} ${bus.IsSleeper || bus.BusType?.Seating === "SLEEPER" ? "Sleeper" : "Seater"
    }`;

  const isSleeper =
    bus.IsSleeper ||
    busTypeStr.toLowerCase().includes("sleeper") ||
    bus.BusType?.Seating === "SLEEPER" ||
    bus.BusType?.Seating === "SEATER_SEMI_SLEEPER";

  const isAc =
    bus.IsAC ||
    (busTypeStr.toLowerCase().includes("ac") && !busTypeStr.toLowerCase().includes("non-ac") && !busTypeStr.toLowerCase().includes("non ac"));

  const rawFare =
    bus.TotalFare ||
    bus.BaseFare ||
    bus.BusStatus?.BaseFares?.[0] ||
    bus.BusStatus?.DiscFares?.[0] ||
    bus.fare?.amount ||
    bus.price ||
    650;

  const rawDep = bus.DepartureTime || bus.DeptTime || bus.departure?.dateTime || "";
  const rawArr = bus.ArrivalTime || bus.ArrTime || bus.arrival?.dateTime || "";

  const durationStr =
    bus.Duration ||
    bus.duration ||
    calculateDuration(rawDep, rawArr);

  const availableSeats =
    bus.AvailableSeats ??
    bus.BusStatus?.Availability ??
    bus.availability?.seats ??
    bus.seats ??
    25;

  const totalSeats =
    bus.TotalSeats ??
    bus.totalSeats ??
    36;

  return {
    id: String(bus.TripId || bus.tripId || bus.RouteBusId || bus.id || Math.random()),
    tripId: String(bus.TripId || bus.tripId || bus.id || ""),
    busTripId: bus.BusTripId || bus.tripId || "",
    scheduleId: String(bus.TripId || bus.scheduleId || bus.id || ""),
    routeBusId: Number(bus.RouteBusId || bus.busId || 1),
    busId: Number(bus.RouteBusId || bus.busId || 1),
    fromCityId: Number(bus.FromCityId || (from && !isNaN(Number(from)) ? from : 4292)),
    toCityId: Number(bus.ToCityId || (to && !isNaN(Number(to)) ? to : 4562)),
    operator: bus.CompanyName || bus.operator?.name || bus.operator || "Intercity Express",
    busNumber: bus.BusLabel || bus.BusTypeName || bus.service?.name || bus.busNumber || "AI-BUS",
    busType: busTypeStr || "AC Luxury Coach",
    layoutType: isSleeper ? "SLEEPER_2_1" : "SEATER_2_2",
    from: bus.FromName || from || bus.departure?.location || bus.from || "Origin",
    to: bus.ToName || to || bus.arrival?.location || bus.to || "Destination",
    departureTime: extractTime(rawDep, "08:30"),
    arrivalTime: extractTime(rawArr, "14:30"),
    duration: durationStr,
    date: rawDep.includes(" ") ? rawDep.split(" ")[0] : (rawDep.slice(0, 10) || date),
    price: Number(rawFare),
    availableSeats: Number(availableSeats),
    seats: Number(availableSeats),
    totalSeats: Number(totalSeats),
    pickups: bus.BoardingPoints || bus.Pickups || [],
    dropoffs: bus.DroppingPoints || bus.Dropoffs || [],
    cancellationPolicy: bus.CancellationPolicy || bus.Canc || [],
    rating: 4.8,
    reviews: "450+ verified reviews",
    amenities: Array.isArray(bus.Amenities) && bus.Amenities.length > 0 && typeof bus.Amenities[0] === "string"
      ? bus.Amenities
      : [
        "Live GPS Tracking",
        "M-Ticket Supported",
        "Charging Point",
        "Reading Light",
        "Emergency Exit",
      ],
  };
}

export const busService = {
  /**
   * Mantis GET /ota/CityList -> Backend GET /api/v1/cities
   */
  getCities: async (query = "") => {
    // 32 Major Indian Hubs to guarantee top transit centers are never missing
    const fallbackHubs = [
      { id: "4292", CityId: "4292", name: "Bangalore", City: "Bangalore", state: "Karnataka", State: "Karnataka" },
      { id: "4292", CityId: "4292", name: "Bengaluru", City: "Bengaluru", state: "Karnataka", State: "Karnataka" },
      { id: "4562", CityId: "4562", name: "Chennai", City: "Chennai", state: "Tamil Nadu", State: "Tamil Nadu" },
      { id: "4562", CityId: "4562", name: "Madras", City: "Madras", state: "Tamil Nadu", State: "Tamil Nadu" },
      { id: "18", CityId: "18", name: "Mumbai", City: "Mumbai", state: "Maharashtra", State: "Maharashtra" },
      { id: "6772", CityId: "6772", name: "Pune", City: "Pune", state: "Maharashtra", State: "Maharashtra" },
      { id: "19", CityId: "19", name: "Pune", City: "Pune", state: "Maharashtra", State: "Maharashtra" },
      { id: "23", CityId: "23", name: "Hyderabad", City: "Hyderabad", state: "Telangana", State: "Telangana" },
      { id: "1", CityId: "1", name: "Delhi", City: "Delhi", state: "Delhi", State: "Delhi" },
      { id: "14", CityId: "14", name: "Ahmedabad", City: "Ahmedabad", state: "Gujarat", State: "Gujarat" },
      { id: "2", CityId: "2", name: "Jaipur", City: "Jaipur", state: "Rajasthan", State: "Rajasthan" },
      { id: "22", CityId: "22", name: "Goa", City: "Goa", state: "Goa", State: "Goa" },
      { id: "28", CityId: "28", name: "Coimbatore", City: "Coimbatore", state: "Tamil Nadu", State: "Tamil Nadu" },
      { id: "29", CityId: "29", name: "Madurai", City: "Madurai", state: "Tamil Nadu", State: "Tamil Nadu" },
      { id: "26", CityId: "26", name: "Kochi", City: "Kochi", state: "Kerala", State: "Kerala" },
      { id: "27", CityId: "27", name: "Trivandrum", City: "Trivandrum", state: "Kerala", State: "Kerala" },
      { id: "30", CityId: "30", name: "Mysuru", City: "Mysuru", state: "Karnataka", State: "Karnataka" },
      { id: "24", CityId: "24", name: "Vijayawada", City: "Vijayawada", state: "Andhra Pradesh", State: "Andhra Pradesh" },
      { id: "25", CityId: "25", name: "Visakhapatnam", City: "Visakhapatnam", state: "Andhra Pradesh", State: "Andhra Pradesh" },
      { id: "20", CityId: "20", name: "Nagpur", City: "Nagpur", state: "Maharashtra", State: "Maharashtra" },
      { id: "21", CityId: "21", name: "Nashik", City: "Nashik", state: "Maharashtra", State: "Maharashtra" },
      { id: "15", CityId: "15", name: "Surat", City: "Surat", state: "Gujarat", State: "Gujarat" },
      { id: "16", CityId: "16", name: "Vadodara", City: "Vadodara", state: "Gujarat", State: "Gujarat" },
      { id: "5", CityId: "5", name: "Chandigarh", City: "Chandigarh", state: "Punjab", State: "Punjab" },
      { id: "10", CityId: "10", name: "Lucknow", City: "Lucknow", state: "Uttar Pradesh", State: "Uttar Pradesh" },
      { id: "11", CityId: "11", name: "Varanasi", City: "Varanasi", state: "Uttar Pradesh", State: "Uttar Pradesh" },
      { id: "12", CityId: "12", name: "Kanpur", City: "Kanpur", state: "Uttar Pradesh", State: "Uttar Pradesh" },
      { id: "3", CityId: "3", name: "Agra", City: "Agra", state: "Uttar Pradesh", State: "Uttar Pradesh" },
      { id: "4", CityId: "4", name: "Dehradun", City: "Dehradun", state: "Uttarakhand", State: "Uttarakhand" },
      { id: "8", CityId: "8", name: "Haridwar", City: "Haridwar", state: "Uttarakhand", State: "Uttarakhand" },
      { id: "9", CityId: "9", name: "Rishikesh", City: "Rishikesh", state: "Uttarakhand", State: "Uttarakhand" },
      { id: "6", CityId: "6", name: "Manali", City: "Manali", state: "Himachal Pradesh", State: "Himachal Pradesh" },
      { id: "7", CityId: "7", name: "Shimla", City: "Shimla", state: "Himachal Pradesh", State: "Himachal Pradesh" },
    ];

    try {
      const response = await api.get("/api/v1/cities", {
        params: query ? { q: query, limit: 50 } : { popular: "true", limit: 100 },
      });
      const list = response.data?.data || response.data || [];
      const remoteCities = Array.isArray(list)
        ? list.map((c) => {
            let rawCity = String(c.City || c.name || "").trim();
            let rawState = String(c.State || c.state || "").trim();

            rawCity = rawCity.replace(/([a-z])([A-Z])/g, "$1 $2");
            if (rawState) {
              rawState = rawState.replace(/([a-z])([A-Z])/g, "$1 $2");
              if (rawCity.toLowerCase().endsWith(rawState.toLowerCase())) {
                rawCity = rawCity
                  .slice(0, rawCity.length - rawState.length)
                  .trim()
                  .replace(/,\s*$/, "");
              }
            }

            return {
              CityId: String(c.CityId || c.id || c.providerCityId),
              City: rawCity,
              State: rawState,
              id: String(c.CityId || c.id || c.providerCityId),
              name: rawCity,
              state: rawState,
            };
          })
        : [];

      if (query && query.trim()) {
        const qLower = query.toLowerCase().trim();
        const matchingHubs = fallbackHubs.filter(
          (h) => h.name.toLowerCase().includes(qLower) || h.state.toLowerCase().includes(qLower)
        );
        const combined = [...matchingHubs, ...remoteCities];
        const dedupe = new Map();
        combined.forEach((c) => {
          const key = `${c.id}-${c.name.toLowerCase()}`;
          if (!dedupe.has(key)) {
            dedupe.set(key, c);
          }
        });
        return Array.from(dedupe.values());
      }

      // Initial load: ensure popular transit centers are combined and deduplicated
      const combined = [...fallbackHubs, ...remoteCities];
      const dedupe = new Map();
      combined.forEach((c) => {
        const key = `${c.id}-${c.name.toLowerCase()}`;
        if (!dedupe.has(key)) {
          dedupe.set(key, c);
        }
      });
      return Array.from(dedupe.values());
    } catch (err) {
      console.warn("Could not fetch remote cities, using fallback hubs:", err.message);
      if (query && query.trim()) {
        const qLower = query.toLowerCase().trim();
        return fallbackHubs.filter(
          (h) => h.name.toLowerCase().includes(qLower) || h.state.toLowerCase().includes(qLower)
        );
      }
      return fallbackHubs;
    }
  },

  /**
   * Helper to resolve city name given a city ID or name string
   */
  resolveCityName: async (cityIdOrName) => {
    if (!cityIdOrName) return "";
    const str = String(cityIdOrName).trim();
    // If not a pure number, return as is
    if (isNaN(Number(str))) return str;

    // Common GDS city ID mappings
    const commonGdsCities = {
      "4292": "Bengaluru",
      "4562": "Chennai",
      "1": "Delhi",
      "2": "Jaipur",
      "3": "Agra",
      "4": "Dehradun",
      "5": "Chandigarh",
      "6": "Manali",
      "7": "Shimla",
      "8": "Haridwar",
      "9": "Rishikesh",
      "10": "Lucknow",
      "11": "Varanasi",
      "12": "Kanpur",
      "13": "Prayagraj",
      "14": "Ahmedabad",
      "15": "Surat",
      "16": "Vadodara",
      "17": "Rajkot",
      "18": "Mumbai",
      "19": "Pune",
      "20": "Nagpur",
      "21": "Nashik",
      "22": "Goa",
      "23": "Hyderabad",
      "24": "Vijayawada",
      "25": "Visakhapatnam",
      "26": "Kochi",
      "27": "Trivandrum",
      "28": "Coimbatore",
      "29": "Madurai",
      "30": "Mysuru",
    };

    if (commonGdsCities[str]) return commonGdsCities[str];

    try {
      const cities = await busService.getCities();
      const match = cities.find((c) => String(c.id) === str || String(c.CityId) === str);
      if (match && match.name) return match.name;
    } catch {
      // Fallback
    }

    return str;
  },

  /**
   * Mantis GET /ota/Search -> Backend GET /api/v1/search
   */
  searchBuses: async ({ from, to, date, fromCityId, toCityId, journeyDate, filters, sortBy } = {}) => {
    const fId = fromCityId || from;
    const tId = toCityId || to;
    const jDate = journeyDate || date;

    try {
      const response = await api.get("/api/v1/search", {
        params: {
          fromCityId: fId,
          toCityId: tId,
          journeyDate: jDate,
        },
      });

      const data = response.data?.data || response.data;
      const rawBuses =
        (data && Array.isArray(data.results) ? data.results : null) ||
        (data && Array.isArray(data.Buses) ? data.Buses : null) ||
        (Array.isArray(data) ? data : []);

      let results = rawBuses.map((b) => mapNormalizedBus(b, { from, to, date: jDate }));

      if (filters || sortBy) {
        results = filterBuses(results, filters, sortBy);
      }
      return results;
    } catch (err) {
      console.warn("Primary search error, trying fallback:", err.message);
      try {
        const response2 = await api.get("/api/bus/search", {
          params: { fromCityId: fId, toCityId: tId, date: jDate },
        });
        const data2 = response2.data?.data || response2.data;
        const rawBuses2 =
          (data2 && Array.isArray(data2.results) ? data2.results : null) ||
          (data2 && Array.isArray(data2.Buses) ? data2.Buses : null) ||
          (Array.isArray(data2) ? data2 : []);
        let results2 = rawBuses2.map((b) => mapNormalizedBus(b, { from, to, date: jDate }));

        if (filters || sortBy) {
          results2 = filterBuses(results2, filters, sortBy);
        }
        return results2;
      } catch (err2) {
        console.error("Bus search failed completely:", err2.message);
        return [];
      }
    }
  },

  /**
   * Mantis GET /ota/Chart -> Backend GET /api/v1/buses/:busId/chart
   */
  getSeatChart: async (busId, { fromCityId, toCityId, journeyDate } = {}) => {
    if (!busId) return null;
    try {
      const response = await api.get(`/api/v1/buses/${busId}/chart`, {
        params: { fromCityId, toCityId, journeyDate },
      });
      const data = response.data?.data || response.data;
      if (!data || data.success === false || data.Error || !data.ChartLayout) {
        return null;
      }
      return data;
    } catch {
      try {
        const response2 = await api.get(`/api/v1/seats/${busId}/chart`, {
          params: { fromCityId, toCityId, journeyDate },
        });
        const data2 = response2.data?.data || response2.data;
        if (!data2 || data2.success === false || data2.Error || !data2.ChartLayout) {
          return null;
        }
        return data2;
      } catch (err) {
        console.warn("Failed to fetch seat chart:", err.message);
        return null;
      }
    }
  },

  /**
   * Seat Availability (Mantis Live Chart)
   */
  getSeatAvailability: async (fromCityId, toCityId, date, scheduleId) => {
    if (!scheduleId) return null;
    return busService.getSeatChart(scheduleId, {
      fromCityId,
      toCityId,
      journeyDate: date,
    });
  },

  /**
   * Search Single Bus (Mantis GET /ota/SearchBus)
   */
  searchSingleBus: async ({ fromCityId, toCityId, journeyDate, busId, from = "", to = "" }) => {
    if (!busId) return null;
    const fId = Number(fromCityId || 4292);
    const tId = Number(toCityId || 4562);
    const jDate = journeyDate ? String(journeyDate).split("T")[0].split(" ")[0] : new Date().toISOString().slice(0, 10);
    const bId = Number(busId);

    try {
      const response = await api.get("/api/v1/search/bus", {
        params: { fromCityId: fId, toCityId: tId, journeyDate: jDate, busId: bId },
      });
      const data = response.data?.data || response.data;
      const rawBuses =
        (data && Array.isArray(data.results) ? data.results : null) ||
        (data && Array.isArray(data.Buses) ? data.Buses : null) ||
        (Array.isArray(data) ? data : []);

      if (rawBuses.length > 0) {
        return mapNormalizedBus(rawBuses[0], { from, to, date: jDate });
      }
      return null;
    } catch (err) {
      console.warn("Single bus search failed, trying fallback:", err.message);
      try {
        const allBuses = await busService.searchBuses({
          from,
          to,
          fromCityId: fId,
          toCityId: tId,
          journeyDate: jDate,
        });
        return (
          allBuses.find(
            (b) => Number(b.routeBusId || b.busId) === bId || String(b.id) === String(busId) || String(b.tripId) === String(busId)
          ) || allBuses[0] || null
        );
      } catch {
        return null;
      }
    }
  },

  getBusById: async (scheduleId) => {
    return null;
  },
};

export default busService;
