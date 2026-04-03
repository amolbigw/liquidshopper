// ---------------------------------------------------------------------------
// Intent Engine -- State Machine  (spec section 4.3)
// ---------------------------------------------------------------------------

import type {
  IntentVector,
  SignalEvent,
  BodyType,
  FuelType,
  VehicleCondition,
  FunnelStage,
  UrgencyLevel,
} from "./types";
import { getConfidenceBand } from "./confidence";

// ---- helpers ---------------------------------------------------------------

function clampConfidence(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function pushSignal(intent: IntentVector, signal: SignalEvent): IntentVector {
  return {
    ...intent,
    signal_history: [...intent.signal_history, signal],
    primary_signal: signal.type,
  };
}

// ---- individual signal handlers --------------------------------------------

function handleTextOrVoiceQuery(
  intent: IntentVector,
  signal: SignalEvent,
): IntentVector {
  const p = signal.payload as Record<string, unknown>;
  let next = { ...intent };

  if (p.condition) next.condition = p.condition as VehicleCondition;
  if (p.body) next.body = p.body as BodyType;
  if (p.make) next.make = p.make as string;
  if (p.model) next.model = p.model as string;
  if (p.year_min) next.year_min = p.year_min as number;
  if (p.year_max) next.year_max = p.year_max as number;
  if (p.price_min) next.price_min = p.price_min as number;
  if (p.price_max) next.price_max = p.price_max as number;
  if (p.mileage_max) next.mileage_max = p.mileage_max as number;
  if (p.fuel) next.fuel = p.fuel as FuelType;
  if (p.urgency) next.urgency = p.urgency as UrgencyLevel;
  if (Array.isArray(p.features) && p.features.length > 0) {
    const merged = new Set([...next.features, ...(p.features as string[])]);
    next.features = [...merged];
  }

  // Confidence from text extraction (see spec 3.3)
  const delta = typeof p.confidence === "number" ? p.confidence : 0;
  next.confidence = clampConfidence(next.confidence + delta);

  return pushSignal(next, signal);
}

function handleUTMMatch(
  intent: IntentVector,
  signal: SignalEvent,
): IntentVector {
  const p = signal.payload as Record<string, unknown>;
  let next = { ...intent };

  if (p.condition) next.condition = p.condition as VehicleCondition;
  if (p.body) next.body = p.body as BodyType;
  if (p.make) next.make = p.make as string;
  if (p.model) next.model = p.model as string;
  if (p.fuel) next.fuel = p.fuel as FuelType;
  if (p.funnel_stage) next.funnel_stage = p.funnel_stage as FunnelStage;
  if (p.focused_vehicle_id)
    next.focused_vehicle_id = p.focused_vehicle_id as string;
  if (typeof p.has_promo_intent === "boolean")
    next.has_promo_intent = p.has_promo_intent;
  if (typeof p.price_min === "number") next.price_min = p.price_min;

  const delta = typeof p.confidence === "number" ? p.confidence : 0;
  next.confidence = clampConfidence(next.confidence + delta);

  return pushSignal(next, signal);
}

function handleVehicleClick(
  intent: IntentVector,
  signal: SignalEvent,
): IntentVector {
  const p = signal.payload as Record<string, unknown>;
  let next = { ...intent };

  // Vehicle click: merge attributes with weight 0.8 (spec 3.4)
  if (p.make) next.make = p.make as string;
  if (p.model) next.model = p.model as string;
  if (p.body) next.body = p.body as BodyType;
  if (p.vehicle_id) next.focused_vehicle_id = p.vehicle_id as string;

  // Price range narrowing from clicked vehicle
  if (typeof p.price === "number") {
    const price = p.price as number;
    const range = price * 0.15; // +/- 15% around clicked price
    next.price_min = Math.round(price - range);
    next.price_max = Math.round(price + range);
  }

  // Vehicle click always boosts confidence toward "specific"
  next.confidence = clampConfidence(next.confidence + 0.25);

  return pushSignal(next, signal);
}

function handleBodyStyleClick(
  intent: IntentVector,
  signal: SignalEvent,
): IntentVector {
  const p = signal.payload as Record<string, unknown>;
  let next = { ...intent };

  if (p.body) next.body = p.body as BodyType;
  // Body style click sets confidence to 0.6 minimum (spec 3.4)
  next.confidence = clampConfidence(Math.max(next.confidence, 0.6) * 1.0);
  if (next.confidence < 0.35) next.confidence = 0.35;
  next.confidence = clampConfidence(
    next.confidence < 0.6 ? 0.6 : next.confidence,
  );

  return pushSignal(next, signal);
}

function handleCompareAdd(
  intent: IntentVector,
  signal: SignalEvent,
): IntentVector {
  const p = signal.payload as Record<string, unknown>;
  let next = { ...intent };

  const vehicleId = p.vehicle_id as string | undefined;
  if (vehicleId) {
    const ids = [...next.compared_vehicle_ids];
    if (!ids.includes(vehicleId) && ids.length < 3) {
      ids.push(vehicleId);
    }
    next.compared_vehicle_ids = ids;
  }

  next.comparison_mode = next.compared_vehicle_ids.length >= 2;

  // Compare moves toward decisive
  next.confidence = clampConfidence(next.confidence + 0.15);

  return pushSignal(next, signal);
}

function handleBackNavigation(
  intent: IntentVector,
  signal: SignalEvent,
): IntentVector {
  return applyRevertRules(pushSignal({ ...intent }, signal), signal);
}

function handleFilterApply(
  intent: IntentVector,
  signal: SignalEvent,
): IntentVector {
  const p = signal.payload as Record<string, unknown>;
  let next = { ...intent };

  // Filters update range attributes directly
  if (p.condition) next.condition = p.condition as VehicleCondition;
  if (p.body) next.body = p.body as BodyType;
  if (p.make) next.make = p.make as string;
  if (p.model) next.model = p.model as string;
  if (typeof p.price_min === "number") next.price_min = p.price_min;
  if (typeof p.price_max === "number") next.price_max = p.price_max;
  if (typeof p.year_min === "number") next.year_min = p.year_min;
  if (typeof p.year_max === "number") next.year_max = p.year_max;
  if (typeof p.mileage_max === "number") next.mileage_max = p.mileage_max;
  if (p.fuel) next.fuel = p.fuel as FuelType;
  if (Array.isArray(p.features)) {
    next.features = p.features as string[];
  }

  // Filters give a small confidence bump
  next.confidence = clampConfidence(next.confidence + 0.05);

  return pushSignal(next, signal);
}

function handleDwellTime(
  intent: IntentVector,
  signal: SignalEvent,
): IntentVector {
  const p = signal.payload as Record<string, unknown>;
  let next = { ...intent };
  const blockType = p.block_type as string | undefined;

  if (blockType === "vehicle_card" || blockType === "hero") {
    // Soft upweight: 0.3 weight per spec 3.4
    if (p.make && !next.make) next.make = p.make as string;
    if (p.model && !next.model) next.model = p.model as string;
    if (p.body && !next.body) next.body = p.body as BodyType;
    next.confidence = clampConfidence(next.confidence + 0.05);
  }

  if (blockType === "price") {
    next.price_sensitive = true;
  }

  if (blockType === "feature_section" && Array.isArray(p.features)) {
    const merged = new Set([...next.features, ...(p.features as string[])]);
    next.features = [...merged];
  }

  return pushSignal(next, signal);
}

function handleScrollDepth(
  intent: IntentVector,
  signal: SignalEvent,
): IntentVector {
  // Scroll depth is informational -- no intent vector changes, just logged
  return pushSignal({ ...intent }, signal);
}

function handlePromoClick(
  intent: IntentVector,
  signal: SignalEvent,
): IntentVector {
  let next = { ...intent };
  next.has_promo_intent = true;
  // Do not infer vehicle preference from promo click alone (spec 3.4)
  return pushSignal(next, signal);
}

// ---- public API ------------------------------------------------------------

/**
 * Apply a single signal event to an intent vector, producing a new vector.
 * This is the main entry point for the state machine.
 */
export function transitionIntent(
  current: IntentVector,
  signal: SignalEvent,
): IntentVector {
  switch (signal.type) {
    case "text_query":
    case "voice_query":
      return handleTextOrVoiceQuery(current, signal);

    case "utm":
      return handleUTMMatch(current, signal);

    case "vehicle_click": {
      // Distinguish body-style clicks from vehicle card clicks
      const p = signal.payload as Record<string, unknown>;
      if (p.click_type === "body_style") return handleBodyStyleClick(current, signal);
      if (p.click_type === "promo") return handlePromoClick(current, signal);
      return handleVehicleClick(current, signal);
    }

    case "compare_add":
      return handleCompareAdd(current, signal);

    case "back_navigation":
      return handleBackNavigation(current, signal);

    case "filter_apply":
      return handleFilterApply(current, signal);

    case "dwell_time":
      return handleDwellTime(current, signal);

    case "scroll_depth":
      return handleScrollDepth(current, signal);

    case "session_history":
      return handleUTMMatch(current, signal); // same merge logic

    default:
      return pushSignal({ ...current }, signal);
  }
}

/**
 * Revert rules (spec section 4.3):
 *  - Back navigation reverts ONE confidence band, not to zero.
 *  - If in comparison_mode, exit comparison and return to vehicle focus for
 *    the first compared vehicle.
 *  - Make / model confidence drops by 0.3 but body + price range remain.
 */
export function applyRevertRules(
  intent: IntentVector,
  _signal: SignalEvent,
): IntentVector {
  let next = { ...intent };
  const currentBand = getConfidenceBand(next.confidence);

  // Exit compare mode first
  if (next.comparison_mode) {
    next.comparison_mode = false;
    const firstVehicle = next.compared_vehicle_ids[0] ?? null;
    next.focused_vehicle_id = firstVehicle;
    next.compared_vehicle_ids = firstVehicle ? [firstVehicle] : [];
    // Drop from decisive -> specific
    next.confidence = clampConfidence(next.confidence - 0.15);
    return next;
  }

  // Reduce make/model confidence
  if (next.focused_vehicle_id) {
    next.focused_vehicle_id = null;
    // Body type and price range remain (spec 3.4)
  }

  // Drop one band
  switch (currentBand) {
    case "decisive":
      next.confidence = clampConfidence(next.confidence - 0.20);
      break;
    case "specific":
      next.confidence = clampConfidence(next.confidence - 0.30);
      // Partially clear make/model but keep body + price
      next.make = null;
      next.model = null;
      break;
    case "broad":
      next.confidence = clampConfidence(next.confidence - 0.25);
      break;
    case "undetermined":
      // Already at the bottom, no further revert
      break;
  }

  return next;
}
