"use client";

import { useEffect, useRef, useState } from "react";
import { useIntentStore } from "@/lib/intent/store";
import { parseUTMParams, mapUTMToIntent } from "@/lib/signals/utm-parser";
import { readIntentFromURL, syncURLWithIntent } from "@/lib/utils/url-state";
import { saveVehicleView, getSearchHistory, getViewHistory } from "@/lib/utils/history";
import { MOCK_VEHICLES } from "@/lib/inventory/mock-data";
import { NavBar } from "@/components/NavBar";
import { AdaptiveGrid } from "@/components/grid/AdaptiveGrid";
import { PersonalizedSection } from "@/components/blocks/PersonalizedSection";
import { BottomSection } from "@/components/blocks/BottomSection";

export default function Home() {
  const updateIntent = useIntentStore((s) => s.updateIntent);
  const intent = useIntentStore((s) => s.intent);
  const initialized = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || initialized.current) return;
    initialized.current = true;
    const urlIntent = readIntentFromURL();
    if (urlIntent && Object.keys(urlIntent).length > 0) { updateIntent(urlIntent); return; }
    const utmParams = parseUTMParams(window.location.href);
    if (utmParams) {
      const utmIntent = mapUTMToIntent(utmParams);
      if (Object.keys(utmIntent).length > 0) { updateIntent(utmIntent); return; }
    }
    try {
      const stored = sessionStorage.getItem("ls_intent");
      if (stored) { const p = JSON.parse(stored); if (p && typeof p === "object") { updateIntent(p); return; } }
    } catch { /* ignore */ }
  }, [mounted, updateIntent]);

  // Sync URL + session when intent changes
  useEffect(() => {
    if (!mounted) return;
    syncURLWithIntent(intent);
    try { const { signal_history, ...r } = intent; sessionStorage.setItem("ls_intent", JSON.stringify(r)); } catch { /* */ }
  }, [intent, mounted]);

  // Track vehicle views in history
  useEffect(() => {
    if (!mounted || !intent.focused_vehicle_id) return;
    const vehicle = MOCK_VEHICLES.find((v) => v.vehicle_id === intent.focused_vehicle_id);
    if (vehicle) {
      saveVehicleView({
        vehicleId: vehicle.vehicle_id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
      });
    }
  }, [mounted, intent.focused_vehicle_id]);

  if (!mounted) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
      </main>
    );
  }

  // Check if we're in Discovery state (no active intent)
  const isDiscovery = intent.confidence <= 0.25;
  const searches = getSearchHistory();
  const views = getViewHistory();
  const hasUserHistory = searches.length > 0 || views.length > 0;

  return (
    <>
      <NavBar />
      <main className="min-h-screen pb-4">
        <div className="px-2 md:px-4">
          <AdaptiveGrid />
        </div>

        {/* Homepage: personalized section when user has history */}
        {isDiscovery && hasUserHistory && (
          <div className="max-w-[1440px] mx-auto px-4 mt-8">
            <PersonalizedSection searches={searches} views={views} />
          </div>
        )}

        {/* All non-homepage pages: incentives, recently viewed, recommended */}
        {!isDiscovery && <BottomSection />}
      </main>
    </>
  );
}
