"use client";

import type { BlockManifest } from "@/lib/layout/types";

interface TrustSignalsProps {
  manifest: BlockManifest;
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          className={i < rating ? "text-yellow-400" : "text-white/15"}
        >
          <path
            d="M8 1l2.2 4.5 5 .7-3.6 3.5.9 5L8 12.4 3.5 14.7l.9-5L.8 6.2l5-.7z"
            fill="currentColor"
          />
        </svg>
      ))}
    </div>
  );
}

export function TrustSignals({ manifest }: TrustSignalsProps) {
  return (
    <div
      className="h-full bg-[#171717] rounded-sm border border-white/[0.06] p-3 md:p-4 flex flex-col justify-center gap-4"
      data-block-id={manifest.block_id}
    >
      {/* Rating */}
      <div className="flex flex-col gap-1">
        <StarRating rating={4} />
        <p className="text-white/60 text-xs">
          <span className="text-white font-semibold">4.8</span> / 5 from{" "}
          <span className="text-white">2,847</span> reviews
        </p>
      </div>

      {/* Certifications */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" className="text-green-400">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <span className="text-white/60 text-xs">Verified Dealer Network</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" className="text-blue-400">
              <path d="M6 1L1 4v4l5 3 5-3V4z" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
          <span className="text-white/60 text-xs">Transparent Pricing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" className="text-yellow-400">
              <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path d="M6 3v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <span className="text-white/60 text-xs">7-Day Return Policy</span>
        </div>
      </div>

      {/* Dealer count */}
      <p className="text-white/30 text-[10px] mt-auto">
        Partnered with <span className="text-white/60">450+</span> dealers nationwide
      </p>
    </div>
  );
}
