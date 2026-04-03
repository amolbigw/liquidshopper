import type {
  InventoryQueryRequest,
  InventoryQueryResponse,
  VehicleRecord,
} from "./types";

// ---------------------------------------------------------------------------
// Base URL helper -- works on both server (absolute) and client (relative)
// ---------------------------------------------------------------------------
function apiBase(): string {
  if (typeof window !== "undefined") return "";
  // Server-side: fall back to localhost during SSR / build
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

const INVENTORY_ENDPOINT = "/api/inventory/query";

// ---------------------------------------------------------------------------
// queryInventory
// Main entry point for fetching filtered, sorted, paginated vehicle lists.
// ---------------------------------------------------------------------------
export async function queryInventory(
  request: InventoryQueryRequest,
): Promise<InventoryQueryResponse> {
  const res = await fetch(`${apiBase()}${INVENTORY_ENDPOINT}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    throw new Error(
      `Inventory query failed: ${res.status} ${res.statusText}`,
    );
  }

  return res.json() as Promise<InventoryQueryResponse>;
}

// ---------------------------------------------------------------------------
// getVehicleById
// Convenience wrapper for fetching a single vehicle by its ID.
// ---------------------------------------------------------------------------
export async function getVehicleById(
  id: string,
): Promise<VehicleRecord | null> {
  const res = await fetch(
    `${apiBase()}${INVENTORY_ENDPOINT}?vehicle_id=${encodeURIComponent(id)}`,
    { method: "GET" },
  );

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(
      `Vehicle lookup failed: ${res.status} ${res.statusText}`,
    );
  }

  const data = (await res.json()) as InventoryQueryResponse;
  return data.vehicles[0] ?? null;
}

// ---------------------------------------------------------------------------
// getSimilarVehicles
// Returns vehicles that share body_style OR make, excluding the source
// vehicle, sorted by price proximity.
// ---------------------------------------------------------------------------
export async function getSimilarVehicles(
  vehicle: VehicleRecord,
  limit: number = 6,
): Promise<VehicleRecord[]> {
  // Strategy: fetch vehicles matching same body_style, then pad with same
  // make if we need more.  The API route handles filtering.
  const response = await queryInventory({
    filter: {
      body_style: [vehicle.body_style],
    },
    sort: "price_asc",
    page: 1,
    page_size: limit + 10, // over-fetch so we can filter out source
  });

  let candidates = response.vehicles.filter(
    (v) => v.vehicle_id !== vehicle.vehicle_id,
  );

  // Sort by absolute price difference from the source vehicle
  candidates.sort(
    (a, b) =>
      Math.abs(a.sale_price - vehicle.sale_price) -
      Math.abs(b.sale_price - vehicle.sale_price),
  );

  if (candidates.length >= limit) {
    return candidates.slice(0, limit);
  }

  // Pad with same-make vehicles
  const makeResponse = await queryInventory({
    filter: { make: [vehicle.make] },
    sort: "price_asc",
    page: 1,
    page_size: limit + 10,
  });

  const existingIds = new Set(candidates.map((v) => v.vehicle_id));
  existingIds.add(vehicle.vehicle_id);

  for (const v of makeResponse.vehicles) {
    if (!existingIds.has(v.vehicle_id)) {
      candidates.push(v);
      existingIds.add(v.vehicle_id);
    }
    if (candidates.length >= limit) break;
  }

  return candidates.slice(0, limit);
}

// ---------------------------------------------------------------------------
// getFeaturedVehicle
// Returns a single "featured" vehicle for hero placement.
// Current heuristic: newest listing with a price drop, or just the newest
// listing on the lot.
// ---------------------------------------------------------------------------
export async function getFeaturedVehicle(): Promise<VehicleRecord> {
  // Try price-drop vehicles first
  const dropRes = await queryInventory({
    filter: { price_drop: true },
    sort: "newest_listing",
    page: 1,
    page_size: 1,
  });

  if (dropRes.vehicles.length > 0) {
    return dropRes.vehicles[0];
  }

  // Fall back to newest listing
  const newRes = await queryInventory({
    sort: "newest_listing",
    page: 1,
    page_size: 1,
  });

  if (newRes.vehicles.length > 0) {
    return newRes.vehicles[0];
  }

  throw new Error("No vehicles available for featured placement");
}
