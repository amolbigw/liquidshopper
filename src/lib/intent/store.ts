// ---------------------------------------------------------------------------
// Intent Engine -- Zustand Store
// ---------------------------------------------------------------------------

import { create } from "zustand";
import type {
  IntentVector,
  SignalEvent,
  ConfidenceBand,
  GridState,
} from "./types";
import { getConfidenceBand, getGridState } from "./confidence";
import { transitionIntent } from "./state-machine";

// ---- Default factory -------------------------------------------------------

export function createDefaultIntentVector(): IntentVector {
  return {
    condition: null,
    body: null,
    make: null,
    model: null,
    year_min: null,
    year_max: null,
    price_min: null,
    price_max: null,
    mileage_max: null,
    fuel: null,
    drivetrain: null,
    features: [],

    funnel_stage: null,
    urgency: null,
    price_sensitive: false,
    comparison_mode: false,
    has_promo_intent: false,

    focused_vehicle_id: null,
    compared_vehicle_ids: [],

    confidence: 0,
    primary_signal: "utm",
    signal_history: [],
  };
}

// ---- Store shape -----------------------------------------------------------

interface IntentStoreState {
  intent: IntentVector;
}

interface IntentStoreActions {
  /** Replace the entire intent vector (e.g. hydration from session/cookie). */
  updateIntent: (partial: Partial<IntentVector>) => void;

  /** Feed a raw signal event through the state machine. */
  processSignal: (signal: SignalEvent) => void;

  /** Reset to a blank default vector. */
  resetIntent: () => void;

  /** Convenience: set the focused vehicle id and bump confidence. */
  setFocusedVehicle: (vehicleId: string | null) => void;

  /** Convenience: add a vehicle to the compare set. */
  addCompareVehicle: (vehicleId: string) => void;

  /** Convenience: remove a vehicle from the compare set. */
  removeCompareVehicle: (vehicleId: string) => void;
}

export type IntentStore = IntentStoreState & IntentStoreActions;

// ---- Store creation --------------------------------------------------------

export const useIntentStore = create<IntentStore>()((set) => ({
  intent: createDefaultIntentVector(),

  updateIntent: (partial) =>
    set((state) => ({
      intent: { ...state.intent, ...partial },
    })),

  processSignal: (signal) =>
    set((state) => ({
      intent: transitionIntent(state.intent, signal),
    })),

  resetIntent: () =>
    set(() => ({
      intent: createDefaultIntentVector(),
    })),

  setFocusedVehicle: (vehicleId) =>
    set((state) => {
      const next = { ...state.intent };
      next.focused_vehicle_id = vehicleId;
      if (vehicleId && next.confidence < 0.56) {
        next.confidence = 0.56; // jump to "specific" minimum
      }
      if (!vehicleId && next.confidence > 0.55) {
        next.confidence = Math.max(next.confidence - 0.20, 0.26);
      }
      return { intent: next };
    }),

  addCompareVehicle: (vehicleId) =>
    set((state) => {
      const next = { ...state.intent };
      const ids = [...next.compared_vehicle_ids];
      if (!ids.includes(vehicleId) && ids.length < 3) {
        ids.push(vehicleId);
      }
      next.compared_vehicle_ids = ids;
      next.comparison_mode = ids.length >= 2;
      if (next.comparison_mode && next.confidence < 0.86) {
        next.confidence = Math.min(1, next.confidence + 0.15);
      }
      return { intent: next };
    }),

  removeCompareVehicle: (vehicleId) =>
    set((state) => {
      const next = { ...state.intent };
      next.compared_vehicle_ids = next.compared_vehicle_ids.filter(
        (id) => id !== vehicleId,
      );
      if (next.compared_vehicle_ids.length < 2) {
        next.comparison_mode = false;
      }
      if (!next.comparison_mode && next.confidence > 0.85) {
        next.confidence = 0.80;
      }
      return { intent: next };
    }),
}));

// ---- Derived selectors (hooks) ---------------------------------------------

/** Returns the current confidence band. */
export function useConfidenceBand(): ConfidenceBand {
  return useIntentStore((s) => getConfidenceBand(s.intent.confidence));
}

/** Returns the current grid-state number (0-3). */
export function useGridState(): GridState {
  return useIntentStore((s) =>
    getGridState(getConfidenceBand(s.intent.confidence)),
  );
}

/** Returns an array of human-readable "active filter" labels. */
export function useActiveFilters(): string[] {
  return useIntentStore((s) => {
    const i = s.intent;
    const filters: string[] = [];

    if (i.condition) filters.push(`Condition: ${i.condition}`);
    if (i.body) filters.push(`Body: ${i.body}`);
    if (i.make) filters.push(`Make: ${i.make}`);
    if (i.model) filters.push(`Model: ${i.model}`);
    if (i.year_min) filters.push(`Year from: ${i.year_min}`);
    if (i.year_max) filters.push(`Year to: ${i.year_max}`);
    if (i.price_min) filters.push(`Min price: $${i.price_min.toLocaleString()}`);
    if (i.price_max) filters.push(`Max price: $${i.price_max.toLocaleString()}`);
    if (i.mileage_max) filters.push(`Max mileage: ${i.mileage_max.toLocaleString()}`);
    if (i.fuel) filters.push(`Fuel: ${i.fuel}`);
    if (i.drivetrain) filters.push(`Drivetrain: ${i.drivetrain}`);
    for (const f of i.features) {
      filters.push(`Feature: ${f.replace(/_/g, " ")}`);
    }

    return filters;
  });
}
