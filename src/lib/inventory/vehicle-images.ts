/**
 * Vehicle image URLs mapped by make + model.
 * All images are from Pexels (free for commercial use, no attribution required).
 * URL parameters: w=1260&h=750 for hero/card display (landscape 16:10 ratio).
 */

const PEXELS_BASE = "https://images.pexels.com/photos";
const PARAMS = "auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
const PARAMS_THUMB = "auto=compress&cs=tinysrgb&w=640&h=400&dpr=1";

interface VehicleImageSet {
  hero: string;   // Large image for hero blocks
  card: string;   // Smaller image for vehicle cards
}

const IMAGE_MAP: Record<string, VehicleImageSet> = {
  // Ford
  "Ford F-150": {
    hero: `${PEXELS_BASE}/10306505/pexels-photo-10306505.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/10306505/pexels-photo-10306505.jpeg?${PARAMS_THUMB}`,
  },
  "Ford Explorer": {
    hero: `${PEXELS_BASE}/18430075/pexels-photo-18430075.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/18430075/pexels-photo-18430075.jpeg?${PARAMS_THUMB}`,
  },
  "Ford Mustang Mach-E": {
    hero: `${PEXELS_BASE}/7762700/pexels-photo-7762700.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/7762700/pexels-photo-7762700.jpeg?${PARAMS_THUMB}`,
  },

  // Toyota
  "Toyota Camry": {
    hero: `${PEXELS_BASE}/205337/pexels-photo-205337.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/205337/pexels-photo-205337.jpeg?${PARAMS_THUMB}`,
  },
  "Toyota RAV4": {
    hero: `${PEXELS_BASE}/9615358/pexels-photo-9615358.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/9615358/pexels-photo-9615358.jpeg?${PARAMS_THUMB}`,
  },
  "Toyota Tacoma": {
    hero: `${PEXELS_BASE}/19667153/pexels-photo-19667153.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/19667153/pexels-photo-19667153.jpeg?${PARAMS_THUMB}`,
  },
  "Toyota Highlander": {
    hero: `${PEXELS_BASE}/119435/pexels-photo-119435.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/119435/pexels-photo-119435.jpeg?${PARAMS_THUMB}`,
  },

  // Honda
  "Honda Civic": {
    hero: `${PEXELS_BASE}/17205721/pexels-photo-17205721.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/17205721/pexels-photo-17205721.jpeg?${PARAMS_THUMB}`,
  },
  "Honda CR-V": {
    hero: `${PEXELS_BASE}/13885915/pexels-photo-13885915.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/13885915/pexels-photo-13885915.jpeg?${PARAMS_THUMB}`,
  },
  "Honda Accord": {
    hero: `${PEXELS_BASE}/16387777/pexels-photo-16387777.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/16387777/pexels-photo-16387777.jpeg?${PARAMS_THUMB}`,
  },

  // Chevrolet
  "Chevrolet Silverado 1500": {
    hero: `${PEXELS_BASE}/15955202/pexels-photo-15955202.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/15955202/pexels-photo-15955202.jpeg?${PARAMS_THUMB}`,
  },
  "Chevrolet Equinox": {
    hero: `${PEXELS_BASE}/1134857/pexels-photo-1134857.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/1134857/pexels-photo-1134857.jpeg?${PARAMS_THUMB}`,
  },
  "Chevrolet Tahoe": {
    hero: `${PEXELS_BASE}/11091622/pexels-photo-11091622.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/11091622/pexels-photo-11091622.jpeg?${PARAMS_THUMB}`,
  },

  // BMW
  "BMW 3 Series": {
    hero: `${PEXELS_BASE}/28775849/pexels-photo-28775849.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/28775849/pexels-photo-28775849.jpeg?${PARAMS_THUMB}`,
  },
  "BMW X5": {
    hero: `${PEXELS_BASE}/12532745/pexels-photo-12532745.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/12532745/pexels-photo-12532745.jpeg?${PARAMS_THUMB}`,
  },

  // Mercedes-Benz
  "Mercedes-Benz C-Class": {
    hero: `${PEXELS_BASE}/10224502/pexels-photo-10224502.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/10224502/pexels-photo-10224502.jpeg?${PARAMS_THUMB}`,
  },
  "Mercedes-Benz GLE": {
    hero: `${PEXELS_BASE}/14692371/pexels-photo-14692371.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/14692371/pexels-photo-14692371.jpeg?${PARAMS_THUMB}`,
  },

  // Tesla
  "Tesla Model 3": {
    hero: `${PEXELS_BASE}/9300916/pexels-photo-9300916.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/9300916/pexels-photo-9300916.jpeg?${PARAMS_THUMB}`,
  },
  "Tesla Model Y": {
    hero: `${PEXELS_BASE}/15089585/pexels-photo-15089585.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/15089585/pexels-photo-15089585.jpeg?${PARAMS_THUMB}`,
  },

  // Jeep
  "Jeep Wrangler": {
    hero: `${PEXELS_BASE}/2882234/pexels-photo-2882234.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/2882234/pexels-photo-2882234.jpeg?${PARAMS_THUMB}`,
  },
  "Jeep Grand Cherokee": {
    hero: `${PEXELS_BASE}/15047471/pexels-photo-15047471.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/15047471/pexels-photo-15047471.jpeg?${PARAMS_THUMB}`,
  },

  // Hyundai
  "Hyundai Tucson": {
    hero: `${PEXELS_BASE}/12007134/pexels-photo-12007134.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/12007134/pexels-photo-12007134.jpeg?${PARAMS_THUMB}`,
  },
  "Hyundai Santa Fe": {
    hero: `${PEXELS_BASE}/19146408/pexels-photo-19146408.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/19146408/pexels-photo-19146408.jpeg?${PARAMS_THUMB}`,
  },
  "Hyundai Ioniq 5": {
    hero: `${PEXELS_BASE}/19410949/pexels-photo-19410949.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/19410949/pexels-photo-19410949.jpeg?${PARAMS_THUMB}`,
  },

  // Ram
  "Ram 1500": {
    hero: `${PEXELS_BASE}/1149058/pexels-photo-1149058.jpeg?${PARAMS}`,
    card: `${PEXELS_BASE}/1149058/pexels-photo-1149058.jpeg?${PARAMS_THUMB}`,
  },
};

/** Generic fallback for vehicles not in the map */
const FALLBACK: VehicleImageSet = {
  hero: `${PEXELS_BASE}/3729464/pexels-photo-3729464.jpeg?${PARAMS}`,
  card: `${PEXELS_BASE}/3729464/pexels-photo-3729464.jpeg?${PARAMS_THUMB}`,
};

/**
 * Get the image URLs for a vehicle by make and model.
 * Returns hero (large) and card (thumbnail) versions.
 */
export function getVehicleImage(make: string, model: string): VehicleImageSet {
  const key = `${make} ${model}`;
  return IMAGE_MAP[key] ?? FALLBACK;
}

/**
 * Get just the hero image URL for a vehicle.
 */
export function getVehicleHeroImage(make: string, model: string): string {
  return getVehicleImage(make, model).hero;
}

/**
 * Get just the card/thumbnail image URL for a vehicle.
 */
export function getVehicleCardImage(make: string, model: string): string {
  return getVehicleImage(make, model).card;
}
