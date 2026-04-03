import { NextRequest, NextResponse } from "next/server";

import { MOCK_VEHICLES } from "@/lib/inventory/mock-data";
import {
  filterVehicles,
  sortVehicles,
  computeFacets,
} from "@/lib/inventory/filters";
import type {
  InventoryQueryRequest,
  InventoryQueryResponse,
  InventoryFilter,
  SortField,
} from "@/lib/inventory/types";

// ---------------------------------------------------------------------------
// POST /api/inventory/query
// Accepts a full InventoryQueryRequest body and returns a paginated,
// filtered, faceted response.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InventoryQueryRequest;
    const response = buildResponse(body);
    return NextResponse.json(response);
  } catch (err) {
    console.error("Inventory query error:", err);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/inventory/query
// Lightweight alternative for simple lookups via query params.
//   ?vehicle_id=veh_001            -> single vehicle lookup
//   ?make=Toyota&body_style=SUV    -> filtered list
//   ?sort=price_asc&page=2         -> sorting + pagination
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  // Single vehicle lookup
  const vehicleId = params.get("vehicle_id");
  if (vehicleId) {
    const match = MOCK_VEHICLES.find((v) => v.vehicle_id === vehicleId);
    if (!match) {
      return NextResponse.json(
        { error: "Vehicle not found" },
        { status: 404 },
      );
    }
    const facets = computeFacets([match]);
    const response: InventoryQueryResponse = {
      vehicles: [match],
      total: 1,
      page: 1,
      page_size: 1,
      total_pages: 1,
      facets,
    };
    return NextResponse.json(response);
  }

  // Build filter from search params
  const filter: InventoryFilter = {};

  const condition = params.getAll("condition");
  if (condition.length) filter.condition = condition as InventoryFilter["condition"];

  const priceMin = params.get("price_min");
  if (priceMin) filter.price_min = Number(priceMin);

  const priceMax = params.get("price_max");
  if (priceMax) filter.price_max = Number(priceMax);

  const make = params.getAll("make");
  if (make.length) filter.make = make;

  const model = params.getAll("model");
  if (model.length) filter.model = model;

  const yearMin = params.get("year_min");
  if (yearMin) filter.year_min = Number(yearMin);

  const yearMax = params.get("year_max");
  if (yearMax) filter.year_max = Number(yearMax);

  const mileageMax = params.get("mileage_max");
  if (mileageMax) filter.mileage_max = Number(mileageMax);

  const bodyStyle = params.getAll("body_style");
  if (bodyStyle.length) filter.body_style = bodyStyle as InventoryFilter["body_style"];

  const exteriorColor = params.getAll("exterior_color");
  if (exteriorColor.length) filter.exterior_color = exteriorColor;

  const transmission = params.getAll("transmission");
  if (transmission.length) filter.transmission = transmission as InventoryFilter["transmission"];

  const drivetrain = params.getAll("drivetrain");
  if (drivetrain.length) filter.drivetrain = drivetrain as InventoryFilter["drivetrain"];

  const fuelType = params.getAll("fuel_type");
  if (fuelType.length) filter.fuel_type = fuelType as InventoryFilter["fuel_type"];

  const features = params.getAll("features");
  if (features.length) filter.features = features;

  const distanceZip = params.get("distance_zip");
  if (distanceZip) filter.distance_zip = distanceZip;

  const distanceRadius = params.get("distance_radius_miles");
  if (distanceRadius) filter.distance_radius_miles = Number(distanceRadius);

  if (params.get("dealer_discount_active") === "true") filter.dealer_discount_active = true;
  if (params.get("manufacturer_incentive_active") === "true") filter.manufacturer_incentive_active = true;
  if (params.get("price_drop") === "true") filter.price_drop = true;
  if (params.get("new_listing") === "true") filter.new_listing = true;

  const sort = (params.get("sort") ?? "price_asc") as SortField;
  const page = Math.max(1, Number(params.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(params.get("page_size") ?? "24")));

  const queryRequest: InventoryQueryRequest = {
    filter,
    sort,
    page,
    page_size: pageSize,
  };

  const response = buildResponse(queryRequest);
  return NextResponse.json(response);
}

// ---------------------------------------------------------------------------
// Shared response builder
// ---------------------------------------------------------------------------
function buildResponse(req: InventoryQueryRequest): InventoryQueryResponse {
  const {
    filter = {},
    sort = "price_asc",
    page = 1,
    page_size = 24,
  } = req;

  // 1. Filter
  const filtered = filterVehicles(MOCK_VEHICLES, filter);

  // 2. Compute facets on filtered set
  const facets = computeFacets(filtered);

  // 3. Sort
  const sorted = sortVehicles(filtered, sort);

  // 4. Paginate
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / page_size));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * page_size;
  const vehicles = sorted.slice(start, start + page_size);

  return {
    vehicles,
    total,
    page: safePage,
    page_size,
    total_pages: totalPages,
    facets,
  };
}
