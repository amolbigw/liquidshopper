// ---------------------------------------------------------------------------
// Signal Layer -- UTM Parser  (spec sections 3.2, 8.1, 8.2, 8.3)
// ---------------------------------------------------------------------------

import type { UTMParams } from "./types";
import type {
  IntentVector,
  BodyType,
  FuelType,
  VehicleCondition,
  FunnelStage,
} from "../intent/types";

// ---- UTM extraction --------------------------------------------------------

/**
 * Extract UTM parameters from a URL string.
 * Returns null when no utm_* params are found at all.
 */
export function parseUTMParams(url: string): UTMParams | null {
  let searchParams: URLSearchParams;
  try {
    const parsed = new URL(url, "https://placeholder.local");
    searchParams = parsed.searchParams;
  } catch {
    return null;
  }

  const source = searchParams.get("utm_source");
  const medium = searchParams.get("utm_medium");
  const campaign = searchParams.get("utm_campaign");
  const content = searchParams.get("utm_content");
  const term = searchParams.get("utm_term");

  if (!source && !medium && !campaign && !content && !term) return null;

  return {
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
    utm_content: content,
    utm_term: term,
  };
}

// ---- dictionaries ----------------------------------------------------------

const BODY_TOKENS: Record<string, BodyType> = {
  truck: "truck",
  trucks: "truck",
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
};

const CONDITION_TOKENS: Record<string, VehicleCondition> = {
  new: "new",
  used: "used",
  preowned: "used",
  "pre-owned": "used",
  certified: "cpo",
  cpo: "cpo",
};

const FUEL_TOKENS: Record<string, FuelType> = {
  ev: "electric",
  electric: "electric",
  hybrid: "hybrid",
  phev: "phev",
  diesel: "diesel",
};

const FUNNEL_TOKENS: Record<string, FunnelStage> = {
  inmarket: "in_market",
  in_market: "in_market",
  retarget: "considering",
  retargeting: "considering",
  conquest: "browsing",
  brand_awareness: "browsing",
  awareness: "browsing",
  firsttime: "browsing",
  loyalty: "in_market",
  service: "in_market",
};

// ---- Campaign segment data ------------------------------------------------

export interface CampaignSegment {
  funnel_stage: FunnelStage | null;
  body: BodyType | null;
  condition: VehicleCondition | null;
  fuel: FuelType | null;
  geo: string | null;
  confidence: number;
}

/**
 * Parse a campaign label following the convention:
 *   {audience_stage}_{body_or_make}_{condition}_{geo}
 *
 * Falls back to token-matching when the label does not follow the convention.
 */
export function parseCampaignLabel(campaign: string): CampaignSegment {
  const lower = campaign.toLowerCase().trim();
  const tokens = lower.split(/[_\-]+/);

  let funnel_stage: FunnelStage | null = null;
  let body: BodyType | null = null;
  let condition: VehicleCondition | null = null;
  let fuel: FuelType | null = null;
  let geo: string | null = null;
  let confidence = 0;

  // Spec 8.1 -- pattern matching
  if (lower.startsWith("inmarket_truck_used")) {
    return {
      funnel_stage: "in_market",
      body: "truck",
      condition: "used",
      fuel: null,
      geo: tokens[3] ?? null,
      confidence: 0.65,
    };
  }
  if (lower.startsWith("inmarket_truck")) {
    return {
      funnel_stage: "in_market",
      body: "truck",
      condition: null,
      fuel: null,
      geo: tokens[2] ?? null,
      confidence: 0.55,
    };
  }
  if (lower.startsWith("retarget_vdp")) {
    return {
      funnel_stage: "considering",
      body: null,
      condition: null,
      fuel: null,
      geo: null,
      confidence: 0.70,
    };
  }
  if (lower.startsWith("retarget_srp")) {
    return {
      funnel_stage: "considering",
      body: null,
      condition: null,
      fuel: null,
      geo: null,
      confidence: 0.50,
    };
  }
  if (lower.startsWith("conquest_luxury")) {
    return {
      funnel_stage: "browsing",
      body: null,
      condition: "new",
      fuel: null,
      geo: null,
      confidence: 0.30,
    };
  }
  if (lower.startsWith("brand_awareness")) {
    return {
      funnel_stage: "browsing",
      body: null,
      condition: null,
      fuel: null,
      geo: null,
      confidence: 0.20,
    };
  }
  if (lower.startsWith("ev_") || lower === "ev") {
    return {
      funnel_stage: "browsing",
      body: null,
      condition: null,
      fuel: "electric",
      geo: null,
      confidence: 0.35,
    };
  }
  if (lower.startsWith("firsttime_buyer")) {
    return {
      funnel_stage: "browsing",
      body: null,
      condition: null,
      fuel: null,
      geo: null,
      confidence: 0.25,
    };
  }
  if (lower.startsWith("loyalty_service")) {
    return {
      funnel_stage: "in_market",
      body: null,
      condition: null,
      fuel: null,
      geo: null,
      confidence: 0.40,
    };
  }

  // Generic token scan for non-standard labels
  for (const token of tokens) {
    if (!funnel_stage && FUNNEL_TOKENS[token]) {
      funnel_stage = FUNNEL_TOKENS[token];
      confidence += 0.15;
    }
    if (!body && BODY_TOKENS[token]) {
      body = BODY_TOKENS[token];
      confidence += 0.15;
    }
    if (!condition && CONDITION_TOKENS[token]) {
      condition = CONDITION_TOKENS[token];
      confidence += 0.10;
    }
    if (!fuel && FUEL_TOKENS[token]) {
      fuel = FUEL_TOKENS[token];
      confidence += 0.10;
    }
  }

  // If the last token looks like a geo marker (2+ alpha chars, not a known keyword)
  const lastToken = tokens[tokens.length - 1];
  if (
    lastToken &&
    lastToken.length >= 2 &&
    /^[a-z]+$/.test(lastToken) &&
    !FUNNEL_TOKENS[lastToken] &&
    !BODY_TOKENS[lastToken] &&
    !CONDITION_TOKENS[lastToken] &&
    !FUEL_TOKENS[lastToken]
  ) {
    geo = lastToken;
  }

  // Fallback confidence for "inmarket_*" generics
  if (lower.startsWith("inmarket") && confidence < 0.45) {
    funnel_stage = "in_market";
    confidence = 0.45;
  }

  return { funnel_stage, body, condition, fuel, geo, confidence };
}

// ---- UTM content parsing (spec 8.2) ----------------------------------------

export interface UTMContentData {
  focused_vehicle_id: string | null;
  has_promo_intent: boolean;
  make: string | null;
  model: string | null;
  confidence_boost: number;
}

const OFFER_CODES = new Set([
  "0apr60",
  "0apr72",
  "0apr48",
  "emp_pricing",
  "employee_pricing",
  "costco_pricing",
  "military_discount",
  "first_responder",
  "college_grad",
]);

/** Well-known make+model tokens for utm_content matching. */
const CONTENT_VEHICLE_MAP: Record<string, { make: string; model: string }> = {
  f150: { make: "Ford", model: "F-150" },
  f150_xlt: { make: "Ford", model: "F-150" },
  f150_lariat: { make: "Ford", model: "F-150" },
  f150_platinum: { make: "Ford", model: "F-150" },
  f150_lightning: { make: "Ford", model: "F-150 Lightning" },
  bronco: { make: "Ford", model: "Bronco" },
  bronco_sport: { make: "Ford", model: "Bronco Sport" },
  explorer: { make: "Ford", model: "Explorer" },
  escape: { make: "Ford", model: "Escape" },
  maverick: { make: "Ford", model: "Maverick" },
  camry: { make: "Toyota", model: "Camry" },
  rav4: { make: "Toyota", model: "RAV4" },
  tacoma: { make: "Toyota", model: "Tacoma" },
  tundra: { make: "Toyota", model: "Tundra" },
  highlander: { make: "Toyota", model: "Highlander" },
  corolla: { make: "Toyota", model: "Corolla" },
  civic: { make: "Honda", model: "Civic" },
  accord: { make: "Honda", model: "Accord" },
  crv: { make: "Honda", model: "CR-V" },
  cr_v: { make: "Honda", model: "CR-V" },
  pilot: { make: "Honda", model: "Pilot" },
  hrv: { make: "Honda", model: "HR-V" },
  silverado: { make: "Chevrolet", model: "Silverado" },
  silverado_1500: { make: "Chevrolet", model: "Silverado 1500" },
  equinox: { make: "Chevrolet", model: "Equinox" },
  tahoe: { make: "Chevrolet", model: "Tahoe" },
  traverse: { make: "Chevrolet", model: "Traverse" },
  colorado: { make: "Chevrolet", model: "Colorado" },
  ram_1500: { make: "Ram", model: "1500" },
  ram1500: { make: "Ram", model: "1500" },
  wrangler: { make: "Jeep", model: "Wrangler" },
  grand_cherokee: { make: "Jeep", model: "Grand Cherokee" },
  model_y: { make: "Tesla", model: "Model Y" },
  model_3: { make: "Tesla", model: "Model 3" },
  "3_series": { make: "BMW", model: "3 Series" },
  x5: { make: "BMW", model: "X5" },
  "c_class": { make: "Mercedes-Benz", model: "C-Class" },
  gle: { make: "Mercedes-Benz", model: "GLE" },
  a4: { make: "Audi", model: "A4" },
  q5: { make: "Audi", model: "Q5" },
};

/**
 * Parse utm_content to extract vehicle SKU, offer code, or make+model token.
 */
export function parseUTMContent(content: string): UTMContentData {
  const lower = content.toLowerCase().trim();

  // 1) Check for stock-number pattern (alphanumeric 6+ chars starting with letter)
  const stockMatch = content.match(/^[A-Z][A-Z0-9]{5,}$/i);
  if (stockMatch) {
    return {
      focused_vehicle_id: content,
      has_promo_intent: false,
      make: null,
      model: null,
      confidence_boost: 0.40,
    };
  }

  // 2) Check for offer codes
  const normalized = lower.replace(/[\s\-]/g, "_");
  if (OFFER_CODES.has(normalized)) {
    return {
      focused_vehicle_id: null,
      has_promo_intent: true,
      make: null,
      model: null,
      confidence_boost: 0.10,
    };
  }

  // Check for offer-code patterns like "0apr60", "0apr72"
  if (/^0apr\d+$/.test(normalized)) {
    return {
      focused_vehicle_id: null,
      has_promo_intent: true,
      make: null,
      model: null,
      confidence_boost: 0.10,
    };
  }

  // 3) Check for make+model token
  const vehicleMatch = CONTENT_VEHICLE_MAP[normalized];
  if (vehicleMatch) {
    return {
      focused_vehicle_id: null,
      has_promo_intent: false,
      make: vehicleMatch.make,
      model: vehicleMatch.model,
      confidence_boost: 0.30,
    };
  }

  // Check underscore-joined parts (e.g. "f150_xlt_0apr")
  const parts = normalized.split("_");
  for (let i = parts.length; i >= 1; i--) {
    const candidate = parts.slice(0, i).join("_");
    const match = CONTENT_VEHICLE_MAP[candidate];
    if (match) {
      // Also check remaining parts for offer codes
      const rest = parts.slice(i).join("_");
      const isPromo = OFFER_CODES.has(rest) || /^0apr\d*$/.test(rest);
      return {
        focused_vehicle_id: null,
        has_promo_intent: isPromo,
        make: match.make,
        model: match.model,
        confidence_boost: 0.30,
      };
    }
  }

  // 4) No recognized format
  return {
    focused_vehicle_id: null,
    has_promo_intent: false,
    make: null,
    model: null,
    confidence_boost: 0,
  };
}

// ---- Source + Medium inference (spec 8.3) -----------------------------------

interface SourceMediumInference {
  funnel_stage: FunnelStage | null;
  trust_weight: "standard" | "higher" | "high";
}

function inferSourceMedium(
  source: string | null,
  medium: string | null,
): SourceMediumInference {
  const s = (source ?? "").toLowerCase();
  const m = (medium ?? "").toLowerCase();

  if (s === "google" && m === "cpc")
    return { funnel_stage: "in_market", trust_weight: "standard" };
  if (s === "facebook" && m === "retargeting")
    return { funnel_stage: "considering", trust_weight: "standard" };
  if (s === "facebook" && m === "prospecting")
    return { funnel_stage: "browsing", trust_weight: "higher" };
  if (s === "email" && m === "crm")
    return { funnel_stage: "in_market", trust_weight: "high" };
  if (s === "google" && m === "organic")
    return { funnel_stage: "browsing", trust_weight: "standard" };
  if (s === "dealer_website" && m === "referral")
    return { funnel_stage: "in_market", trust_weight: "high" };

  return { funnel_stage: null, trust_weight: "standard" };
}

// ---- Composite mapping -----------------------------------------------------

/**
 * Map a full set of UTM params to a partial IntentVector.
 * Merges campaign, content, source+medium, and term signals.
 */
export function mapUTMToIntent(params: UTMParams): Partial<IntentVector> {
  const result: Partial<IntentVector> & { confidence?: number } = {};
  let confidence = 0;

  // 1. Campaign segment
  if (params.utm_campaign) {
    const seg = parseCampaignLabel(params.utm_campaign);
    if (seg.funnel_stage) result.funnel_stage = seg.funnel_stage;
    if (seg.body) result.body = seg.body;
    if (seg.condition) result.condition = seg.condition;
    if (seg.fuel) result.fuel = seg.fuel;
    confidence += seg.confidence;
  }

  // 2. Content (vehicle / offer)
  if (params.utm_content) {
    const cd = parseUTMContent(params.utm_content);
    if (cd.focused_vehicle_id) result.focused_vehicle_id = cd.focused_vehicle_id;
    if (cd.has_promo_intent) result.has_promo_intent = true;
    if (cd.make) result.make = cd.make;
    if (cd.model) result.model = cd.model;
    confidence += cd.confidence_boost;
  }

  // 3. Source + Medium
  const sm = inferSourceMedium(params.utm_source, params.utm_medium);
  if (sm.funnel_stage && !result.funnel_stage) {
    result.funnel_stage = sm.funnel_stage;
  }

  // 4. Term (SEM keywords like "used+ford+f150+philadelphia")
  if (params.utm_term) {
    const termTokens = params.utm_term.toLowerCase().split(/[\s+]+/);
    for (const token of termTokens) {
      if (!result.condition && CONDITION_TOKENS[token]) {
        result.condition = CONDITION_TOKENS[token];
        confidence += 0.10;
      }
      if (!result.body && BODY_TOKENS[token]) {
        result.body = BODY_TOKENS[token];
        confidence += 0.10;
      }
    }

    // Check for make+model in term tokens
    for (const [key, vehicle] of Object.entries(CONTENT_VEHICLE_MAP)) {
      if (termTokens.includes(key.replace(/_/g, ""))) {
        if (!result.make) result.make = vehicle.make;
        if (!result.model) result.model = vehicle.model;
        confidence += 0.15;
        break;
      }
    }
    // Also try direct make matches
    const makeTokens = termTokens.map((t) => t.charAt(0).toUpperCase() + t.slice(1));
    const knownMakes = [
      "Ford", "Toyota", "Honda", "Chevrolet", "Ram", "Jeep", "Tesla",
      "BMW", "Mercedes", "Audi", "Nissan", "Hyundai", "Kia", "Subaru",
      "Volkswagen", "Mazda", "Lexus", "Acura", "Infiniti", "Volvo",
      "Cadillac", "Lincoln", "Buick", "GMC", "Dodge", "Chrysler",
      "Genesis", "Porsche", "Jaguar", "Land",
    ];
    for (const mt of makeTokens) {
      if (!result.make && knownMakes.includes(mt)) {
        result.make = mt;
        confidence += 0.10;
        break;
      }
    }
  }

  result.confidence = Math.min(1, confidence);
  return result;
}
