"use client";

import { useMemo, useCallback } from "react";
import type { BlockManifest } from "@/lib/layout/types";
import type { VehicleRecord } from "@/lib/inventory/types";
import { MOCK_VEHICLES } from "@/lib/inventory/mock-data";
import { useIntentStore } from "@/lib/intent/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface VehicleCardProps {
  manifest: BlockManifest;
  vehicle?: VehicleRecord;
}

export function VehicleCard({ manifest, vehicle }: VehicleCardProps) {
  const setFocusedVehicle = useIntentStore((s) => s.setFocusedVehicle);
  const addCompareVehicle = useIntentStore((s) => s.addCompareVehicle);

  const v = useMemo(() => {
    if (vehicle) return vehicle;
    const vid = manifest.content_query.vehicle_id;
    if (vid) {
      return MOCK_VEHICLES.find((mv) => mv.vehicle_id === vid) ?? null;
    }
    /* Fallback: pick a mock vehicle based on block_id index */
    const match = manifest.block_id.match(/(\d+)$/);
    const idx = match ? parseInt(match[1], 10) : 0;
    return MOCK_VEHICLES[idx % MOCK_VEHICLES.length] ?? null;
  }, [vehicle, manifest]);

  const handleView = useCallback(() => {
    if (v) setFocusedVehicle(v.vehicle_id);
  }, [v, setFocusedVehicle]);

  const handleCompare = useCallback(() => {
    if (v) addCompareVehicle(v.vehicle_id);
  }, [v, addCompareVehicle]);

  if (!v) return null;

  return (
    <div
      className="h-full flex flex-col bg-[#171717] rounded-sm border border-white/[0.06] overflow-hidden cursor-pointer group hover:scale-[1.02] transition-transform duration-200"
      data-block-id={manifest.block_id}
      onClick={handleView}
    >
      {/* Image placeholder */}
      <div className="relative aspect-[16/10] bg-[#1f1f1f] flex items-center justify-center overflow-hidden">
        <svg
          width="64"
          height="36"
          viewBox="0 0 120 60"
          fill="none"
          className="text-white/[0.08]"
        >
          <rect x="10" y="25" width="100" height="25" rx="5" stroke="currentColor" strokeWidth="2" />
          <path d="M30 25 L40 10 L80 10 L95 25" stroke="currentColor" strokeWidth="2" />
          <circle cx="30" cy="50" r="7" stroke="currentColor" strokeWidth="2" />
          <circle cx="90" cy="50" r="7" stroke="currentColor" strokeWidth="2" />
        </svg>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {v.price_drop_flag && <Badge variant="price-drop">Price Drop</Badge>}
          {v.new_listing_flag && <Badge variant="new">New</Badge>}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 gap-1.5">
        {/* Title */}
        <h3 className="text-white font-bold text-sm leading-tight truncate">
          {v.year} {v.make} {v.model}
        </h3>

        {/* Specs row */}
        <p className="text-white/40 text-xs truncate">
          {v.mileage.toLocaleString()} mi &middot; {v.drivetrain} &middot;{" "}
          {v.fuel_type} &middot; {v.transmission}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-auto pt-2">
          <span className="text-white font-bold text-lg">
            ${v.sale_price.toLocaleString()}
          </span>
          {v.total_savings > 0 && (
            <Badge variant="savings" className="text-[10px]">
              -{(((v.total_savings / v.msrp) * 100) | 0)}%
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 text-[10px]"
            onClick={(e) => {
              e.stopPropagation();
              handleView();
            }}
          >
            View
          </Button>
          <Button
            variant="text"
            size="sm"
            className="flex-1 text-[10px]"
            onClick={(e) => {
              e.stopPropagation();
              handleCompare();
            }}
          >
            Compare
          </Button>
        </div>
      </div>
    </div>
  );
}
