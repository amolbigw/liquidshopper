// ---------------------------------------------------------------------------
// Utility Layer -- Session & Cookie Persistence   (spec section 13)
// ---------------------------------------------------------------------------

import type { IntentVector, ConfidenceBand } from "../intent/types";
import { getConfidenceBand } from "../intent/confidence";

// ---- constants -------------------------------------------------------------

const SESSION_KEY = "ls_intent_vector";
const COOKIE_NAME = "intent_vector";
const VIEWED_COOKIE = "viewed_vehicles";
const COOKIE_MAX_AGE_DAYS = 30;

// ---- sessionStorage (spec 13.1) --------------------------------------------

/**
 * Persist the full intent vector to sessionStorage.
 * Called on every grid reassembly.
 */
export function saveIntentToSession(intent: IntentVector): void {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(intent);
    window.sessionStorage.setItem(SESSION_KEY, serialized);
  } catch {
    // Storage full or blocked -- degrade silently
  }
}

/**
 * Restore the intent vector from sessionStorage.
 * Used on browser back/forward for instant state restore (no animation).
 */
export function loadIntentFromSession(): IntentVector | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as IntentVector;
  } catch {
    return null;
  }
}

// ---- cookie helpers --------------------------------------------------------

function setCookie(name: string, value: string, maxAgeDays: number): void {
  if (typeof document === "undefined") return;
  const maxAge = maxAgeDays * 24 * 60 * 60;
  // First-party, SameSite=Lax, Secure when on HTTPS
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  for (const c of cookies) {
    const [key, ...rest] = c.trim().split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

// ---- cookie: intent_vector (spec 13.2) -------------------------------------

interface CookieIntentPayload {
  confidence_band: ConfidenceBand;
  primary_signal: string;
  body: string | null;
  condition: string | null;
  price_min: number | null;
  price_max: number | null;
  fuel: string | null;
  focused_vehicle_id: string | null;
  confidence: number;
  saved_at: number; // epoch ms
}

/**
 * Persist a lightweight intent snapshot to a 30-day first-party cookie.
 */
export function saveIntentToCookie(intent: IntentVector): void {
  const payload: CookieIntentPayload = {
    confidence_band: getConfidenceBand(intent.confidence),
    primary_signal: intent.primary_signal,
    body: intent.body,
    condition: intent.condition,
    price_min: intent.price_min,
    price_max: intent.price_max,
    fuel: intent.fuel,
    focused_vehicle_id: intent.focused_vehicle_id,
    confidence: intent.confidence,
    saved_at: Date.now(),
  };

  setCookie(COOKIE_NAME, JSON.stringify(payload), COOKIE_MAX_AGE_DAYS);
}

/**
 * Load a partial intent vector from the cookie, applying confidence decay
 * based on time elapsed since the cookie was written (spec 13.2):
 *
 *   < 24h  : confidence * 0.85
 *   1-7d   : confidence * 0.60
 *   7-30d  : confidence * 0.40
 *   > 30d  : cookie expired (browser handles this)
 */
export function loadIntentFromCookie(): Partial<IntentVector> | null {
  const raw = getCookie(COOKIE_NAME);
  if (!raw) return null;

  let payload: CookieIntentPayload;
  try {
    payload = JSON.parse(raw) as CookieIntentPayload;
  } catch {
    return null;
  }

  // Calculate decay factor
  const elapsed = Date.now() - payload.saved_at;
  const ONE_DAY = 24 * 60 * 60 * 1000;

  let decayFactor: number;
  if (elapsed < ONE_DAY) {
    decayFactor = 0.85;
  } else if (elapsed < 7 * ONE_DAY) {
    decayFactor = 0.60;
  } else {
    decayFactor = 0.40;
  }

  const decayedConfidence = Math.max(0, payload.confidence * decayFactor);

  const result: Partial<IntentVector> = {
    confidence: decayedConfidence,
    primary_signal: payload.primary_signal as IntentVector["primary_signal"],
  };

  if (payload.body) result.body = payload.body as IntentVector["body"];
  if (payload.condition) result.condition = payload.condition as IntentVector["condition"];
  if (payload.price_min != null) result.price_min = payload.price_min;
  if (payload.price_max != null) result.price_max = payload.price_max;
  if (payload.fuel) result.fuel = payload.fuel as IntentVector["fuel"];
  if (payload.focused_vehicle_id) result.focused_vehicle_id = payload.focused_vehicle_id;

  return result;
}

// ---- cookie: viewed_vehicles (spec 13.2) -----------------------------------

interface ViewedEntry {
  id: string;
  ts: number; // epoch ms
}

/**
 * Save an array of recently viewed vehicle IDs (max 10) to a 30-day cookie.
 */
export function saveViewedVehicles(vehicleIds: string[]): void {
  // Merge with existing
  const existing = loadViewedEntries();
  const map = new Map<string, number>();

  // Preserve existing timestamps
  for (const entry of existing) {
    map.set(entry.id, entry.ts);
  }

  // Update/add new entries
  const now = Date.now();
  for (const id of vehicleIds) {
    map.set(id, now);
  }

  // Keep most recent 10
  const entries: ViewedEntry[] = [...map.entries()]
    .map(([id, ts]) => ({ id, ts }))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 10);

  setCookie(VIEWED_COOKIE, JSON.stringify(entries), COOKIE_MAX_AGE_DAYS);
}

function loadViewedEntries(): ViewedEntry[] {
  const raw = getCookie(VIEWED_COOKIE);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ViewedEntry[];
  } catch {
    return [];
  }
}

/**
 * Load the list of previously viewed vehicle IDs from the cookie.
 * Returns IDs ordered most-recent-first.
 */
export function loadViewedVehicles(): string[] {
  return loadViewedEntries().map((e) => e.id);
}
