// ---------------------------------------------------------------------------
// Intent Engine -- Confidence helpers
// ---------------------------------------------------------------------------

import type { ConfidenceBand, GridState, IntentVector } from "./types";

/**
 * Map a raw confidence score (0..1) to a named band.
 *
 * | Band          | Range       |
 * |---------------|-------------|
 * | undetermined  | 0.00 – 0.25 |
 * | broad         | 0.26 – 0.55 |
 * | specific      | 0.56 – 0.85 |
 * | decisive      | 0.86 – 1.00 |
 */
export function getConfidenceBand(score: number): ConfidenceBand {
  const clamped = Math.max(0, Math.min(1, score));
  if (clamped <= 0.25) return "undetermined";
  if (clamped <= 0.55) return "broad";
  if (clamped <= 0.85) return "specific";
  return "decisive";
}

/**
 * Translate a confidence band into its numeric grid state.
 *
 *  undetermined -> 0 (Discovery)
 *  broad        -> 1 (Broad intent)
 *  specific     -> 2 (Vehicle focus)
 *  decisive     -> 3 (Compare / conversion)
 */
export function getGridState(band: ConfidenceBand): GridState {
  const map: Record<ConfidenceBand, GridState> = {
    undetermined: 0,
    broad: 1,
    specific: 2,
    decisive: 3,
  };
  return map[band];
}

/**
 * Compute the absolute delta between two intent vectors' confidence scores.
 * Used by the reassembly gating logic (spec section 9.1 -- delta >= 0.15
 * required before a reassembly fires).
 */
export function calculateConfidenceDelta(
  from: IntentVector,
  to: IntentVector,
): number {
  return Math.abs(to.confidence - from.confidence);
}
