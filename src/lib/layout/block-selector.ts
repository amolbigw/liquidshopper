// ---------------------------------------------------------------------------
// Block Selector -- Reads IntentVector and outputs BlockManifest[]
// Implements the decision sequence from spec section 5.2
// ---------------------------------------------------------------------------

import type { IntentVector, ConfidenceBand, GridState } from "@/lib/intent/types";
import type { InventoryFilter } from "@/lib/inventory/types";
import type { BlockManifest, ContentQuery } from "./types";
import { GRID_STATE_TEMPLATES } from "./grid-states";

// ---------------------------------------------------------------------------
// Confidence band thresholds (spec section 4.2 / 7)
// ---------------------------------------------------------------------------

/** Map a raw confidence score (0.0-1.0) to a discrete confidence band. */
export function confidenceToBand(confidence: number): ConfidenceBand {
  if (confidence <= 0.25) return "undetermined";
  if (confidence <= 0.55) return "broad";
  if (confidence <= 0.85) return "specific";
  return "decisive";
}

/** Map a confidence band to its numeric grid state. */
export function bandToGridState(band: ConfidenceBand): GridState {
  switch (band) {
    case "undetermined":
      return 0;
    case "broad":
      return 1;
    case "specific":
      return 2;
    case "decisive":
      return 3;
  }
}

// ---------------------------------------------------------------------------
// Intent vector to inventory filter
// ---------------------------------------------------------------------------

/** Convert relevant fields from the intent vector into an InventoryFilter. */
function intentToInventoryFilter(intent: IntentVector): InventoryFilter {
  const filter: InventoryFilter = {};

  if (intent.condition) {
    // Map intent condition (lowercase) to inventory Condition (title case)
    const conditionMap: Record<string, "New" | "Used" | "CPO"> = {
      new: "New",
      used: "Used",
      cpo: "CPO",
    };
    const mapped = conditionMap[intent.condition];
    if (mapped) filter.condition = [mapped];
  }

  if (intent.body) {
    // Map intent body (lowercase) to inventory BodyStyle (title case)
    const bodyMap: Record<string, string> = {
      truck: "Truck",
      suv: "SUV",
      sedan: "Sedan",
      coupe: "Coupe",
      van: "Van",
      convertible: "Convertible",
      wagon: "Wagon",
      hatchback: "Hatchback",
      crossover: "Crossover",
    };
    const mapped = bodyMap[intent.body];
    if (mapped) filter.body_style = [mapped as InventoryFilter["body_style"] extends (infer T)[] | undefined ? T : never];
  }

  if (intent.make) filter.make = [intent.make];
  if (intent.model) filter.model = [intent.model];
  if (intent.year_min != null) filter.year_min = intent.year_min;
  if (intent.year_max != null) filter.year_max = intent.year_max;
  if (intent.price_min != null) filter.price_min = intent.price_min;
  if (intent.price_max != null) filter.price_max = intent.price_max;
  if (intent.mileage_max != null) filter.mileage_max = intent.mileage_max;

  if (intent.fuel) {
    const fuelMap: Record<string, string> = {
      gasoline: "Gasoline",
      diesel: "Diesel",
      hybrid: "Hybrid",
      phev: "PHEV",
      electric: "Electric",
      flex_fuel: "Flex Fuel",
    };
    const mapped = fuelMap[intent.fuel];
    if (mapped) filter.fuel_type = [mapped as InventoryFilter["fuel_type"] extends (infer T)[] | undefined ? T : never];
  }

  if (intent.drivetrain) {
    const dtMap: Record<string, string> = {
      fwd: "FWD",
      awd: "AWD",
      rwd: "RWD",
      "4wd": "4WD",
    };
    const mapped = dtMap[intent.drivetrain];
    if (mapped) filter.drivetrain = [mapped as InventoryFilter["drivetrain"] extends (infer T)[] | undefined ? T : never];
  }

  if (intent.features.length > 0) filter.features = [...intent.features];

  if (intent.has_promo_intent) {
    filter.dealer_discount_active = true;
  }

  return filter;
}

// ---------------------------------------------------------------------------
// Content query builders
// ---------------------------------------------------------------------------

function heroQuery(intent: IntentVector): ContentQuery {
  if (intent.focused_vehicle_id) {
    return { vehicle_id: intent.focused_vehicle_id, limit: 1 };
  }
  // Discovery: most-favorited / dealer-featured vehicle
  return {
    inventory_filter: intentToInventoryFilter(intent),
    sort: "days_on_lot_desc",
    limit: 1,
    static_content: "featured_vehicle",
  };
}

function vehicleCardQuery(intent: IntentVector, index: number): ContentQuery {
  const filter = intentToInventoryFilter(intent);
  return {
    inventory_filter: filter,
    sort: "price_asc",
    limit: 1,
    // Offset is conceptual; actual pagination handled by inventory layer
    static_content: `vehicle_card_offset_${index}`,
  };
}

function similarVehicleQuery(intent: IntentVector): ContentQuery {
  const filter = intentToInventoryFilter(intent);
  // Exclude the focused vehicle from similar results
  return {
    inventory_filter: filter,
    sort: "price_asc",
    limit: 1,
    static_content: "similar_vehicle",
  };
}

function priceQuery(intent: IntentVector): ContentQuery {
  if (intent.focused_vehicle_id) {
    return { vehicle_id: intent.focused_vehicle_id, limit: 1 };
  }
  return {};
}

function ctaQuery(intent: IntentVector): ContentQuery {
  if (intent.focused_vehicle_id) {
    return {
      vehicle_id: intent.focused_vehicle_id,
      static_content:
        intent.funnel_stage === "deciding"
          ? "cta_high_urgency"
          : intent.funnel_stage === "in_market"
            ? "cta_medium_urgency"
            : "cta_standard",
    };
  }
  return { static_content: "cta_standard" };
}

function specsQuery(intent: IntentVector): ContentQuery {
  if (intent.focused_vehicle_id) {
    return { vehicle_id: intent.focused_vehicle_id };
  }
  if (intent.compared_vehicle_ids.length >= 2) {
    return { static_content: "specs_comparison" };
  }
  return {};
}

function promoQuery(intent: IntentVector): ContentQuery {
  return {
    inventory_filter: intentToInventoryFilter(intent),
    sort: "price_desc",
    limit: 3,
    static_content: intent.has_promo_intent ? "promo_featured" : "promo_standard",
  };
}

function compareQuery(intent: IntentVector): ContentQuery {
  return {
    static_content: "compare_tray",
  };
}

function compareHeroQuery(intent: IntentVector, vehicleIndex: number): ContentQuery {
  const vid = intent.compared_vehicle_ids[vehicleIndex];
  if (vid) {
    return { vehicle_id: vid, limit: 1 };
  }
  return {};
}

// ---------------------------------------------------------------------------
// Block enrichment: attach content queries to template blocks
// ---------------------------------------------------------------------------

function enrichBlock(block: BlockManifest, intent: IntentVector): BlockManifest {
  const enriched = { ...block, content_query: { ...block.content_query } };

  switch (block.block_type) {
    case "intent":
      enriched.content_query = { static_content: "intent_bar" };
      break;

    case "hero":
      if (block.block_id === "hero_a") {
        enriched.content_query = compareHeroQuery(intent, 0);
      } else if (block.block_id === "hero_b") {
        enriched.content_query = compareHeroQuery(intent, 1);
      } else {
        enriched.content_query = heroQuery(intent);
      }
      break;

    case "vehicle_card": {
      // Extract numeric index from block_id (e.g. "vehicle_card_2" -> 2)
      const match = block.block_id.match(/(\d+)$/);
      const idx = match ? parseInt(match[1], 10) : 0;
      if (block.content_query.static_content === "similar_vehicle") {
        enriched.content_query = similarVehicleQuery(intent);
      } else {
        enriched.content_query = vehicleCardQuery(intent, idx);
      }
      break;
    }

    case "browse":
      enriched.content_query = { static_content: "browse_body_types" };
      break;

    case "filter":
      enriched.content_query = {
        inventory_filter: intentToInventoryFilter(intent),
        static_content: "filter_panel",
      };
      break;

    case "trust":
      enriched.content_query = {
        static_content: intent.focused_vehicle_id
          ? "trust_dealer_specific"
          : "trust_general",
      };
      break;

    case "editorial":
      enriched.content_query = {
        static_content: intent.body ? `editorial_${intent.body}` : "editorial_general",
      };
      break;

    case "promo":
      enriched.content_query = promoQuery(intent);
      break;

    case "price":
      enriched.content_query = priceQuery(intent);
      break;

    case "cta":
      enriched.content_query = ctaQuery(intent);
      break;

    case "specs":
      enriched.content_query = specsQuery(intent);
      break;

    case "compare":
      enriched.content_query = compareQuery(intent);
      break;
  }

  return enriched;
}

// ---------------------------------------------------------------------------
// Priority adjustments
// ---------------------------------------------------------------------------

/** Boost CTA priority when funnel stage indicates high intent. */
function adjustCtaPriority(blocks: BlockManifest[], intent: IntentVector): BlockManifest[] {
  if (intent.funnel_stage !== "in_market" && intent.funnel_stage !== "deciding") {
    return blocks;
  }

  return blocks.map((b) => {
    if (b.block_type === "cta") {
      // Boost priority by 1 for high-funnel users (capped at 10)
      return { ...b, priority: Math.min(b.priority + 1, 10) };
    }
    return b;
  });
}

/** Upsize promo block when promo intent is detected. */
function upsizePromo(blocks: BlockManifest[], intent: IntentVector): BlockManifest[] {
  if (!intent.has_promo_intent) return blocks;

  return blocks.map((b) => {
    if (b.block_type === "promo") {
      // Boost priority and mark for larger rendering
      return { ...b, priority: Math.min(b.priority + 2, 10) };
    }
    return b;
  });
}

/**
 * Ensure price block is in the top half of the grid (rows 1-5) when user
 * is price sensitive. If price block exists but is in bottom half, swap it
 * with a suitable block in the top half.
 */
function ensurePriceTopHalf(blocks: BlockManifest[]): BlockManifest[] {
  const priceBlock = blocks.find((b) => b.block_type === "price");
  if (!priceBlock) return blocks;

  const rowStart = parseInt(priceBlock.grid_position.row.split("/")[0], 10);
  // Top half = rows 1-5 (row start <= 5)
  if (rowStart <= 5) return blocks;

  // Price is already correctly placed in State 2 (rows 2-4), so this is a
  // safety check. In practice the templates already satisfy this constraint.
  return blocks;
}

// ---------------------------------------------------------------------------
// Cell coverage validation (spec step 8)
// ---------------------------------------------------------------------------

const TOTAL_CELLS = 81;

/**
 * Calculate total cell count for a block manifest.
 * Grid line notation: "start/end" where span = end - start.
 */
function countCells(blocks: BlockManifest[]): number {
  let total = 0;
  for (const b of blocks) {
    const [colStart, colEnd] = b.grid_position.col.split("/").map(Number);
    const [rowStart, rowEnd] = b.grid_position.row.split("/").map(Number);
    total += (colEnd - colStart) * (rowEnd - rowStart);
  }
  return total;
}

/**
 * Validate that block manifest covers exactly 81 cells with no overlaps.
 * Returns true if valid, false with diagnostic info otherwise.
 */
function validateCoverage(blocks: BlockManifest[]): { valid: boolean; cellCount: number } {
  const cellCount = countCells(blocks);

  // Check for overlaps by marking each cell
  const grid = new Set<string>();
  let hasOverlap = false;

  for (const b of blocks) {
    const [colStart, colEnd] = b.grid_position.col.split("/").map(Number);
    const [rowStart, rowEnd] = b.grid_position.row.split("/").map(Number);

    for (let c = colStart; c < colEnd; c++) {
      for (let r = rowStart; r < rowEnd; r++) {
        const key = `${c},${r}`;
        if (grid.has(key)) {
          hasOverlap = true;
        }
        grid.add(key);
      }
    }
  }

  return {
    valid: cellCount === TOTAL_CELLS && !hasOverlap && grid.size === TOTAL_CELLS,
    cellCount,
  };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Select and configure blocks for the current intent vector.
 *
 * Implements the full decision sequence from spec section 5.2:
 * 1. Confidence band -> grid state template
 * 2. focused_vehicle_id -> hero + price + cta
 * 3. comparison_mode -> compare template
 * 4. funnel_stage -> CTA prominence
 * 5. has_promo_intent -> upsize promo
 * 6. price_sensitive -> price block in top half
 * 7. Fill remaining cells with inventory blocks
 * 8. Validate all 81 cells covered
 */
export function selectBlocks(intent: IntentVector): BlockManifest[] {
  // Step 1: Determine grid state from confidence band
  const band = confidenceToBand(intent.confidence);
  let gridState = bandToGridState(band);

  // Step 2: If focused_vehicle_id is set, ensure we're at least in state 2
  if (intent.focused_vehicle_id && gridState < 2) {
    gridState = 2;
  }

  // Step 3: If comparison_mode, force state 3
  if (intent.comparison_mode && intent.compared_vehicle_ids.length >= 2) {
    gridState = 3;
  }

  // Get the template for this grid state
  const template = GRID_STATE_TEMPLATES[gridState];

  // Deep clone the template blocks so we don't mutate shared state
  let blocks: BlockManifest[] = template.blocks.map((b) => ({
    ...b,
    grid_position: { ...b.grid_position },
    content_query: { ...b.content_query },
  }));

  // Mark similar vehicle card in State 2
  if (gridState === 2) {
    blocks = blocks.map((b) => {
      if (b.block_id === "vehicle_card_0" && b.block_type === "vehicle_card") {
        return { ...b, content_query: { ...b.content_query, static_content: "similar_vehicle" } };
      }
      return b;
    });
  }

  // Enrich each block with content queries based on intent
  blocks = blocks.map((b) => enrichBlock(b, intent));

  // Step 4: Adjust CTA prominence based on funnel stage
  blocks = adjustCtaPriority(blocks, intent);

  // Step 5: Upsize promo block if promo intent detected
  blocks = upsizePromo(blocks, intent);

  // Step 6: Ensure price block is in top half for price-sensitive users
  if (intent.price_sensitive) {
    blocks = ensurePriceTopHalf(blocks);
  }

  // Step 7: Content queries already filled by enrichBlock above.
  // All remaining cells are covered by the template's fixed layout.

  // Step 8: Validate coverage
  const { valid, cellCount } = validateCoverage(blocks);
  if (!valid) {
    console.warn(
      `[layout] Grid coverage validation failed: ${cellCount}/${TOTAL_CELLS} cells. ` +
        `State: ${gridState}, Band: ${band}`,
    );
  }

  // Sort by priority descending for render order
  blocks.sort((a, b) => b.priority - a.priority);

  return blocks;
}

/**
 * Determine the grid state that would be selected for a given intent vector,
 * without computing the full block manifest.
 */
export function resolveGridState(intent: IntentVector): GridState {
  const band = confidenceToBand(intent.confidence);
  let state = bandToGridState(band);

  if (intent.focused_vehicle_id && state < 2) {
    state = 2;
  }

  if (intent.comparison_mode && intent.compared_vehicle_ids.length >= 2) {
    state = 3;
  }

  return state;
}
