"use client";

import { useMemo, useState } from "react";
import { MOCK_VEHICLES } from "@/lib/inventory/mock-data";
import { getVehicleCardImage } from "@/lib/inventory/vehicle-images";
import { useIntentStore } from "@/lib/intent/store";
import { formatPrice, formatNumber } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";

const INCENTIVES = [
  {
    id: "promo_1",
    badge: "Finance Special",
    title: "0% APR for 60 Months",
    subtitle: "On all new 2024 models with approved credit",
    savings: "$4,500",
    color: "border-l-blue-500 bg-blue-500/[0.06] border-white/[0.06]",
    badgeColor: "text-blue-500",
  },
  {
    id: "promo_2",
    badge: "Dealer Event",
    title: "Employee Pricing for Everyone",
    subtitle: "All remaining 2024 inventory must go",
    savings: "$6,200",
    color: "border-l-green-500 bg-green-500/[0.06] border-white/[0.06]",
    badgeColor: "text-green-600",
  },
  {
    id: "promo_3",
    badge: "Loyalty Offer",
    title: "$2,000 Loyalty Cash",
    subtitle: "For returning AMOLW customers on any new vehicle",
    savings: "$2,000",
    color: "border-l-amber-500 bg-amber-500/[0.06] border-white/[0.06]",
    badgeColor: "text-amber-600",
  },
];

type FilterTab = "all" | "new" | "used" | "cpo";

export function InventoryBrowse() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const setFocusedVehicle = useIntentStore((s) => s.setFocusedVehicle);
  const updateIntent = useIntentStore((s) => s.updateIntent);

  // Filter vehicles by condition tab
  const vehicles = useMemo(() => {
    if (activeTab === "all") return MOCK_VEHICLES;
    const condMap: Record<string, string> = { new: "New", used: "Used", cpo: "CPO" };
    return MOCK_VEHICLES.filter((v) => v.condition === condMap[activeTab]);
  }, [activeTab]);

  // Group by make+model with counts
  const groups = useMemo(() => {
    const map = new Map<string, { make: string; model: string; count: number; vehicles: typeof MOCK_VEHICLES }>();
    for (const v of vehicles) {
      const key = `${v.make} ${v.model}`;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        existing.vehicles.push(v);
      } else {
        map.set(key, { make: v.make, model: v.model, count: 1, vehicles: [v] });
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [vehicles]);

  // Tab counts
  const counts = useMemo(() => ({
    all: MOCK_VEHICLES.length,
    new: MOCK_VEHICLES.filter((v) => v.condition === "New").length,
    used: MOCK_VEHICLES.filter((v) => v.condition === "Used").length,
    cpo: MOCK_VEHICLES.filter((v) => v.condition === "CPO").length,
  }), []);

  const handleVehicleClick = (vehicleId: string) => {
    setFocusedVehicle(vehicleId);
    // Also update intent to exit inventory browse
    updateIntent({ confidence: 0.60 });
  };

  const handleModelClick = (make: string, model: string) => {
    updateIntent({
      make,
      model,
      confidence: 0.45,
      focused_vehicle_id: null,
    });
  };

  // Build the grid: vehicle cards + incentive cards mixed in
  const gridItems: Array<{ type: "vehicle"; vehicle: typeof MOCK_VEHICLES[0] } | { type: "incentive"; incentive: typeof INCENTIVES[0] }> = [];

  // Flatten all vehicles, insert incentives after every 6 vehicles
  let incentiveIdx = 0;
  for (let i = 0; i < vehicles.length; i++) {
    gridItems.push({ type: "vehicle", vehicle: vehicles[i] });
    if ((i + 1) % 6 === 0 && incentiveIdx < INCENTIVES.length) {
      gridItems.push({ type: "incentive", incentive: INCENTIVES[incentiveIdx] });
      incentiveIdx++;
    }
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white text-3xl md:text-4xl font-bold mb-2">
          Browse Inventory
        </h1>
        <p className="text-white/40 text-sm">
          {vehicles.length} vehicles available at AMOLW Dealership
        </p>
      </div>

      {/* Condition tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/[0.06]">
        {(["all", "new", "used", "cpo"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors relative ${
              activeTab === tab
                ? "text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {tab === "cpo" ? "Certified" : tab}{" "}
            <span className="text-white/20 ml-1">{counts[tab]}</span>
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        ))}
      </div>

      {/* Model group summary (horizontal scroll) */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {groups.map((g) => (
          <button
            key={`${g.make}-${g.model}`}
            onClick={() => handleModelClick(g.make, g.model)}
            className="flex-shrink-0 bg-[#171717] border border-white/[0.06] rounded-sm px-4 py-2.5 hover:border-white/15 transition-colors text-left"
          >
            <span className="text-white text-2xl font-bold block">{g.count}</span>
            <span className="text-white/50 text-[10px] whitespace-nowrap">
              {g.make} {g.model}
            </span>
          </button>
        ))}
      </div>

      {/* Vehicle grid with incentive cards mixed in */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {gridItems.map((item, idx) => {
          if (item.type === "incentive") {
            const inc = item.incentive;
            return (
              <div
                key={inc.id}
                className={`${inc.color} border border-l-4 rounded-sm p-5 flex flex-col justify-between min-h-[200px]`}
              >
                <div>
                  <span className={`${inc.badgeColor} text-[9px] font-bold uppercase tracking-wider`}>
                    {inc.badge}
                  </span>
                  <h3 className="text-white font-bold text-xl mt-2 mb-1">{inc.title}</h3>
                  <p className="text-white/50 text-xs">{inc.subtitle}</p>
                </div>
                <div className="mt-4">
                  <span className="text-green-400 text-sm font-semibold">
                    Save up to {inc.savings}
                  </span>
                </div>
              </div>
            );
          }

          const v = item.vehicle;
          return (
            <button
              key={v.vehicle_id}
              onClick={() => handleVehicleClick(v.vehicle_id)}
              className="group bg-[#171717] rounded-sm border border-white/[0.06] overflow-hidden hover:border-white/15 transition-all text-left"
            >
              {/* Image */}
              <div className="relative aspect-[16/10] bg-[#1f1f1f] overflow-hidden">
                <img
                  src={getVehicleCardImage(v.make, v.model)}
                  alt={`${v.year} ${v.make} ${v.model}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 flex gap-1">
                  {v.condition === "New" && <Badge variant="new">New</Badge>}
                  {v.condition === "CPO" && <Badge variant="cpo">Certified</Badge>}
                  {v.price_drop_flag && <Badge variant="price-drop">Price Drop</Badge>}
                  {v.new_listing_flag && <Badge variant="new">Just Listed</Badge>}
                </div>
              </div>

              {/* Content */}
              <div className="p-3.5">
                <h3 className="text-white font-bold text-sm mb-0.5">
                  {v.year} {v.make} {v.model}
                </h3>
                <p className="text-white/30 text-[10px] mb-2">{v.trim}</p>
                <p className="text-white/40 text-xs mb-3">
                  {formatNumber(v.mileage)} mi · {v.drivetrain} · {v.fuel_type} · {v.transmission}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-white font-bold text-lg">
                    {formatPrice(v.sale_price)}
                  </span>
                  {v.total_savings > 0 && (
                    <>
                      <span className="text-white/20 line-through text-xs">
                        {formatPrice(v.msrp)}
                      </span>
                      <Badge variant="savings" className="text-[10px]">
                        Save {formatPrice(v.total_savings)}
                      </Badge>
                    </>
                  )}
                </div>
                {v.est_monthly_payment > 0 && (
                  <p className="text-white/30 text-[10px] mt-1">
                    Est. {formatPrice(v.est_monthly_payment)}/mo
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
