// ---------------------------------------------------------------------------
// Utility Layer -- URL <-> Intent State Sync   (spec section 14.4, 9.5)
// ---------------------------------------------------------------------------

import type { IntentVector } from "../intent/types";

/**
 * Serialize the intent vector into URL search params.
 * Only non-null, non-default values are written. Spec section 14.4 defines
 * the canonical parameter names.
 */
export function intentToURLParams(intent: IntentVector): URLSearchParams {
  const params = new URLSearchParams();

  if (intent.condition) params.set("condition", intent.condition);
  if (intent.body) params.set("body", intent.body);
  if (intent.make) params.set("make", intent.make);
  if (intent.model) params.set("model", intent.model);
  if (intent.year_min != null) params.set("year_min", String(intent.year_min));
  if (intent.year_max != null) params.set("year_max", String(intent.year_max));
  if (intent.price_min != null) params.set("price_min", String(intent.price_min));
  if (intent.price_max != null) params.set("price_max", String(intent.price_max));
  if (intent.mileage_max != null) params.set("mileage_max", String(intent.mileage_max));
  if (intent.fuel) params.set("fuel", intent.fuel);
  if (intent.drivetrain) params.set("drivetrain", intent.drivetrain);
  if (intent.features.length > 0) params.set("features", intent.features.join(","));
  if (intent.focused_vehicle_id) params.set("vehicle_id", intent.focused_vehicle_id);
  if (intent.compared_vehicle_ids.length > 0) {
    params.set("compare", intent.compared_vehicle_ids.join(","));
  }

  return params;
}

/**
 * Deserialize URL search params into a partial intent vector.
 * All fields are optional; missing params yield null/empty.
 */
export function urlParamsToIntent(
  params: URLSearchParams,
): Partial<IntentVector> {
  const result: Partial<IntentVector> = {};

  const condition = params.get("condition");
  if (condition === "new" || condition === "used" || condition === "cpo") {
    result.condition = condition;
  }

  const body = params.get("body");
  if (body) result.body = body as IntentVector["body"];

  const make = params.get("make");
  if (make) result.make = make;

  const model = params.get("model");
  if (model) result.model = model;

  const yearMin = params.get("year_min");
  if (yearMin) result.year_min = parseInt(yearMin, 10) || null;

  const yearMax = params.get("year_max");
  if (yearMax) result.year_max = parseInt(yearMax, 10) || null;

  const priceMin = params.get("price_min");
  if (priceMin) result.price_min = parseInt(priceMin, 10) || null;

  const priceMax = params.get("price_max");
  if (priceMax) result.price_max = parseInt(priceMax, 10) || null;

  const mileageMax = params.get("mileage_max");
  if (mileageMax) result.mileage_max = parseInt(mileageMax, 10) || null;

  const fuel = params.get("fuel");
  if (fuel) result.fuel = fuel as IntentVector["fuel"];

  const drivetrain = params.get("drivetrain");
  if (drivetrain) result.drivetrain = drivetrain as IntentVector["drivetrain"];

  const features = params.get("features");
  if (features) result.features = features.split(",").filter(Boolean);

  const vehicleId = params.get("vehicle_id");
  if (vehicleId) result.focused_vehicle_id = vehicleId;

  const compare = params.get("compare");
  if (compare) {
    result.compared_vehicle_ids = compare.split(",").filter(Boolean).slice(0, 3);
    if (result.compared_vehicle_ids.length >= 2) {
      result.comparison_mode = true;
    }
  }

  return result;
}

/**
 * Push the current intent vector into the browser URL without a full
 * navigation. Uses replaceState so the back button still works naturally.
 */
export function syncURLWithIntent(intent: IntentVector): void {
  if (typeof window === "undefined") return;

  const params = intentToURLParams(intent);
  const search = params.toString();
  const newURL = search
    ? `${window.location.pathname}?${search}`
    : window.location.pathname;

  window.history.replaceState(
    { intentConfidence: intent.confidence },
    "",
    newURL,
  );
}

/**
 * Attempt to read an intent vector from the current page URL.
 * Returns null if no intent-related params are present.
 */
export function readIntentFromURL(): Partial<IntentVector> | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);

  // Quick check: are there any intent params at all?
  const intentKeys = [
    "condition", "body", "make", "model", "year_min", "year_max",
    "price_min", "price_max", "mileage_max", "fuel", "drivetrain",
    "features", "vehicle_id", "compare",
  ];
  const hasAny = intentKeys.some((k) => params.has(k));
  if (!hasAny) return null;

  return urlParamsToIntent(params);
}
