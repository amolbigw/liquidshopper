// ---------------------------------------------------------------------------
// Signal Layer -- Text / Voice Query Parser   (spec section 3.3)
// ---------------------------------------------------------------------------

import type { TextQueryResult } from "./types";
import type { BodyType, FuelType, VehicleCondition, UrgencyLevel } from "../intent/types";

// ---- dictionaries ----------------------------------------------------------

const CONDITION_MAP: Record<string, VehicleCondition> = {
  new: "new",
  brand_new: "new",
  "brand new": "new",
  used: "used",
  "pre-owned": "used",
  preowned: "used",
  "pre owned": "used",
  certified: "cpo",
  cpo: "cpo",
  "certified pre-owned": "cpo",
  "certified pre owned": "cpo",
};

const BODY_MAP: Record<string, BodyType> = {
  truck: "truck",
  trucks: "truck",
  pickup: "truck",
  "pickup truck": "truck",
  suv: "suv",
  suvs: "suv",
  sedan: "sedan",
  sedans: "sedan",
  coupe: "coupe",
  coupes: "coupe",
  van: "van",
  vans: "van",
  minivan: "van",
  convertible: "convertible",
  wagon: "wagon",
  hatchback: "hatchback",
  crossover: "crossover",
  "family car": "suv",
  "family vehicle": "suv",
  "something sporty": "coupe",
  sporty: "coupe",
};

/** Top 30+ makes. */
const MAKE_LIST: string[] = [
  "Ford", "Toyota", "Honda", "Chevrolet", "Ram", "Jeep", "Tesla",
  "BMW", "Mercedes-Benz", "Mercedes", "Audi", "Nissan", "Hyundai",
  "Kia", "Subaru", "Volkswagen", "Mazda", "Lexus", "Acura", "Infiniti",
  "Volvo", "Cadillac", "Lincoln", "Buick", "GMC", "Dodge", "Chrysler",
  "Genesis", "Porsche", "Jaguar", "Land Rover", "Mitsubishi", "Mini",
  "Alfa Romeo", "Maserati", "Rivian", "Lucid", "Polestar",
];

/** Lowercase make -> canonical name. */
const MAKE_MAP: Map<string, string> = new Map(
  MAKE_LIST.map((m) => [m.toLowerCase(), m]),
);
// Add common short forms
MAKE_MAP.set("chevy", "Chevrolet");
MAKE_MAP.set("merc", "Mercedes-Benz");
MAKE_MAP.set("benz", "Mercedes-Benz");
MAKE_MAP.set("vw", "Volkswagen");
MAKE_MAP.set("landrover", "Land Rover");
MAKE_MAP.set("land rover", "Land Rover");
MAKE_MAP.set("alfa", "Alfa Romeo");
MAKE_MAP.set("alfa romeo", "Alfa Romeo");

/** Top models per make (lowercase -> { make, model }). */
const MODEL_MAP: Map<string, { make: string; model: string }> = new Map([
  // Ford
  ["f-150", { make: "Ford", model: "F-150" }],
  ["f150", { make: "Ford", model: "F-150" }],
  ["f 150", { make: "Ford", model: "F-150" }],
  ["bronco", { make: "Ford", model: "Bronco" }],
  ["bronco sport", { make: "Ford", model: "Bronco Sport" }],
  ["explorer", { make: "Ford", model: "Explorer" }],
  ["escape", { make: "Ford", model: "Escape" }],
  ["mustang", { make: "Ford", model: "Mustang" }],
  ["maverick", { make: "Ford", model: "Maverick" }],
  ["edge", { make: "Ford", model: "Edge" }],
  ["expedition", { make: "Ford", model: "Expedition" }],
  ["ranger", { make: "Ford", model: "Ranger" }],
  ["f-150 lightning", { make: "Ford", model: "F-150 Lightning" }],
  // Toyota
  ["camry", { make: "Toyota", model: "Camry" }],
  ["corolla", { make: "Toyota", model: "Corolla" }],
  ["rav4", { make: "Toyota", model: "RAV4" }],
  ["rav 4", { make: "Toyota", model: "RAV4" }],
  ["tacoma", { make: "Toyota", model: "Tacoma" }],
  ["tundra", { make: "Toyota", model: "Tundra" }],
  ["highlander", { make: "Toyota", model: "Highlander" }],
  ["4runner", { make: "Toyota", model: "4Runner" }],
  ["prius", { make: "Toyota", model: "Prius" }],
  ["supra", { make: "Toyota", model: "Supra" }],
  ["sienna", { make: "Toyota", model: "Sienna" }],
  // Honda
  ["civic", { make: "Honda", model: "Civic" }],
  ["accord", { make: "Honda", model: "Accord" }],
  ["cr-v", { make: "Honda", model: "CR-V" }],
  ["crv", { make: "Honda", model: "CR-V" }],
  ["cr v", { make: "Honda", model: "CR-V" }],
  ["pilot", { make: "Honda", model: "Pilot" }],
  ["hr-v", { make: "Honda", model: "HR-V" }],
  ["hrv", { make: "Honda", model: "HR-V" }],
  ["odyssey", { make: "Honda", model: "Odyssey" }],
  ["ridgeline", { make: "Honda", model: "Ridgeline" }],
  // Chevrolet
  ["silverado", { make: "Chevrolet", model: "Silverado" }],
  ["silverado 1500", { make: "Chevrolet", model: "Silverado 1500" }],
  ["equinox", { make: "Chevrolet", model: "Equinox" }],
  ["tahoe", { make: "Chevrolet", model: "Tahoe" }],
  ["traverse", { make: "Chevrolet", model: "Traverse" }],
  ["colorado", { make: "Chevrolet", model: "Colorado" }],
  ["suburban", { make: "Chevrolet", model: "Suburban" }],
  ["malibu", { make: "Chevrolet", model: "Malibu" }],
  ["blazer", { make: "Chevrolet", model: "Blazer" }],
  ["camaro", { make: "Chevrolet", model: "Camaro" }],
  ["corvette", { make: "Chevrolet", model: "Corvette" }],
  ["trailblazer", { make: "Chevrolet", model: "Trailblazer" }],
  // Ram
  ["ram 1500", { make: "Ram", model: "1500" }],
  ["ram 2500", { make: "Ram", model: "2500" }],
  // Jeep
  ["wrangler", { make: "Jeep", model: "Wrangler" }],
  ["grand cherokee", { make: "Jeep", model: "Grand Cherokee" }],
  ["cherokee", { make: "Jeep", model: "Cherokee" }],
  ["gladiator", { make: "Jeep", model: "Gladiator" }],
  ["compass", { make: "Jeep", model: "Compass" }],
  // Tesla
  ["model y", { make: "Tesla", model: "Model Y" }],
  ["model 3", { make: "Tesla", model: "Model 3" }],
  ["model s", { make: "Tesla", model: "Model S" }],
  ["model x", { make: "Tesla", model: "Model X" }],
  ["cybertruck", { make: "Tesla", model: "Cybertruck" }],
  // BMW
  ["3 series", { make: "BMW", model: "3 Series" }],
  ["5 series", { make: "BMW", model: "5 Series" }],
  ["x3", { make: "BMW", model: "X3" }],
  ["x5", { make: "BMW", model: "X5" }],
  // Mercedes
  ["c-class", { make: "Mercedes-Benz", model: "C-Class" }],
  ["c class", { make: "Mercedes-Benz", model: "C-Class" }],
  ["e-class", { make: "Mercedes-Benz", model: "E-Class" }],
  ["gle", { make: "Mercedes-Benz", model: "GLE" }],
  ["glc", { make: "Mercedes-Benz", model: "GLC" }],
  // Audi
  ["a4", { make: "Audi", model: "A4" }],
  ["a6", { make: "Audi", model: "A6" }],
  ["q5", { make: "Audi", model: "Q5" }],
  ["q7", { make: "Audi", model: "Q7" }],
  // Nissan
  ["altima", { make: "Nissan", model: "Altima" }],
  ["rogue", { make: "Nissan", model: "Rogue" }],
  ["sentra", { make: "Nissan", model: "Sentra" }],
  ["pathfinder", { make: "Nissan", model: "Pathfinder" }],
  ["frontier", { make: "Nissan", model: "Frontier" }],
  // Hyundai
  ["tucson", { make: "Hyundai", model: "Tucson" }],
  ["santa fe", { make: "Hyundai", model: "Santa Fe" }],
  ["elantra", { make: "Hyundai", model: "Elantra" }],
  ["sonata", { make: "Hyundai", model: "Sonata" }],
  ["palisade", { make: "Hyundai", model: "Palisade" }],
  ["ioniq 5", { make: "Hyundai", model: "Ioniq 5" }],
  // Kia
  ["telluride", { make: "Kia", model: "Telluride" }],
  ["sorento", { make: "Kia", model: "Sorento" }],
  ["sportage", { make: "Kia", model: "Sportage" }],
  ["forte", { make: "Kia", model: "Forte" }],
  ["ev6", { make: "Kia", model: "EV6" }],
  // Subaru
  ["outback", { make: "Subaru", model: "Outback" }],
  ["forester", { make: "Subaru", model: "Forester" }],
  ["crosstrek", { make: "Subaru", model: "Crosstrek" }],
  ["wrx", { make: "Subaru", model: "WRX" }],
  // GMC
  ["sierra", { make: "GMC", model: "Sierra" }],
  ["sierra 1500", { make: "GMC", model: "Sierra 1500" }],
  ["yukon", { make: "GMC", model: "Yukon" }],
  ["terrain", { make: "GMC", model: "Terrain" }],
  ["acadia", { make: "GMC", model: "Acadia" }],
  // Dodge
  ["charger", { make: "Dodge", model: "Charger" }],
  ["challenger", { make: "Dodge", model: "Challenger" }],
  ["durango", { make: "Dodge", model: "Durango" }],
  ["hornet", { make: "Dodge", model: "Hornet" }],
]);

const FUEL_MAP: Record<string, FuelType> = {
  electric: "electric",
  ev: "electric",
  "all electric": "electric",
  "fully electric": "electric",
  hybrid: "hybrid",
  "plug-in hybrid": "phev",
  "plug in hybrid": "phev",
  phev: "phev",
  diesel: "diesel",
  gas: "gasoline",
  gasoline: "gasoline",
  "flex fuel": "flex_fuel",
};

const FEATURE_MAP: Record<string, string> = {
  "tow package": "tow_package",
  "towing package": "tow_package",
  towing: "tow_package",
  "heated seats": "heated_seats",
  "seat heaters": "heated_seats",
  "cooled seats": "cooled_seats",
  "ventilated seats": "cooled_seats",
  "apple carplay": "apple_carplay",
  carplay: "apple_carplay",
  "android auto": "android_auto",
  sunroof: "sunroof",
  moonroof: "sunroof",
  "panoramic sunroof": "panoramic_sunroof",
  "panoramic roof": "panoramic_sunroof",
  "backup camera": "backup_camera",
  "rear camera": "backup_camera",
  "blind spot": "blind_spot_monitor",
  "blind spot monitor": "blind_spot_monitor",
  "third row": "third_row",
  "3rd row": "third_row",
  "third row seating": "third_row",
  "remote start": "remote_start",
  navigation: "navigation",
  nav: "navigation",
  gps: "navigation",
  "leather seats": "leather_seats",
  leather: "leather_seats",
  awd: "awd",
  "all wheel drive": "awd",
  "all-wheel drive": "awd",
  "4wd": "4wd",
  "four wheel drive": "4wd",
  "four-wheel drive": "4wd",
  "lane keep": "lane_keep_assist",
  "lane keeping": "lane_keep_assist",
  "lane assist": "lane_keep_assist",
  "adaptive cruise": "adaptive_cruise",
  "adaptive cruise control": "adaptive_cruise",
  "keyless entry": "keyless_entry",
  "push button start": "push_button_start",
  "wireless charging": "wireless_charging",
  "heads up display": "heads_up_display",
  "head up display": "heads_up_display",
  "hud": "heads_up_display",
  "good on gas": "fuel_efficient",
  "fuel efficient": "fuel_efficient",
  "good gas mileage": "fuel_efficient",
  "great mpg": "fuel_efficient",
  "safe for kids": "top_safety",
  "family friendly": "top_safety",
  "top safety": "top_safety",
};

const URGENCY_MAP: Record<string, UrgencyLevel> = {
  today: "high",
  "right now": "high",
  asap: "high",
  immediately: "high",
  urgent: "high",
  "this weekend": "high",
  "this week": "medium",
  soon: "medium",
  "next week": "medium",
  "next month": "low",
  "just looking": "low",
  "just browsing": "low",
  browsing: "low",
  "not sure": "low",
  researching: "low",
  thinking: "low",
};

// ---- price extraction -------------------------------------------------------

interface PriceExtraction {
  price_min: number | null;
  price_max: number | null;
}

function extractPrice(text: string): PriceExtraction {
  let price_min: number | null = null;
  let price_max: number | null = null;

  // Range: "$20-30k", "$20k-$30k", "$20,000-$30,000", "$20k to $30k"
  const rangeMatch = text.match(
    /\$\s*([\d,]+)\s*k?\s*(?:to|-|–)\s*\$?\s*([\d,]+)\s*k?/i,
  );
  if (rangeMatch) {
    let low = parseFloat(rangeMatch[1].replace(/,/g, ""));
    let high = parseFloat(rangeMatch[2].replace(/,/g, ""));
    // If values look like they're in thousands (< 1000), multiply by 1000
    if (low < 1000) low *= 1000;
    if (high < 1000) high *= 1000;
    return { price_min: low, price_max: high };
  }

  // "under $40k", "less than $40,000", "below $40k", "no more than $40k"
  const underMatch = text.match(
    /(?:under|less than|below|no more than|up to|max|maximum)\s*\$?\s*([\d,]+)\s*k?/i,
  );
  if (underMatch) {
    let val = parseFloat(underMatch[1].replace(/,/g, ""));
    if (val < 1000) val *= 1000;
    price_max = val;
  }

  // "around $35,000", "about $35k", "near $35k"
  const aroundMatch = text.match(
    /(?:around|about|near|roughly|approximately)\s*\$?\s*([\d,]+)\s*k?/i,
  );
  if (aroundMatch) {
    let val = parseFloat(aroundMatch[1].replace(/,/g, ""));
    if (val < 1000) val *= 1000;
    price_min = Math.round(val * 0.85);
    price_max = Math.round(val * 1.15);
  }

  // "at least $30k", "over $30k", "above $30k", "starting at $30k", "minimum $30k"
  const overMatch = text.match(
    /(?:at least|over|above|starting at|minimum|more than)\s*\$?\s*([\d,]+)\s*k?/i,
  );
  if (overMatch) {
    let val = parseFloat(overMatch[1].replace(/,/g, ""));
    if (val < 1000) val *= 1000;
    price_min = val;
  }

  // Standalone "$40k", "$40,000" (treated as max)
  if (!price_min && !price_max) {
    const standaloneMatch = text.match(/\$\s*([\d,]+)\s*k?/i);
    if (standaloneMatch) {
      let val = parseFloat(standaloneMatch[1].replace(/,/g, ""));
      if (val < 1000) val *= 1000;
      price_max = val;
    }
  }

  // "cheap" / "affordable" / "budget"
  if (
    !price_max &&
    /\b(cheap|affordable|budget|inexpensive|economy)\b/i.test(text)
  ) {
    price_max = 25000;
  }

  return { price_min, price_max };
}

// ---- mileage extraction -----------------------------------------------------

function extractMileage(text: string): number | null {
  // "under 50,000 miles", "less than 50k miles"
  const match = text.match(
    /(?:under|less than|below|max|maximum)?\s*([\d,]+)\s*k?\s*(?:miles|mi)\b/i,
  );
  if (match) {
    let val = parseFloat(match[1].replace(/,/g, ""));
    if (val < 1000) val *= 1000;
    return val;
  }

  if (/\blow\s*mileage\b/i.test(text)) return 30000;
  if (/\bvery\s*low\s*mileage\b/i.test(text)) return 15000;

  return null;
}

// ---- year extraction --------------------------------------------------------

interface YearExtraction {
  year_min: number | null;
  year_max: number | null;
}

function extractYear(text: string): YearExtraction {
  // Range: "2020-2024", "2020 to 2024"
  const rangeMatch = text.match(/\b(20\d{2})\s*(?:to|-|–)\s*(20\d{2})\b/);
  if (rangeMatch) {
    return {
      year_min: parseInt(rangeMatch[1], 10),
      year_max: parseInt(rangeMatch[2], 10),
    };
  }

  // "newer than 2020", "2020 or newer"
  const newerMatch = text.match(
    /(?:newer than|after)\s*(20\d{2})\b|\b(20\d{2})\s*(?:or newer|and newer|\+)/,
  );
  if (newerMatch) {
    const yr = parseInt(newerMatch[1] ?? newerMatch[2], 10);
    return { year_min: yr, year_max: null };
  }

  // Standalone year: "2024 Ford F-150" -> treat as both min and max
  const singleMatch = text.match(/\b(20\d{2})\b/);
  if (singleMatch) {
    const yr = parseInt(singleMatch[1], 10);
    return { year_min: yr, year_max: yr };
  }

  return { year_min: null, year_max: null };
}

// ---- main parser -----------------------------------------------------------

/**
 * Parse a free-text or voice query and extract structured intent fields.
 * Returns a TextQueryResult with all matched attributes and a confidence score.
 */
export function parseTextQuery(text: string): TextQueryResult {
  const lower = text.toLowerCase().trim();
  const matched_tokens: string[] = [];
  let confidence = 0;

  // ---- Condition ----
  let condition: VehicleCondition | null = null;
  for (const [phrase, value] of Object.entries(CONDITION_MAP)) {
    if (lower.includes(phrase)) {
      condition = value;
      matched_tokens.push(phrase);
      confidence += 0.10;
      break;
    }
  }

  // ---- Body type ----
  let body: BodyType | null = null;
  // Try multi-word phrases first, then single words
  const bodyEntries = Object.entries(BODY_MAP).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [phrase, value] of bodyEntries) {
    if (lower.includes(phrase)) {
      body = value;
      matched_tokens.push(phrase);
      confidence += 0.20;
      break;
    }
  }

  // ---- Model (check before make so we can infer make from model) ----
  let make: string | null = null;
  let model: string | null = null;

  // Sort model entries by key length descending for longest-match-first
  const modelEntries = [...MODEL_MAP.entries()].sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [phrase, value] of modelEntries) {
    if (lower.includes(phrase)) {
      make = value.make;
      model = value.model;
      matched_tokens.push(phrase);
      confidence += 0.30; // exact make/model match
      break;
    }
  }

  // ---- Make (only if not already set via model match) ----
  if (!make) {
    // Sort by key length descending for multi-word makes first
    const makeEntries = [...MAKE_MAP.entries()].sort(
      (a, b) => b[0].length - a[0].length,
    );
    for (const [phrase, canonical] of makeEntries) {
      // Use word boundary check
      const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (regex.test(lower)) {
        make = canonical;
        matched_tokens.push(phrase);
        // Make alone is worth less than make+model
        if (!model) confidence += 0.15;
        break;
      }
    }
  }

  // ---- Price ----
  const { price_min, price_max } = extractPrice(lower);
  if (price_min !== null || price_max !== null) {
    matched_tokens.push("price");
    confidence += 0.15;
  }

  // ---- Year ----
  const { year_min, year_max } = extractYear(lower);
  if (year_min !== null || year_max !== null) {
    matched_tokens.push("year");
    confidence += 0.05;
  }

  // ---- Mileage ----
  const mileage_max = extractMileage(lower);
  if (mileage_max !== null) {
    matched_tokens.push("mileage");
    confidence += 0.05;
  }

  // ---- Fuel type ----
  let fuel: FuelType | null = null;
  const fuelEntries = Object.entries(FUEL_MAP).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [phrase, value] of fuelEntries) {
    if (lower.includes(phrase)) {
      fuel = value;
      matched_tokens.push(phrase);
      confidence += 0.10;
      break;
    }
  }

  // ---- Features ----
  const features: string[] = [];
  let featureConfidence = 0;
  const featureEntries = Object.entries(FEATURE_MAP).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [phrase, value] of featureEntries) {
    if (lower.includes(phrase) && !features.includes(value)) {
      features.push(value);
      matched_tokens.push(phrase);
      featureConfidence += 0.05;
    }
  }
  // Max 0.15 from features per spec
  confidence += Math.min(0.15, featureConfidence);

  // ---- Urgency ----
  let urgency: UrgencyLevel | null = null;
  const urgencyEntries = Object.entries(URGENCY_MAP).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [phrase, value] of urgencyEntries) {
    if (lower.includes(phrase)) {
      urgency = value;
      matched_tokens.push(phrase);
      // Vague / exploratory phrasing reduces confidence
      if (value === "low") {
        confidence -= 0.20;
      }
      break;
    }
  }

  // Clamp confidence to [0, 1]
  confidence = Math.max(0, Math.min(1, confidence));

  return {
    condition,
    body: body as string | null,
    make,
    model,
    year_min,
    year_max,
    price_min,
    price_max,
    mileage_max,
    fuel: fuel as string | null,
    features,
    urgency,
    confidence,
    matched_tokens,
  };
}
