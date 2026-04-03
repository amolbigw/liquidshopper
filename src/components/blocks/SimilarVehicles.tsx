"use client";

import { useMemo } from "react";
import type { BlockManifest } from "@/lib/layout/types";
import type { VehicleRecord } from "@/lib/inventory/types";
import { MOCK_VEHICLES } from "@/lib/inventory/mock-data";
import { getVehicleCardImage } from "@/lib/inventory/vehicle-images";
import { useIntentStore } from "@/lib/intent/store";
import { formatPrice } from "@/lib/utils/format";

interface SimilarVehiclesProps {
  manifest: BlockManifest;
}

export function SimilarVehicles({ manifest }: SimilarVehiclesProps) {
  const intent = useIntentStore((s) => s.intent);
  const setFocusedVehicle = useIntentStore((s) => s.setFocusedVehicle);

  const vehicles = useMemo(() => {
    const focusedId = intent.focused_vehicle_id;
    const focused = focusedId ? MOCK_VEHICLES.find((v) => v.vehicle_id === focusedId) : null;

    if (!focused) {
      // No focused vehicle — show first 4 that aren't the default
      return MOCK_VEHICLES.slice(1, 5);
    }

    // Find similar: same body_style or same make, excluding the focused vehicle
    const candidates = MOCK_VEHICLES.filter((v) => {
      if (v.vehicle_id === focusedId) return false;
      return v.body_style === focused.body_style || v.make === focused.make;
    });

    // Sort by price proximity to focused vehicle
    candidates.sort((a, b) =>
      Math.abs(a.sale_price - focused.sale_price) - Math.abs(b.sale_price - focused.sale_price)
    );

    // If not enough similar, pad with other vehicles
    if (candidates.length < 4) {
      const ids = new Set([focusedId, ...candidates.map((c) => c.vehicle_id)]);
      for (const v of MOCK_VEHICLES) {
        if (candidates.length >= 4) break;
        if (!ids.has(v.vehicle_id)) {
          candidates.push(v);
          ids.add(v.vehicle_id);
        }
      }
    }

    return candidates.slice(0, 4);
  }, [intent.focused_vehicle_id]);

  return (
    <div
      className="h-full bg-[#171717] rounded-sm border border-white/[0.06] p-3 md:p-4 flex flex-col"
      data-block-id={manifest.block_id}
    >
      <h3 className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-3">
        Similar Vehicles
      </h3>

      <div className="flex flex-col gap-2 flex-1">
        {vehicles.map((v) => (
          <button
            key={v.vehicle_id}
            onClick={() => setFocusedVehicle(v.vehicle_id)}
            className="flex items-center gap-3 p-1.5 rounded-sm hover:bg-white/5 transition-colors group text-left"
          >
            {/* Tiny image */}
            <div className="w-16 h-10 flex-shrink-0 rounded-sm overflow-hidden bg-[#1f1f1f]">
              <img
                src={getVehicleCardImage(v.make, v.model)}
                alt={`${v.year} ${v.make} ${v.model}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate group-hover:text-blue-400 transition-colors">
                {v.year} {v.make} {v.model}
              </p>
              <p className="text-white/40 text-[10px]">
                {formatPrice(v.sale_price)}
                {v.total_savings > 0 && (
                  <span className="text-green-400 ml-1.5">
                    Save {formatPrice(v.total_savings)}
                  </span>
                )}
              </p>
            </div>

            {/* Arrow */}
            <svg width="12" height="12" viewBox="0 0 12 12" className="text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0">
              <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
