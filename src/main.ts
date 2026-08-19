/**
 * Main entry — wire all components together with live data from stats.json.
 *
 * Flow:
 *   1. Load stats (await)
 *   2. Render Hero
 *   3. Render Project Cards (×2)
 *   4. Render Stat Grid
 *   5. Render Cross-Project Status
 *   6. Render Quick Links
 *   7. Render Footer
 */

import { loadStats, fmtNumber, fmtPercent, fmtDate } from './data/loader';
import type { DashboardStats } from './data/types';
import { renderHero } from './components/hero';
import { renderProjectCard } from './components/project-card';
import { renderStatGrid } from './components/stat-grid';
import { renderCrossProjectStatus } from './components/cross-project';
import { renderQuickLinks } from './components/quick-links';
import { initTheme, attachThemeToggle } from './utils/theme';

function getRoot(): HTMLElement {
  const r = document.querySelector<HTMLElement>('app-root');
  if (!r) throw new Error('<app-root> element not found in DOM');
  return r;
}

initTheme();
attachThemeToggle();

async function init(): Promise<void> {
  const root = getRoot();
  const stats = await loadStats();

  // If data load failed, show error state
  if (!stats) {
    root.innerHTML = `
      <div class="error-state" role="alert">
        <h2>⚠ Dashboard Stats Unavailable</h2>
        <p>Could not load <code>/data/dashboard-stats.json</code>.</p>
        <p>Run <code>npm run build:data</code> in <code>Game/dashboard/</code> to regenerate.</p>
      </div>
    `;
    return;
  }

  root.innerHTML = renderDashboard(stats);
}

function renderDashboard(stats: DashboardStats): string {
  const { wetRun: w, typingLanguage: t, fiction: f, generatedAt } = stats;

  return [
    renderHero(generatedAt),

    `<main id="main-content">`,
    `<h2>📂 Projects (프로젝트)</h2>
     <div class="project-grid">`,

    renderProjectCard({
      slug: 'wet-run',
      icon: '🌆',
      name: 'Wet Run',
      subtitle: '깁슨 스프롤 3부작 기반 로그라이크 · Python + tcod',
      description: 'Sprawl의 자키가 되어 ICE를 뚫고 의뢰를 수행. RT-MS 전투, ASCII 그래픽, 한/영 이중 언어. Bilingual (en + ko) + 깁슨 톤 보존.',
      accentClass: 'roguelike',
      href: '../wet_run/dashboard/index.html',
      stats: [
        { label: 'Tests', value: fmtNumber(w.tests), sub: 'passing' },
        { label: 'Stages', value: fmtNumber(w.stages), sub: 'per Run' },
        { label: 'Story', value: fmtNumber(w.storyLines), sub: 'lines' },
        { label: 'NPCs', value: fmtNumber(w.npcs), sub: 'characters' },
      ],
      subDashboards: [
        { label: '📖 Story', href: '../wet_run/dashboard/stories-browse.html' },
        { label: '⏱ Stages', href: '../wet_run/dashboard/stages.html' },
        { label: '⚔ Combat', href: '../wet_run/dashboard/combat.html' },
        { label: '+ 5 more', href: '../wet_run/dashboard/index.html' },
      ],
    }),

    renderProjectCard({
      slug: 'lingotype',
      icon: '⌨',
      name: 'LingoType',
      subtitle: '다국어 타이핑 학습 게임 · TypeScript + React + Vite',
      description: '영/일/한/스페인어 4개 언어로 타이핑 학습. 단계별 콘텐츠, 위키, 학습 플랜. 게임화 + 진행률 추적.',
      accentClass: 'typing',
      href: '../lingotype/dashboard/index.html',
      stats: [
        { label: 'Languages', value: fmtNumber(t.languages), sub: 'en/jp/kr/es' },
        { label: 'Corpus', value: fmtNumber(t.corpus), sub: 'words/phrases' },
        { label: 'Stages', value: fmtNumber(t.stages), sub: 'lessons' },
        { label: 'Coverage', value: fmtPercent(t.coverage), sub: '% avg' },
      ],
      subDashboards: [
        { label: '📊 Overview', href: '../lingotype/dashboard/index.html' },
        { label: '📚 Languages', href: '../lingotype/wiki/languages/' },
        { label: '🎯 Stages', href: '../lingotype/ROADMAP.md' },
      ],
    }),

    `</div>`,

    renderStatGrid({
      wetRunTests: fmtNumber(w.tests),
      wetRunStoryLines: fmtNumber(w.storyLines),
      typingLanguages: fmtNumber(t.languages),
      typingCorpus: fmtNumber(t.corpus),
      lastSync: fmtDate(generatedAt),
      lastSyncSub: 'auto-refresh on data aggregation',
    }),

    renderCrossProjectStatus({
      pages: fmtNumber(f.pages),
      totalAdrs: fmtNumber(f.totalAdrs),
      acceptedAdrs: fmtNumber(f.acceptedAdrs),
      supersededAdrs: fmtNumber(f.supersededAdrs),
      lastSync: fmtDate(f.lastSync),
    }),

    renderQuickLinks(),

    `</main>`,

    `<footer class="footer">
       <code>Game/dashboard/index.html</code> · Cross-project Hub v${stats.meta.version}<br>
       Generated: <code>${fmtDate(generatedAt)}</code><br>
       <span class="footer-note">Live stats aggregator: <code>scripts/aggregate-stats.mjs</code> → <code>public/data/dashboard-stats.json</code>. Schema v${stats.meta.schemaVersion}.</span>
     </footer>`,
  ].join('\n');
}

init().catch(err => {
  console.error('[dashboard] init failed:', err);
  const errRoot = document.querySelector<HTMLElement>('app-root');
  if (errRoot) {
    errRoot.innerHTML = `
      <div class="error-state" role="alert">
        <h2>⚠ Initialization Failed</h2>
        <pre>${String(err)}</pre>
      </div>
    `;
  }
});