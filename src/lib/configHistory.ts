/**
 * Every /admin/config/* GET returns the full change history as { configs: [...] },
 * newest first (confirmed against the live API) — not just "the current value".
 * These helpers collapse that history down to what's actually in effect.
 */
type Timestamped = { effectiveFrom?: string; createdAt?: string }

function ts(c: Timestamped): number {
  return new Date(c.effectiveFrom ?? c.createdAt ?? 0).getTime()
}

export function sortByRecency<T extends Timestamped>(configs: T[]): T[] {
  return [...configs].sort((a, b) => ts(b) - ts(a))
}

export function latestConfig<T extends Timestamped>(configs: T[]): T | null {
  return sortByRecency(configs)[0] ?? null
}

/** Most recent entry per group key (e.g. hostId, so null = global + one per override). */
export function latestByGroup<T extends Timestamped>(configs: T[], keyFn: (c: T) => string): Map<string, T> {
  const map = new Map<string, T>()
  for (const c of sortByRecency(configs)) {
    const k = keyFn(c)
    if (!map.has(k)) map.set(k, c)
  }
  return map
}

/** All entries that belong to the same "save" as the most recent one (same effectiveFrom). */
export function latestBatch<T extends Timestamped>(configs: T[]): T[] {
  const latest = latestConfig(configs)
  if (!latest) return []
  return configs.filter((c) => c.effectiveFrom === latest.effectiveFrom)
}
