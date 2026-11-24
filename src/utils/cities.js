export const COMMON_CITY_ID_MAP = {
  "4292": "Bengaluru",
  "4562": "Chennai",
  "6772": "Pune",
  "4492": "Pune",
  "19": "Pune",
  "18": "Mumbai",
  "4300": "Mumbai",
  "23": "Hyderabad",
  "4120": "Hyderabad",
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
  "20": "Nagpur",
  "21": "Nashik",
  "22": "Goa",
  "24": "Vijayawada",
  "25": "Visakhapatnam",
  "26": "Kochi",
  "27": "Trivandrum",
  "28": "Coimbatore",
  "29": "Madurai",
  "30": "Mysuru",
  "31": "Mangalore",
  "32": "Hubli",
  "33": "Belgaum",
  "34": "Kolhapur",
  "35": "Solapur",
  "36": "Aurangabad",
  "37": "Udaipur",
  "38": "Jodhpur",
  "39": "Bhopal",
  "40": "Indore",
};

/**
 * Resolves a city name cleanly, ensuring that pure numeric IDs (e.g. "4292", "4562")
 * are never rendered directly in the UI.
 */
export function resolveCityDisplayName(value, fallbackName, fallbackId) {
  // If value is a non-empty string and not purely numeric, it's already a valid city name
  if (value && typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed && isNaN(Number(trimmed))) {
      return trimmed;
    }
  }

  // If fallbackName is non-empty and not numeric
  if (fallbackName && typeof fallbackName === "string") {
    const trimmedFallback = fallbackName.trim();
    if (trimmedFallback && isNaN(Number(trimmedFallback))) {
      return trimmedFallback;
    }
  }

  // Look up numeric ID in COMMON_CITY_ID_MAP
  const idStr = String(value || fallbackId || fallbackName || "").trim();
  if (idStr && COMMON_CITY_ID_MAP[idStr]) {
    return COMMON_CITY_ID_MAP[idStr];
  }

  // Final fallback: if fallbackName is valid text, return it
  if (fallbackName && typeof fallbackName === "string" && isNaN(Number(fallbackName.trim()))) {
    return fallbackName.trim();
  }
  return "City";
}

const cities = [
  "Mumbai",
  "Pune",
  "Nashik",
  "Nagpur",
  "Aurangabad",
  "Goa",
  "Bengaluru",
  "Hyderabad",
  "Ahmedabad",
  "Surat",
  "Indore",
  "Bhopal",
  "Delhi",
  "Jaipur",
  "Chandigarh",
];

export default cities;
