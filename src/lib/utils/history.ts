/**
 * User history tracking — stores recent searches and viewed vehicles
 * in localStorage for personalizing the Discovery homepage.
 */

const SEARCH_HISTORY_KEY = "ls_search_history";
const VIEW_HISTORY_KEY = "ls_view_history";
const MAX_SEARCHES = 10;
const MAX_VIEWS = 15;

export interface SearchEntry {
  query: string;
  make: string | null;
  model: string | null;
  body: string | null;
  condition: string | null;
  timestamp: number;
}

export interface ViewEntry {
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  timestamp: number;
}

/** Save a search to history */
export function saveSearch(entry: Omit<SearchEntry, "timestamp">): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getSearchHistory();
    // Don't duplicate exact same query
    const deduped = existing.filter((e) => e.query.toLowerCase() !== entry.query.toLowerCase());
    deduped.unshift({ ...entry, timestamp: Date.now() });
    const trimmed = deduped.slice(0, MAX_SEARCHES);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(trimmed));
  } catch { /* ignore */ }
}

/** Get search history, most recent first */
export function getSearchHistory(): SearchEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SearchEntry[];
  } catch {
    return [];
  }
}

/** Save a vehicle view to history */
export function saveVehicleView(entry: Omit<ViewEntry, "timestamp">): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getViewHistory();
    const deduped = existing.filter((e) => e.vehicleId !== entry.vehicleId);
    deduped.unshift({ ...entry, timestamp: Date.now() });
    const trimmed = deduped.slice(0, MAX_VIEWS);
    localStorage.setItem(VIEW_HISTORY_KEY, JSON.stringify(trimmed));
  } catch { /* ignore */ }
}

/** Get view history, most recent first */
export function getViewHistory(): ViewEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(VIEW_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ViewEntry[];
  } catch {
    return [];
  }
}

/** Get the most common body types from search history */
export function getPreferredBodyTypes(): string[] {
  const searches = getSearchHistory();
  const counts = new Map<string, number>();
  for (const s of searches) {
    if (s.body) {
      counts.set(s.body, (counts.get(s.body) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([body]) => body);
}

/** Get the most searched makes */
export function getPreferredMakes(): string[] {
  const searches = getSearchHistory();
  const views = getViewHistory();
  const counts = new Map<string, number>();
  for (const s of searches) {
    if (s.make) counts.set(s.make, (counts.get(s.make) ?? 0) + 2); // searches weigh more
  }
  for (const v of views) {
    if (v.make) counts.set(v.make, (counts.get(v.make) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([make]) => make);
}

/** Check if user has any history at all */
export function hasHistory(): boolean {
  return getSearchHistory().length > 0 || getViewHistory().length > 0;
}

/** Clear all history */
export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SEARCH_HISTORY_KEY);
  localStorage.removeItem(VIEW_HISTORY_KEY);
}
