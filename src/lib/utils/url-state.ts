// ---------------------------------------------------------------------------
// URL <-> Intent State Sync — SEO-friendly paths
//
// URL patterns:
//   Homepage:       /
//   Search (SRP):   /inventory/used/ford/f-150/philadelphia-pa
//   Vehicle (VDP):  /inventory/used/2024/ford/f-150/xlt-supercrew/philadelphia-pa/veh_abc123
//
// Additional filters go as query params: ?price_max=40000&fuel=electric
// ---------------------------------------------------------------------------

import type { IntentVector } from "../intent/types";
import { MOCK_VEHICLES } from "../inventory/mock-data";
import { getDealerById, DEFAULT_LOCATION } from "../inventory/dealers";

/** Slugify a string for URLs: "F-150 XLT SuperCrew" → "f-150-xlt-supercrew" */
function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Build an SEO-friendly URL path from the intent vector.
 *
 * VDP (focused vehicle): /inventory/used/2024/ford/f-150/xlt-supercrew/philadelphia-pa/veh_abc
 * SRP (search results):  /inventory/used/ford/f-150/philadelphia-pa
 * Broad search:          /inventory/used/trucks/philadelphia-pa
 * Homepage:              /
 */
export function intentToSEOPath(intent: IntentVector): string {
  const segments: string[] = [];

  // If no meaningful intent, stay at root
  if (!intent.condition && !intent.body && !intent.make && !intent.model && !intent.focused_vehicle_id) {
    return "/";
  }

  segments.push("inventory");

  // VDP — single focused vehicle
  if (intent.focused_vehicle_id) {
    const vehicle = MOCK_VEHICLES.find((v) => v.vehicle_id === intent.focused_vehicle_id);
    if (vehicle) {
      const condition = vehicle.condition.toLowerCase(); // "new", "used", "cpo"
      const location = getDealerById(vehicle.dealer_id)?.slug ?? DEFAULT_LOCATION;

      segments.push(condition);
      segments.push(String(vehicle.year));
      segments.push(slugify(vehicle.make));
      segments.push(slugify(vehicle.model));
      if (vehicle.trim) segments.push(slugify(vehicle.trim));
      segments.push(location);
      segments.push(vehicle.vehicle_id);

      return "/" + segments.join("/");
    }
  }

  // SRP — search results
  if (intent.condition) segments.push(intent.condition); // "used", "new", "cpo"
  if (intent.body && !intent.make) segments.push(slugify(intent.body) + "s"); // "trucks", "suvs"
  if (intent.make) segments.push(slugify(intent.make));
  if (intent.model) segments.push(slugify(intent.model));

  // Location
  segments.push(DEFAULT_LOCATION);

  return "/" + segments.join("/");
}

/**
 * Build additional query params for filters not captured in the path.
 */
export function intentToQueryParams(intent: IntentVector): URLSearchParams {
  const params = new URLSearchParams();

  if (intent.year_min != null) params.set("year_min", String(intent.year_min));
  if (intent.year_max != null) params.set("year_max", String(intent.year_max));
  if (intent.price_min != null) params.set("price_min", String(intent.price_min));
  if (intent.price_max != null) params.set("price_max", String(intent.price_max));
  if (intent.mileage_max != null) params.set("mileage_max", String(intent.mileage_max));
  if (intent.fuel) params.set("fuel", intent.fuel);
  if (intent.drivetrain) params.set("drivetrain", intent.drivetrain);
  if (intent.features.length > 0) params.set("features", intent.features.join(","));
  if (intent.compared_vehicle_ids.length > 0) {
    params.set("compare", intent.compared_vehicle_ids.join(","));
  }

  return params;
}

/**
 * Sync the browser URL with the current intent vector.
 * Uses pushState when the path changes (so back button works)
 * and replaceState when only query params change.
 */
export function syncURLWithIntent(intent: IntentVector): void {
  if (typeof window === "undefined") return;

  const path = intentToSEOPath(intent);
  const params = intentToQueryParams(intent);
  const search = params.toString();
  const newURL = search ? `${path}?${search}` : path;

  // If the path changed (not just query params), push a new history entry
  const currentPath = window.location.pathname;
  const stateData = { intentConfidence: intent.confidence };

  if (path !== currentPath) {
    window.history.pushState(stateData, "", newURL);
  } else {
    window.history.replaceState(stateData, "", newURL);
  }
}

/**
 * Parse an SEO-friendly URL path back into intent fields.
 * Handles both old query-param style and new path style.
 */
export function readIntentFromURL(): Partial<IntentVector> | null {
  if (typeof window === "undefined") return null;

  const pathname = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const result: Partial<IntentVector> = {};

  // --- Parse path segments ---
  // /inventory/used/2024/ford/f-150/xlt-supercrew/philadelphia-pa/veh_abc123
  if (pathname.startsWith("/inventory/")) {
    const parts = pathname.replace("/inventory/", "").split("/").filter(Boolean);

    for (const part of parts) {
      // Vehicle ID
      if (part.startsWith("veh_")) {
        result.focused_vehicle_id = part;
        // Look up vehicle to set make/model/condition
        const vehicle = MOCK_VEHICLES.find((v) => v.vehicle_id === part);
        if (vehicle) {
          result.make = vehicle.make;
          result.model = vehicle.model;
          result.condition = vehicle.condition.toLowerCase() as IntentVector["condition"];
          result.confidence = 0.70;
        }
        continue;
      }

      // Condition
      if (part === "new" || part === "used" || part === "cpo") {
        result.condition = part;
        continue;
      }

      // Year (4-digit number starting with 19 or 20)
      if (/^(19|20)\d{2}$/.test(part)) {
        const yr = parseInt(part, 10);
        result.year_min = yr;
        result.year_max = yr;
        continue;
      }

      // Body type plurals
      const bodyMap: Record<string, string> = {
        trucks: "truck", suvs: "suv", sedans: "sedan", coupes: "coupe",
        vans: "van", crossovers: "crossover", convertibles: "convertible",
        wagons: "wagon", hatchbacks: "hatchback",
      };
      if (bodyMap[part]) {
        result.body = bodyMap[part] as IntentVector["body"];
        continue;
      }

      // Location slug — skip (we don't store location in intent)
      if (part.match(/-[a-z]{2}$/)) continue;

      // Make/model — try to match against known vehicles
      const unslug = part.replace(/-/g, " ");
      const matchedVehicle = MOCK_VEHICLES.find(
        (v) => slugify(v.make) === part || slugify(v.model) === part
      );
      if (matchedVehicle) {
        if (slugify(matchedVehicle.make) === part && !result.make) {
          result.make = matchedVehicle.make;
        } else if (slugify(matchedVehicle.model) === part && !result.model) {
          result.model = matchedVehicle.model;
          if (!result.make) result.make = matchedVehicle.make;
        }
        continue;
      }
    }
  }

  // --- Parse query params (additional filters) ---
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

  const compare = params.get("compare");
  if (compare) {
    result.compared_vehicle_ids = compare.split(",").filter(Boolean).slice(0, 3);
    if (result.compared_vehicle_ids.length >= 2) {
      result.comparison_mode = true;
    }
  }

  // Also support legacy query-param style
  const condition = params.get("condition");
  if (condition && !result.condition) {
    if (condition === "new" || condition === "used" || condition === "cpo") {
      result.condition = condition;
    }
  }
  const make = params.get("make");
  if (make && !result.make) result.make = make;
  const model = params.get("model");
  if (model && !result.model) result.model = model;
  const body = params.get("body");
  if (body && !result.body) result.body = body as IntentVector["body"];
  const vehicleId = params.get("vehicle_id");
  if (vehicleId && !result.focused_vehicle_id) result.focused_vehicle_id = vehicleId;

  // Set confidence based on what was parsed
  if (!result.confidence) {
    let conf = 0;
    if (result.focused_vehicle_id) conf = 0.70;
    else if (result.make && result.model) conf = 0.45;
    else if (result.make || result.body || result.condition) conf = 0.30;
    if (conf > 0) result.confidence = conf;
  }

  // Check if anything was actually parsed
  const hasData = Object.keys(result).length > 0;
  return hasData ? result : null;
}

// Keep for backward compat
export function intentToURLParams(intent: IntentVector): URLSearchParams {
  return intentToQueryParams(intent);
}

export function urlParamsToIntent(params: URLSearchParams): Partial<IntentVector> {
  return readIntentFromURL() ?? {};
}
