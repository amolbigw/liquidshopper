"use client";

import { useMemo } from "react";
import type { BlockManifest } from "@/lib/layout/types";
import type { VehicleRecord } from "@/lib/inventory/types";
import { MOCK_VEHICLES } from "@/lib/inventory/mock-data";
import { useIntentStore } from "@/lib/intent/store";
import { formatPrice } from "@/lib/utils/format";

interface PriceBreakdownProps {
  manifest: BlockManifest;
}

export function PriceBreakdown({ manifest }: PriceBreakdownProps) {
  const focusedVehicleId = useIntentStore((s) => s.intent.focused_vehicle_id);

  const vehicle: VehicleRecord | null = useMemo(() => {
    const vid = focusedVehicleId ?? manifest.content_query.vehicle_id;
    if (vid) {
      return MOCK_VEHICLES.find((mv) => mv.vehicle_id === vid) ?? MOCK_VEHICLES[0];
    }
    return MOCK_VEHICLES[0];
  }, [focusedVehicleId, manifest.content_query.vehicle_id]);

  if (!vehicle) return null;

  return (
    <div
      className="h-full bg-[#171717] rounded-sm border border-white/[0.06] p-5 md:p-6 flex flex-col justify-center"
      data-block-id={manifest.block_id}
    >
      <h3 className="text-white/50 text-[10px] font-semibold uppercase tracking-[0.15em] mb-4">
        Price Breakdown
      </h3>

      <div className="flex flex-col gap-3">
        {/* MSRP */}
        <div className="flex justify-between items-baseline">
          <span className="text-white/60 text-sm">MSRP</span>
          <span className="text-white/70 text-lg font-medium">{formatPrice(vehicle.msrp)}</span>
        </div>

        {/* Dealer Discount */}
        {vehicle.dealer_discount > 0 && (
          <div className="flex justify-between items-baseline">
            <span className="text-white/60 text-sm">Dealer Discount</span>
            <span className="text-green-400 text-lg font-semibold">
              -{formatPrice(vehicle.dealer_discount)}
            </span>
          </div>
        )}

        {/* Manufacturer Incentive */}
        {vehicle.manufacturer_incentive > 0 && (
          <div className="flex justify-between items-baseline">
            <span className="text-white/60 text-sm">Manufacturer Incentive</span>
            <span className="text-green-400 text-lg font-semibold">
              -{formatPrice(vehicle.manufacturer_incentive)}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-white/[0.08] my-1" />

        {/* Sale Price — the hero number */}
        <div className="flex justify-between items-baseline">
          <span className="text-white font-semibold text-base">Sale Price</span>
          <span className="text-white font-bold text-3xl md:text-4xl tracking-tight">
            {formatPrice(vehicle.sale_price)}
          </span>
        </div>

        {/* Monthly payment */}
        <div className="flex justify-between items-baseline mt-1">
          <span className="text-white/50 text-sm">Est. Monthly</span>
          <span className="text-white/80 text-xl font-semibold">
            {formatPrice(vehicle.est_monthly_payment)}/mo
          </span>
        </div>
        <p className="text-white/30 text-xs text-right">
          {vehicle.finance_apr}% APR, {vehicle.finance_term_months} months,{" "}
          {formatPrice(vehicle.finance_down_payment)} down
        </p>
      </div>

      {/* Calculate Payment link */}
      <button
        type="button"
        className="text-blue-400 text-sm font-medium mt-4 hover:text-blue-300 transition-colors text-left"
      >
        Calculate Payment &rarr;
      </button>
    </div>
  );
}
