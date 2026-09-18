/**
 * Data loader — fetches dashboard-stats.json with validation.
 *
 * Uses relative path so it works both in Vite dev server (/data/...)
 * and on GitHub Pages (/dashboard/data/...).
 */

import type { DashboardStats } from './types';

const DATA_URL = 'data/dashboard-stats.json';

/* ---------- runtime validation ---------- */

function isValidStats(obj: unknown): obj is DashboardStats {
  if (obj == null || typeof obj !== 'object') return false;
  const s = obj as Partial<DashboardStats>;
  return (
    typeof s.generatedAt === 'string' &&
    typeof s.wetRun === 'object' &&
    typeof s.typingLanguage === 'object' &&
    typeof s.fiction === 'object' &&
    typeof s.meta === 'object' &&
    typeof s.meta.schemaVersion === 'number'
  );
}

/* ---------- loader ---------- */

export async function loadStats(): Promise<DashboardStats | null> {
  try {
    const res = await fetch(DATA_URL, { cache: 'no-cache' });
    if (!res.ok) {
      console.warn(`[dashboard] stats fetch failed: ${res.status} ${res.statusText}`);
      return null;
    }
    const data: unknown = await res.json();
    if (!isValidStats(data)) {
      console.warn('[dashboard] stats validation failed');
      return null;
    }
    return data;
  } catch (e) {
    console.warn(`[dashboard] stats load error: ${(e as Error).message}`);
    return null;
  }
}

/**
 * Format helpers — return em-dash for null values.
 */
export function fmtNumber(n: number | null): string {
  return n == null ? '—' : n.toLocaleString('en-US');
}

export function fmtPercent(n: number | null): string {
  return n == null ? '—' : `${n}%`;
}

export function fmtDate(iso: string | null): string {
  if (iso == null) return '—';
  return iso;
}