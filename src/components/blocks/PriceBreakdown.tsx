"use client";

import { useMemo } from "react";
import type { BlockManifest } from "@/lib/layout/types";
import type { VehicleRecord } from "@/lib/inventory/types";
import { MOCK_VEHICLES } from "@/lib/inventory/mock-data";

interface PriceBreakdownProps {
  manifest: BlockManifest;
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString()}`;
}

export function PriceBreakdown({ manifest }: PriceBreakdownProps) {
  const vehicle: VehicleRecord | null = useMemo(() => {
    const vid = manifest.content_query.vehicle_id;
    if (vid) {
      return MOCK_VEHICLES.find((mv) => mv.vehicle_id === vid) ?? MOCK_VEHICLES[0];
    }
    return MOCK_VEHICLES[0];
  }, [manifest.content_query.vehicle_id]);

  if (!vehicle) return null;

  return (
    <div
      className="h-full bg-[#171717] rounded-sm border border-white/[0.06] p-4 flex flex-col justify-center"
      data-block-id={manifest.block_id}
    >
      <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
        Price Breakdown
      </h3>

      <div className="flex flex-col gap-2">
        {/* MSRP */}
        <div className="flex justify-between items-center">
          <span className="text-white/50 text-xs">MSRP</span>
          <span className="text-white/70 text-sm">{formatCurrency(vehicle.msrp)}</span>
        </div>

        {/* Dealer Discount */}
        {vehicle.dealer_discount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-white/50 text-xs">Dealer Discount</span>
            <span className="text-green-400 text-sm">
              -{formatCurrency(vehicle.dealer_discount)}
            </span>
          </div>
        )}

        {/* Manufacturer Incentive */}
        {vehicle.manufacturer_incentive > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-white/50 text-xs">Manufacturer Incentive</span>
            <span className="text-green-400 text-sm">
              -{formatCurrency(vehicle.manufacturer_incentive)}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-white/[0.08] my-1" />

        {/* Sale Price */}
        <div className="flex justify-between items-center">
          <span className="text-white font-semibold text-sm">Sale Price</span>
          <span className="text-white font-bold text-xl">
            {formatCurrency(vehicle.sale_price)}
          </span>
        </div>

        {/* Monthly payment */}
        <div className="flex justify-between items-center mt-1">
          <span className="text-white/40 text-xs">Est. Monthly</span>
          <span className="text-white/60 text-sm">
            {formatCurrency(vehicle.est_monthly_payment)}/mo
          </span>
        </div>
        <p className="text-white/20 text-[10px] text-right">
          {vehicle.finance_apr}% APR, {vehicle.finance_term_months} months,{" "}
          {formatCurrency(vehicle.finance_down_payment)} down
        </p>
      </div>

      {/* Calculate Payment link */}
      <button
        type="button"
        className="text-blue-400 text-xs font-medium mt-3 hover:text-blue-300 transition-colors text-left"
      >
        Calculate Payment &rarr;
      </button>
    </div>
  );
}
