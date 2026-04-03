// ---------------------------------------------------------------------------
// Layout Engine -- Core Types
// Derived from platform-spec-liquid.md sections 5, 6, 7
// ---------------------------------------------------------------------------

import type { InventoryFilter, SortField } from "@/lib/inventory/types";
import type { GridState } from "@/lib/intent/types";

// ---------------------------------------------------------------------------
// Block Types (spec section 6.1)
// ---------------------------------------------------------------------------

/** Every block type the layout engine can place on the grid. */
export type BlockType =
  | "intent"
  | "hero"
  | "vehicle_card"
  | "browse"
  | "filter"
  | "trust"
  | "editorial"
  | "promo"
  | "price"
  | "cta"
  | "specs"
  | "compare";

// ---------------------------------------------------------------------------
// Grid Position (spec section 5.1)
// ---------------------------------------------------------------------------

/**
 * CSS Grid line notation for a block's placement.
 *
 * Values use 1-indexed grid line numbers in the format "start/end".
 * Example: { col: "1/10", row: "1/2" } occupies columns 1-9, row 1 (9x1).
 */
export interface GridPosition {
  /** Column start/end in CSS grid-column notation, e.g. "1/10", "4/8". */
  col: string;
  /** Row start/end in CSS grid-row notation, e.g. "1/2", "2/5". */
  row: string;
}

// ---------------------------------------------------------------------------
// Content Query (spec section 5.3)
// ---------------------------------------------------------------------------

/**
 * Structured query attached to each block to populate it from the inventory
 * API or CMS layer.
 */
export interface ContentQuery {
  /** Inventory filter criteria matching the vehicle data model. */
  inventory_filter?: InventoryFilter;
  /** Sort field for inventory results. */
  sort?: SortField;
  /** Maximum number of results to fetch. */
  limit?: number;
  /** Static content key for non-inventory blocks (editorial, promo, trust). */
  static_content?: string;
  /** Specific vehicle ID when block targets a single listing. */
  vehicle_id?: string;
}

// ---------------------------------------------------------------------------
// Block Manifest (spec section 5.3)
// ---------------------------------------------------------------------------

/**
 * A single block in the layout engine's output manifest.
 * Describes what to render, where, and with what data.
 */
export interface BlockManifest {
  /** Unique identifier for this block instance (e.g. "hero_0", "vehicle_card_2"). */
  block_id: string;
  /** The block type from the block library. */
  block_type: BlockType;
  /** Grid placement using CSS grid line notation. */
  grid_position: GridPosition;
  /** Query to populate the block's content. */
  content_query: ContentQuery;
  /** Render priority (higher = rendered first, used for stagger delays). */
  priority: number;
}

// ---------------------------------------------------------------------------
// Grid State Template (spec section 7)
// ---------------------------------------------------------------------------

/**
 * A complete grid state definition: the state identifier and the full list
 * of blocks that fill all 81 cells of the 9x9 grid.
 */
export interface GridStateTemplate {
  /** Numeric grid state identifier (0-3). */
  state: GridState;
  /** Ordered block manifest covering all 81 grid cells. */
  blocks: BlockManifest[];
}

// ---------------------------------------------------------------------------
// Reassembly Config (spec section 9.2)
// ---------------------------------------------------------------------------

/**
 * Timing configuration for grid reassembly animations.
 * All durations in milliseconds.
 */
export interface ReassemblyConfig {
  /** Duration for existing blocks to fade out (ms). */
  duration_out: 200;
  /** Duration for new blocks to fade in (ms). */
  duration_in: 300;
  /** Stagger delays by priority tier (ms). */
  stagger_delays: {
    /** Priority 9-10: immediate. */
    highest: 0;
    /** Priority 7-8. */
    high: 60;
    /** Priority 5-6. */
    medium: 120;
    /** Priority 1-4. */
    low: 180;
  };
  /** Minimum time between reassemblies (ms). */
  cooldown: 1500;
}
