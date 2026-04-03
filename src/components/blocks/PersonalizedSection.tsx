"use client";

import { useMemo } from "react";
import { useIntentStore } from "@/lib/intent/store";
import { parseTextQuery } from "@/lib/signals/text-parser";
import { getSearchHistory, getViewHistory, type SearchEntry, type ViewEntry } from "@/lib/utils/history";
import { MOCK_VEHICLES } from "@/lib/inventory/mock-data";
import { getVehicleCardImage } from "@/lib/inventory/vehicle-images";
import { formatPrice } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";

interface PersonalizedSectionProps {
  searches: SearchEntry[];
  views: ViewEntry[];
}

export function PersonalizedSection({ searches, views }: PersonalizedSectionProps) {
  const processSignal = useIntentStore((s) => s.processSignal);
  const setFocusedVehicle = useIntentStore((s) => s.setFocusedVehicle);

  // Get recently viewed vehicles from mock data
  const recentVehicles = useMemo(() => {
    return views
      .map((v) => MOCK_VEHICLES.find((mv) => mv.vehicle_id === v.vehicleId))
      .filter(Boolean)
      .slice(0, 4);
  }, [views]);

  // Get vehicles matching past search preferences
  const recommendedVehicles = useMemo(() => {
    if (searches.length === 0) return [];
    const makes = new Set(searches.map((s) => s.make).filter(Boolean));
    const bodies = new Set(searches.map((s) => s.body).filter(Boolean));
    const bodyMap: Record<string, string> = {
      truck: "Truck", suv: "SUV", sedan: "Sedan", coupe: "Coupe",
      van: "Van", crossover: "Crossover",
    };

    const candidates = MOCK_VEHICLES.filter((v) => {
      const matchesMake = makes.size === 0 || makes.has(v.make);
      const matchesBody = bodies.size === 0 || [...bodies].some((b) => bodyMap[b!] === v.body_style);
      return matchesMake || matchesBody;
    });

    // Exclude recently viewed
    const viewedIds = new Set(views.map((v) => v.vehicleId));
    return candidates.filter((v) => !viewedIds.has(v.vehicle_id)).slice(0, 4);
  }, [searches, views]);

  const handleReSearch = (search: SearchEntry) => {
    const parsed = parseTextQuery(search.query);
    processSignal({
      type: "text_query",
      source: "history_re_search",
      timestamp: Date.now(),
      priority: "highest",
      payload: {
        text: search.query,
        condition: parsed.condition,
        body: parsed.body,
        make: parsed.make,
        model: parsed.model,
        year_min: parsed.year_min,
        year_max: parsed.year_max,
        price_min: parsed.price_min,
        price_max: parsed.price_max,
        mileage_max: parsed.mileage_max,
        fuel: parsed.fuel,
        features: parsed.features,
        urgency: parsed.urgency,
        confidence: parsed.confidence,
      },
    });
  };

  const showRecent = recentVehicles.length > 0;
  const showRecommended = recommendedVehicles.length > 0;
  const showSearches = searches.length > 0;

  if (!showRecent && !showRecommended && !showSearches) return null;

  return (
    <div className="space-y-6">
      {/* Recent Searches */}
      {showSearches && (
        <div>
          <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">
            Recent Searches
          </h3>
          <div className="flex flex-wrap gap-2">
            {searches.slice(0, 5).map((s, i) => (
              <button
                key={`${s.query}-${i}`}
                onClick={() => handleReSearch(s)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/[0.08] rounded-full text-white/70 text-xs transition-colors hover:text-white"
              >
                {s.query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {showRecent && (
        <div>
          <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">
            Recently Viewed
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {recentVehicles.map((v) => v && (
              <button
                key={v.vehicle_id}
                onClick={() => setFocusedVehicle(v.vehicle_id)}
                className="group bg-[#171717] rounded-sm border border-white/[0.06] overflow-hidden hover:border-white/15 transition-colors text-left"
              >
                <div className="aspect-[16/10] bg-[#1f1f1f] overflow-hidden">
                  <img
                    src={getVehicleCardImage(v.make, v.model)}
                    alt={`${v.year} ${v.make} ${v.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-2">
                  <p className="text-white text-xs font-bold truncate">
                    {v.year} {v.make} {v.model}
                  </p>
                  <p className="text-white/50 text-[10px]">{formatPrice(v.sale_price)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recommended for You */}
      {showRecommended && (
        <div>
          <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">
            Recommended for You
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {recommendedVehicles.map((v) => (
              <button
                key={v.vehicle_id}
                onClick={() => setFocusedVehicle(v.vehicle_id)}
                className="group bg-[#171717] rounded-sm border border-white/[0.06] overflow-hidden hover:border-white/15 transition-colors text-left"
              >
                <div className="aspect-[16/10] bg-[#1f1f1f] overflow-hidden">
                  <img
                    src={getVehicleCardImage(v.make, v.model)}
                    alt={`${v.year} ${v.make} ${v.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-2">
                  <p className="text-white text-xs font-bold truncate">
                    {v.year} {v.make} {v.model}
                  </p>
                  <p className="text-white/50 text-[10px]">{formatPrice(v.sale_price)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
