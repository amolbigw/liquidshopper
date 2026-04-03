"use client";

import { useEffect, useState, useMemo } from "react";
import { useIntentStore } from "@/lib/intent/store";
import { selectBlocks } from "@/lib/layout/block-selector";
import type { BlockManifest } from "@/lib/layout/types";
import { GridBlock } from "./GridBlock";

/* Block component imports */
import { IntentBar } from "@/components/blocks/IntentBar";
import { VehicleHero } from "@/components/blocks/VehicleHero";
import { VehicleCard } from "@/components/blocks/VehicleCard";
import { BrowseByType } from "@/components/blocks/BrowseByType";
import { FilterPanel } from "@/components/blocks/FilterPanel";
import { TrustSignals } from "@/components/blocks/TrustSignals";
import { Editorial } from "@/components/blocks/Editorial";
import { Promotion } from "@/components/blocks/Promotion";
import { PriceBreakdown } from "@/components/blocks/PriceBreakdown";
import { ConversionCTA } from "@/components/blocks/ConversionCTA";
import { SpecSheet } from "@/components/blocks/SpecSheet";
import { CompareTray } from "@/components/blocks/CompareTray";

/** Render the correct block component for a given manifest entry. */
function renderBlock(manifest: BlockManifest) {
  switch (manifest.block_type) {
    case "intent":
      return <IntentBar manifest={manifest} />;
    case "hero":
      return <VehicleHero manifest={manifest} />;
    case "vehicle_card":
      return <VehicleCard manifest={manifest} />;
    case "browse":
      return <BrowseByType manifest={manifest} />;
    case "filter":
      return <FilterPanel manifest={manifest} />;
    case "trust":
      return <TrustSignals manifest={manifest} />;
    case "editorial":
      return <Editorial manifest={manifest} />;
    case "promo":
      return <Promotion manifest={manifest} />;
    case "price":
      return <PriceBreakdown manifest={manifest} />;
    case "cta":
      return <ConversionCTA manifest={manifest} />;
    case "specs":
      return <SpecSheet manifest={manifest} />;
    case "compare":
      return <CompareTray manifest={manifest} />;
    default:
      return null;
  }
}

export function AdaptiveGrid() {
  const intent = useIntentStore((s) => s.intent);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const blocks: BlockManifest[] = useMemo(() => selectBlocks(intent), [intent]);

  /* On mobile, sort by priority descending for linear stack order. */
  const orderedBlocks = useMemo(() => {
    if (!isMobile) return blocks;
    return [...blocks].sort((a, b) => b.priority - a.priority);
  }, [blocks, isMobile]);

  if (isMobile) {
    return (
      <div className="flex flex-col gap-[var(--grid-gap)] px-3 py-3">
        {orderedBlocks.map((m) => (
          <GridBlock key={m.block_id} manifest={m} isMobile animated={mounted}>
            {renderBlock(m)}
          </GridBlock>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid gap-[var(--grid-gap)] w-full max-w-[1440px] mx-auto px-4"
      style={{
        gridTemplateColumns: "repeat(9, 1fr)",
        gridTemplateRows: "auto repeat(8, minmax(80px, auto))",
      }}
    >
      {orderedBlocks.map((m) => (
        <GridBlock key={m.block_id} manifest={m} isMobile={false} animated={mounted}>
          {renderBlock(m)}
        </GridBlock>
      ))}
    </div>
  );
}
