// ---------------------------------------------------------------------------
// Intent Engine -- Core Types
// ---------------------------------------------------------------------------

/** Vehicle body styles recognized by the platform. */
export type BodyType =
  | "truck"
  | "suv"
  | "sedan"
  | "coupe"
  | "van"
  | "convertible"
  | "wagon"
  | "hatchback"
  | "crossover";

/** Fuel / powertrain types. */
export type FuelType =
  | "gasoline"
  | "diesel"
  | "hybrid"
  | "phev"
  | "electric"
  | "flex_fuel";

/** Drivetrain options. */
export type DrivetrainType = "fwd" | "awd" | "rwd" | "4wd";

/** Condition of a vehicle listing. */
export type VehicleCondition = "new" | "used" | "cpo";

/** Funnel stages inferred from signals. */
export type FunnelStage =
  | "browsing"
  | "considering"
  | "in_market"
  | "deciding";

/** Urgency levels. */
export type UrgencyLevel = "low" | "medium" | "high";

// ---------------------------------------------------------------------------
// Signal types (referenced inside IntentVector and elsewhere)
// ---------------------------------------------------------------------------

/** Every recognized signal source. Matches spec section 3.1. */
export type SignalType =
  | "utm"
  | "session_history"
  | "text_query"
  | "voice_query"
  | "vehicle_click"
  | "filter_apply"
  | "compare_add"
  | "scroll_depth"
  | "dwell_time"
  | "back_navigation";

/** A single signal event produced by the Signal Layer. */
export interface SignalEvent {
  type: SignalType;
  source: string;
  timestamp: number;
  priority: "highest" | "high" | "medium" | "low";
  payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Confidence & Grid State
// ---------------------------------------------------------------------------

/**
 * Human-readable confidence band.
 * Maps 1-to-1 to a grid state (spec section 4.2).
 */
export type ConfidenceBand = "undetermined" | "broad" | "specific" | "decisive";

/**
 * Numeric grid-state identifier.
 *   0 = Discovery
 *   1 = Broad Intent
 *   2 = Vehicle Focus
 *   3 = Decisive / Compare
 */
export type GridState = 0 | 1 | 2 | 3;

// ---------------------------------------------------------------------------
// Intent Vector (spec section 4.1)
// ---------------------------------------------------------------------------

export interface IntentVector {
  // --- Vehicle attributes ---
  condition: VehicleCondition | null;
  body: BodyType | null;
  make: string | null;
  model: string | null;
  year_min: number | null;
  year_max: number | null;
  price_min: number | null;
  price_max: number | null;
  mileage_max: number | null;
  fuel: FuelType | null;
  drivetrain: DrivetrainType | null;
  features: string[];

  // --- Funnel & behavioural state ---
  funnel_stage: FunnelStage | null;
  urgency: UrgencyLevel | null;
  price_sensitive: boolean;
  comparison_mode: boolean;
  has_promo_intent: boolean;

  // --- Focused / compared vehicles ---
  focused_vehicle_id: string | null;
  compared_vehicle_ids: string[]; // max 3

  // --- Confidence & metadata ---
  confidence: number; // 0.0 .. 1.0
  primary_signal: SignalType;
  signal_history: SignalEvent[];
}
