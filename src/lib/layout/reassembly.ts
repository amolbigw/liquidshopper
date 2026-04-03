// ---------------------------------------------------------------------------
// Reassembly Rules -- Gating, timing, and animation config
// Implements spec section 9
// ---------------------------------------------------------------------------

import type { IntentVector, GridState } from "@/lib/intent/types";
import type { ReassemblyConfig } from "./types";
import { confidenceToBand, bandToGridState } from "./block-selector";

// ---------------------------------------------------------------------------
// Reassembly Configuration (spec section 9.2)
// ---------------------------------------------------------------------------

export const REASSEMBLY_CONFIG: ReassemblyConfig = {
  duration_out: 200 as const,
  duration_in: 300 as const,
  stagger_delays: {
    highest: 0 as const,
    high: 60 as const,
    medium: 120 as const,
    low: 180 as const,
  },
  cooldown: 1500 as const,
};

/** Minimum page open time before reassembly is allowed (ms). Spec section 9.4. */
const MIN_PAGE_OPEN_TIME = 3000;

/** Confidence delta threshold to trigger reassembly. Spec section 9.1. */
const CONFIDENCE_DELTA_THRESHOLD = 0.15;

/** Scroll position threshold (top 40% of page). Spec section 9.1. */
const SCROLL_TOP_THRESHOLD = 0.4;

/** User idle time required if scroll position is past threshold (ms). */
const IDLE_TIMEOUT_FOR_SCROLL = 2000;

// ---------------------------------------------------------------------------
// Reassembly trigger evaluation (spec section 9.1)
// ---------------------------------------------------------------------------

/**
 * Context about the current UI state, passed into reassembly checks.
 * The calling component is responsible for providing these values.
 */
export interface ReassemblyContext {
  /** Current scroll position as a fraction of total page height (0.0-1.0). */
  scrollPosition: number;
  /** Time in ms since the user last interacted (click, scroll, type). */
  idleDuration: number;
  /** Time in ms since the page was first loaded. */
  pageOpenDuration: number;
  /** Whether a lead form or modal is currently open. */
  hasOpenModal: boolean;
  /** Whether the user is mid-click (mousedown held). */
  isMouseDown: boolean;
  /** Whether a payment calculator or trade-in tool is in use. */
  hasActiveFinanceTool: boolean;
}

/**
 * Determine whether the grid should reassemble based on the current and
 * proposed intent vectors, timing, and UI context.
 *
 * All four conditions from spec 9.1 must be met:
 * 1. Confidence delta >= 0.15
 * 2. State change (different band)
 * 3. Cooldown >= 1500ms since last reassembly
 * 4. User not mid-scroll (top 40%) or idle >= 2s
 *
 * Additionally, none of the anti-patterns from spec 9.4 may be active.
 */
export function shouldReassemble(
  currentState: GridState,
  nextState: GridState,
  intent: IntentVector,
  lastReassemblyTime: number,
  context: ReassemblyContext,
): boolean {
  // Check anti-patterns first (spec 9.4) — these block unconditionally
  if (isReassemblyBlocked(context)) {
    return false;
  }

  const now = Date.now();

  // Condition 1: Confidence delta >= 0.15
  // We check the delta between the confidence that produced the current state
  // and the new confidence. Use band boundaries as the reference points.
  const currentBand = bandForState(currentState);
  const currentBandMidpoint = bandMidpoint(currentBand);
  const confidenceDelta = Math.abs(intent.confidence - currentBandMidpoint);
  if (confidenceDelta < CONFIDENCE_DELTA_THRESHOLD) {
    return false;
  }

  // Condition 2: State change — the new grid state must be different
  if (currentState === nextState) {
    return false;
  }

  // Condition 3: Cooldown — at least 1500ms since last reassembly
  if (now - lastReassemblyTime < REASSEMBLY_CONFIG.cooldown) {
    return false;
  }

  // Condition 4: User not mid-scroll OR idle >= 2s
  const isInTopPortion = context.scrollPosition <= SCROLL_TOP_THRESHOLD;
  const isIdle = context.idleDuration >= IDLE_TIMEOUT_FOR_SCROLL;
  if (!isInTopPortion && !isIdle) {
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Anti-patterns (spec section 9.4)
// ---------------------------------------------------------------------------

/**
 * Check whether reassembly is blocked by any of the anti-pattern conditions
 * defined in spec section 9.4:
 * - User has an open lead form or modal
 * - User is in the middle of a click action (mousedown held)
 * - A payment calculator or trade-in tool is actively in use
 * - The page has been open for < 3 seconds
 */
export function isReassemblyBlocked(context: ReassemblyContext): boolean {
  // Open lead form or modal
  if (context.hasOpenModal) return true;

  // Mid-click action
  if (context.isMouseDown) return true;

  // Active finance tool
  if (context.hasActiveFinanceTool) return true;

  // Page open for less than 3 seconds
  if (context.pageOpenDuration < MIN_PAGE_OPEN_TIME) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Stagger delays (spec section 9.2)
// ---------------------------------------------------------------------------

/**
 * Get the stagger delay for a block based on its priority.
 *
 * Priority 9-10 = 0ms (highest, rendered first)
 * Priority 7-8  = 60ms
 * Priority 5-6  = 120ms
 * Priority 1-4  = 180ms
 */
export function getStaggerDelay(priority: number): number {
  if (priority >= 9) return REASSEMBLY_CONFIG.stagger_delays.highest;
  if (priority >= 7) return REASSEMBLY_CONFIG.stagger_delays.high;
  if (priority >= 5) return REASSEMBLY_CONFIG.stagger_delays.medium;
  return REASSEMBLY_CONFIG.stagger_delays.low;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Map a GridState back to its ConfidenceBand for delta comparison. */
function bandForState(state: GridState): ReturnType<typeof confidenceToBand> {
  switch (state) {
    case 0:
      return "undetermined";
    case 1:
      return "broad";
    case 2:
      return "specific";
    case 3:
      return "decisive";
  }
}

/** Get the midpoint confidence value for a given band. */
function bandMidpoint(band: ReturnType<typeof confidenceToBand>): number {
  switch (band) {
    case "undetermined":
      return 0.125; // midpoint of 0.0–0.25
    case "broad":
      return 0.405; // midpoint of 0.26–0.55
    case "specific":
      return 0.705; // midpoint of 0.56–0.85
    case "decisive":
      return 0.925; // midpoint of 0.86–1.0
  }
}
