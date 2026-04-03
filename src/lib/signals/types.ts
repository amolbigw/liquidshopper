// ---------------------------------------------------------------------------
// Signal Layer -- Types
// ---------------------------------------------------------------------------

export type {
  SignalType,
  SignalEvent,
} from "../intent/types";

/** UTM parameters extracted from a URL. */
export interface UTMParams {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

/** Result of parsing a free-text or voice search query. */
export interface TextQueryResult {
  condition: "new" | "used" | "cpo" | null;
  body: string | null;
  make: string | null;
  model: string | null;
  year_min: number | null;
  year_max: number | null;
  price_min: number | null;
  price_max: number | null;
  mileage_max: number | null;
  fuel: string | null;
  features: string[];
  urgency: "low" | "medium" | "high" | null;
  confidence: number;
  matched_tokens: string[];
}
