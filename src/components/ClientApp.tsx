"use client";

import { useEffect, useRef } from "react";
import { useIntentStore } from "@/lib/intent/store";
import { parseUTMParams, mapUTMToIntent } from "@/lib/signals/utm-parser";
import { readIntentFromURL, syncURLWithIntent } from "@/lib/utils/url-state";
import { AdaptiveGrid } from "@/components/grid/AdaptiveGrid";

export default function ClientApp() {
  const updateIntent = useIntentStore((s) => s.updateIntent);
  const intent = useIntentStore((s) => s.intent);
  const initialized = useRef(false);

  /* -------------------------------------------------------------------
   * On mount: hydrate intent from URL params, UTMs, session, or cookie
   * ------------------------------------------------------------------- */
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    /* 1. Try to read intent-specific params from the URL (deep link). */
    const urlIntent = readIntentFromURL();
    if (urlIntent && Object.keys(urlIntent).length > 0) {
      updateIntent(urlIntent);
      return;
    }

    /* 2. Try to parse UTM parameters for ad-sourced traffic. */
    const utmParams = parseUTMParams(window.location.href);
    if (utmParams) {
      const utmIntent = mapUTMToIntent(utmParams);
      if (Object.keys(utmIntent).length > 0) {
        updateIntent(utmIntent);
        return;
      }
    }

    /* 3. Fallback: session storage for returning visitors. */
    try {
      const stored = sessionStorage.getItem("ls_intent");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          updateIntent(parsed);
          return;
        }
      }
    } catch {
      /* Ignore parse errors on corrupt session data. */
    }

    /* 4. No signals: stay in Discovery (state 0). */
  }, [updateIntent]);

  /* -------------------------------------------------------------------
   * Sync URL + session when intent changes
   * ------------------------------------------------------------------- */
  useEffect(() => {
    syncURLWithIntent(intent);

    try {
      const { signal_history, ...serializable } = intent;
      sessionStorage.setItem("ls_intent", JSON.stringify(serializable));
    } catch {
      /* Session storage might be unavailable (private browsing, quota). */
    }
  }, [intent]);

  return (
    <main className="min-h-screen py-2 md:py-4">
      <AdaptiveGrid />
    </main>
  );
}
