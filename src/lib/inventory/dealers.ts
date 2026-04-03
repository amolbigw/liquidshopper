/** Dealer location data for SEO-friendly URLs */

export interface DealerInfo {
  id: string;
  name: string;
  city: string;
  state: string;
  slug: string; // URL-safe city-state
}

export const DEALERS: Record<string, DealerInfo> = {
  dealer_001: {
    id: "dealer_001",
    name: "AMOLW Philadelphia",
    city: "Philadelphia",
    state: "PA",
    slug: "philadelphia-pa",
  },
  dealer_002: {
    id: "dealer_002",
    name: "AMOLW Cherry Hill",
    city: "Cherry Hill",
    state: "NJ",
    slug: "cherry-hill-nj",
  },
  dealer_003: {
    id: "dealer_003",
    name: "AMOLW King of Prussia",
    city: "King of Prussia",
    state: "PA",
    slug: "king-of-prussia-pa",
  },
};

export const DEFAULT_LOCATION = "philadelphia-pa";

export function getDealerBySlug(slug: string): DealerInfo | undefined {
  return Object.values(DEALERS).find((d) => d.slug === slug);
}

export function getDealerById(id: string): DealerInfo | undefined {
  return DEALERS[id];
}
