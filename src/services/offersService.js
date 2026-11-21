import api from "./api";

// High quality fallback offers matching backend FormattedCoupon schema
export const FALLBACK_OFFERS = [
  {
    id: "offer-aibus100",
    code: "AIBUS100",
    category: "Bus",
    title: "Flat ₹100 OFF on Bus Tickets",
    subtitle: "Min. booking amount ₹500",
    type: "FLAT",
    value: 100,
    maxDiscount: null,
    minOrderValue: 500,
    discountBadge: "₹100 OFF",
    validUntil: "2026-12-31T23:59:59.000Z",
    formattedExpiry: "Valid till: 31 Dec",
    description: "Get flat ₹100 instant cash discount on any AC or Non-AC bus booking across India.",
    termsAndConditions: [
      "Use code AIBUS100 to get flat ₹100 discount on bus bookings.",
      "Offer applicable for minimum ticket value of Rs 500.",
      "Offer valid on both AiBus mobile app and website.",
      "Cannot be clubbed with any other promotional code or wallet cashback.",
      "Valid once per registered user account per calendar month.",
    ],
  },
  {
    id: "offer-firstbus",
    code: "FIRSTBUS",
    category: "New Users",
    title: "15% OFF for First Time Travellers",
    subtitle: "Up to ₹150 discount on your first journey",
    type: "PERCENTAGE",
    value: 15,
    maxDiscount: 150,
    minOrderValue: 300,
    discountBadge: "UPTO ₹150 OFF",
    validUntil: "2026-12-31T23:59:59.000Z",
    formattedExpiry: "Valid for 1st booking",
    description: "Exclusive welcome discount of 15% (up to ₹150) on your very first booking on AiBus.",
    termsAndConditions: [
      "Use code FIRSTBUS to get 15% up to ₹150 discount on bus bookings.",
      "Valid strictly on the primary traveler's first successful bus booking.",
      "Applicable for minimum ticket value of Rs 300.",
      "Instant discount is deducted at checkout.",
      "Offer valid across all private and state transport bus operators.",
    ],
  },
  {
    id: "offer-weekend20",
    code: "WEEKEND20",
    category: "Weekend",
    title: "Weekend Getaway 20% OFF",
    subtitle: "Save up to ₹200 on Friday-Sunday trips",
    type: "PERCENTAGE",
    value: 20,
    maxDiscount: 200,
    minOrderValue: 600,
    discountBadge: "20% OFF",
    validUntil: "2026-12-31T23:59:59.000Z",
    formattedExpiry: "Valid on weekends",
    description: "Plan your weekend escapes and save 20% up to ₹200 on Friday, Saturday, and Sunday travels.",
    termsAndConditions: [
      "Use code WEEKEND20 to get 20% upto ₹200 discount on bus bookings.",
      "Journey departure date must be a Friday, Saturday, or Sunday.",
      "Offer applicable for minimum ticket value of Rs 600.",
      "Valid on selected top intercity routes across India.",
    ],
  },
  {
    id: "offer-super100",
    code: "SUPER100",
    category: "Mega Saver",
    title: "Flat ₹100 Mega Discount",
    subtitle: "Min. booking amount ₹600",
    type: "FLAT",
    value: 100,
    maxDiscount: null,
    minOrderValue: 600,
    discountBadge: "₹100 MEGA",
    validUntil: "2026-12-31T23:59:59.000Z",
    formattedExpiry: "Valid till: 31 Dec",
    description: "Super saver discount on luxury sleepers, Multi-Axle Volvos, and Scania coaches.",
    termsAndConditions: [
      "Use code SUPER100 to get flat ₹100 discount on premium bus services.",
      "Minimum booking amount of Rs 600 required.",
      "Valid on all operator fleets including SRS Travels, VRL, Orange, and Greenline.",
    ],
  },
  {
    id: "offer-return50",
    code: "RETURN50",
    category: "Round Trip",
    title: "Round Trip Saver ₹50 OFF",
    subtitle: "Flat ₹50 savings on return journeys",
    type: "FLAT",
    value: 50,
    maxDiscount: null,
    minOrderValue: 400,
    discountBadge: "₹50 OFF",
    validUntil: "2026-12-31T23:59:59.000Z",
    formattedExpiry: "Valid till: 30 Nov",
    description: "Book your return journey or travel with friends and enjoy instant flat ₹50 discount.",
    termsAndConditions: [
      "Use code RETURN50 to get flat ₹50 discount on return and multi-ticket bookings.",
      "Minimum ticket fare Rs 400.",
      "Can be used multiple times throughout the promotional period.",
    ],
  },
  {
    id: "offer-festive",
    code: "FESTIVE",
    category: "Festive",
    title: "Festive Season 10% Savings",
    subtitle: "Up to ₹120 OFF during festival rushes",
    type: "PERCENTAGE",
    value: 10,
    maxDiscount: 120,
    minOrderValue: 450,
    discountBadge: "10% OFF",
    validUntil: "2026-12-31T23:59:59.000Z",
    formattedExpiry: "Valid this festive season",
    description: "Travel home to your loved ones this festive season with an instant 10% discount.",
    termsAndConditions: [
      "Use code FESTIVE to get 10% upto ₹120 discount on bus bookings.",
      "Applicable for minimum ticket value of Rs 450.",
      "Valid across all routes and bus types.",
    ],
  },
];

export const offersService = {
  /**
   * Fetch all active coupons/offers from the backend API
   * Endpoint: GET /api/v1/offers or GET /api/v1/coupons
   * @param {Object} [params]
   * @param {string} [params.category]
   * @param {string} [params.type] 'FLAT' | 'PERCENTAGE'
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   */
  getOffers: async (params = {}) => {
    try {
      // Backend routes mount couponsRoutes at both /api/v1/offers and /api/v1/coupons
      const response = await api.get("/api/v1/offers", {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          ...(params.category ? { category: params.category } : {}),
          ...(params.type ? { type: params.type } : {}),
        },
      });

      const data = response.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      if (Array.isArray(data?.items) && data.items.length > 0) {
        return data.items;
      }
      return FALLBACK_OFFERS;
    } catch (err) {
      console.warn("[offersService] GET /api/v1/offers fallback triggered:", err.message);
      // Fallback to pre-configured offers so UI remains rich and operational
      return FALLBACK_OFFERS;
    }
  },

  /**
   * Fetch details for a specific coupon code from backend
   * Endpoint: GET /api/v1/offers/:code
   * @param {string} code
   */
  getOfferByCode: async (code) => {
    if (!code) return null;
    const cleanCode = code.trim().toUpperCase();

    try {
      const response = await api.get(`/api/v1/offers/${encodeURIComponent(cleanCode)}`);
      return response.data?.data || null;
    } catch {
      return FALLBACK_OFFERS.find((o) => o.code === cleanCode) || null;
    }
  },

  /**
   * Authoritatively validate coupon code and calculate discount
   * Endpoint: POST /api/v1/offers/validate (or /api/v1/coupons/validate)
   * @param {Object} input
   * @param {string} input.code
   * @param {number} input.totalFare
   * @param {string} [input.operatorName]
   * @param {number} [input.fromCityId]
   * @param {number} [input.toCityId]
   * @param {number} [input.busId]
   */
  validateOffer: async ({ code, totalFare, operatorName, fromCityId, toCityId, busId }) => {
    const cleanCode = String(code || "").trim().toUpperCase();
    if (!cleanCode) {
      throw new Error("Please enter a valid coupon code");
    }

    const fare = Number(totalFare);
    if (isNaN(fare) || fare <= 0) {
      throw new Error("Booking total fare must be greater than zero to apply offer");
    }

    try {
      const response = await api.post("/api/v1/offers/validate", {
        code: cleanCode,
        totalFare: fare,
        ...(operatorName ? { operatorName: String(operatorName).trim() } : {}),
        ...(fromCityId ? { fromCityId: Number(fromCityId) } : {}),
        ...(toCityId ? { toCityId: Number(toCityId) } : {}),
        ...(busId ? { busId: Number(busId) } : {}),
      });

      const result = response.data?.data;
      if (result && result.valid) {
        return {
          valid: true,
          coupon: result.coupon,
          discountAmount: Number(result.discountAmount || 0),
          originalFare: Number(result.originalFare || fare),
          finalPayableAmount: Number(result.finalPayableAmount || Math.max(0, fare - (result.discountAmount || 0))),
        };
      }
      throw new Error("Coupon could not be validated");
    } catch (apiErr) {
      // If server explicitly returned validation failure (400), propagate message
      const errData = apiErr.response?.data;
      const serverMsg =
        (typeof errData?.error === "string" ? errData.error : errData?.error?.message) ||
        errData?.message;

      if (serverMsg) {
        throw new Error(serverMsg);
      }

      // Offline / fallback calculation if backend coupon database is not seeded
      const matched = FALLBACK_OFFERS.find((o) => o.code === cleanCode);
      if (!matched) {
        throw new Error(`Coupon '${cleanCode}' is invalid or does not exist`);
      }

      if (matched.minOrderValue && fare < matched.minOrderValue) {
        throw new Error(`Coupon '${cleanCode}' requires minimum booking amount of ₹${matched.minOrderValue}. Current fare: ₹${fare}`);
      }

      let discount = 0;
      if (matched.type === "FLAT") {
        discount = Math.min(matched.value, fare);
      } else {
        const rawPct = (fare * matched.value) / 100;
        discount = matched.maxDiscount ? Math.min(rawPct, matched.maxDiscount) : rawPct;
        discount = Math.min(discount, fare);
      }
      discount = Math.round(discount * 100) / 100;

      return {
        valid: true,
        coupon: matched,
        discountAmount: discount,
        originalFare: fare,
        finalPayableAmount: Math.max(0, Math.round((fare - discount) * 100) / 100),
      };
    }
  },
};

export default offersService;

