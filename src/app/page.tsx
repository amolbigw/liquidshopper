"use client";

import { useEffect, useRef, useState } from "react";
import { useIntentStore } from "@/lib/intent/store";
import { parseUTMParams, mapUTMToIntent } from "@/lib/signals/utm-parser";
import { readIntentFromURL, syncURLWithIntent } from "@/lib/utils/url-state";
import { AdaptiveGrid } from "@/components/grid/AdaptiveGrid";

export default function Home() {
  const updateIntent = useIntentStore((s) => s.updateIntent);
  const intent = useIntentStore((s) => s.intent);
  const initialized = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || initialized.current) return;
    initialized.current = true;
    const urlIntent = readIntentFromURL();
    if (urlIntent && Object.keys(urlIntent).length > 0) { updateIntent(urlIntent); return; }
    const utmParams = parseUTMParams(window.location.href);
    if (utmParams) {
      const utmIntent = mapUTMToIntent(utmParams);
      if (Object.keys(utmIntent).length > 0) { updateIntent(utmIntent); return; }
    }
    try {
      const stored = sessionStorage.getItem("ls_intent");
      if (stored) { const p = JSON.parse(stored); if (p && typeof p === "object") { updateIntent(p); return; } }
    } catch { /* ignore */ }
  }, [mounted, updateIntent]);

  useEffect(() => {
    if (!mounted) return;
    syncURLWithIntent(intent);
    try { const { signal_history, ...r } = intent; sessionStorage.setItem("ls_intent", JSON.stringify(r)); } catch { /* */ }
  }, [intent, mounted]);

  if (!mounted) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen py-2 md:py-4">
      <AdaptiveGrid />
    </main>
  );
}
