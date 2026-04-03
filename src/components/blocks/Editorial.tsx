"use client";

import type { BlockManifest } from "@/lib/layout/types";

interface EditorialProps {
  manifest: BlockManifest;
}

export function Editorial({ manifest }: EditorialProps) {
  /* Derive category from the content query. */
  const category =
    manifest.content_query.static_content?.replace("editorial_", "").replace("_", " ") ??
    "Buying Guide";

  return (
    <div
      className="h-full relative rounded-sm overflow-hidden bg-[#171717] border border-white/[0.06] group cursor-pointer"
      data-block-id={manifest.block_id}
    >
      {/* Image placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-[#171717]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-4">
        {/* Category tag */}
        <span className="text-blue-400 text-[10px] font-semibold uppercase tracking-wider mb-2">
          {category}
        </span>

        {/* Title */}
        <h3 className="text-white font-bold text-sm leading-tight mb-1 group-hover:text-blue-400 transition-colors">
          The Complete Guide to Buying Your Next Vehicle
        </h3>

        {/* Excerpt */}
        <p className="text-white/40 text-xs leading-relaxed line-clamp-2 mb-3">
          Everything you need to know about pricing, financing, and finding the perfect match
          for your lifestyle.
        </p>

        {/* Read More */}
        <span className="text-white/60 text-xs font-medium group-hover:text-blue-400 transition-colors inline-flex items-center gap-1">
          Read More
          <svg width="12" height="12" viewBox="0 0 12 12" className="transition-transform group-hover:translate-x-0.5">
            <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
        </span>
      </div>
    </div>
  );
}
