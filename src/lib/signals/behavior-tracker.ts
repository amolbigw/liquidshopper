// ---------------------------------------------------------------------------
// Signal Layer -- Behaviour Tracker   (spec section 3.4)
// ---------------------------------------------------------------------------

import type { SignalEvent, SignalType } from "../intent/types";
import type { BodyType } from "../intent/types";

// ---- helpers ---------------------------------------------------------------

function now(): number {
  return Date.now();
}

function makeSignal(
  type: SignalType,
  source: string,
  priority: SignalEvent["priority"],
  payload: Record<string, unknown>,
): SignalEvent {
  return { type, source, timestamp: now(), priority, payload };
}

// ---- public signal factories -----------------------------------------------

export interface VehicleData {
  vehicle_id: string;
  make?: string;
  model?: string;
  year?: number;
  body?: string;
  price?: number;
}

/**
 * User clicked on a vehicle card.
 * Spec: extract make, model, year, body, price range. Weight 0.8.
 */
export function handleVehicleClick(vehicleData: VehicleData): SignalEvent {
  return makeSignal("vehicle_click", "dom:vehicle_card", "high", {
    click_type: "vehicle",
    vehicle_id: vehicleData.vehicle_id,
    make: vehicleData.make ?? null,
    model: vehicleData.model ?? null,
    year: vehicleData.year ?? null,
    body: vehicleData.body ?? null,
    price: vehicleData.price ?? null,
  });
}

/**
 * User clicked on a body style tile (e.g. SUV, Truck).
 * Spec: set body type with confidence 0.6.
 */
export function handleBodyStyleClick(bodyType: BodyType): SignalEvent {
  return makeSignal("vehicle_click", "dom:body_style_tile", "high", {
    click_type: "body_style",
    body: bodyType,
  });
}

/**
 * User clicked on a promotion banner or offer card.
 * Spec: flag has_promo_intent but do not infer vehicle preference.
 */
export function handlePromoClick(): SignalEvent {
  return makeSignal("vehicle_click", "dom:promo", "medium", {
    click_type: "promo",
  });
}

/**
 * User added a vehicle to compare.
 * Spec: flag comparison_mode, lock vehicle pair.
 */
export function handleCompareAdd(vehicleId: string): SignalEvent {
  return makeSignal("compare_add", "dom:compare_button", "medium", {
    vehicle_id: vehicleId,
  });
}

/**
 * Dwell signal -- user idled on a block for 3+ seconds.
 * Spec:
 *  - vehicle_card / hero: soft upweight vehicle attributes (weight 0.3)
 *  - price block: flag price_sensitive
 *  - feature section: upweight matched features
 */
export function handleDwellSignal(
  blockType: string,
  durationMs: number,
  vehicleData?: Partial<VehicleData>,
): SignalEvent {
  return makeSignal("dwell_time", `observer:dwell:${blockType}`, "low", {
    block_type: blockType,
    duration_ms: durationMs,
    ...(vehicleData ?? {}),
  });
}

/**
 * Scroll depth signal -- user reached a milestone.
 * Spec: fires at 50%, 75%, 90%.
 */
export function handleScrollDepth(depth: number): SignalEvent {
  return makeSignal("scroll_depth", "observer:scroll", "low", {
    depth_percent: depth,
  });
}

/**
 * Back navigation signal.
 * Spec:
 *  - After vehicle focus: reduce confidence on last vehicle's make/model by 0.3
 *  - After compare: exit comparison, return to vehicle focus for first vehicle
 */
export function handleBackNavigation(): SignalEvent {
  return makeSignal("back_navigation", "history_api", "medium", {});
}

// ---- observer setup --------------------------------------------------------

interface TrackerCleanup {
  destroy: () => void;
}

/**
 * Create DOM observers for dwell, scroll depth, and back navigation.
 * Returns a cleanup object. Call `destroy()` on unmount.
 *
 * Accepts a callback that receives each SignalEvent to be fed into the store.
 */
export function createBehaviorTracker(
  onSignal: (signal: SignalEvent) => void,
): TrackerCleanup {
  const controllers: AbortController[] = [];

  // --- Scroll depth tracking ---
  const scrollCtrl = new AbortController();
  controllers.push(scrollCtrl);
  const firedDepths = new Set<number>();
  const DEPTH_MILESTONES = [50, 75, 90];

  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const pct = Math.round((scrollTop / docHeight) * 100);

    for (const milestone of DEPTH_MILESTONES) {
      if (pct >= milestone && !firedDepths.has(milestone)) {
        firedDepths.add(milestone);
        onSignal(handleScrollDepth(milestone));
      }
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("scroll", handleScroll, {
      passive: true,
      signal: scrollCtrl.signal,
    });
  }

  // --- Dwell tracking via IntersectionObserver ---
  const dwellTimers = new Map<Element, ReturnType<typeof setTimeout>>();
  let intersectionObserver: IntersectionObserver | null = null;

  if (typeof window !== "undefined" && typeof IntersectionObserver !== "undefined") {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target;
          if (entry.isIntersecting) {
            // Start dwell timer (3 seconds per spec)
            if (!dwellTimers.has(el)) {
              const timer = setTimeout(() => {
                const blockType =
                  el.getAttribute("data-block-type") ?? "unknown";
                const vehicleId = el.getAttribute("data-vehicle-id") ?? undefined;
                const make = el.getAttribute("data-make") ?? undefined;
                const model = el.getAttribute("data-model") ?? undefined;
                const body = el.getAttribute("data-body") ?? undefined;

                const vehicleData: Partial<VehicleData> = {};
                if (vehicleId) vehicleData.vehicle_id = vehicleId;
                if (make) vehicleData.make = make;
                if (model) vehicleData.model = model;
                if (body) vehicleData.body = body;

                onSignal(
                  handleDwellSignal(blockType, 3000, vehicleData),
                );
                dwellTimers.delete(el);
              }, 3000);
              dwellTimers.set(el, timer);
            }
          } else {
            // Left viewport -- cancel dwell timer
            const timer = dwellTimers.get(el);
            if (timer) {
              clearTimeout(timer);
              dwellTimers.delete(el);
            }
          }
        }
      },
      { threshold: 0.5 },
    );

    // Observe any element with data-block-type
    const blocks = document.querySelectorAll("[data-block-type]");
    blocks.forEach((el) => intersectionObserver!.observe(el));
  }

  // --- Back navigation (History API popstate) ---
  const popCtrl = new AbortController();
  controllers.push(popCtrl);

  if (typeof window !== "undefined") {
    window.addEventListener(
      "popstate",
      () => {
        onSignal(handleBackNavigation());
      },
      { signal: popCtrl.signal },
    );
  }

  // --- Cleanup ---
  return {
    destroy() {
      for (const ctrl of controllers) ctrl.abort();
      if (intersectionObserver) intersectionObserver.disconnect();
      for (const timer of dwellTimers.values()) clearTimeout(timer);
      dwellTimers.clear();
    },
  };
}
