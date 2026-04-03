"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useIntentStore, useActiveFilters } from "@/lib/intent/store";
import { parseTextQuery } from "@/lib/signals/text-parser";
import { saveSearch } from "@/lib/utils/history";
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
      const text = query.trim();
      if (!text) return;

      // Parse the text query into structured intent fields
      const parsed = parseTextQuery(text);

      // Send the parsed result as the signal payload
      // The state machine reads these fields directly
      processSignal({
        type: "text_query",
        source: "intent_bar",
        timestamp: Date.now(),
        priority: "highest",
        payload: {
          text,
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

      // Save to search history for personalization
      saveSearch({
        query: text,
        make: parsed.make,
        model: parsed.model,
        body: parsed.body as string | null,
        condition: parsed.condition,
      });
    },
    [query, processSignal],
  );

  const handleRemoveFilter = useCallback(
    (filterLabel: string) => {
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
      confidence: 0,
      focused_vehicle_id: null,
      compared_vehicle_ids: [],
      comparison_mode: false,
    });
    setQuery("");
  }, [updateIntent]);

  return (
    <div
      className="h-full flex items-center justify-center py-1.5 md:py-2"
      data-block-id={manifest.block_id}
    >
    <div
      className="w-full max-w-[96%] md:max-w-[92%] flex flex-col justify-center rounded-full bg-white/[0.04] border border-white/[0.08] px-5 md:px-7 py-2.5 shadow-[0_0_20px_rgba(59,130,246,0.04)] hover:border-white/[0.12] hover:shadow-[0_0_30px_rgba(59,130,246,0.06)] focus-within:border-blue-500/30 focus-within:shadow-[0_0_30px_rgba(59,130,246,0.1)] transition-all duration-300"
    >
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        {/* Search icon */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className="text-white/25 flex-shrink-0"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search vehicles, e.g. &quot;used Ford F-150 under $40k&quot;"
          className="flex-1 bg-transparent text-white text-base font-light tracking-wide placeholder:text-white/20 focus:outline-none"
        />

        {/* Submit button (visible when query has text) */}
        {query.trim() && (
          <button
            type="submit"
            className="px-5 py-1.5 bg-blue-500/90 hover:bg-blue-500 text-white text-[10px] font-semibold uppercase tracking-[0.15em] rounded-full transition-all duration-200"
          >
            Search
          </button>
        )}

        {/* Divider */}
        <div className="w-px h-5 bg-white/[0.08]" />

        {/* Microphone button */}
        <button
          type="button"
          className="p-1.5 rounded-full hover:bg-white/5 transition-colors text-white/20 hover:text-white/50"
          aria-label="Voice search"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 11a7 7 0 0014 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 18v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </form>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2 px-2 overflow-x-auto pb-1 scrollbar-none">
          {activeFilters.map((label) => (
            <Chip
              key={label}
              label={label}
              onRemove={() => handleRemoveFilter(label)}
            />
          ))}
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-white/50 hover:text-white whitespace-nowrap transition-colors ml-2"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
    </div>
  );
}
