// ---------------------------------------------------------------------------
// Signal Layer -- Conflict Resolution   (spec section 3.5)
// ---------------------------------------------------------------------------

import type { IntentVector, SignalEvent, SignalType } from "../intent/types";
import { transitionIntent } from "../intent/state-machine";

// ---- priority map ----------------------------------------------------------

const SIGNAL_PRIORITY: Record<SignalType, number> = {
  utm: 80,
  session_history: 70,
  text_query: 90,
  voice_query: 90,
  vehicle_click: 85,
  filter_apply: 60,
  compare_add: 75,
  scroll_depth: 10,
  dwell_time: 20,
  back_navigation: 65,
};

// ---- conflict detection helpers -------------------------------------------

type VehicleAttributeKey = "make" | "model" | "body" | "condition" | "fuel";
type RangeAttributeKey = "price_min" | "price_max" | "mileage_max" | "year_min" | "year_max";

function isVehicleAttribute(key: string): key is VehicleAttributeKey {
  return ["make", "model", "body", "condition", "fuel"].includes(key);
}

function isRangeAttribute(key: string): key is RangeAttributeKey {
  return ["price_min", "price_max", "mileage_max", "year_min", "year_max"].includes(key);
}

function getPayloadKeys(signal: SignalEvent): string[] {
  return Object.keys(signal.payload).filter(
    (k) => signal.payload[k] != null && k !== "click_type" && k !== "confidence",
  );
}

function countSessionSignals(history: SignalEvent[]): number {
  // Count signals from the current session (not session_history type)
  return history.filter((s) => s.type !== "session_history").length;
}

// ---- main resolver ---------------------------------------------------------

/**
 * Given an existing intent vector and a batch of new signal events, resolve
 * conflicts between them and return the merged intent vector.
 *
 * Resolution rules (spec 3.5):
 *  1. Text query beats UTM
 *  2. Click beats filter for vehicle attributes; filter beats click for ranges
 *  3. Click beats dwell on same block
 *  4. Current session beats history after 2+ new signals
 *  5. Most recent input wins for voice vs text
 */
export function resolveConflicts(
  existing: IntentVector,
  newSignals: SignalEvent[],
): IntentVector {
  if (newSignals.length === 0) return existing;

  // Sort signals by priority (lowest first so higher priority overwrites)
  const sorted = [...newSignals].sort(
    (a, b) => SIGNAL_PRIORITY[a.type] - SIGNAL_PRIORITY[b.type],
  );

  // Separate signals by type for conflict analysis
  const textQuerySignals = sorted.filter((s) => s.type === "text_query");
  const voiceQuerySignals = sorted.filter((s) => s.type === "voice_query");
  const utmSignals = sorted.filter((s) => s.type === "utm");
  const clickSignals = sorted.filter((s) => s.type === "vehicle_click");
  const filterSignals = sorted.filter((s) => s.type === "filter_apply");
  const dwellSignals = sorted.filter((s) => s.type === "dwell_time");
  const historySignals = sorted.filter((s) => s.type === "session_history");
  const otherSignals = sorted.filter(
    (s) =>
      !["text_query", "voice_query", "utm", "vehicle_click", "filter_apply", "dwell_time", "session_history"].includes(s.type),
  );

  // Build a resolved signal list applying conflict rules
  const resolvedSignals: SignalEvent[] = [];

  // Rule 4: Current session beats history after 2+ new signals
  const currentSessionCount = countSessionSignals(existing.signal_history);
  const newNonHistoryCount = newSignals.filter(
    (s) => s.type !== "session_history",
  ).length;
  const totalCurrentSignals = currentSessionCount + newNonHistoryCount;

  if (totalCurrentSignals >= 2) {
    // Drop session_history signals in favor of current session data
    // (but still use them as a baseline if no current data exists for a field)
  } else {
    resolvedSignals.push(...historySignals);
  }

  // Rule 1: Text query beats UTM
  // If there is a text or voice query, UTM signals should not override
  // query-set attributes. We still apply UTM first so it can set uncontested
  // fields, then overlay text/voice on top.
  const hasTextOrVoice = textQuerySignals.length > 0 || voiceQuerySignals.length > 0;

  if (hasTextOrVoice) {
    // Apply UTM first (lower priority), but strip vehicle-attribute fields
    // that will be overridden by text/voice query
    for (const utm of utmSignals) {
      const strippedPayload = { ...utm.payload };
      // Only strip fields that the text/voice query also sets
      const queryPayloads = [...textQuerySignals, ...voiceQuerySignals].map(
        (s) => s.payload,
      );
      for (const qp of queryPayloads) {
        for (const key of Object.keys(qp)) {
          if (qp[key] != null && key in strippedPayload) {
            delete strippedPayload[key];
          }
        }
      }
      resolvedSignals.push({ ...utm, payload: strippedPayload });
    }
  } else {
    resolvedSignals.push(...utmSignals);
  }

  // Rule 3: Click beats dwell on same block
  // Remove dwell signals whose vehicle_id matches a click signal
  const clickedVehicleIds = new Set(
    clickSignals
      .map((s) => s.payload.vehicle_id as string | undefined)
      .filter(Boolean),
  );

  const filteredDwellSignals = dwellSignals.filter((s) => {
    const dwellVehicleId = s.payload.vehicle_id as string | undefined;
    if (dwellVehicleId && clickedVehicleIds.has(dwellVehicleId)) {
      return false; // click supersedes dwell on same vehicle
    }
    return true;
  });

  resolvedSignals.push(...filteredDwellSignals);

  // Rule 2: Click vs filter resolution
  // Click wins for vehicle-specific attributes (make, model, body, condition, fuel)
  // Filter wins for range attributes (price, mileage, year)
  if (clickSignals.length > 0 && filterSignals.length > 0) {
    // For filter signals, strip vehicle attributes that conflict with click signals
    for (const filter of filterSignals) {
      const adjustedPayload = { ...filter.payload };
      for (const click of clickSignals) {
        for (const key of getPayloadKeys(click)) {
          if (isVehicleAttribute(key) && key in adjustedPayload) {
            delete adjustedPayload[key];
          }
        }
      }
      resolvedSignals.push({ ...filter, payload: adjustedPayload });
    }
    // For click signals, strip range attributes that conflict with filter signals
    for (const click of clickSignals) {
      const adjustedPayload = { ...click.payload };
      for (const filter of filterSignals) {
        for (const key of getPayloadKeys(filter)) {
          if (isRangeAttribute(key) && key in adjustedPayload) {
            delete adjustedPayload[key];
          }
        }
      }
      resolvedSignals.push({ ...click, payload: adjustedPayload });
    }
  } else {
    resolvedSignals.push(...clickSignals);
    resolvedSignals.push(...filterSignals);
  }

  // Rule 5: Most recent input wins for voice vs text
  if (textQuerySignals.length > 0 && voiceQuerySignals.length > 0) {
    const allQuerySignals = [...textQuerySignals, ...voiceQuerySignals];
    allQuerySignals.sort((a, b) => a.timestamp - b.timestamp);
    // Only keep the most recent query signal
    resolvedSignals.push(allQuerySignals[allQuerySignals.length - 1]);
  } else {
    resolvedSignals.push(...textQuerySignals);
    resolvedSignals.push(...voiceQuerySignals);
  }

  // Add remaining signals (compare_add, back_navigation, scroll_depth)
  resolvedSignals.push(...otherSignals);

  // Sort by priority (lowest first) so highest-priority is applied last
  resolvedSignals.sort(
    (a, b) => SIGNAL_PRIORITY[a.type] - SIGNAL_PRIORITY[b.type],
  );

  // Apply all resolved signals sequentially through the state machine
  let result = existing;
  for (const signal of resolvedSignals) {
    result = transitionIntent(result, signal);
  }

  return result;
}
