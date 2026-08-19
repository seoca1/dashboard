/**
 * Dashboard stats types
 *
 * Shape of `public/data/dashboard-stats.json` (committed to repo).
 * All fields are nullable — partial data is acceptable (UI shows "—" for null).
 */

export interface WetRunStats {
  tests: number | null;
  stages: number | null;
  storyLines: number | null;
  npcs: number | null;
  missions: number | null;
}

export interface TypingLanguageStats {
  languages: number | null;
  corpus: number | null;
  stages: number | null;
  coverage: number | null;
}

export interface FictionStats {
  pages: number | null;
  totalAdrs: number | null;
  acceptedAdrs: number | null;
  supersededAdrs: number | null;
  lastSync: string | null;
}

export interface DashboardMeta {
  version: string;
  schemaVersion: number;
}

export interface DashboardStats {
  generatedAt: string;
  wetRun: WetRunStats;
  typingLanguage: TypingLanguageStats;
  fiction: FictionStats;
  meta: DashboardMeta;
}