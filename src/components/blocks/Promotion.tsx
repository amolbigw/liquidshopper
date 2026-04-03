"use client";

import type { BlockManifest } from "@/lib/layout/types";
import { Button } from "@/components/ui/Button";

interface PromotionProps {
  manifest: BlockManifest;
}

export function Promotion({ manifest }: PromotionProps) {
  return (
    <div
      className="h-full rounded-sm overflow-hidden border border-blue-500/15 border-l-4 border-l-blue-500 bg-blue-500/[0.06] flex flex-col md:flex-row items-center justify-between p-4 md:p-6 gap-4"
      data-block-id={manifest.block_id}
    >
      {/* Content */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <span className="text-blue-500 text-[10px] font-semibold uppercase tracking-wider">
          Limited Time Offer
        </span>
        <h3 className="text-white font-bold text-lg md:text-xl leading-tight">
          0% APR for 60 Months
        </h3>
        <p className="text-white/50 text-xs">
          Save up to{" "}
          <span className="text-green-500 font-semibold">$4,500</span> on select
          models. Offer expires December 31.
        </p>
        <p className="text-white/30 text-[10px]">
          With approved credit. See dealer for details.
        </p>
      </div>

      {/* CTA */}
      <div className="flex-shrink-0">
        <Button variant="primary" size="sm">
          View Offers
        </Button>
      </div>
    </div>
  );
}
