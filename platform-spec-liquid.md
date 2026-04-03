# Liquid Intent Automotive Platform — Platform Spec
**Version:** 2.0  
**Model:** Intent-adaptive, modular grid UI  
**Replaces:** Template-based page architecture

---

## Table of Contents

1. [Platform Philosophy](#1-platform-philosophy)
2. [Architecture Overview](#2-architecture-overview)
3. [Signal Layer](#3-signal-layer)
4. [Intent Vector Schema](#4-intent-vector-schema)
5. [Layout Engine](#5-layout-engine)
6. [Block Library](#6-block-library)
7. [Grid State Definitions](#7-grid-state-definitions)
8. [UTM-to-Intent Mapping](#8-utm-to-intent-mapping)
9. [Reassembly Rules](#9-reassembly-rules)
10. [Vehicle Data Model](#10-vehicle-data-model)
11. [Filter Schema](#11-filter-schema)
12. [Lead Capture & CTA Rules](#12-lead-capture--cta-rules)
13. [Session Continuity & Personalization](#13-session-continuity--personalization)
14. [Technical Requirements](#14-technical-requirements)
15. [Design Principles](#15-design-principles)

---

## 1. Platform Philosophy

This platform treats the website not as a set of page templates but as a single adaptive surface that reorganizes itself around what a user wants. The "homepage," "search results page," and "vehicle detail page" are not fixed destinations — they are emergent configurations of the same modular grid, assembled in real time based on detected intent.

### Core Premise

Every user arrives with some level of intent. That intent may be explicit (they typed a query), inferred (their UTM parameters reveal what ad they clicked), or latent (their session history suggests a returning in-market shopper). The platform reads that signal at the earliest possible moment and configures the experience to match it — before the user has to do anything.

As the user interacts, each action is a new signal. Clicks, dwell time, filter selections, and scroll depth all update the intent model. When the model crosses a threshold, the grid reassembles around the new understanding. The user experiences this as a page that responds to them rather than a page they have to navigate.

### What This Replaces

| Traditional model | Liquid intent model |
|---|---|
| Fixed page templates | Single adaptive grid surface |
| User navigates to the right page | Page reconfigures around the user |
| Intent captured via search box | Intent captured from UTMs, text, audio, behavior |
| SRP and VDP are separate pages | SRP and VDP are grid configurations |
| Same layout for every visitor | Layout derived from each visitor's intent vector |

### Key Metric Impact

- Reduces clicks-to-vehicle from avg 3.2 to target < 1.5
- UTM-matched landing states increase lead conversion vs. generic homepage
- Confidence-gated reassembly prevents disorientation while maintaining relevance

---

## 2. Architecture Overview

The platform runs on three stacked layers. Each layer feeds into the next.

```
┌─────────────────────────────────────────────────────────────┐
│  SIGNAL LAYER                                               │
│  UTM parsing · Text/voice NLP · Behavioral event stream     │
│  Outputs: raw signals with source and timestamp             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  INTENT ENGINE                                              │
│  Signal fusion · Confidence scoring · Vector state machine  │
│  Outputs: intent vector (typed fields + confidence score)   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYOUT ENGINE                                              │
│  Block selection · Grid composition · Reassembly gating     │
│  Outputs: block manifest (type, footprint, content query)   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  RENDER LAYER                                               │
│  9x9 CSS grid · Block components · Inventory API calls      │
│  Outputs: live DOM, animations, lead forms                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Signal Layer

The signal layer is responsible for collecting all available information about user intent and producing typed signal objects. It fires continuously throughout the session.

### 3.1 Signal Types

| Signal type | Source | Fires when | Priority |
|---|---|---|---|
| `utm` | URL parameters | Page load | Highest |
| `session_history` | Cookie / localStorage | Page load | High |
| `text_query` | Search input | User submits text | High |
| `voice_query` | Audio input | User submits voice | High |
| `vehicle_click` | DOM event | User clicks vehicle card | High |
| `filter_apply` | DOM event | User sets a filter | Medium |
| `compare_add` | DOM event | User adds to compare | Medium |
| `scroll_depth` | Scroll observer | User reaches 50%, 75%, 90% | Low |
| `dwell_time` | Timer | User idle on block for 3s+ | Low |
| `back_navigation` | History API | User navigates back | Medium |

### 3.2 UTM Signal Parsing

UTMs are read on page load before any render. The signal layer maps UTM parameters to intent dimensions.

**Parameters read:**

| UTM param | Maps to | Example |
|---|---|---|
| `utm_source` | Traffic origin (informs trust weighting) | `facebook`, `google`, `email` |
| `utm_medium` | Channel (informs funnel stage assumption) | `cpc`, `retargeting`, `organic` |
| `utm_campaign` | Audience segment label (primary intent signal) | `inmarket_truck_buyers_pa` |
| `utm_content` | Creative variant (informs specific vehicle or offer) | `f150_xlt_0apr` |
| `utm_term` | Keyword (for SEM, maps to model/make intent) | `used+ford+f150+philadelphia` |

**UTM campaign label parsing rules:**

Campaign labels should follow a structured naming convention for maximum signal extraction:
```
{audience_stage}_{body_or_make}_{condition}_{geo}
```
Example: `inmarket_truck_used_philadelphia` maps to:
- Funnel stage: in-market
- Body type: truck
- Condition: used
- Geo filter: Philadelphia

Labels that don't match the convention fall back to keyword matching against a term dictionary.

### 3.3 Text and Voice Query Processing

Text and voice inputs are processed through an intent extraction pipeline:

**Extraction targets:**

| Attribute | Example phrase | Extracted value |
|---|---|---|
| Condition | "used", "pre-owned", "new", "certified" | `condition: "used"` |
| Body type | "truck", "SUV", "family car", "something sporty" | `body: "truck"` |
| Make | "Ford", "Toyota", "domestic" | `make: "Ford"` |
| Model | "F-150", "Camry", "something like a Tacoma" | `model: "F-150"` |
| Price max | "under $40k", "around $35,000", "cheap" | `price_max: 40000` |
| Price min | "at least $30k", "nothing under $25,000" | `price_min: 30000` |
| Mileage max | "low mileage", "under 50,000 miles" | `mileage_max: 50000` |
| Feature intent | "good on gas", "safe for kids", "tow package" | `features: ["tow_package"]` |
| Fuel type | "electric", "hybrid", "gas" | `fuel: "electric"` |
| Urgency | "today", "this weekend", "just looking" | `urgency: "high"` |

**Confidence rules for text extraction:**

- Exact make/model match: confidence += 0.30
- Recognized body type: confidence += 0.20
- Price range stated: confidence += 0.15
- Condition stated: confidence += 0.10
- Feature keywords matched: confidence += 0.05 per feature (max 0.15)
- Vague or exploratory phrasing ("just browsing", "not sure"): confidence -= 0.20

### 3.4 Behavioral Signal Processing

Behavioral signals update the intent vector continuously during the session.

**Click signals:**
- Click on a vehicle card: extract make, model, year, body, price range from that vehicle. Merge into intent vector with weight 0.8.
- Click on a body style tile: set body type with confidence 0.6.
- Click on a promotion: flag `has_promo_intent: true`. Do not infer vehicle preference from promotion click alone.
- Click "Compare": flag `comparison_mode: true`. Lock the current vehicle pair.

**Dwell signals:**
- 3s+ dwell on a vehicle card: soft upweight that vehicle's attributes in intent vector (weight 0.3).
- 3s+ dwell on a price block: flag `price_sensitive: true`.
- 3s+ dwell on a feature section: upweight matched features.

**Back navigation:**
- User presses back after vehicle focus: reduce confidence on last vehicle's make/model by 0.3. Do not fully revert — the body type and price range signals remain.
- User presses back after compare: exit comparison mode, return to vehicle focus state for the first vehicle.

### 3.5 Signal Priority and Conflict Resolution

When signals conflict (e.g., UTM implies new vehicles but user types "used"), resolution rules apply:

| Conflict type | Resolution |
|---|---|
| Text query vs. UTM | Text query wins. User is telling you something the ad didn't predict. |
| Click vs. filter | Click wins for vehicle-specific attributes (make, model). Filter wins for range attributes (price, mileage). |
| Dwell vs. click | Click always supersedes dwell on the same block. |
| Session history vs. current session | Current session signals override history after 2+ new signals. |
| Voice vs. text | Most recent input wins. |

---

## 4. Intent Vector Schema

The intent vector is the unified output of the signal layer. It is a typed object that the layout engine reads to determine grid composition.

### 4.1 Schema Definition

```typescript
interface IntentVector {
  // Vehicle attributes
  condition:     "new" | "used" | "cpo" | null;
  body:          BodyType | null;           // "truck" | "suv" | "sedan" | ...
  make:          string | null;             // "Ford"
  model:         string | null;             // "F-150"
  year_min:      number | null;
  year_max:      number | null;
  price_min:     number | null;
  price_max:     number | null;
  mileage_max:   number | null;
  fuel:          FuelType | null;
  drivetrain:    DrivetrainType | null;
  features:      string[];                  // ["tow_package", "heated_seats"]

  // Funnel & behavioral state
  funnel_stage:  "browsing" | "considering" | "in_market" | "deciding" | null;
  urgency:       "low" | "medium" | "high" | null;
  price_sensitive: boolean;
  comparison_mode: boolean;
  has_promo_intent: boolean;

  // Focused vehicle (when user has clicked into a specific listing)
  focused_vehicle_id: string | null;
  compared_vehicle_ids: string[];           // max 3

  // Confidence and metadata
  confidence:    number;                    // 0.0 to 1.0
  primary_signal: SignalType;              // what drove the last major state change
  signal_history: SignalEvent[];           // ordered log of contributing signals
}
```

### 4.2 Confidence Score Bands

The confidence score gates which grid state is rendered.

| Band | Score range | Interpretation | Grid state triggered |
|---|---|---|---|
| Undetermined | 0.0 – 0.25 | No clear intent | Discovery (State 0) |
| Broad | 0.26 – 0.55 | Category-level intent | Broad intent (State 1) |
| Specific | 0.56 – 0.85 | Make/model/price intent | Vehicle focus (State 2) |
| Decisive | 0.86 – 1.0 | Ready to act | Conversion focus (State 3+) |

### 4.3 Intent Vector State Machine

```
[UNDETERMINED] ──── text/voice query ──────────────────► [BROAD]
     │                                                       │
     │── utm_campaign match (confidence ≥ 0.40) ──────────► [BROAD]
     │                                                       │
     │                                               vehicle_click
     │                                                       │
     │                                                       ▼
     │── utm_content match (confidence ≥ 0.65) ──────► [SPECIFIC]
                                                            │
                                                     compare_add
                                                            │
                                                            ▼
                                                       [DECISIVE]
                                                            │
                                                    back_navigation
                                                            │
                                                            ▼
                                                  (revert one level)
```

**Revert rules:**
- Back navigation reverts one confidence band, not to zero.
- Filter removal does not revert the state, it only updates matching inventory.
- Session expiry (30 min idle) resets to Undetermined but preserves signal history in cookie for next session.

---

## 5. Layout Engine

The layout engine reads the intent vector and outputs a block manifest: an ordered list of block types, each with a grid footprint (column span, row span) and a content query to populate it.

### 5.1 The 9x9 Grid

The page is divided into a 9-column × 9-row grid. All blocks occupy one or more contiguous cells. Blocks can span across columns and rows to create variable-sized surfaces.

**Grid rules:**
- Every cell must be occupied. No empty cells in any grid state.
- Blocks may not overlap.
- The intent capture bar always occupies row 1 (full width: 9×1).
- Total cells: 81. Row 1 is always the intent bar (9 cells), leaving 72 cells for content blocks.
- Column widths are equal (1fr each). Row heights are equal (configurable; default 52px desktop, 44px mobile).
- Gap between cells: 6px desktop, 4px mobile.

**Block footprint notation:**

```
col_start/col_end  ×  row_start/row_end
```
Where values are CSS Grid line numbers (1-indexed). A block at `1/4 × 2/5` spans columns 1–3 and rows 2–4 (3 cols × 3 rows = 9 cells).

### 5.2 Block Selection Logic

For a given intent vector, the layout engine runs this decision sequence:

```
1. Read confidence band → select grid state template
2. Read focused_vehicle_id → if set, include hero + price + cta blocks
3. Read comparison_mode → if true, switch to compare template
4. Read funnel_stage → adjust CTA block prominence accordingly
5. Read has_promo_intent → if true, upsize promo block footprint
6. Read price_sensitive → if true, ensure price block is in top half of grid
7. Fill remaining cells with inventory blocks matching intent vector filters
8. Validate: all 81 cells covered. Expand/shrink blocks to fill gaps.
```

### 5.3 Content Queries per Block

Each block in the manifest carries a structured content query used to populate it from the inventory API:

```typescript
interface BlockManifest {
  block_id: string;
  block_type: BlockType;
  grid_position: { col: string; row: string };  // e.g. "1/7", "2/7"
  content_query: {
    inventory_filter?: InventoryFilter;   // matches vehicle data model
    sort?: SortField;
    limit?: number;
    static_content?: string;             // for non-inventory blocks
  };
  priority: number;                      // render priority for lazy loading
}
```

---

## 6. Block Library

Each block type has a defined role, minimum and maximum footprint, and rules for which intent states it appears in.

### 6.1 Block Type Reference

#### Intent Capture (`intent`)
- **Role:** Primary input for text and voice intent. Always present. Updates on reassembly to reflect current intent state (shows populated query string when intent is active).
- **Fixed footprint:** 9×1 (full width, row 1 always)
- **States:** All
- **Content:** Text input, voice button, current intent tags (pills), "Refine" affordance

#### Filter Panel (`filter`)
- **Role:** Structured attribute filtering. Appears when inventory browsing is the primary mode.
- **Min footprint:** 2×6
- **Max footprint:** 2×8
- **States:** Broad intent, Specific intent (as collapsed rail)
- **Content:** Condition, make, model, year, price, mileage, body, color, trans, features, distance
- **Collapses to:** Single-row chip strip when intent confidence > 0.80

#### Vehicle Hero (`hero`)
- **Role:** Primary vehicle surface. Full visual treatment of a specific listing.
- **Min footprint:** 4×4
- **Max footprint:** 6×5
- **States:** Specific intent, Decisive, Compare (one per compared vehicle)
- **Content:** Gallery, year/make/model/trim, mileage, condition badge, price teaser

#### Vehicle Card (`vehicle_card`)
- **Role:** Inventory result tile. Multiple instances in a grid.
- **Min footprint:** 3×3
- **Max footprint:** 4×4
- **States:** Discovery (3 cards), Broad intent (4–6 cards), Specific intent (2 similar vehicles below hero)
- **Content:** Lead photo, identity, key specs, sale price, savings badge, View/Save/Compare

#### Browse by Type (`browse`)
- **Role:** Body style discovery for low-intent users.
- **Min footprint:** 3×3
- **Max footprint:** 4×4
- **States:** Discovery only
- **Content:** Icon tiles for Sedan, SUV, Truck, Crossover, Van, Convertible, EV/Hybrid. Each links to Broad intent state for that body type.

#### Trust Signals (`trust`)
- **Role:** Social proof and credibility. Prominent in early funnel, secondary in late funnel.
- **Min footprint:** 2×2
- **Max footprint:** 3×3
- **States:** Discovery, Broad intent (small), Vehicle focus (small)
- **Content:** Star rating, review count, certifications, dealer count, response time SLA

#### Content / Editorial (`editorial`)
- **Role:** Buying guides, comparisons, EV explainers. Keeps discovery-mode users engaged.
- **Min footprint:** 4×2
- **Max footprint:** 5×2
- **States:** Discovery only
- **Content:** CMS-driven articles. Personalized by body type when available.

#### Active Offer / Promotion (`promo`)
- **Role:** Manufacturer incentives, dealer specials, financing offers.
- **Min footprint:** 3×2
- **Max footprint:** 7×2
- **States:** All (size varies by `has_promo_intent`)
- **Content:** Offer headline, savings amount, expiry date, CTA button. Filtered to match current intent vector (e.g., truck-specific offers when body type is truck).

#### Price Breakdown (`price`)
- **Role:** Full transparent pricing block. Appears when a specific vehicle is in focus.
- **Min footprint:** 3×3
- **Max footprint:** 3×3 (fixed)
- **States:** Specific intent, Decisive, Compare
- **Content:** MSRP, dealer discount, manufacturer incentive, sale price, est. monthly payment, finance terms. Expandable.

#### Conversion CTAs (`cta`)
- **Role:** Lead capture entry points. Multiple CTA options in one block.
- **Min footprint:** 3×3
- **Max footprint:** 3×5
- **States:** Specific intent, Decisive, Compare
- **Content:** Get best price (primary), Schedule test drive, Apply for financing, Call dealer. Click-to-call on mobile.

#### Spec Sheet (`specs`)
- **Role:** Full vehicle specification detail. Appears after a vehicle is focused.
- **Min footprint:** 4×3
- **Max footprint:** 9×2
- **States:** Specific intent, Decisive, Compare (full-width in compare mode)
- **Content:** Tabbed: Overview, Features, Packages, Options, Warranty

#### Compare Tray (`compare`)
- **Role:** Side-by-side comparison header. Shows both vehicles being compared.
- **Fixed footprint:** 9×1 (full width, row 2 when active)
- **States:** Decisive (compare mode only)
- **Content:** Two vehicle thumbnails + names, "Exit compare" option, key differentiators highlighted

### 6.2 Block Priority by Intent State

Priority determines render order and z-index during reassembly. Higher = rendered first.

| Block | Discovery | Broad intent | Vehicle focus | Compare |
|---|---|---|---|---|
| intent | 10 | 10 | 10 | 10 |
| hero | — | — | 9 | 9 |
| price | — | — | 9 | 8 |
| cta | — | — | 9 | 8 |
| vehicle_card | 7 | 9 | 6 | — |
| filter | — | 8 | 5 | — |
| compare | — | — | — | 10 |
| specs | — | — | 7 | 9 |
| promo | 5 | 6 | 5 | 5 |
| trust | 7 | 4 | 4 | — |
| browse | 8 | — | — | — |
| editorial | 4 | — | — | — |

---

## 7. Grid State Definitions

Four primary grid states cover the full user journey. Each state fully occupies all 81 grid cells.

### State 0: Discovery (Undetermined intent)

**Trigger:** Confidence score 0.0–0.25, no UTM match, no session history  
**User interpretation:** "I don't know what I want yet, show me what's available"

```
Columns:  1    2    3    4    5    6    7    8    9
Row 1:  [─────────── Intent capture (9×1) ───────────]
Row 2:  [─Browse──] [────── Hero vehicle ────] [─Trust]
Row 3:  [─by type─] [────── (featured) ──────] [──────]
Row 4:  [──(3×3)──] [────────── (4×3) ───────] [(2×3)]
Row 5:  [─ V.Card─] [─── V.Card ────] [── V.Card ────]
Row 6:  [── (3×3)─] [─── (3×3) ─────] [────── (3×3) ─]
Row 7:  [──────────] [───────────────] [──────────────]
Row 8:  [────── Promotion ──────────] [── Editorial ──]
Row 9:  [────────── (5×2) ──────────] [──── (4×2) ────]
```

**Block manifest:**

| Block | Col | Row | Footprint |
|---|---|---|---|
| intent | 1/10 | 1/2 | 9×1 |
| browse | 1/4 | 2/5 | 3×3 |
| hero | 4/8 | 2/5 | 4×3 |
| trust | 8/10 | 2/5 | 2×3 |
| vehicle_card (×3) | 1/4, 4/7, 7/10 | 5/8 each | 3×3 each |
| promo | 1/6 | 8/10 | 5×2 |
| editorial | 6/10 | 8/10 | 4×2 |

**Content queries:**
- Hero: most-favorited or dealer-featured vehicle in local inventory
- Vehicle cards: 3 highest-ranked vehicles by recency and price competitiveness
- Promo: current active offers, sorted by savings amount

---

### State 1: Broad Intent (Category-level signal detected)

**Trigger:** Confidence score 0.26–0.55; condition, body type, or price range known  
**User interpretation:** "I know roughly what I want, help me find it"

```
Columns:  1    2    3    4    5    6    7    8    9
Row 1:  [─────────── Intent capture (9×1) ───────────]
Row 2:  [─Filter──] [── V.Card ───] [──── V.Card ────]
Row 3:  [─ panel ─] [─── (3×3) ──] [───── (4×3) ────]
Row 4:  [── (2×8)─] [─────────────] [────────────────]
Row 5:  [──────────] [── V.Card ──] [──── V.Card ────]
Row 6:  [──────────] [─── (3×3) ──] [───── (4×3) ────]
Row 7:  [──────────] [─────────────] [────────────────]
Row 8:  [──────────] [──────── Promotion ─────────────]
Row 9:  [──────────] [──────── (7×2) ─────────────────]
```

**Block manifest:**

| Block | Col | Row | Footprint |
|---|---|---|---|
| intent | 1/10 | 1/2 | 9×1 |
| filter | 1/3 | 2/10 | 2×8 |
| vehicle_card (×4) | 3/6, 6/10, 3/6, 6/10 | 2/5, 2/5, 5/8, 5/8 | 3×3, 4×3, 3×3, 4×3 |
| promo | 3/10 | 8/10 | 7×2 |

**Content queries:**
- Vehicle cards: inventory matching intent vector filters, sorted by best match score
- Filter panel: pre-populated with detected intent attributes (e.g., condition checkbox pre-checked)
- Promo: offers matching detected body type / condition

---

### State 2: Vehicle Focus (Specific vehicle in view)

**Trigger:** Confidence score 0.56–0.85; `focused_vehicle_id` is set  
**User interpretation:** "I'm interested in this specific vehicle"

```
Columns:  1    2    3    4    5    6    7    8    9
Row 1:  [─────────── Intent capture (9×1) ───────────]
Row 2:  [───────────── Hero vehicle ──────] [─ Price ─]
Row 3:  [────────────── (6×5) ───────────] [── (3×3)─]
Row 4:  [─────────────────────────────────] [──────────]
Row 5:  [─────────────────────────────────] [── CTAs ──]
Row 6:  [─────────────────────────────────] [── (3×3)─]
Row 7:  [── Specs ────────] [─ V.Card ─] [── CTAs ──]
Row 8:  [────── (4×3) ────] [── (2×3) ─] [── Trust ─]
Row 9:  [─────────────────] [──────────] [── (3×2) ─]
```

**Block manifest:**

| Block | Col | Row | Footprint |
|---|---|---|---|
| intent | 1/10 | 1/2 | 9×1 |
| hero | 1/7 | 2/7 | 6×5 |
| price | 7/10 | 2/5 | 3×3 |
| cta | 7/10 | 5/8 | 3×3 |
| specs | 1/5 | 7/10 | 4×3 |
| vehicle_card (similar) | 5/7 | 7/10 | 2×3 |
| trust | 7/10 | 8/10 | 3×2 |

**Content queries:**
- Hero: `focused_vehicle_id` → full vehicle record
- Similar vehicle card: 1 vehicle matching same body/price range, different make/model
- Trust: dealer-specific ratings for the vehicle's dealer

---

### State 3: Decisive / Compare Mode

**Trigger:** `comparison_mode: true` or confidence ≥ 0.86 with `focused_vehicle_id` set  
**User interpretation:** "I'm ready to decide — show me what I need to commit"

```
Columns:  1    2    3    4    5    6    7    8    9
Row 1:  [─────────── Intent capture (9×1) ───────────]
Row 2:  [─────────── Compare tray (9×1) ─────────────]
Row 3:  [──── Vehicle A hero ─────] [── Vehicle B hero]
Row 4:  [────────── (4×4) ────────] [───── (5×4) ─────]
Row 5:  [─────────────────────────] [─────────────────]
Row 6:  [─────────────────────────] [─────────────────]
Row 7:  [──────────── Specs comparison (9×2) ─────────]
Row 8:  [────────────────────────────────────────────]
Row 9:  [────── CTAs ─────────────] [──── Promotion ──]
```

**Block manifest:**

| Block | Col | Row | Footprint |
|---|---|---|---|
| intent | 1/10 | 1/2 | 9×1 |
| compare | 1/10 | 2/3 | 9×1 |
| hero (Vehicle A) | 1/5 | 3/7 | 4×4 |
| hero (Vehicle B) | 5/10 | 3/7 | 5×4 |
| specs | 1/10 | 7/9 | 9×2 |
| cta | 1/5 | 9/10 | 4×1 |
| promo | 5/10 | 9/10 | 5×1 |

**Content queries:**
- Hero A + B: `compared_vehicle_ids[0]` and `compared_vehicle_ids[1]`
- Specs: side-by-side comparison of both vehicles' full spec records
- CTAs: separate "Get price" and "Test drive" actions for each vehicle
- Promo: financing offer applicable to either vehicle

---

## 8. UTM-to-Intent Mapping

UTM parameters are mapped to an initial intent vector before any page render. This is the highest-priority signal and sets the starting grid state.

### 8.1 Campaign Segment Mapping Table

The following table maps common campaign naming patterns to intent vector values and initial grid states.

| Campaign pattern | condition | body | funnel_stage | Initial confidence | Grid state |
|---|---|---|---|---|---|
| `inmarket_*` | null | inferred from body token | `in_market` | 0.45 | State 1 |
| `inmarket_truck_*` | null | truck | `in_market` | 0.55 | State 1 |
| `inmarket_truck_used_*` | used | truck | `in_market` | 0.65 | State 1→2 boundary |
| `retarget_vdp_*` | null | null | `considering` | 0.70 | State 2 |
| `retarget_srp_*` | null | inferred | `considering` | 0.50 | State 1 |
| `conquest_luxury_*` | new | null | `browsing` | 0.30 | State 0→1 boundary |
| `brand_awareness_*` | null | null | `browsing` | 0.20 | State 0 |
| `ev_*` | null | null | `browsing` | 0.35 | State 1 (fuel: electric) |
| `firsttime_buyer_*` | null | null | `browsing` | 0.25 | State 0 |
| `loyalty_service_*` | null | null | `in_market` | 0.40 | State 1 |

### 8.2 UTM Content Parsing

`utm_content` may carry a specific vehicle SKU or offer code. When detected:

| utm_content pattern | Action |
|---|---|
| Contains a valid stock number | Set `focused_vehicle_id`. Jump to State 2. |
| Contains offer code (e.g. `0APR60`, `EMP_PRICING`) | Set `has_promo_intent: true`. Upsize promo block. |
| Contains make + model token (e.g. `f150_xlt`) | Set make and model in intent vector. Confidence += 0.30. |
| Unrecognized format | No action. UTM campaign mapping still applies. |

### 8.3 Source and Medium Inference

| utm_source + utm_medium | Funnel stage inference | Trust weighting |
|---|---|---|
| `google` + `cpc` | `in_market` | Standard |
| `facebook` + `retargeting` | `considering` | Standard |
| `facebook` + `prospecting` | `browsing` | Higher (unknown audience) |
| `email` + `crm` | `in_market` or `loyalty` | High (known customer) |
| `google` + `organic` | `browsing` or `in_market` | Standard |
| `dealer_website` + `referral` | `in_market` | High (high intent source) |
| `(direct)` or absent | Unknown | Standard |

### 8.4 fullthrottle.ai Audience Segment Integration

When the platform is integrated with fullthrottle.ai identity resolution, UTM campaign segments can be enriched with audience-level attributes passed as URL parameters or via server-side lookup:

| Audience signal | Mapped intent attribute |
|---|---|
| Audience segment: `in_market_truck_buyer` | `body: truck`, `funnel_stage: in_market`, confidence += 0.25 |
| Audience segment: `luxury_intender` | `price_min: 50000`, confidence += 0.20 |
| Audience segment: `ev_researcher` | `fuel: electric`, confidence += 0.20 |
| First-party match: prior VDP visit | `focused_vehicle_id` (if same vehicle), confidence += 0.40 |
| First-party match: prior SRP filter state | Restore filter state, confidence += 0.30 |
| Geo signal: within 25mi of dealer | Set `distance_max: 25`, confidence += 0.05 |

---

## 9. Reassembly Rules

Reassembly is the act of dissolving the current grid and recomposing it around an updated intent vector. It must feel intentional, not chaotic.

### 9.1 Reassembly Triggers

Reassembly only fires when the following conditions are all met:

1. **Confidence delta:** New intent vector confidence differs from current rendered state's threshold by ≥ 0.15.
2. **State change:** The new confidence band is different from the currently rendered band.
3. **Cooldown:** At least 1.5 seconds have passed since the last reassembly.
4. **User not mid-scroll:** Scroll position is within the top 40% of the page, OR user has been idle for ≥ 2 seconds.

**Important:** Micro-interactions that do not cross a confidence band boundary do NOT trigger reassembly. Adding a filter chip updates inventory results within the current layout. Removing a filter chip does the same. Reassembly is reserved for state transitions.

### 9.2 Reassembly Animation Sequence

```
1. Intent bar updates immediately (no fade) — shows new query/state label
2. All non-intent-bar blocks fade to opacity 0 (duration: 200ms, ease-out)
3. Grid positions update (instant, invisible during fade)
4. New blocks fade in (duration: 300ms, ease-in, staggered by block priority)
5. Stagger delay: priority 9-10 = 0ms, priority 7-8 = 60ms, priority 5-6 = 120ms, priority 1-4 = 180ms
```

Total reassembly time: ~500ms perceived (200ms out + 300ms in with stagger).

### 9.3 Partial Reassembly

When only content changes within the same grid state (e.g., filter applied, sort changed), blocks do not animate. Only the block's internal content refreshes with a 150ms crossfade.

### 9.4 Reassembly Anti-Patterns

These conditions block reassembly even if the confidence threshold is met:

- User has an open lead form or modal
- User is in the middle of a click action (mousedown held)
- A payment calculator or trade-in tool is actively in use
- The page has been open for < 3 seconds (prevents snap-to on load for borderline UTM confidence scores)

### 9.5 Intent Persistence and Back Navigation

- Filter state is written to URL params on every change. Sharing the URL restores the intent vector.
- Session state is written to sessionStorage. Browser back button restores the previous grid state without a reassembly animation (instant restore).
- Cross-session history is written to a 30-day cookie. Returning visitors start from their last known intent band, subject to decay (confidence ×0.7 on return visit > 24h, ×0.4 on return visit > 7 days).

---

## 10. Vehicle Data Model

Fields tagged: **[SRP]** appears on vehicle card · **[VDP]** appears in vehicle focus state · **[BOTH]** both · **[F]** filterable

### 10.1 Identity

| Field | Type | Example | Tags |
|---|---|---|---|
| vehicle_id | String (UUID) | `veh_a3f8c2` | Internal |
| year | Integer | 2024 | [BOTH] [F] |
| make | String | Toyota | [BOTH] [F] |
| model | String | Camry | [BOTH] [F] |
| trim | String | XSE V6 | [BOTH] [F] |
| condition | Enum | New / Used / CPO | [BOTH] [F] |
| body_style | Enum | Sedan / SUV / Truck / Van / Coupe / Convertible / Wagon / Hatchback | [BOTH] [F] |
| stock_number | String | T240851 | [VDP] |
| vin | String (17) | 4T1BF3EK5AU561234 | [VDP] |

### 10.2 Appearance

| Field | Type | Example | Tags |
|---|---|---|---|
| exterior_color_label | String | Midnight Black Metallic | [BOTH] [F] |
| exterior_color_hex | Hex | #1a1a1a | [BOTH] |
| interior_color | String | Black Perforated Leather | [BOTH] [F] |
| interior_material | Enum | Leather / Cloth / Leatherette / Alcantara | [VDP] |

### 10.3 Mechanical

| Field | Type | Example | Tags |
|---|---|---|---|
| transmission | Enum | Automatic / Manual / CVT / DCT | [BOTH] [F] |
| drivetrain | Enum | FWD / AWD / RWD / 4WD | [BOTH] [F] |
| engine | String | 3.5L V6 DOHC 24V | [BOTH] |
| cylinders | Integer | 6 | [VDP] [F] |
| horsepower | Integer | 301 | [VDP] |
| torque | Integer | 267 | [VDP] |
| fuel_type | Enum | Gasoline / Diesel / Hybrid / Electric / PHEV | [BOTH] [F] |
| mpg_city | Integer | 22 | [BOTH] |
| mpg_hwy | Integer | 31 | [BOTH] |
| ev_range_miles | Integer | 358 | [BOTH] |
| mileage | Integer | 34210 | [BOTH] [F] |

### 10.4 Pricing

| Field | Type | Example | Tags |
|---|---|---|---|
| msrp | Currency | 38450 | [BOTH] |
| sale_price | Currency | 34995 | [BOTH] [F] |
| dealer_discount | Currency | 2500 | [VDP] |
| manufacturer_incentive | Currency | 955 | [VDP] |
| total_savings | Currency (calc) | 3455 | [BOTH] |
| est_monthly_payment | Currency (calc) | 589 | [BOTH] |
| finance_apr | Float | 5.9 | [VDP] |
| finance_term_months | Integer | 72 | [VDP] |
| finance_down_payment | Currency | 3000 | [VDP] |

**Calculation rules:**
- `total_savings = msrp - sale_price`
- `est_monthly_payment = PMT(finance_apr/12, finance_term_months, -(sale_price - finance_down_payment))`
- Both calculated fields are computed server-side and cached per vehicle record.

### 10.5 Packages, Add-ons & Features

| Field | Type | Example | Tags |
|---|---|---|---|
| factory_packages | String[] | ["Technology Pkg", "Premium Audio Pkg"] | [VDP] [F] |
| addon_options | String[] | ["Roof rack", "Cargo liner"] | [VDP] |
| standard_features | String[] | ["Apple CarPlay", "Heated seats"] | [VDP] [F] |
| safety_features | String[] | ["Blind spot monitor", "Lane keep assist"] | [VDP] [F] |
| warranty_basic | String | "3yr / 36,000 mi" | [VDP] |
| warranty_powertrain | String | "5yr / 60,000 mi" | [VDP] |
| warranty_roadside | String | "3yr / 36,000 mi" | [VDP] |

### 10.6 Media & Metadata

| Field | Type | Notes | Tags |
|---|---|---|---|
| photos | String[] | Ordered. Index 0 is lead photo on vehicle card. | [BOTH] |
| video_url | String | Walkaround or 360° spin | [VDP] |
| days_on_lot | Integer | Used for aging signals and deal flagging | [VDP] |
| dealer_id | String | Foreign key to dealer record | [BOTH] |
| dealer_distance_miles | Float | Calculated from user zip at query time | [BOTH] [F] |
| carfax_flag | Boolean | 1-owner, accident-free | [VDP] |
| carfax_url | String | Deep link to report | [VDP] |
| price_drop_flag | Boolean | Sale price dropped in last 7 days | [SRP] |
| new_listing_flag | Boolean | Listed within last 48 hours | [SRP] |

---

## 11. Filter Schema

Filters modify inventory results within the current grid state without triggering a reassembly. All filter values are written to URL params.

### 11.1 Filter Definitions

| Filter | UI type | Values |
|---|---|---|
| Condition | Toggle multi-select | New · Used · Certified Pre-Owned |
| Price range | Dual-handle slider + text inputs | $5,000–$150,000+. Presets: Under $20k / $20–30k / $30–50k / $50k+ |
| Make | Searchable checklist | All makes, with live result count. Grouped: Domestic / Import / Luxury |
| Model | Searchable checklist (make-dependent) | Populates from selected make(s) |
| Year range | Dual dropdown (From / To) | Current year back 15 years |
| Mileage max | Single-handle slider | Presets: 15k / 30k / 50k / 75k / 100k / Any |
| Body style | Icon grid | Sedan · Coupe · SUV · Crossover · Truck · Van · Convertible · Wagon · Hatchback |
| Exterior color | Hex swatch grid | White · Black · Silver · Gray · Red · Blue · Green · Brown · Gold · Other |
| Transmission | Checklist | Automatic · Manual · CVT · Dual-Clutch |
| Drivetrain | Checklist | FWD · AWD · RWD · 4WD |
| Fuel type | Checklist | Gasoline · Diesel · Hybrid · PHEV · Electric · Flex Fuel |
| Features | Tag multi-select | Sunroof · Heated seats · Apple CarPlay · Android Auto · Backup camera · Blind spot · Third row · Tow package · Remote start · Navigation |
| Distance from zip | Zip input + radius | 10 / 25 / 50 / 100 / 200 / Any miles. Auto-detects user location. |
| Special offers | Boolean flags | Dealer discount active · Manufacturer incentive active · Price drop (7d) · New listing (48h) |

### 11.2 Filter UX Rules

- Result count updates in real time as each filter changes (before user taps "Apply" on mobile)
- Filters with 0 matching results are grayed out and non-interactive
- Applied filters appear as removable chips above the inventory grid
- On mobile, filters live in a full-screen bottom drawer triggered by a "Filters" button
- Filter state survives back navigation (browser back does not reset filters)
- Filter state is reflected in the URL: `?condition=used&body=truck&price_max=40000`
- "Save this search" captures current URL params + email for inventory alert emails
- Pre-population: when intent vector has high-confidence values, corresponding filters are pre-checked on State 1 entry

---

## 12. Lead Capture & CTA Rules

### 12.1 CTA Hierarchy

Every grid state has at least one CTA entry point. Priority order:

1. **Get best price** — Primary. Short lead form (name, email, phone). Appears in `cta` block and as sticky element on mobile.
2. **Schedule test drive** — Secondary. Date/time picker. Inline or modal.
3. **Apply for financing** — Tertiary. Links to credit application pre-populated with vehicle.
4. **Call dealer** — Quaternary. Click-to-call on mobile. Tracking number for attribution. Shows dealer hours.

### 12.2 Lead Form Fields

**Minimum required (Get best price):**
- First name
- Email address
- Phone number (optional on first attempt, required on retry)

**Optional fields (shown on expand):**
- Preferred contact time
- Trade-in intent (yes/no)
- Finance intent (yes/no)
- Zip code (pre-filled from detection)

**Form behavior:**
- Inline validation (not on submit)
- Auto-fill from browser where permitted
- On submission: show confirmation, log lead event, trigger dealer CRM webhook
- Do not show CAPTCHA on first attempt; apply friction only on 3+ submissions from same session

### 12.3 CTA Adaptation by Intent State

| Grid state | Primary CTA prominence | Secondary CTAs visible |
|---|---|---|
| Discovery | Hidden (no vehicle in focus) | — |
| Broad intent | Per vehicle card: "View details" only | — |
| Vehicle focus | Full CTA block in right column | All 4 CTAs |
| Compare | Duplicate CTA per vehicle | "Get price" for each |

### 12.4 Mobile Sticky CTA

On mobile, once a vehicle is in focus (State 2+), a sticky bar appears at the bottom of the screen:
- Sale price (large)
- "Get price" button (primary, full width)
- Collapses to icon strip when user scrolls up (to not obscure content)

---

## 13. Session Continuity & Personalization

### 13.1 Within-Session Persistence

- Intent vector state is held in memory (JS module state)
- Filter state is written to URL params on every change
- Grid state is written to sessionStorage on every reassembly
- Browser back/forward restores prior grid state from sessionStorage (instant, no animation)

### 13.2 Cross-Session Persistence

**Cookie: `intent_vector`** (30-day expiry, first-party)
- Stores: last confidence band, primary signal type, body type, condition, price range, focused_vehicle_id if any
- On return visit: restores intent vector with confidence decay applied
  - < 24h since last visit: confidence × 0.85
  - 1–7 days: confidence × 0.60
  - 7–30 days: confidence × 0.40
  - > 30 days: cookie expired, start from Discovery

**Cookie: `viewed_vehicles`** (30-day expiry)
- Stores: array of up to 10 `vehicle_id` values with timestamps
- Used to: exclude previously viewed vehicles from "similar" recommendations, flag returning vehicle interest

### 13.3 fullthrottle.ai First-Party Identity Integration

When the user is identified via fullthrottle.ai's identity graph (email match, cookie sync, or device fingerprint):
- Prior VDP visits from any channel surface that vehicle's `vehicle_id` in the intent vector (confidence boost)
- Audience segment membership updates the initial UTM inference even without UTM params
- Known contact information can optionally pre-fill lead form fields (with user consent flow)

---

## 14. Technical Requirements

### 14.1 Performance

| Metric | Target | Hard limit |
|---|---|---|
| Intent vector resolution (UTM) | < 50ms | < 100ms |
| First block render (LCP) | < 1.2s | < 2.0s |
| Grid reassembly (total animation) | 500ms | 750ms |
| Inventory API response | < 300ms | < 600ms |
| Filter update latency | < 200ms | < 400ms |
| Mobile sticky CTA render | < 100ms after vehicle focus | — |

### 14.2 Grid Implementation

- CSS Grid: `grid-template-columns: repeat(9, 1fr)` · `grid-template-rows: repeat(9, [row-height])`
- Row height: 52px desktop, 44px mobile (CSS custom property: `--grid-row-height`)
- Gap: 6px desktop, 4px mobile
- Block transitions: `opacity` only (grid-column/grid-row do not animate; reposition during opacity-0 phase)
- All grid states must be fully validated (no empty cells, no overlapping spans) before shipping

### 14.3 Inventory API Contract

The layout engine calls the inventory API with a structured query derived from the block manifest:

```typescript
// Request
POST /api/inventory/query
{
  filter: InventoryFilter;       // derived from intent vector
  sort: SortField;
  limit: number;
  offset: number;
  include_fields: string[];      // only fields needed for this block type
  dealer_id?: string;            // optional dealer scope
  user_zip?: string;             // for distance calculation
}

// Response
{
  total: number;
  vehicles: VehicleRecord[];
  facets: FilterFacets;          // for live filter count updates
}
```

**Facet response** (drives live filter counts):
```typescript
interface FilterFacets {
  condition: Record<string, number>;
  body_style: Record<string, number>;
  make: Record<string, number>;
  price_ranges: Record<string, number>;
  fuel_type: Record<string, number>;
  // ... per filter dimension
}
```

### 14.4 URL Parameter Schema

All stateful parameters are reflected in the URL:

```
/inventory
  ?condition=used
  &body=truck
  &make=Ford
  &model=F-150
  &year_min=2020
  &price_max=40000
  &mileage_max=75000
  &features=tow_package,heated_seats
  &sort=price_asc
  &view=grid
  &vehicle_id=veh_a3f8c2          ← triggers State 2
  &compare=veh_a3f8c2,veh_b9d1e5  ← triggers State 3
```

Sharing a URL restores the full intent state on load.

### 14.5 Accessibility

- All grid blocks must have meaningful ARIA labels (`aria-label`, `role`)
- Reassembly animation must respect `prefers-reduced-motion` (fade only, no position shifts)
- Focus management: after reassembly, focus returns to intent bar
- Vehicle cards must be keyboard-navigable and tab-indexed in visual order
- Lead forms must be fully accessible (labels, error states, confirmation)

### 14.6 Mobile Considerations

- Grid collapses to 1-column linear stack on viewports < 768px
- Block order in mobile stack follows priority scores from section 6.2
- Filter panel uses full-screen bottom drawer (not sidebar)
- Intent bar is always visible (sticky at top on scroll)
- Compare mode on mobile: swipeable tabs (Vehicle A / Vehicle B / Compare) rather than side-by-side

---

## 15. Design Principles

1. **Intent-first, not template-first.** The grid state is always derived from what the user wants, not from which URL they landed on.

2. **Reassembly is a feature, not a bug.** When the page changes, it should feel like it understood something new about the user, not like a glitch. The animation sequence must reinforce this — deliberate, not jarring.

3. **Every cell earns its place.** No block occupies space by default or by convention. Every block in a given state is there because it serves the intent vector.

4. **Price is always transparent.** MSRP, sale price, savings, and estimated payment appear together whenever price appears. No hiding the real number until a lead is captured.

5. **The intent bar is the anchor.** It is the one element that never disappears and never moves. It is the user's handle on the experience — they can always reach it to redirect the page.

6. **CTAs follow vehicles, not pages.** Lead capture is always tied to a specific vehicle in focus. Generic "contact us" CTAs without a vehicle context are not used.

7. **The ad and the landing experience share an intent model.** UTM parameters carry the same audience understanding that drove the ad impression. The page picks up where the ad left off.

8. **Mobile is not a reduced experience.** The grid collapses linearly but the intent model, reassembly logic, and CTA paths are identical to desktop.

9. **Confidence gates, not conditions.** The grid does not switch states because the user clicked a certain button. It switches because the confidence score crossed a threshold. This makes the system robust to unexpected user paths.

10. **Silence is also a signal.** If a user dwells on a vehicle card for 3+ seconds without clicking, that is soft interest. If a user exits a lead form midway, that is price sensitivity. Both update the intent vector.

---

*End of spec. Reference this file in Claude Code as `docs/platform-spec-liquid.md`. The intent vector schema and grid state definitions are the two sections to implement first.*
