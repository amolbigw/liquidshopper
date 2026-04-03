// Barrel export for the inventory data layer
export * from "./types";
export { MOCK_VEHICLES } from "./mock-data";
export { filterVehicles, sortVehicles, computeFacets } from "./filters";
export {
  queryInventory,
  getVehicleById,
  getSimilarVehicles,
  getFeaturedVehicle,
} from "./api-client";
