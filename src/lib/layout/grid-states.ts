// ---------------------------------------------------------------------------
// Grid State Templates -- 4 primary states (spec section 7)
// ---------------------------------------------------------------------------

import type { GridStateTemplate, BlockManifest } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shorthand factory for BlockManifest with default empty content_query. */
function block(
  block_id: string,
  block_type: BlockManifest["block_type"],
  col: string,
  row: string,
  priority: number,
): BlockManifest {
  return {
    block_id,
    block_type,
    grid_position: { col, row },
    content_query: {},
    priority,
  };
}

// ---------------------------------------------------------------------------
// State 0: Discovery (Undetermined intent)
// Trigger: confidence 0.0-0.25, no UTM match, no session history
// ---------------------------------------------------------------------------

export const DISCOVERY_STATE: GridStateTemplate = {
  state: 0,
  blocks: [
    // Row 1: Intent capture bar (9x1)
    block("intent_0", "intent", "1/10", "1/2", 10),

    // Rows 2-4: Browse (3x3) | Hero (4x3) | Trust (2x3)
    block("browse_0", "browse", "1/4", "2/5", 8),
    block("hero_0", "hero", "4/8", "2/5", 7),
    block("trust_0", "trust", "8/10", "2/5", 7),

    // Rows 5-7: Vehicle cards x3 (3x3 each)
    block("vehicle_card_0", "vehicle_card", "1/4", "5/8", 7),
    block("vehicle_card_1", "vehicle_card", "4/7", "5/8", 7),
    block("vehicle_card_2", "vehicle_card", "7/10", "5/8", 7),

    // Rows 8-9: Promo (5x2) | Editorial (4x2)
    block("promo_0", "promo", "1/6", "8/10", 5),
    block("editorial_0", "editorial", "6/10", "8/10", 4),
  ],
};

// ---------------------------------------------------------------------------
// State 1: Broad Intent (Category-level signal detected)
// Trigger: confidence 0.26-0.55; condition, body type, or price range known
// ---------------------------------------------------------------------------

export const BROAD_INTENT_STATE: GridStateTemplate = {
  state: 1,
  blocks: [
    // Row 1: Intent capture bar (9x1)
    block("intent_0", "intent", "1/10", "1/2", 10),

    // Rows 2-9: Filter panel (2x8)
    block("filter_0", "filter", "1/3", "2/10", 8),

    // Rows 2-4: Vehicle cards row 1 — 3x3 + 4x3
    block("vehicle_card_0", "vehicle_card", "3/6", "2/5", 9),
    block("vehicle_card_1", "vehicle_card", "6/10", "2/5", 9),

    // Rows 5-7: Vehicle cards row 2 — 3x3 + 4x3
    block("vehicle_card_2", "vehicle_card", "3/6", "5/8", 9),
    block("vehicle_card_3", "vehicle_card", "6/10", "5/8", 9),

    // Rows 8-9: Promo (7x2)
    block("promo_0", "promo", "3/10", "8/10", 6),
  ],
};

// ---------------------------------------------------------------------------
// State 2: Vehicle Focus (Specific vehicle in view)
// Trigger: confidence 0.56-0.85; focused_vehicle_id is set
// ---------------------------------------------------------------------------

export const VEHICLE_FOCUS_STATE: GridStateTemplate = {
  state: 2,
  blocks: [
    // Row 1: Intent capture bar (9x1)
    block("intent_0", "intent", "1/10", "1/2", 10),

    // Rows 2-6: Hero vehicle (6x5)
    block("hero_0", "hero", "1/7", "2/7", 9),

    // Rows 2-4: Price breakdown (3x3)
    block("price_0", "price", "7/10", "2/5", 9),

    // Rows 5-7: CTAs (3x3)
    block("cta_0", "cta", "7/10", "5/8", 9),

    // Rows 7-9: Specs (4x3)
    block("specs_0", "specs", "1/5", "7/10", 7),

    // Rows 7-9: Similar vehicle card (2x3)
    block("vehicle_card_0", "vehicle_card", "5/7", "7/10", 6),

    // Rows 8-9: Trust (3x2)
    block("trust_0", "trust", "7/10", "8/10", 4),
  ],
};

// ---------------------------------------------------------------------------
// State 3: Decisive / Compare Mode
// Trigger: comparison_mode: true or confidence >= 0.86 with focused_vehicle_id
// ---------------------------------------------------------------------------

export const COMPARE_STATE: GridStateTemplate = {
  state: 3,
  blocks: [
    // Row 1: Intent capture bar (9x1)
    block("intent_0", "intent", "1/10", "1/2", 10),

    // Row 2: Compare tray (9x1)
    block("compare_0", "compare", "1/10", "2/3", 10),

    // Rows 3-6: Vehicle A hero (4x4) | Vehicle B hero (5x4)
    block("hero_a", "hero", "1/5", "3/7", 9),
    block("hero_b", "hero", "5/10", "3/7", 9),

    // Rows 7-8: Specs comparison (9x2)
    block("specs_0", "specs", "1/10", "7/9", 9),

    // Row 9: CTAs (4x1) | Promo (5x1)
    block("cta_0", "cta", "1/5", "9/10", 8),
    block("promo_0", "promo", "5/10", "9/10", 5),
  ],
};

// ---------------------------------------------------------------------------
// Lookup by GridState number
// ---------------------------------------------------------------------------

/** All grid state templates indexed by their numeric state identifier. */
export const GRID_STATE_TEMPLATES: Record<0 | 1 | 2 | 3, GridStateTemplate> = {
  0: DISCOVERY_STATE,
  1: BROAD_INTENT_STATE,
  2: VEHICLE_FOCUS_STATE,
  3: COMPARE_STATE,
};
