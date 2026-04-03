"use client";

import type { BlockManifest } from "@/lib/layout/types";
import { Button } from "@/components/ui/Button";

interface PromotionProps {
  manifest: BlockManifest;
}

export function Promotion({ manifest }: PromotionProps) {
  return (
    <div
      className="h-full rounded-sm overflow-hidden bg-gradient-to-r from-blue-600/10 via-blue-500/5 to-[#171717] border border-blue-500/10 flex flex-col md:flex-row items-center justify-between p-4 md:p-6 gap-4"
      data-block-id={manifest.block_id}
    >
      {/* Content */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <span className="text-blue-400 text-[10px] font-semibold uppercase tracking-wider">
          Limited Time Offer
        </span>
        <h3 className="text-white font-bold text-lg md:text-xl leading-tight">
          0% APR for 60 Months
        </h3>
        <p className="text-white/40 text-xs">
          Save up to{" "}
          <span className="text-green-400 font-semibold">$4,500</span> on select
          models. Offer expires December 31.
        </p>
        <p className="text-white/20 text-[10px]">
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
