"use client";

import { useMemo } from "react";
import { useIntentStore } from "@/lib/intent/store";
import { parseTextQuery } from "@/lib/signals/text-parser";
import { getSearchHistory, getViewHistory, type SearchEntry } from "@/lib/utils/history";
import { MOCK_VEHICLES } from "@/lib/inventory/mock-data";
import { getVehicleCardImage } from "@/lib/inventory/vehicle-images";
import { formatPrice } from "@/lib/utils/format";

const INCENTIVES = [
  { id: "inc1", title: "0% APR for 60 Months", subtitle: "On select new models", savings: "$4,500", badge: "Finance" },
  { id: "inc2", title: "Employee Pricing Event", subtitle: "All 2024 inventory", savings: "$6,200", badge: "Special" },
  { id: "inc3", title: "$2,000 Loyalty Bonus", subtitle: "For returning customers", savings: "$2,000", badge: "Loyalty" },
];

export function BottomSection() {
  const processSignal = useIntentStore((s) => s.processSignal);
  const setFocusedVehicle = useIntentStore((s) => s.setFocusedVehicle);
  const focusedVehicleId = useIntentStore((s) => s.intent.focused_vehicle_id);

  const searches = typeof window !== "undefined" ? getSearchHistory() : [];
  const views = typeof window !== "undefined" ? getViewHistory() : [];

  // Recently viewed vehicles (exclude currently focused)
  const recentVehicles = useMemo(() => {
    return views
      .filter((v) => v.vehicleId !== focusedVehicleId)
      .map((v) => MOCK_VEHICLES.find((mv) => mv.vehicle_id === v.vehicleId))
      .filter(Boolean)
      .slice(0, 4);
  }, [views, focusedVehicleId]);

  // Recommended based on search/view patterns
  const recommended = useMemo(() => {
    const makes = new Set<string>();
    const bodies = new Set<string>();
    for (const s of searches) {
      if (s.make) makes.add(s.make);
      if (s.body) bodies.add(s.body);
    }
    for (const v of views) {
      if (v.make) makes.add(v.make);
    }

    const bodyMap: Record<string, string> = {
      truck: "Truck", suv: "SUV", sedan: "Sedan", coupe: "Coupe",
      van: "Van", crossover: "Crossover",
    };

    const viewedIds = new Set([focusedVehicleId, ...views.map((v) => v.vehicleId)]);

    const candidates = MOCK_VEHICLES.filter((v) => {
      if (viewedIds.has(v.vehicle_id)) return false;
      const matchMake = makes.size === 0 || makes.has(v.make);
      const matchBody = bodies.size === 0 || [...bodies].some((b) => bodyMap[b] === v.body_style);
      return matchMake || matchBody;
    });

    return candidates.slice(0, 4);
  }, [searches, views, focusedVehicleId]);

  const handleReSearch = (search: SearchEntry) => {
    const parsed = parseTextQuery(search.query);
    processSignal({
      type: "text_query",
      source: "bottom_section",
      timestamp: Date.now(),
      priority: "highest",
      payload: { text: search.query, ...parsed },
    });
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 mt-10 pb-12 space-y-10">

      {/* Special Offers / Incentives */}
      <section>
        <h2 className="text-white/50 text-[10px] font-semibold uppercase tracking-[0.2em] mb-4">
          Special Offers & Incentives
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {INCENTIVES.map((inc) => (
            <div
              key={inc.id}
              className="bg-gradient-to-br from-blue-600/8 to-[#171717] border border-blue-500/10 rounded-sm p-4 flex flex-col gap-2"
            >
              <span className="text-blue-400 text-[9px] font-bold uppercase tracking-wider">
                {inc.badge}
              </span>
              <h3 className="text-white font-bold text-sm">{inc.title}</h3>
              <p className="text-white/40 text-xs">{inc.subtitle}</p>
              <p className="text-green-400 text-xs font-semibold">
                Save up to {inc.savings}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Viewed */}
      {recentVehicles.length > 0 && (
        <section>
          <h2 className="text-white/50 text-[10px] font-semibold uppercase tracking-[0.2em] mb-4">
            Recently Viewed
          </h2>
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
                <div className="p-2.5">
                  <p className="text-white text-xs font-bold truncate">
                    {v.year} {v.make} {v.model}
                  </p>
                  <p className="text-white/40 text-[10px] mt-0.5">{formatPrice(v.sale_price)}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Recommended for You */}
      {recommended.length > 0 && (
        <section>
          <h2 className="text-white/50 text-[10px] font-semibold uppercase tracking-[0.2em] mb-4">
            Recommended for You
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {recommended.map((v) => (
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
                <div className="p-2.5">
                  <p className="text-white text-xs font-bold truncate">
                    {v.year} {v.make} {v.model}
                  </p>
                  <p className="text-white/40 text-[10px] mt-0.5">{formatPrice(v.sale_price)}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Recent Searches */}
      {searches.length > 0 && (
        <section>
          <h2 className="text-white/50 text-[10px] font-semibold uppercase tracking-[0.2em] mb-3">
            Recent Searches
          </h2>
          <div className="flex flex-wrap gap-2">
            {searches.slice(0, 6).map((s, i) => (
              <button
                key={`${s.query}-${i}`}
                onClick={() => handleReSearch(s)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/[0.08] rounded-full text-white/60 text-xs transition-colors hover:text-white"
              >
                {s.query}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
