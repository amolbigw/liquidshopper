"use client";

import { useMemo } from "react";
import type { BlockManifest } from "@/lib/layout/types";
import type { VehicleRecord } from "@/lib/inventory/types";
import { MOCK_VEHICLES } from "@/lib/inventory/mock-data";
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
  /* Resolve vehicle from manifest content query or fallback to mock */
  const v = useMemo(() => {
    if (vehicle) return vehicle;
    const vid = manifest.content_query.vehicle_id;
    if (vid) {
      return MOCK_VEHICLES.find((mv) => mv.vehicle_id === vid) ?? MOCK_VEHICLES[0];
    }
    return MOCK_VEHICLES[0];
  }, [vehicle, manifest.content_query.vehicle_id]);

  const isLarge = size === "large";
  const titleClass = isLarge
    ? "text-4xl md:text-6xl font-bold"
    : "text-2xl md:text-4xl font-bold";

  return (
    <div
      className="relative h-full overflow-hidden rounded-sm bg-gradient-to-br from-[#171717] to-[#0a0a0a] flex flex-col justify-end p-4 md:p-6"
      data-block-id={manifest.block_id}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-[1]" />

      {/* Vehicle image placeholder */}
      <div className="absolute inset-0 flex items-center justify-center z-0">
        <svg
          width="120"
          height="60"
          viewBox="0 0 120 60"
          fill="none"
          className="text-white/[0.06]"
        >
          <rect x="10" y="25" width="100" height="25" rx="5" stroke="currentColor" strokeWidth="2" />
          <path d="M30 25 L40 10 L80 10 L95 25" stroke="currentColor" strokeWidth="2" />
          <circle cx="30" cy="50" r="7" stroke="currentColor" strokeWidth="2" />
          <circle cx="90" cy="50" r="7" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

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
          <Button variant="secondary" size={isLarge ? "md" : "sm"}>
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
