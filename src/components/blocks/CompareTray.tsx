"use client";

import { useMemo } from "react";
import { useIntentStore } from "@/lib/intent/store";
import type { BlockManifest } from "@/lib/layout/types";
import type { VehicleRecord } from "@/lib/inventory/types";
import { MOCK_VEHICLES } from "@/lib/inventory/mock-data";
import { formatNumber, formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";

interface CompareTrayProps {
  manifest: BlockManifest;
}

function VehicleThumb({ vehicle }: { vehicle: VehicleRecord }) {
  return (
    <div className="flex items-center gap-3">
      {/* Small placeholder thumbnail */}
      <div className="w-12 h-8 rounded-sm bg-white/5 flex items-center justify-center flex-shrink-0">
        <svg
          width="24"
          height="14"
          viewBox="0 0 48 28"
          fill="none"
          className="text-white/20"
        >
          <rect x="4" y="14" width="40" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 14 L16 6 L32 6 L38 14" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="24" r="3" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="36" cy="24" r="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      <div className="min-w-0">
        <p className="text-white text-xs font-semibold truncate">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </p>
        <p className="text-white/40 text-[10px]">
          {formatPrice(vehicle.sale_price)}
        </p>
      </div>
    </div>
  );
}

export function CompareTray({ manifest }: CompareTrayProps) {
  const comparedIds = useIntentStore((s) => s.intent.compared_vehicle_ids);
  const removeCompareVehicle = useIntentStore((s) => s.removeCompareVehicle);
  const updateIntent = useIntentStore((s) => s.updateIntent);

  const vehicles = useMemo(() => {
    return comparedIds
      .map((id) => MOCK_VEHICLES.find((v) => v.vehicle_id === id))
      .filter(Boolean) as VehicleRecord[];
  }, [comparedIds]);

  const handleExitCompare = () => {
    updateIntent({
      compared_vehicle_ids: [],
      comparison_mode: false,
    });
  };

  return (
    <div
      className="h-full bg-[#171717] rounded-sm border border-white/[0.06] px-4 flex items-center justify-between gap-4"
      data-block-id={manifest.block_id}
    >
      {/* Compare label */}
      <span className="text-white/40 text-xs font-semibold uppercase tracking-wider flex-shrink-0">
        Comparing
      </span>

      {/* Vehicle thumbnails */}
      <div className="flex items-center gap-6 flex-1 min-w-0">
        {vehicles.map((v) => (
          <VehicleThumb key={v.vehicle_id} vehicle={v} />
        ))}

        {vehicles.length < 2 && (
          <div className="flex items-center gap-2 text-white/20 text-xs">
            <div className="w-12 h-8 rounded-sm border border-dashed border-white/10 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            Add vehicle
          </div>
        )}
      </div>

      {/* Key differentiators (placeholder) */}
      {vehicles.length >= 2 && (
        <div className="hidden lg:flex items-center gap-4 text-[10px]">
          <div className="text-center">
            <p className="text-white/30">Price Diff</p>
            <p className="text-white/70 font-semibold">
              {formatPrice(Math.abs(vehicles[0].sale_price - vehicles[1].sale_price))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/30">MPG Diff</p>
            <p className="text-white/70 font-semibold">
              {Math.abs(vehicles[0].mpg_hwy - vehicles[1].mpg_hwy)} mpg
            </p>
          </div>
        </div>
      )}

      {/* Exit Compare */}
      <Button
        variant="text"
        size="sm"
        onClick={handleExitCompare}
        className="flex-shrink-0 text-white/40 hover:text-white"
      >
        Exit Compare
      </Button>
    </div>
  );
}
