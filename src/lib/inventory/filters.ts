import type {
  VehicleRecord,
  InventoryFilter,
  SortField,
  FilterFacets,
  FacetBucket,
  RangeFacet,
} from "./types";

// ---------------------------------------------------------------------------
// filterVehicles
// Applies every populated field of InventoryFilter against the vehicle list.
// All active filters are combined with AND logic.
// ---------------------------------------------------------------------------
export function filterVehicles(
  vehicles: VehicleRecord[],
  filter: InventoryFilter,
): VehicleRecord[] {
  return vehicles.filter((v) => {
    // Condition
    if (filter.condition?.length && !filter.condition.includes(v.condition)) {
      return false;
    }

    // Price range
    if (filter.price_min != null && v.sale_price < filter.price_min) {
      return false;
    }
    if (filter.price_max != null && v.sale_price > filter.price_max) {
      return false;
    }

    // Make
    if (
      filter.make?.length &&
      !filter.make.some((m) => m.toLowerCase() === v.make.toLowerCase())
    ) {
      return false;
    }

    // Model
    if (
      filter.model?.length &&
      !filter.model.some((m) => m.toLowerCase() === v.model.toLowerCase())
    ) {
      return false;
    }

    // Year range
    if (filter.year_min != null && v.year < filter.year_min) {
      return false;
    }
    if (filter.year_max != null && v.year > filter.year_max) {
      return false;
    }

    // Mileage max
    if (filter.mileage_max != null && v.mileage > filter.mileage_max) {
      return false;
    }

    // Body style
    if (filter.body_style?.length && !filter.body_style.includes(v.body_style)) {
      return false;
    }

    // Exterior color (case-insensitive partial match on label)
    if (filter.exterior_color?.length) {
      const colorLower = v.exterior_color_label.toLowerCase();
      const matched = filter.exterior_color.some((c) =>
        colorLower.includes(c.toLowerCase()),
      );
      if (!matched) return false;
    }

    // Transmission
    if (
      filter.transmission?.length &&
      !filter.transmission.includes(v.transmission)
    ) {
      return false;
    }

    // Drivetrain
    if (filter.drivetrain?.length && !filter.drivetrain.includes(v.drivetrain)) {
      return false;
    }

    // Fuel type
    if (filter.fuel_type?.length && !filter.fuel_type.includes(v.fuel_type)) {
      return false;
    }

    // Features (all selected features must be present)
    if (filter.features?.length) {
      const allFeatures = [
        ...v.standard_features,
        ...v.safety_features,
        ...v.factory_packages,
      ].map((f) => f.toLowerCase());

      for (const feat of filter.features) {
        if (!allFeatures.some((f) => f.includes(feat.toLowerCase()))) {
          return false;
        }
      }
    }

    // Distance (only meaningful when dealer_distance_miles is populated)
    if (
      filter.distance_radius_miles != null &&
      v.dealer_distance_miles != null &&
      v.dealer_distance_miles > filter.distance_radius_miles
    ) {
      return false;
    }

    // Special-offer boolean flags
    if (filter.dealer_discount_active && v.dealer_discount <= 0) {
      return false;
    }
    if (filter.manufacturer_incentive_active && v.manufacturer_incentive <= 0) {
      return false;
    }
    if (filter.price_drop && !v.price_drop_flag) {
      return false;
    }
    if (filter.new_listing && !v.new_listing_flag) {
      return false;
    }

    return true;
  });
}

// ---------------------------------------------------------------------------
// sortVehicles
// Returns a new sorted array (does not mutate input).
// ---------------------------------------------------------------------------
export function sortVehicles(
  vehicles: VehicleRecord[],
  sort: SortField,
): VehicleRecord[] {
  const sorted = [...vehicles];

  switch (sort) {
    case "price_asc":
      sorted.sort((a, b) => a.sale_price - b.sale_price);
      break;
    case "price_desc":
      sorted.sort((a, b) => b.sale_price - a.sale_price);
      break;
    case "year_desc":
      sorted.sort((a, b) => b.year - a.year);
      break;
    case "year_asc":
      sorted.sort((a, b) => a.year - b.year);
      break;
    case "mileage_asc":
      sorted.sort((a, b) => a.mileage - b.mileage);
      break;
    case "mileage_desc":
      sorted.sort((a, b) => b.mileage - a.mileage);
      break;
    case "days_on_lot_desc":
      sorted.sort((a, b) => b.days_on_lot - a.days_on_lot);
      break;
    case "days_on_lot_asc":
      sorted.sort((a, b) => a.days_on_lot - b.days_on_lot);
      break;
    case "distance_asc":
      sorted.sort(
        (a, b) =>
          (a.dealer_distance_miles ?? Infinity) -
          (b.dealer_distance_miles ?? Infinity),
      );
      break;
    case "newest_listing":
      sorted.sort((a, b) => a.days_on_lot - b.days_on_lot);
      break;
  }

  return sorted;
}

// ---------------------------------------------------------------------------
// computeFacets
// Produces counts / ranges for all filterable dimensions based on the
// *current* vehicle set (post-filter, so counts reflect available options).
// ---------------------------------------------------------------------------
export function computeFacets(vehicles: VehicleRecord[]): FilterFacets {
  const conditionMap = new Map<string, number>();
  const makeMap = new Map<string, number>();
  const modelMap = new Map<string, number>();
  const bodyStyleMap = new Map<string, number>();
  const colorMap = new Map<string, number>();
  const transmissionMap = new Map<string, number>();
  const drivetrainMap = new Map<string, number>();
  const fuelTypeMap = new Map<string, number>();

  let yearMin = Infinity;
  let yearMax = -Infinity;
  let priceMin = Infinity;
  let priceMax = -Infinity;
  let mileageMin = Infinity;
  let mileageMax = -Infinity;

  for (const v of vehicles) {
    increment(conditionMap, v.condition);
    increment(makeMap, v.make);
    increment(modelMap, v.model);
    increment(bodyStyleMap, v.body_style);
    increment(colorMap, canonicalColor(v.exterior_color_label));
    increment(transmissionMap, v.transmission);
    increment(drivetrainMap, v.drivetrain);
    increment(fuelTypeMap, v.fuel_type);

    if (v.year < yearMin) yearMin = v.year;
    if (v.year > yearMax) yearMax = v.year;
    if (v.sale_price < priceMin) priceMin = v.sale_price;
    if (v.sale_price > priceMax) priceMax = v.sale_price;
    if (v.mileage < mileageMin) mileageMin = v.mileage;
    if (v.mileage > mileageMax) mileageMax = v.mileage;
  }

  const safe = (val: number, fallback: number) =>
    isFinite(val) ? val : fallback;

  return {
    condition: toBuckets(conditionMap),
    make: toBuckets(makeMap),
    model: toBuckets(modelMap),
    body_style: toBuckets(bodyStyleMap),
    year: { min: safe(yearMin, 2010), max: safe(yearMax, 2025) } as RangeFacet,
    price: { min: safe(priceMin, 0), max: safe(priceMax, 150000) } as RangeFacet,
    mileage: { min: safe(mileageMin, 0), max: safe(mileageMax, 200000) } as RangeFacet,
    exterior_color: toBuckets(colorMap),
    transmission: toBuckets(transmissionMap),
    drivetrain: toBuckets(drivetrainMap),
    fuel_type: toBuckets(fuelTypeMap),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function toBuckets(map: Map<string, number>): FacetBucket[] {
  return Array.from(map.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Map verbose color labels to canonical bucket names matching the spec's
 * hex-swatch grid: White, Black, Silver, Gray, Red, Blue, Green, Brown, Gold, Other
 */
function canonicalColor(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("white") || l.includes("pearl") || l.includes("quartz"))
    return "White";
  if (l.includes("black") || l.includes("obsidian") || l.includes("midnight"))
    return "Black";
  if (l.includes("silver") || l.includes("shimmering") || l.includes("sterling"))
    return "Silver";
  if (
    l.includes("gray") ||
    l.includes("grey") ||
    l.includes("shadow") ||
    l.includes("selenite") ||
    l.includes("sonic")
  )
    return "Gray";
  if (
    l.includes("red") ||
    l.includes("rallye") ||
    l.includes("magma") ||
    l.includes("cherry") ||
    l.includes("radiant")
  )
    return "Red";
  if (
    l.includes("blue") ||
    l.includes("blueprint") ||
    l.includes("patriot") ||
    l.includes("phytonic") ||
    l.includes("bikini") ||
    l.includes("teal")
  )
    return "Blue";
  if (l.includes("green") || l.includes("army")) return "Green";
  if (l.includes("brown") || l.includes("java")) return "Brown";
  if (l.includes("gold") || l.includes("caramel")) return "Gold";
  return "Other";
}
