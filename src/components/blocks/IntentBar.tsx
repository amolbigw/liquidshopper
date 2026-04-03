"use client";

import { useState, useCallback, useRef, useEffect, type FormEvent } from "react";
import { useIntentStore, useActiveFilters } from "@/lib/intent/store";
import { parseTextQuery } from "@/lib/signals/text-parser";
import { saveSearch, getSearchHistory } from "@/lib/utils/history";
import type { BlockManifest } from "@/lib/layout/types";
import { Chip } from "@/components/ui/Chip";

interface IntentBarProps {
  manifest: BlockManifest;
}

const SUGGESTIONS = [
  "Used trucks under $40k",
  "New SUVs with AWD",
  "Electric vehicles",
  "Toyota Camry",
  "Ford F-150",
  "Family-friendly SUVs",
];

export function IntentBar({ manifest }: IntentBarProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const processSignal = useIntentStore((s) => s.processSignal);
  const updateIntent = useIntentStore((s) => s.updateIntent);
  const activeFilters = useActiveFilters();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cmd+K shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setFocused(true);
      }
      if (e.key === "Escape") {
        setFocused(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const executeSearch = useCallback((text: string) => {
    const parsed = parseTextQuery(text);
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
    saveSearch({
      query: text,
      make: parsed.make,
      model: parsed.model,
      body: parsed.body as string | null,
      condition: parsed.condition,
    });
    setFocused(false);
  }, [processSignal]);

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    const text = query.trim();
    if (!text) return;
    executeSearch(text);
  }, [query, executeSearch]);

  const handleSuggestionClick = useCallback((text: string) => {
    setQuery(text);
    executeSearch(text);
  }, [executeSearch]);

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
      if (update) updateIntent(update);
    },
    [updateIntent],
  );

  const handleClearAll = useCallback(() => {
    updateIntent({
      condition: null, body: null, make: null, model: null,
      year_min: null, year_max: null, price_min: null, price_max: null,
      mileage_max: null, fuel: null, drivetrain: null, features: [],
      confidence: 0, focused_vehicle_id: null, compared_vehicle_ids: [], comparison_mode: false,
    });
    setQuery("");
  }, [updateIntent]);

  const recentSearches = typeof window !== "undefined" ? getSearchHistory().slice(0, 4) : [];
  const showDropdown = focused && !query.trim();

  return (
    <div
      className="h-full flex items-center justify-center py-1.5 md:py-2"
      data-block-id={manifest.block_id}
    >
    <div className="w-full max-w-[96%] md:max-w-[92%] relative" ref={containerRef}>
      {/* Search bar */}
      <div
        className={`flex flex-col justify-center rounded-full bg-white/[0.04] border px-5 md:px-7 py-2.5 transition-all duration-300 ${
          focused
            ? "border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)] bg-white/[0.06]"
            : "border-white/[0.08] shadow-[0_0_20px_rgba(59,130,246,0.04)] hover:border-white/[0.12] hover:shadow-[0_0_30px_rgba(59,130,246,0.06)]"
        } ${showDropdown ? "rounded-b-none rounded-t-2xl" : ""}`}
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          {/* Search icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            className={`flex-shrink-0 transition-colors duration-200 ${focused ? "text-blue-400/60" : "text-white/25"}`}>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Search vehicles..."
            className="flex-1 bg-transparent text-white text-base font-light tracking-wide placeholder:text-white/20 focus:outline-none"
          />

          {/* Submit button */}
          {query.trim() ? (
            <button
              type="submit"
              className="px-5 py-1.5 bg-blue-500/90 hover:bg-blue-500 text-white text-[10px] font-semibold uppercase tracking-[0.15em] rounded-full transition-all duration-200"
            >
              Search
            </button>
          ) : (
            /* Keyboard shortcut hint */
            <span className="hidden md:flex items-center gap-1 text-white/15 text-[10px] font-mono select-none">
              <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded border border-white/[0.08] text-[9px]">⌘</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded border border-white/[0.08] text-[9px]">K</kbd>
            </span>
          )}

          {/* Divider */}
          <div className="w-px h-5 bg-white/[0.08]" />

          {/* Mic button */}
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
              <Chip key={label} label={label} onRemove={() => handleRemoveFilter(label)} />
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

      {/* Dropdown panel */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 bg-[#171717]/95 backdrop-blur-xl border border-white/[0.08] border-t-0 rounded-b-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden">

          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <div className="px-6 pt-4 pb-2">
              <p className="text-white/30 text-[10px] font-semibold uppercase tracking-[0.15em] mb-2">
                Recent
              </p>
              {recentSearches.map((s, i) => (
                <button
                  key={`${s.query}-${i}`}
                  onClick={() => handleSuggestionClick(s.query)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors group"
                >
                  {/* Clock icon */}
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-white/15 flex-shrink-0">
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1" />
                    <path d="M8 4.5v4l2.5 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                  <span className="text-white/50 text-sm font-light group-hover:text-white/80 transition-colors">
                    {s.query}
                  </span>
                  {/* Enter icon */}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-white/10 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <path d="M2 8h7V4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                    <path d="M2 8l2.5-2.5M2 8l2.5 2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          {/* Divider */}
          {recentSearches.length > 0 && (
            <div className="mx-6 border-t border-white/[0.04]" />
          )}

          {/* Suggestions */}
          <div className="px-6 pt-3 pb-4">
            <p className="text-white/30 text-[10px] font-semibold uppercase tracking-[0.15em] mb-2">
              Try searching
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-full text-white/40 text-xs hover:bg-white/[0.06] hover:text-white/70 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
