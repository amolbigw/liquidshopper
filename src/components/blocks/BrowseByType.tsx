"use client";

import { useCallback } from "react";
import { useIntentStore } from "@/lib/intent/store";
import type { BlockManifest } from "@/lib/layout/types";
import type { BodyType } from "@/lib/intent/types";

interface IntentBarProps {
  manifest: BlockManifest;
}

const BODY_TYPES: { type: BodyType; label: string; icon: string }[] = [
  { type: "sedan", label: "Sedan", icon: "sedan" },
  { type: "suv", label: "SUV", icon: "suv" },
  { type: "truck", label: "Truck", icon: "truck" },
  { type: "coupe", label: "Coupe", icon: "coupe" },
  { type: "van", label: "Van", icon: "van" },
  { type: "crossover", label: "Crossover", icon: "crossover" },
  { type: "convertible", label: "Convertible", icon: "convertible" },
  { type: "hatchback", label: "Hatchback", icon: "hatchback" },
  { type: "wagon", label: "Wagon", icon: "wagon" },
];

/** Simple SVG vehicle silhouettes. */
function BodyIcon({ type }: { type: string }) {
  /* Generic car outline that varies slightly per type. */
  const isHighRoof = ["suv", "van", "crossover"].includes(type);
  const isTruck = type === "truck";
  const roofY = isHighRoof ? 6 : 10;
  const bedEnd = isTruck ? 20 : 0;

  return (
    <svg
      width="48"
      height="28"
      viewBox="0 0 48 28"
      fill="none"
      className="text-white/60 group-hover:text-white transition-colors"
    >
      {isTruck ? (
        <>
          <rect x="4" y="12" width="40" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d={`M12 12 L16 ${roofY} L28 ${roofY} L32 12`} stroke="currentColor" strokeWidth="1.5" />
          <line x1="32" y1="12" x2="32" y2="24" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="12" cy="24" r="3" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="38" cy="24" r="3" stroke="currentColor" strokeWidth="1.5" />
        </>
      ) : (
        <>
          <rect x="4" y="14" width="40" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d={`M12 14 L16 ${roofY} L32 ${roofY} L38 14`} stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="24" r="3" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="36" cy="24" r="3" stroke="currentColor" strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
}

export function BrowseByType({ manifest }: IntentBarProps) {
  const processSignal = useIntentStore((s) => s.processSignal);

  const handleSelect = useCallback(
    (bodyType: BodyType) => {
      processSignal({
        type: "filter_apply",
        source: "browse_by_type",
        timestamp: Date.now(),
        priority: "high",
        payload: { body: bodyType },
      });
    },
    [processSignal],
  );

  return (
    <div
      className="h-full bg-[#171717] rounded-sm border border-white/[0.06] p-3 md:p-4 flex flex-col"
      data-block-id={manifest.block_id}
    >
      <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
        Browse by Type
      </h3>

      <div className="grid grid-cols-3 gap-2 flex-1 content-start">
        {BODY_TYPES.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => handleSelect(type)}
            className="group flex flex-col items-center justify-center gap-1 p-2 rounded-sm hover:bg-white/5 transition-colors"
          >
            <BodyIcon type={type} />
            <span className="text-white/50 text-[10px] font-medium group-hover:text-blue-400 transition-colors relative">
              {label}
              <span className="absolute bottom-0 left-0 right-0 h-px bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
