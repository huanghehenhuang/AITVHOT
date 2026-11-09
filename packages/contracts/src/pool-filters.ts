import { beijingDate, beijingMidnight } from "./time.ts";

export interface PoolFacets {
  from?: string | null;
  to?: string | null;
  source?: string | null;
}

function calendarDate(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000-")) return null;
  const midnight = beijingMidnight(value);
  return Number.isFinite(+midnight) && beijingDate(midnight) === value ? value : null;
}

export function readPoolFacets(get: (name: string) => string | null | undefined) {
  const source = get("source")?.trim().slice(0, 120);
  return {
    from: calendarDate(get("from") ?? null),
    to: calendarDate(get("to") ?? null),
    source: source && !source.includes("\0") ? source : null,
  };
}
