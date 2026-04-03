"use client";

import { useEffect, useState, useMemo } from "react";
import type { BlockManifest } from "@/lib/layout/types";
import { useIntentStore } from "@/lib/intent/store";
import { MOCK_VEHICLES } from "@/lib/inventory/mock-data";
import { Button } from "@/components/ui/Button";
import { LeadFormModal } from "@/components/ui/LeadFormModal";

interface ConversionCTAProps {
  manifest: BlockManifest;
}

export function ConversionCTA({ manifest }: ConversionCTAProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [modalType, setModalType] = useState<"price" | "test_drive" | "financing" | null>(null);
  const focusedVehicleId = useIntentStore((s) => s.intent.focused_vehicle_id);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const vehicleLabel = useMemo(() => {
    if (!focusedVehicleId) return "Selected Vehicle";
    const v = MOCK_VEHICLES.find((mv) => mv.vehicle_id === focusedVehicleId);
    return v ? `${v.year} ${v.make} ${v.model} ${v.trim}` : "Selected Vehicle";
  }, [focusedVehicleId]);

  if (isMobile) {
    return (
      <>
        <div
          className="bg-[#171717] rounded-sm border border-white/[0.06] p-4"
          data-block-id={manifest.block_id}
        >
          <Button variant="primary" size="lg" className="w-full" onClick={() => setModalType("price")}>
            Get Best Price
          </Button>
        </div>
        {modalType && (
          <LeadFormModal vehicleLabel={vehicleLabel} ctaType={modalType} onClose={() => setModalType(null)} />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className="h-full bg-[#171717] rounded-sm border border-white/[0.06] p-4 flex flex-col justify-center gap-3"
        data-block-id={manifest.block_id}
      >
        <Button variant="primary" size="lg" className="w-full" onClick={() => setModalType("price")}>
          Get Best Price
        </Button>
        <Button variant="secondary" size="md" className="w-full" onClick={() => setModalType("test_drive")}>
          Schedule Test Drive
        </Button>
        <Button variant="secondary" size="md" className="w-full" onClick={() => setModalType("financing")}>
          Apply for Financing
        </Button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 text-white/50 text-xs hover:text-white transition-colors mt-1"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M1 2.5A1.5 1.5 0 012.5 1h2.12a1 1 0 01.97.75l.5 2a1 1 0 01-.28.96L4.5 5.96a8 8 0 003.54 3.54l1.25-1.31a1 1 0 01.96-.28l2 .5a1 1 0 01.75.97V11.5A1.5 1.5 0 0111.5 13 10.5 10.5 0 011 2.5z"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="none"
            />
          </svg>
          Call Dealer
        </button>
      </div>
      {modalType && (
        <LeadFormModal vehicleLabel={vehicleLabel} ctaType={modalType} onClose={() => setModalType(null)} />
      )}
    </>
  );
}
