"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useIntentStore, useActiveFilters } from "@/lib/intent/store";
import type { BlockManifest } from "@/lib/layout/types";
import { Chip } from "@/components/ui/Chip";

interface IntentBarProps {
  manifest: BlockManifest;
}

export function IntentBar({ manifest }: IntentBarProps) {
  const [query, setQuery] = useState("");
  const processSignal = useIntentStore((s) => s.processSignal);
  const updateIntent = useIntentStore((s) => s.updateIntent);
  const activeFilters = useActiveFilters();

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!query.trim()) return;

      processSignal({
        type: "text_query",
        source: "intent_bar",
        timestamp: Date.now(),
        priority: "highest",
        payload: { text: query.trim() },
      });

      setQuery("");
    },
    [query, processSignal],
  );

  const handleRemoveFilter = useCallback(
    (filterLabel: string) => {
      /* Parse the filter label to determine which field to clear. */
      const [key] = filterLabel.split(": ");
      const clearMap: Record<string, Partial<Parameters<typeof updateIntent>[0]>> = {
        Condition: { condition: null },
        Body: { body: null },
        Make: { make: null },
        Model: { model: null },
        "Year from": { year_min: null },
        "Year to": { year_max: null },
        "Min price": { price_min: null },
        "Max price": { price_max: null },
        "Max mileage": { mileage_max: null },
        Fuel: { fuel: null },
        Drivetrain: { drivetrain: null },
      };

      const update = clearMap[key];
      if (update) {
        updateIntent(update);
      }
    },
    [updateIntent],
  );

  return (
    <div
      className="h-full flex flex-col justify-center glass rounded-sm border border-white/[0.06] px-4 md:px-6"
      data-block-id={manifest.block_id}
    >
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        {/* Search icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          className="text-white/40 flex-shrink-0"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What are you looking for?"
          className="flex-1 bg-transparent text-white text-lg placeholder:text-white/30 focus:outline-none"
        />

        {/* Microphone button */}
        <button
          type="button"
          className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/40 hover:text-white/70"
          aria-label="Voice search"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2" />
            <path d="M5 11a7 7 0 0014 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 18v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </form>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1 scrollbar-none">
          {activeFilters.map((label) => (
            <Chip
              key={label}
              label={label}
              onRemove={() => handleRemoveFilter(label)}
            />
          ))}
          <button
            type="button"
            onClick={() =>
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
              })
            }
            className="text-xs text-white/50 hover:text-white whitespace-nowrap transition-colors ml-2"
          >
            Refine
          </button>
        </div>
      )}
    </div>
  );
}
