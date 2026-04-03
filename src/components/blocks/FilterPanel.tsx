"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIntentStore, useActiveFilters } from "@/lib/intent/store";
import type { BlockManifest } from "@/lib/layout/types";
import type { VehicleCondition, BodyType, FuelType } from "@/lib/intent/types";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";

interface FilterPanelProps {
  manifest: BlockManifest;
}

const CONDITIONS: VehicleCondition[] = ["new", "used", "cpo"];
const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "truck", label: "Truck" },
  { value: "coupe", label: "Coupe" },
  { value: "van", label: "Van" },
  { value: "crossover", label: "Crossover" },
  { value: "convertible", label: "Convertible" },
  { value: "hatchback", label: "Hatchback" },
];
const FUEL_TYPES: { value: FuelType; label: string }[] = [
  { value: "gasoline", label: "Gas" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "electric", label: "Electric" },
  { value: "phev", label: "PHEV" },
];
const POPULAR_MAKES = [
  "Ford", "Toyota", "Honda", "Chevrolet", "Jeep", "Ram", "Tesla",
  "BMW", "Mercedes-Benz", "Audi", "Nissan", "Hyundai", "Kia",
];

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.06] pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider text-white/60 hover:text-white/80 transition-colors mb-2"
      >
        {title}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FilterPanel({ manifest }: FilterPanelProps) {
  const intent = useIntentStore((s) => s.intent);
  const updateIntent = useIntentStore((s) => s.updateIntent);
  const processSignal = useIntentStore((s) => s.processSignal);
  const activeFilters = useActiveFilters();
  const [makeSearch, setMakeSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredMakes = POPULAR_MAKES.filter((m) =>
    m.toLowerCase().includes(makeSearch.toLowerCase()),
  );

  const handleCondition = useCallback(
    (c: VehicleCondition) => {
      updateIntent({ condition: intent.condition === c ? null : c });
    },
    [intent.condition, updateIntent],
  );

  const handleBody = useCallback(
    (b: BodyType) => {
      processSignal({
        type: "filter_apply",
        source: "filter_panel",
        timestamp: Date.now(),
        priority: "high",
        payload: { body: b },
      });
    },
    [processSignal],
  );

  const handleMake = useCallback(
    (make: string) => {
      updateIntent({ make: intent.make === make ? null : make });
    },
    [intent.make, updateIntent],
  );

  const handleFuel = useCallback(
    (fuel: FuelType) => {
      updateIntent({ fuel: intent.fuel === fuel ? null : fuel });
    },
    [intent.fuel, updateIntent],
  );

  const handleClearAll = useCallback(() => {
    updateIntent({
      condition: null,
      body: null,
      make: null,
      model: null,
      year_min: null,
      year_max: null,
      price_min: null,
      price_max: null,
      mileage_max: null,
      fuel: null,
      drivetrain: null,
      features: [],
    });
  }, [updateIntent]);

  const panelContent = (
    <div className="flex flex-col gap-0">
      {/* Applied filters */}
      {activeFilters.length > 0 && (
        <div className="pb-3 mb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/40">Active Filters</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {activeFilters.map((label) => (
              <Chip key={label} label={label} onRemove={() => {}} className="text-[10px]" />
            ))}
          </div>
        </div>
      )}

      {/* Condition */}
      <Section title="Condition">
        <div className="flex gap-1">
          {CONDITIONS.map((c) => (
            <button
              key={c}
              onClick={() => handleCondition(c)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                intent.condition === c
                  ? "bg-blue-500 text-white"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      </Section>

      {/* Price range */}
      <Section title="Price">
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="number"
              placeholder="Min"
              value={intent.price_min ?? ""}
              onChange={(e) =>
                updateIntent({ price_min: e.target.value ? Number(e.target.value) : null })
              }
              className="w-full bg-white/5 border border-white/[0.06] rounded-sm px-2 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <span className="text-white/20 self-center text-xs">to</span>
          <div className="flex-1">
            <input
              type="number"
              placeholder="Max"
              value={intent.price_max ?? ""}
              onChange={(e) =>
                updateIntent({ price_max: e.target.value ? Number(e.target.value) : null })
              }
              className="w-full bg-white/5 border border-white/[0.06] rounded-sm px-2 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>
      </Section>

      {/* Make */}
      <Section title="Make">
        <input
          type="text"
          placeholder="Search makes..."
          value={makeSearch}
          onChange={(e) => setMakeSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/[0.06] rounded-sm px-2 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 mb-2"
        />
        <div className="flex flex-col gap-0.5 max-h-32 overflow-y-auto">
          {filteredMakes.map((make) => (
            <button
              key={make}
              onClick={() => handleMake(make)}
              className={`text-left px-2 py-1 text-xs rounded-sm transition-colors ${
                intent.make === make
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {make}
            </button>
          ))}
        </div>
      </Section>

      {/* Body Style */}
      <Section title="Body Style" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-1">
          {BODY_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleBody(value)}
              className={`py-1.5 text-xs rounded-sm transition-colors ${
                intent.body === value
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      {/* Fuel Type */}
      <Section title="Fuel Type" defaultOpen={false}>
        <div className="flex flex-wrap gap-1">
          {FUEL_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleFuel(value)}
              className={`px-2 py-1 text-xs rounded-sm transition-colors ${
                intent.fuel === value
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      {/* Year */}
      <Section title="Year" defaultOpen={false}>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="From"
            value={intent.year_min ?? ""}
            onChange={(e) =>
              updateIntent({ year_min: e.target.value ? Number(e.target.value) : null })
            }
            className="flex-1 bg-white/5 border border-white/[0.06] rounded-sm px-2 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
          />
          <span className="text-white/20 self-center text-xs">to</span>
          <input
            type="number"
            placeholder="To"
            value={intent.year_max ?? ""}
            onChange={(e) =>
              updateIntent({ year_max: e.target.value ? Number(e.target.value) : null })
            }
            className="flex-1 bg-white/5 border border-white/[0.06] rounded-sm px-2 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </Section>

      {/* Mileage */}
      <Section title="Mileage" defaultOpen={false}>
        <input
          type="number"
          placeholder="Max mileage"
          value={intent.mileage_max ?? ""}
          onChange={(e) =>
            updateIntent({ mileage_max: e.target.value ? Number(e.target.value) : null })
          }
          className="w-full bg-white/5 border border-white/[0.06] rounded-sm px-2 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
        />
      </Section>
    </div>
  );

  return (
    <>
      {/* Desktop panel */}
      <div
        className="hidden md:flex h-full flex-col bg-[#171717] rounded-sm border-l-2 border-white/[0.06] p-3 overflow-y-auto"
        data-block-id={manifest.block_id}
      >
        {panelContent}
      </div>

      {/* Mobile: bottom drawer toggle */}
      <div className="md:hidden" data-block-id={manifest.block_id}>
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => setMobileOpen(true)}
        >
          Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
        </Button>

        <AnimatePresence>
          {mobileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40"
                onClick={() => setMobileOpen(false)}
              />
              {/* Drawer */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed inset-x-0 bottom-0 z-50 bg-[#171717] rounded-t-2xl max-h-[85vh] overflow-y-auto p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold">Filters</h2>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="p-2 text-white/40 hover:text-white"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                {panelContent}
                <div className="mt-4">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={() => setMobileOpen(false)}
                  >
                    Show Results
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
