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

export interface VerificationFrameworkStats {
  modes_total: number | null;
  curations_total: number | null;
  dimensions: number | null;
  amendments_total: number | null;
  amendments_project_total: number | null;
  spraw_coverage_pct: number | null;
  bridge_coverage_pct: number | null;
  wiki_pages_created: number | null;
  tools_total: number | null;
}

export interface FictionStats {
  pages: number | null;
  totalAdrs: number | null;
  acceptedAdrs: number | null;
  supersededAdrs: number | null;
  lastSync: string | null;
  verification_framework: VerificationFrameworkStats;
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