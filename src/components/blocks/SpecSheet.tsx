"use client";

import { useState, useMemo } from "react";
import type { BlockManifest } from "@/lib/layout/types";
import type { VehicleRecord } from "@/lib/inventory/types";
import { MOCK_VEHICLES } from "@/lib/inventory/mock-data";

interface SpecSheetProps {
  manifest: BlockManifest;
}

type TabKey = "overview" | "features" | "safety" | "warranty";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "features", label: "Features" },
  { key: "safety", label: "Safety" },
  { key: "warranty", label: "Warranty" },
];

function SpecRow({ label, value, alt }: { label: string; value: string; alt?: boolean }) {
  return (
    <div
      className={`flex justify-between items-center px-3 py-1.5 text-xs ${
        alt ? "bg-white/[0.02]" : ""
      }`}
    >
      <span className="text-white/40">{label}</span>
      <span className="text-white/80 font-medium">{value}</span>
    </div>
  );
}

export function SpecSheet({ manifest }: SpecSheetProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const vehicle: VehicleRecord | null = useMemo(() => {
    const vid = manifest.content_query.vehicle_id;
    if (vid) {
      return MOCK_VEHICLES.find((mv) => mv.vehicle_id === vid) ?? MOCK_VEHICLES[0];
    }
    return MOCK_VEHICLES[0];
  }, [manifest.content_query.vehicle_id]);

  if (!vehicle) return null;

  const overviewSpecs = [
    { label: "Engine", value: vehicle.engine },
    { label: "Horsepower", value: `${vehicle.horsepower} hp` },
    { label: "Torque", value: `${vehicle.torque} lb-ft` },
    { label: "Transmission", value: vehicle.transmission },
    { label: "Drivetrain", value: vehicle.drivetrain },
    { label: "Fuel Type", value: vehicle.fuel_type },
    { label: "MPG City / Hwy", value: `${vehicle.mpg_city} / ${vehicle.mpg_hwy}` },
    ...(vehicle.ev_range_miles
      ? [{ label: "EV Range", value: `${vehicle.ev_range_miles} miles` }]
      : []),
    { label: "Exterior", value: vehicle.exterior_color_label },
    { label: "Interior", value: `${vehicle.interior_color} ${vehicle.interior_material}` },
  ];

  return (
    <div
      className="h-full bg-[#171717] rounded-sm border border-white/[0.06] flex flex-col overflow-hidden"
      data-block-id={manifest.block_id}
    >
      {/* Tab bar */}
      <div className="flex border-b border-white/[0.06]">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2 text-xs font-medium transition-colors relative ${
              activeTab === key
                ? "text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {label}
            {activeTab === key && (
              <span className="absolute bottom-0 left-0 right-0 h-px bg-blue-500" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "overview" && (
          <div className="flex flex-col">
            {overviewSpecs.map((spec, i) => (
              <SpecRow key={spec.label} label={spec.label} value={spec.value} alt={i % 2 === 1} />
            ))}
          </div>
        )}

        {activeTab === "features" && (
          <div className="p-3">
            <div className="flex flex-col gap-1">
              {vehicle.standard_features.slice(0, 8).map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs">
                  <svg width="10" height="10" viewBox="0 0 10 10" className="text-green-400 flex-shrink-0">
                    <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  </svg>
                  <span className="text-white/60">{f.replace(/_/g, " ")}</span>
                </div>
              ))}
              {vehicle.standard_features.length > 8 && (
                <button type="button" className="text-blue-400 text-[10px] mt-1 text-left">
                  +{vehicle.standard_features.length - 8} more features
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === "safety" && (
          <div className="p-3">
            <div className="flex flex-col gap-1">
              {vehicle.safety_features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs">
                  <svg width="10" height="10" viewBox="0 0 10 10" className="text-blue-400 flex-shrink-0">
                    <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1" fill="none" />
                    <path d="M5 3v2l1.5 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" />
                  </svg>
                  <span className="text-white/60">{f.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "warranty" && (
          <div className="flex flex-col">
            <SpecRow label="Basic" value={vehicle.warranty_basic} />
            <SpecRow label="Powertrain" value={vehicle.warranty_powertrain} alt />
            <SpecRow label="Roadside" value={vehicle.warranty_roadside} />
          </div>
        )}
      </div>
    </div>
  );
}
