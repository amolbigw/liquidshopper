// ---------------------------------------------------------------------------
// Inventory Data Model -- LiquidShopper Platform
// Derived from platform-spec-liquid.md sections 10 & 11
// ---------------------------------------------------------------------------

// --- Enums ------------------------------------------------------------------

export type Condition = "New" | "Used" | "CPO";

export type BodyStyle =
  | "Sedan"
  | "SUV"
  | "Truck"
  | "Van"
  | "Coupe"
  | "Convertible"
  | "Wagon"
  | "Hatchback"
  | "Crossover";

export type Transmission = "Automatic" | "Manual" | "CVT" | "DCT";

export type Drivetrain = "FWD" | "AWD" | "RWD" | "4WD";

export type FuelType =
  | "Gasoline"
  | "Diesel"
  | "Hybrid"
  | "Electric"
  | "PHEV"
  | "Flex Fuel";

export type InteriorMaterial =
  | "Leather"
  | "Cloth"
  | "Leatherette"
  | "Alcantara";

// --- Vehicle Record ---------------------------------------------------------

export interface VehicleRecord {
  // 10.1 Identity
  vehicle_id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  condition: Condition;
  body_style: BodyStyle;
  stock_number: string;
  vin: string;

  // 10.2 Appearance
  exterior_color_label: string;
  exterior_color_hex: string;
  interior_color: string;
  interior_material: InteriorMaterial;

  // 10.3 Mechanical
  transmission: Transmission;
  drivetrain: Drivetrain;
  engine: string;
  cylinders: number;
  horsepower: number;
  torque: number;
  fuel_type: FuelType;
  mpg_city: number;
  mpg_hwy: number;
  ev_range_miles: number | null;
  mileage: number;

  // 10.4 Pricing
  msrp: number;
  sale_price: number;
  dealer_discount: number;
  manufacturer_incentive: number;
  total_savings: number;
  est_monthly_payment: number;
  finance_apr: number;
  finance_term_months: number;
  finance_down_payment: number;

  // 10.5 Packages, Add-ons & Features
  factory_packages: string[];
  addon_options: string[];
  standard_features: string[];
  safety_features: string[];
  warranty_basic: string;
  warranty_powertrain: string;
  warranty_roadside: string;

  // 10.6 Media & Metadata
  photos: string[];
  video_url: string | null;
  days_on_lot: number;
  dealer_id: string;
  dealer_distance_miles: number | null;
  carfax_flag: boolean;
  carfax_url: string | null;
  price_drop_flag: boolean;
  new_listing_flag: boolean;
}

// --- Filter & Query Types ---------------------------------------------------

export interface InventoryFilter {
  condition?: Condition[];
  price_min?: number;
  price_max?: number;
  make?: string[];
  model?: string[];
  year_min?: number;
  year_max?: number;
  mileage_max?: number;
  body_style?: BodyStyle[];
  exterior_color?: string[];
  transmission?: Transmission[];
  drivetrain?: Drivetrain[];
  fuel_type?: FuelType[];
  features?: string[];
  distance_zip?: string;
  distance_radius_miles?: number;
  dealer_discount_active?: boolean;
  manufacturer_incentive_active?: boolean;
  price_drop?: boolean;
  new_listing?: boolean;
}

export type SortField =
  | "price_asc"
  | "price_desc"
  | "year_desc"
  | "year_asc"
  | "mileage_asc"
  | "mileage_desc"
  | "days_on_lot_desc"
  | "days_on_lot_asc"
  | "distance_asc"
  | "newest_listing";

export interface FacetBucket {
  value: string;
  count: number;
}

export interface RangeFacet {
  min: number;
  max: number;
}

export interface FilterFacets {
  condition: FacetBucket[];
  make: FacetBucket[];
  model: FacetBucket[];
  body_style: FacetBucket[];
  year: RangeFacet;
  price: RangeFacet;
  mileage: RangeFacet;
  exterior_color: FacetBucket[];
  transmission: FacetBucket[];
  drivetrain: FacetBucket[];
  fuel_type: FacetBucket[];
}

export interface InventoryQueryRequest {
  filter?: InventoryFilter;
  sort?: SortField;
  page?: number;
  page_size?: number;
  vehicle_id?: string;
}

export interface InventoryQueryResponse {
  vehicles: VehicleRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  facets: FilterFacets;
}
