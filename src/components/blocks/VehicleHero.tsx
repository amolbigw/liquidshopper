"use client";

import { useMemo } from "react";
import type { BlockManifest } from "@/lib/layout/types";
import type { VehicleRecord } from "@/lib/inventory/types";
import { MOCK_VEHICLES } from "@/lib/inventory/mock-data";
import { getVehicleHeroImage } from "@/lib/inventory/vehicle-images";
import { useIntentStore } from "@/lib/intent/store";
import { formatNumber, formatPrice } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface VehicleHeroProps {
  manifest: BlockManifest;
  vehicle?: VehicleRecord;
  size?: "large" | "medium";
}

function conditionBadgeVariant(condition: string): "new" | "cpo" | "savings" {
  if (condition === "New") return "new";
  if (condition === "CPO") return "cpo";
  return "savings";
}

export function VehicleHero({ manifest, vehicle, size = "large" }: VehicleHeroProps) {
  const intent = useIntentStore((s) => s.intent);
  const setFocusedVehicle = useIntentStore((s) => s.setFocusedVehicle);

  /* Resolve vehicle from: explicit prop > focused vehicle > intent-filtered match > fallback */
  const v = useMemo(() => {
    if (vehicle) return vehicle;
    const vid = manifest.content_query.vehicle_id;
    if (vid) {
      return MOCK_VEHICLES.find((mv) => mv.vehicle_id === vid) ?? MOCK_VEHICLES[0];
    }
    // Filter mock vehicles by current intent to show a relevant hero
    let candidates = [...MOCK_VEHICLES];
    if (intent.make) candidates = candidates.filter((v) => v.make.toLowerCase() === intent.make!.toLowerCase());
    if (intent.model) candidates = candidates.filter((v) => v.model.toLowerCase() === intent.model!.toLowerCase());
    if (intent.body) {
      const bodyMap: Record<string, string> = { truck: "Truck", suv: "SUV", sedan: "Sedan", coupe: "Coupe", van: "Van", crossover: "Crossover", convertible: "Convertible", wagon: "Wagon", hatchback: "Hatchback" };
      const mapped = bodyMap[intent.body];
      if (mapped) candidates = candidates.filter((v) => v.body_style === mapped);
    }
    if (intent.condition) {
      const condMap: Record<string, string> = { new: "New", used: "Used", cpo: "CPO" };
      const mapped = condMap[intent.condition];
      if (mapped) candidates = candidates.filter((v) => v.condition === mapped);
    }
    if (intent.price_max) candidates = candidates.filter((v) => v.sale_price <= intent.price_max!);
    if (intent.price_min) candidates = candidates.filter((v) => v.sale_price >= intent.price_min!);
    return candidates[0] ?? MOCK_VEHICLES[0];
  }, [vehicle, manifest.content_query.vehicle_id, intent.make, intent.model, intent.body, intent.condition, intent.price_max, intent.price_min]);

  const isLarge = size === "large";
  const titleClass = isLarge
    ? "text-4xl md:text-6xl font-bold"
    : "text-2xl md:text-4xl font-bold";

  return (
    <div
      className="relative h-full overflow-hidden rounded-sm bg-gradient-to-br from-[#171717] to-[#0a0a0a] flex flex-col justify-end p-4 md:p-6"
      data-block-id={manifest.block_id}
    >
      {/* Gradient overlay — pointer-events-none so buttons below remain clickable */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-[1] pointer-events-none" />

      {/* Vehicle image */}
      <img
        src={getVehicleHeroImage(v.make, v.model)}
        alt={`${v.year} ${v.make} ${v.model}`}
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
        loading="eager"
      />

      {/* Content */}
      <div className="relative z-[2] flex flex-col gap-2">
        {/* Condition badge */}
        <div className="flex items-center gap-2">
          <Badge variant={conditionBadgeVariant(v.condition)}>
            {v.condition}
          </Badge>
          {v.new_listing_flag && (
            <Badge variant="new">New Listing</Badge>
          )}
          {v.price_drop_flag && (
            <Badge variant="price-drop">Price Drop</Badge>
          )}
        </div>

        {/* Year Make Model Trim */}
        <h2 className={`${titleClass} text-white leading-tight`}>
          {v.year} {v.make} {v.model}
        </h2>
        {isLarge && (
          <p className="text-white/50 text-sm font-medium tracking-wide">
            {v.trim}
          </p>
        )}

        {/* Mileage */}
        <p className="text-white/40 text-sm">
          {formatNumber(v.mileage)} miles
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-3 mt-1">
          <span className="text-2xl md:text-3xl font-bold text-white">
            {formatPrice(v.sale_price)}
          </span>
          {v.total_savings > 0 && (
            <>
              <span className="text-white/30 line-through text-sm">
                {formatPrice(v.msrp)}
              </span>
              <Badge variant="savings">
                Save {formatPrice(v.total_savings)}
              </Badge>
            </>
          )}
        </div>

        {/* CTA */}
        <div className="mt-3">
          <Button
            variant="secondary"
            size={isLarge ? "md" : "sm"}
            onClick={() => setFocusedVehicle(v.vehicle_id)}
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
